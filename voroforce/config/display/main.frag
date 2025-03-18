#version 300 es

precision highp float;

uniform highp sampler2D uCellCoordsTexture;
uniform highp sampler2D uVoroIndexBufferTexture;
uniform highp usampler2D uCellNeighborsTexture;
uniform highp usampler2D uCellNeighborsAltTexture;
uniform highp sampler2D uCellWeightsTexture;
uniform highp usampler2D uCellMediaVersionsTexture;
uniform highp usampler2D uCellIdMapTexture;

uniform bool bMediaEnabled;
uniform mediump sampler2DArray uMediaV0Texture;
uniform mediump sampler2DArray uMediaV1Texture;
uniform mediump sampler2DArray uMediaV2Texture;
uniform ivec3 iNumMediaVersionCols;
uniform ivec3 iNumMediaVersionRows;
uniform ivec3 iNumMediaVersionLayers;

uniform vec3 iResolution;
uniform int iNumCells;
uniform int iLatticeRows;
uniform int iLatticeCols;
uniform int iFocusedIndex;
uniform float iTime;
uniform bool bForceMaxQuality;
uniform int iForceMaxNeighborLevel;
uniform float fRoundnessMod;
uniform float fEdgeMod;
uniform float fEdgeSmoothnessMod;
uniform vec3 fBaseColor;
uniform vec2 fCenter;

in vec2 vUv;

layout(location = 0) out vec4 voroIndexBufferColor;
layout(location = 1) out vec4 outputColor;
layout(location = 2) out vec2 voroEdgeBufferColor;

#define PI 3.14159265359
#define PI2 2.0 * PI
#define FLOAT_INF uintBitsToFloat(0x7f800000u)
#define EPSILON .0001

#define MAX_NEIGHBOR_ITERATIONS_LEVEL_1 8u
#define MAX_NEIGHBOR_ITERATIONS_LEVEL_2 24u
#define MAX_NEIGHBOR_ITERATIONS_LEVEL_3 48u
#define GLOBAL_MAX_NEIGHBOR_ITERATIONS MAX_NEIGHBOR_ITERATIONS_LEVEL_1

#define DEBUG_MEDIA_BBOXES 0
#define Y_SCALE 1.
#define MEDIA_UV_ROTATE_FACTOR 1
#define WEIGHTED_DIST 1
#define WEIGHT_OFFSET_SCALE 2000.
//#define WEIGHT_OFFSET_SCALE_MEDIA_MOD 4.25
#define WEIGHT_OFFSET_SCALE_MEDIA_MOD 9.25
#define X_DIST_SCALING 1
#define BASE_X_DIST_SCALE 1.5
#define WEIGHTED_X_DIST_SCALE 1.5
#define MEDIA_BBOX_ADJUSTMENT_SCALE 3.
#define LOCK_MEDIA_ASPECT 1
#define MEDIA_ASPECT 1.5
#define PIXEL_SEARCH 1
#define PIXEL_SEARCH_RADIUS 16.
#define PIXEL_SEARCH_RANDOM_DIR 0
#define PIXEL_SEARCH_FULL_RANDOM 0
#define TRANSPARENT_BG 0
#define ROUNDNESS 0.01 * BASE_X_DIST_SCALE // adjust roundness to match x dist scale
#define EDGE_1 .007
#define EDGE_2 .001

struct Data {
    uvec4 indices;
    vec2 minEdgeDists;
    vec4 mediaBbox;
    bool debugFlag;
    float scaleMod;
};

uint hash(inout uint x) {
    x ^= x >> 16;
    x *= 0x7feb352dU;
    x ^= x >> 15;
    x *= 0x846ca68bU;
    x ^= x >> 16;

    return x;
}

float randomFloat(inout uint state) {
    return float(hash(state)) / 4294967296.0;
}

vec2 randomDir(inout uint state) {
    float z = randomFloat(state) * 2.0 - 1.0;
    float a = randomFloat(state) * PI2;
    float r = sqrt(1.0f - z * z);
    float x = r * cos(a);
    float y = r * sin(a);
    return vec2(x, y);
}

uint wrap1d(uint flatId) {
    return flatId % uint(iNumCells);
}

vec2 wrap2d(vec2 id, vec2 resolution) {
    return fract(id / resolution) * resolution;
}

uint to1d(vec2 id, vec2 resolution) {
    return uint(id.x + id.y * resolution.x);
}

ivec2 to2d(uint flatId, ivec2 resolution) {
    return ivec2(flatId, flatId / uint(resolution.x)) % resolution;
}

uint murmur3( in uint u )
{
    u ^= ( u >> 16 ); u *= 0x85EBCA6Bu;
    u ^= ( u >> 13 ); u *= 0xC2B2AE35u;
    u ^= ( u >> 16 );

    return u;
}

uint rngSeed = 314159265u;

uint xorshift(in uint value) {
    value ^= value << 13;
    value ^= value >> 17;
    value ^= value << 5;
    return value;
}

float xorshiftFloat(uint state) {
    return float(xorshift(state)) / float(0xffffffffU);
}

uint nextUint() {
    rngSeed = xorshift(rngSeed);
    return rngSeed;
}

float nextFloat() {
    return float(nextUint()) / float(uint(-1));
}

// Commutative smooth minimum function. Provided by Tomkh and
// taken from Alex Evans's (aka Statix) talk:
// http://media.lolrus.mediamolecule.com/AlexEvans_SIGGRAPH-2015.pdf
// Credited to Dave Smith @media molecule.
float smin2(float a, float b, float r)
{
    float f = max(0., 1. - abs(b - a)/r);
    return min(a, b) - r*.25*f*f;
}

// smoothmin function by iq
float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float dot2(vec2 p) {
    return dot(p,p);
}

float dist(vec2 a, vec2 b) {
    //    return distance(a, b);
    return dot2(a - b);
}

// Converts an integer into a pseudo-random float between 0.0 and 1.0
float randomColorChannel(uint seed) {
    return fract(sin(float(seed) * 78.233) * 43758.5453123);
}

// Generates a random vec3 color based on an integer
vec3 randomColor(uint seed) {
    float r = randomColorChannel(seed);
    float g = randomColorChannel(seed + 1u);
    float b = randomColorChannel(seed + 2u);
    return vec3(r, g, b);
}

float getXDistScale(float weight) {
    return BASE_X_DIST_SCALE + weight * (WEIGHTED_X_DIST_SCALE-BASE_X_DIST_SCALE);
}

float weightedDist(vec2 p1, vec2 p2, float weight, float weightOffset) {
    vec2 v = p1 - p2;

    #if X_DIST_SCALING == 1
        float scaleX = getXDistScale(weight);
        v.x *= scaleX; // Apply less x weight
    #endif

    float dist = dot2(v);
    #if WEIGHTED_DIST == 1
        dist -= weightOffset;
    #endif
    return dist;
}

bool indexIsUndefined(uint id) {
    return id == uint(-1);
}

uint cellIdMapTexData(uint index) {
    int iIndex = int(index);
    int textureWidth = textureSize(uCellIdMapTexture, 0).x;
    return texelFetch(uCellIdMapTexture, ivec2(iIndex % textureWidth, iIndex / textureWidth), 0).r;
}

uvec2 mediaVersionTexData(uint index) {
    int iIndex = int(index);
    int textureWidth = textureSize(uCellMediaVersionsTexture, 0).x;
    return texelFetch(uCellMediaVersionsTexture, ivec2(iIndex % textureWidth, iIndex / textureWidth), 0).rg;
}

float weightTexData(uint index) {
    int iIndex = int(index);
    int textureWidth = textureSize(uCellWeightsTexture, 0).x;
    return texelFetch(uCellWeightsTexture, ivec2(iIndex % textureWidth, iIndex / textureWidth), 0).r;
}

uint neighborsTexData(uint index) {
    int iIndex = int(index);
    int textureWidth = textureSize(uCellNeighborsTexture, 0).x;
    return texelFetch(uCellNeighborsTexture, ivec2(iIndex % textureWidth, iIndex / textureWidth), 0).r;
}

vec2 coordsTexData(int index) {
    int textureWidth = textureSize(uCellCoordsTexture, 0).x;
    return texelFetch(uCellCoordsTexture, ivec2(index % textureWidth, index / textureWidth), 0).rg ;
}

vec2 normalizeCoords(in vec2 screenCoords) {
    //    float aspectRatio = iResolution.x / iResolution.y;
    //    ndc.x /= aspectRatio;
    return (screenCoords / iResolution.xy) * 2.0 - 1.0;
}

vec2 fetchCellCoords(uint i) {
    vec2 screenCoords = coordsTexData(int(i));
    return (vec2(screenCoords.x, iResolution.y - screenCoords.y)*2.0-iResolution.xy) / iResolution.y;
}

vec2 fetchRawCellCoords(uint i) {
    vec2 screenCoords = coordsTexData(int(i));
    return vec2(screenCoords.x, iResolution.y - screenCoords.y);
}

vec2 fetchNormalizedCellCoords(uint i) {
    vec2 coords = coordsTexData(int(i));
    return normalizeCoords(vec2(coords.x, iResolution.y - coords.y));
}

vec2 fetchPCoords() {
    vec2 fragCoord = gl_FragCoord.xy / iResolution.z;
    //    fragCoord.y /= Y_SCALE;
    return (fragCoord.xy*2.0-iResolution.xy) / iResolution.y;
}

vec2 fetchNormalizedPCoords() {
    vec2 fragCoord = gl_FragCoord.xy / iResolution.z;
    fragCoord.y /= Y_SCALE;
    return normalizeCoords(fragCoord);
}

float fetchResolutionScale() {
    return ((iResolution.x * iResolution.y) / (1920.*1080.));
}

float calculateOrientation(vec2 left, vec2 right) {
    vec2 localX = normalize(right - left);
    float angle = atan(localX.y, localX.x);
    return angle;
}

void rotateMediaTileUv(inout vec2 mediaTileUv, in uint index) {
    uint neighborsIndexStart = neighborsTexData(index*2u);
    float angle = calculateOrientation(fetchNormalizedCellCoords(neighborsTexData(neighborsIndexStart+3u)),fetchNormalizedCellCoords(neighborsTexData(neighborsIndexStart+4u)));

    // center origin
    vec2 centerUv = vec2(0.5);
    vec2 pos = mediaTileUv - centerUv;

    // rotate
    angle *= float(MEDIA_UV_ROTATE_FACTOR);
    float cosAngle = cos(angle);
    float sinAngle = sin(angle);
    vec2 rotatedUv = vec2(
        pos.x * cosAngle - pos.y * sinAngle,
        pos.x * sinAngle + pos.y * cosAngle
    );

    // revert centered origin
    mediaTileUv = rotatedUv + centerUv;
}

vec3 mediaColor(uint index, vec4 mediaBbox) {

    vec2 p = fetchNormalizedPCoords();

    vec2 mediaTileUv = (p - mediaBbox.xy) / (mediaBbox.zw - mediaBbox.xy);
    mediaTileUv.y = 1. - mediaTileUv.y;

    #if MEDIA_UV_ROTATE_FACTOR != 0
        rotateMediaTileUv(mediaTileUv, index);
    #endif

    #if DEBUG_MEDIA_BBOXES == 1  // highlight bbox overflow in red
        if (mediaTileUv.x < 0.01 || mediaTileUv.x > 0.99 || mediaTileUv.y < 0.01 || mediaTileUv.y > 0.99) {
            return vec3(1.,0.,0.);
        }
    # else  // obscure bbox inaccuracies and prevent tile bleeding
        mediaTileUv = vec2(clamp(mediaTileUv.x, 0.01, 0.99), clamp(mediaTileUv.y, 0.01, 0.99));
    #endif

    int iMediaVersion = int(mediaVersionTexData(index).x);
    int numLayers;
    int mediaCols;
    int mediaRows;
    // dynamic indexing of vectors and matrices is emulated and can be slow.
    if (iMediaVersion == 1) {
        numLayers = iNumMediaVersionLayers.y;
        mediaCols = iNumMediaVersionCols.y;
        mediaRows = iNumMediaVersionRows.y;
    } else if (iMediaVersion == 2) {
        numLayers = iNumMediaVersionLayers.z;
        mediaCols = iNumMediaVersionCols.z;
        mediaRows = iNumMediaVersionRows.z;
    } else {
        numLayers = iNumMediaVersionLayers.x;
        mediaCols = iNumMediaVersionCols.x;
        mediaRows = iNumMediaVersionRows.x;
    }

    int id = int(cellIdMapTexData(index));
    int mediaCapacity = mediaCols * mediaRows;
    int layer = id / mediaCapacity % numLayers;
    int tileIndex = id % mediaCapacity;
    float tileRow = float(tileIndex / mediaCols);
    float tileCol = float(tileIndex % mediaCols);
    float tileWidth = 1.0 / float(mediaCols);
    float tileHeight = 1.0 / float(mediaRows);
    vec2 tileOffset = vec2(tileCol * tileWidth, tileRow * tileHeight);

    vec2 mediaTexcoord = tileOffset + mediaTileUv * vec2(tileWidth, tileHeight);

    if (iMediaVersion == 1) {
        return texture(uMediaV1Texture, vec3(mediaTexcoord, float(layer))).rgb;
    } else if (iMediaVersion == 2) {
        return texture(uMediaV2Texture, vec3(mediaTexcoord, float(layer))).rgb;
    }
    return texture(uMediaV0Texture, vec3(mediaTexcoord, float(layer))).rgb;
}

void calcMinEdgeDists(in uint closeIndex, in vec2 cellCoords, in vec2 p, inout vec2 minEdgeDists, in float weight, in float weightOffset, in float weightOffsetScale) {
    vec2 closeCellCoords = fetchCellCoords(closeIndex);

    #if WEIGHTED_DIST == 1 || X_DIST_SCALING == 1
        float closeWeight = weightTexData(closeIndex);
        float closeWeightOffset = weightOffsetScale * closeWeight;

        vec2 cellDiff = cellCoords - p;
        vec2 closeCellDiff = closeCellCoords - p;
        vec2 diffsDiff = closeCellDiff - cellDiff;

        #if X_DIST_SCALING == 1
            float scaleX = getXDistScale(max(closeWeight, weight));
            cellDiff.x *= scaleX;
            closeCellDiff.x *= scaleX;
            diffsDiff.x *= scaleX;
        #endif

        float baseDist = dist(closeCellDiff, cellDiff);
        float weightedDist = baseDist;
        #if WEIGHTED_DIST == 1
            weightedDist -= (closeWeightOffset - weightOffset);
        #endif

        float distFactor = weightedDist / (2.*baseDist);
        float len = dot( mix(cellDiff,closeCellDiff,distFactor), diffsDiff*(1./sqrt(baseDist)) );
    #else
        // simplified variant without weights and x-component dist scaling
        vec2 mid = (closeCellCoords+cellCoords)*0.5;
        vec2 direction = normalize(cellCoords - closeCellCoords); // unit direction vector
        float len = dot(direction,p-mid);
    #endif

    //  minEdgeDists.x = smin( minEdgeDists.x, len, ROUNDNESS );
    minEdgeDists.x = smin2(minEdgeDists.x, len, (len*.5 + .5)*fRoundnessMod*ROUNDNESS);
    minEdgeDists.y = min(minEdgeDists.y, len);
}

void sortClosest(
    inout vec4 distances,
    inout uvec4 indices,
    uint index,
    vec2 center,
    float weightOffsetScale,
    float prevMaxWeight
) {
    if (indexIsUndefined(index) || any(equal(indices, uvec4(index)))) return;

    float weight = weightTexData(index);
    float weightOffset = weightOffsetScale * weight;
    weight = weight > 0. ? weight : prevMaxWeight;

    float dist = weightedDist(center, fetchCellCoords(index), weight, weightOffset);

    if (dist < distances.x) {
        distances = vec4(dist, distances.xyz);
        indices = uvec4(index, indices.xyz);
    } else if (dist < distances.y) {
        distances = vec4(distances.x, dist, distances.yz);
        indices = uvec4(indices.x, index, indices.yz);
    } else if (dist < distances.z) {
        distances = vec4(distances.xy, dist, distances.z);
        indices = uvec4(indices.xy, index, indices.z);
    } else if (dist < distances.w) {
        distances = vec4(distances.xyz, dist);
        indices = uvec4(indices.xyz, index);
    }
}

uvec4 fetchIndices(vec2 position) {
    return floatBitsToUint(texelFetch(uVoroIndexBufferTexture, ivec2(position), 0)) - 1u;
}

void fetchAndSortIndices( inout vec4 distances, inout uvec4 prevIndices, in vec2 samplePoint, in vec2 cellCenter, in float weightOffsetScale, in float prevMaxWeight ) {
    uvec4 indices = fetchIndices(samplePoint);

    sortClosest(distances, prevIndices, indices.x, cellCenter, weightOffsetScale, prevMaxWeight);
    sortClosest(distances, prevIndices, indices.y, cellCenter, weightOffsetScale, prevMaxWeight);
    sortClosest(distances, prevIndices, indices.z, cellCenter, weightOffsetScale, prevMaxWeight);
    sortClosest(distances, prevIndices, indices.w, cellCenter, weightOffsetScale, prevMaxWeight);
}

Data init() {
    vec2 p = fetchPCoords();
    uvec4 indices = uvec4(uint(-1));

    uint row = uint(round((1.-vUv.y) * float(iLatticeRows)));
    uint col = uint(round(vUv.x * float(iLatticeCols)));

    indices.x = row * uint(iLatticeCols) + col;
    if (int(indices.x) > iNumCells) {
        indices.x = (row-1u) * uint(iLatticeCols) + col;
    }

    return Data(indices, vec2(0.), vec4(0.), false, 0.);
}

Data update() {
    vec2 fragCoord = gl_FragCoord.xy;
    uvec4 prevIndices = fetchIndices(fragCoord);
    if (indexIsUndefined(prevIndices.x)) return init();

    vec2 p = fetchPCoords();

    float prevMaxWeight = weightTexData(prevIndices.x);
    prevMaxWeight = max(prevMaxWeight, weightTexData(prevIndices.y));

    bool debugFlag = false;
    float weightOffsetScale = 1.;
    float mediaWeightOffsetScale = 1.;

    #if WEIGHTED_DIST == 1
        weightOffsetScale = WEIGHT_OFFSET_SCALE * fetchResolutionScale() * 1./float(iNumCells);
        mediaWeightOffsetScale =  weightOffsetScale * WEIGHT_OFFSET_SCALE_MEDIA_MOD;
    #endif

    vec4 mediaBbox = vec4(vec2(1.), vec2(-1.));
//    vec2 cellNdcCoords;
//    vec2 midPointsSum = vec2(0.0);
//    float mediaWeight;

    uint closestIndex = prevIndices.x;

//    if (bMediaEnabled) {
//        cellNdcCoords = fetchNormalizedCellCoords(closestIndex);
//        mediaWeight = mediaWeightOffsetScale * weightTexData(closestIndex);
//    }

    uvec4 indices = uvec4(-1);
    vec4 distances = vec4(FLOAT_INF);

    // pixel search
    #if PIXEL_SEARCH == 1
        vec2 rad = vec2(PIXEL_SEARCH_RADIUS);
        #if PIXEL_SEARCH_RANDOM_DIR == 1
            uint seed = uint(fragCoord.x) + uint(fragCoord.y);
            rad *= randomDir(seed);
        #endif

        fetchAndSortIndices(distances, indices, fragCoord, p, weightOffsetScale, prevMaxWeight);
        fetchAndSortIndices(distances, indices, fragCoord + vec2( 1., 0.) * rad, p, weightOffsetScale, prevMaxWeight);
        fetchAndSortIndices(distances, indices, fragCoord + vec2( 0., 1.) * rad, p, weightOffsetScale, prevMaxWeight);
        fetchAndSortIndices(distances, indices, fragCoord + vec2(-1., 0.) * rad, p, weightOffsetScale, prevMaxWeight);
        fetchAndSortIndices(distances, indices, fragCoord + vec2( 0.,-1.) * rad, p, weightOffsetScale, prevMaxWeight);

        #if PIXEL_SEARCH_FULL_RANDOM == 1
            rngSeed = murmur3(uint(fragCoord.x)) ^ murmur3(floatBitsToUint(fragCoord.y)) ^ murmur3(floatBitsToUint(iTime));
            for (int i = 0; i < 16; i++) {
                sortClosest(bestDistances, indices, wrap1d(nextUint()), p, weightOffsetScale, prevMaxWeight);
            }
        #endif

    # else
        sortClosest(distances, indices, closestIndex, p, weightOffsetScale, prevMaxWeight);
    #endif

    // neighbors search
    uint maxNeighborIterations = GLOBAL_MAX_NEIGHBOR_ITERATIONS;
    if (iForceMaxNeighborLevel == 1) {
        maxNeighborIterations = MAX_NEIGHBOR_ITERATIONS_LEVEL_1;
    } else if (iForceMaxNeighborLevel == 2) {
        maxNeighborIterations = MAX_NEIGHBOR_ITERATIONS_LEVEL_2;
    } else if (iForceMaxNeighborLevel == 3) {
        maxNeighborIterations = MAX_NEIGHBOR_ITERATIONS_LEVEL_3;
    }
    uint neighborsPosition = neighborsTexData(indices.x*2u);
    uint neighborsLength = neighborsTexData(indices.x*2u+1u);
    for (uint i = 0u; i < min(neighborsLength, maxNeighborIterations); i++) {
        sortClosest(distances, indices, neighborsTexData(neighborsPosition+i), p, weightOffsetScale, prevMaxWeight);
    }

    // update closest
    closestIndex = indices.x;

    // edge calc using the other 3 indices
    float weight = weightTexData(closestIndex);
    float weightOffset = weightOffsetScale * weight;
    vec2 cellCoords = fetchCellCoords(closestIndex);
    vec2 minEdgeDists = vec2(0.1);
    calcMinEdgeDists(indices.y, cellCoords, p, minEdgeDists, weight, weightOffset, weightOffsetScale);
    calcMinEdgeDists(indices.z, cellCoords, p, minEdgeDists, weight, weightOffset, weightOffsetScale);
    calcMinEdgeDists(indices.w, cellCoords, p, minEdgeDists, weight, weightOffset, weightOffsetScale);

    // media bbox
    if (bMediaEnabled) {

        mediaBbox = vec4(vec2(1.), vec2(-1.));
        vec2 midPointsSum = vec2(0.0);
        float mediaWeight = mediaWeightOffsetScale * weightTexData(closestIndex);
        vec2 cellNdcCoords = fetchNormalizedCellCoords(closestIndex);

        neighborsPosition = neighborsTexData(closestIndex*2u);
        neighborsLength = min(neighborsTexData(closestIndex*2u+1u), MAX_NEIGHBOR_ITERATIONS_LEVEL_1);
        for (uint i = 0u; i < neighborsLength; i++) {
            uint neighborIndex = neighborsTexData(neighborsPosition+i);
            vec2 neighborNdcCoords = fetchNormalizedCellCoords(neighborIndex);

            float mid = 0.5;
            #if WEIGHTED_DIST == 1
                float neighborMediaWeight = mediaWeightOffsetScale * weightTexData(neighborIndex);
                mid += (mediaWeight - neighborMediaWeight);
            #endif

            vec2 mediaMidNdcPoint = mix(cellNdcCoords, neighborNdcCoords, mid);
            midPointsSum += mediaMidNdcPoint;

            mediaBbox.xy = min(mediaBbox.xy, mediaMidNdcPoint);
            mediaBbox.zw = max(mediaBbox.zw, mediaMidNdcPoint);
        }

        vec2 avgCenter = midPointsSum / float(neighborsLength);
//        vec2 avgCenterDiff = avgCenter - cellNdcCoords;
        vec2 avgCenterDiff = (avgCenter - cellNdcCoords) * MEDIA_BBOX_ADJUSTMENT_SCALE;

        mediaBbox.xy = min(mediaBbox.xy, mediaBbox.xy + avgCenterDiff);
        mediaBbox.zw = max(mediaBbox.zw, mediaBbox.zw + avgCenterDiff);

        float bbX = mediaBbox.z - mediaBbox.x;
        float bbY = mediaBbox.w - mediaBbox.y;

        #if LOCK_MEDIA_ASPECT == 1
            float bbMax = max(bbX, bbY/MEDIA_ASPECT);
            float aspect = iResolution.x / iResolution.y;
            vec2 offset = vec2(bbMax/aspect,bbMax*MEDIA_ASPECT)*0.5;
            mediaBbox.xy = avgCenter - offset;
            mediaBbox.zw = avgCenter + offset;
        #else
            mediaBbox.xy = avgCenter - vec2(bbX,bbY)*0.5;
            mediaBbox.zw = avgCenter + vec2(bbX,bbY)*0.5;
        #endif
    }

    return Data(indices, minEdgeDists, mediaBbox, debugFlag, 0.);
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 center =vec2(fCenter.x, iResolution.y - fCenter.y);
    float centerDist = distance(fragCoord, center);
    if (centerDist > 500.) {
        discard;
    }

    Data data = update();
    uvec4 indices = data.indices;
    vec3 c = bMediaEnabled ? mediaColor(indices.x, data.mediaBbox) : randomColor(indices.x);
    float a = 1.;

    float edge1 = EDGE_1 * fEdgeSmoothnessMod;
    float edge2 = EDGE_2 * fEdgeMod;

    #if TRANSPARENT_BG == 1
        a = mix(
            1.,
            0.,
            smoothstep(edge1, edge2, data.minEdgeDists.x)
        );
    # else
        c = mix(
            c,
            fBaseColor,
            smoothstep(edge1, edge2, data.minEdgeDists.x)
        );
    #endif

    voroIndexBufferColor = uintBitsToFloat(indices + 1u);
    outputColor = vec4(c, a);
    voroEdgeBufferColor = vec2(data.minEdgeDists.x, data.minEdgeDists.y);
}
