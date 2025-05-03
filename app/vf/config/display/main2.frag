#version 300 es

precision highp float;

uniform highp sampler2D uCellCoordsTexture;
uniform highp sampler2D uVoroIndexBufferTexture;
uniform highp sampler2D uVoroIndexBuffer2Texture;
uniform highp usampler2D uCellNeighborsTexture;
uniform highp usampler2D uCellNeighborsAltTexture;
uniform highp sampler2D uCellWeightsTexture;
uniform highp usampler2D uCellMediaVersionsTexture;
uniform highp usampler2D uCellIdMapTexture;

uniform bool bMediaEnabled;
uniform mediump sampler2DArray uMediaV0Texture;
uniform mediump sampler2DArray uMediaV1Texture;
uniform mediump sampler2DArray uMediaV2Texture;
uniform mediump sampler2DArray uMediaV3Texture;
uniform ivec3 iStdNumMediaVersionCols;
uniform ivec3 iStdNumMediaVersionRows;
uniform ivec3 iStdNumMediaVersionLayers;

uniform vec3 iResolution;
uniform int iNumCells;
uniform int iLatticeRows;
uniform int iLatticeCols;
uniform float fLatticeCellWidth;
uniform float fLatticeCellHeight;
uniform int iFocusedIndex;
uniform float iTime;
uniform bool bForceMaxQuality;
uniform int iForceMaxNeighborLevel;
uniform float fRoundnessMod;
uniform float fEdge1Mod;
uniform float fEdge0Mod;
uniform float fFishEyeMod;
uniform vec3 fBaseColor;
uniform vec2 fPointer;
uniform vec2 fForceCenter;
uniform bool bPostEnabled;
uniform bool bPixelSearch;

in vec2 vUv;

layout(location = 0) out vec4 voroIndexBufferColor;
layout(location = 1) out vec4 outputColor;
layout(location = 2) out vec3 voroEdgeBufferColor;
layout(location = 3) out vec4 voroIndexBuffer2Color;

#define PI 3.14159265359
#define TAU 2.0 * PI
#define FLOAT_INF uintBitsToFloat(0x7f800000u)
#define EPSILON .0001

#define MAX_NEIGHBOR_ITERATIONS_LEVEL_1 8u
#define MAX_NEIGHBOR_ITERATIONS_LEVEL_2 24u
#define MAX_NEIGHBOR_ITERATIONS_LEVEL_3 48u
#define GLOBAL_MAX_NEIGHBOR_ITERATIONS MAX_NEIGHBOR_ITERATIONS_LEVEL_1

#define BICUBIC_MEDIA_FILTER 0
#define DRAW_EDGES 1
#define EDGE_SCALING 1
#define DOUBLE_INDEX_POOL 1
#define DOUBLE_INDEX_POOL_BUFFER 0
#define FISHEYE_TEST 1
#define DEBUG_MEDIA_BBOXES 0
#define Y_SCALE 1.
#define MEDIA_UV_ROTATE_FACTOR 1
#define WEIGHTED_DIST 1
//#define WEIGHTED_DIST 0
//#define WEIGHT_OFFSET_SCALE 2000.
#define WEIGHT_OFFSET_SCALE 0.25
//#define WEIGHT_OFFSET_SCALE 1.
#define WEIGHT_OFFSET_SCALE_MEDIA_MOD 9.25
#define X_DIST_SCALING 1
//#define X_DIST_SCALING 0
#define BASE_X_DIST_SCALE 1.5
#define WEIGHTED_X_DIST_SCALE 1.5
#define MEDIA_BBOX_SCALE 1. // TODO TMP
//#define MEDIA_BBOX_ADJUSTMENT_SCALE 3.
#define MEDIA_BBOX_ADJUSTMENT_SCALE 1.
#define LOCK_MEDIA_ASPECT 1
#define MEDIA_ASPECT 1.5
#define PIXEL_SEARCH 1
#define PIXEL_SEARCH_RADIUS 16.
#define PIXEL_SEARCH_RANDOM_DIR 0
#define PIXEL_SEARCH_FULL_RANDOM 0
#define TRANSPARENT_BG 0
//#define ROUNDNESS 0.01 * BASE_X_DIST_SCALE // adjust roundness to match x dist scale
//#define ROUNDNESS 0.025 * BASE_X_DIST_SCALE // adjust roundness to match x dist scale
#define ROUNDNESS 0.1 * BASE_X_DIST_SCALE // adjust roundness to match x dist scale
//#define ROUNDNESS 0.01 * BASE_X_DIST_SCALE // adjust roundness to match x dist scale

//#define EDGE_1 .005
//#define EDGE_2 .001

#define EDGE_1 .009
#define EDGE_2 .0005

struct Data {
    uvec4 indices;
    uvec4 indices2;
    vec2 minEdgeDists;
    vec4 mediaBbox;
    bool debugFlag;
    float scaleMod;
};

// Cubic function for interpolation
vec4 cubic(float v) {
    vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
    vec4 s = n * n * n;
    float x = s.x;
    float y = s.y - 4.0 * s.x;
    float z = s.z - 4.0 * s.y + 6.0 * s.x;
    float w = 6.0 - x - y - z;
    return vec4(x, y, z, w) * (1.0/6.0);
}

vec4 bicubicFilter(mediump sampler2DArray tex, vec3 texCoord, vec2 texSize) {
    vec2 invTexSize = 1.0 / texSize;
    texCoord.xy = texCoord.xy * texSize - 0.5;

    vec2 fxy = fract(texCoord.xy);
    texCoord.xy -= fxy;

    vec4 xcubic = cubic(fxy.x);
    vec4 ycubic = cubic(fxy.y);

    vec4 c = texCoord.xxyy + vec2(-0.5, 1.5).xyxy;

    vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
    vec4 offset = c + vec4(xcubic.yw, ycubic.yw) / s;

    offset *= invTexSize.xxyy;

    vec4 sample0 = texture(tex, vec3(offset.xz, float(texCoord.z)));
    vec4 sample1 = texture(tex, vec3(offset.yz, float(texCoord.z)));
    vec4 sample2 = texture(tex, vec3(offset.xw, float(texCoord.z)));
    vec4 sample3 = texture(tex, vec3(offset.yw, float(texCoord.z)));

    float sx = s.x / (s.x + s.y);
    float sy = s.z / (s.z + s.w);

    return mix(mix(sample3, sample2, sx), mix(sample1, sample0, sx), sy);
}

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
    float a = randomFloat(state) * TAU;
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
//    return min(((iResolution.x * iResolution.y) / (1920.*1080.)), 0.1);
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

vec3 mediaColor(vec2 p, uint index, vec4 mediaBbox) {

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
        numLayers = iStdNumMediaVersionLayers.y;
        mediaCols = iStdNumMediaVersionCols.y;
        mediaRows = iStdNumMediaVersionRows.y;
    } else if (iMediaVersion == 2) {
        numLayers = iStdNumMediaVersionLayers.z;
        mediaCols = iStdNumMediaVersionCols.z;
        mediaRows = iStdNumMediaVersionRows.z;
    } else if (iMediaVersion == 3) {
//        numLayers = 50000;
//        mediaCols = 1;
//        mediaRows = 1;
//        numLayers = int(ceil(50000./54.));
        numLayers = 1;
        mediaCols = 9;
        mediaRows = 6;
    } else {
        numLayers = iStdNumMediaVersionLayers.x;
        mediaCols = iStdNumMediaVersionCols.x;
        mediaRows = iStdNumMediaVersionRows.x;
    }

    int id = int(cellIdMapTexData(index));
    int mediaCapacity = mediaCols * mediaRows;
//    int mediaCapacity = min(mediaCols * mediaRows, iNumCells);
    int layer = id / mediaCapacity % numLayers;
    int tileIndex = id % mediaCapacity;
    float tileRow = float(tileIndex / mediaCols);
    float tileCol = float(tileIndex % mediaCols);
    float tileWidth = 1.0 / float(mediaCols);
    float tileHeight = 1.0 / float(mediaRows);
    vec2 tileOffset = vec2(tileCol * tileWidth, tileRow * tileHeight);

    vec2 tileSize = vec2(tileWidth, tileHeight);
    vec2 mediaTexcoord = tileOffset + mediaTileUv * tileSize;


    if (iMediaVersion == 1) {
        #if BICUBIC_MEDIA_FILTER == 1
            vec2 texSize = vec2(textureSize(uMediaV1Texture, 0).xy);
            vec2 tileTexSize = texSize*tileSize;
            return bicubicFilter(uMediaV1Texture, vec3(mediaTexcoord, float(layer)), texSize).rgb;
        #else
            return texture(uMediaV1Texture, vec3(mediaTexcoord, float(layer))).rgb;
        #endif
    } else if (iMediaVersion == 2) {

        #if BICUBIC_MEDIA_FILTER == 1
            vec2 texSize = vec2(textureSize(uMediaV2Texture, 0).xy);
            vec2 tileTexSize = texSize*tileSize;
            return bicubicFilter(uMediaV2Texture, vec3(mediaTexcoord, float(layer)), texSize).rgb;
        #else
            return texture(uMediaV2Texture, vec3(mediaTexcoord, float(layer))).rgb;
        #endif
    } else if (iMediaVersion == 3) {

        #if BICUBIC_MEDIA_FILTER == 1
            vec2 texSize = vec2(textureSize(uMediaV2Texture, 0).xy);
            vec2 tileTexSize = texSize*tileSize;
            return bicubicFilter(uMediaV3Texture, vec3(mediaTexcoord, float(layer)), texSize).rgb;
        #else
            return texture(uMediaV3Texture, vec3(mediaTexcoord, float(layer))).rgb;
        #endif
    }
    #if BICUBIC_MEDIA_FILTER == 1
        vec2 texSize = vec2(textureSize(uMediaV0Texture, 0).xy);
        vec2 tileTexSize = texSize*tileSize;
        return bicubicFilter(uMediaV0Texture, vec3(mediaTexcoord, float(layer)), texSize).rgb;
    #else
        return texture(uMediaV0Texture, vec3(mediaTexcoord, float(layer))).rgb;
    #endif
}

void calcMinEdgeDists(in uint closeIndex, in vec2 cellCoords, in vec2 p, inout vec2 minEdgeDists, in float weight, in float weightOffset, in float weightOffsetScale, in float scaleMod) {
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
//    minEdgeDists.x = smin2(minEdgeDists.x, len, (len*.5 + .5)*fRoundnessMod*ROUNDNESS*min(scaleMod*5., 1.));
//    minEdgeDists.x = smin2(minEdgeDists.x, len, (len*.5 + .5)*fRoundnessMod*ROUNDNESS);
//    minEdgeDists.x = smin2(minEdgeDists.x, len, fRoundnessMod*ROUNDNESS*min(scaleMod, 1.));
//    minEdgeDists.x = smin2(minEdgeDists.x, len, fRoundnessMod*ROUNDNESS*scaleMod*scaleMod*10.);
//    minEdgeDists.x = smin2(minEdgeDists.x, len, fRoundnessMod*ROUNDNESS*sqrt(scaleMod));





    minEdgeDists.x = smin2(minEdgeDists.x, len, fRoundnessMod*ROUNDNESS*scaleMod);
    minEdgeDists.y = min(minEdgeDists.y, len);


//    minEdgeDists.y = max(minEdgeDists.x, min(minEdgeDists.y, len));
//    minEdgeDists.x = min(minEdgeDists.x, len);

}

void sortClosest(
    inout vec4 distances,
    inout vec4 distances2,
    inout uvec4 indices,
    inout uvec4 indices2,
    uint index,
    vec2 center,
    float weightOffsetScale,
    float prevMaxWeight
) {
    if (indexIsUndefined(index) || any(equal(indices, uvec4(index)))) return;

    #if DOUBLE_INDEX_POOL == 1
        if (any(equal(indices2, uvec4(index)))) return;
    #endif

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
    #if DOUBLE_INDEX_POOL == 1
    else if (dist < distances2.x) {
        distances2 = vec4(dist, distances2.xyz);
        indices2 = uvec4(index, indices2.xyz);
    } else if (dist < distances2.y) {
        distances2 = vec4(distances2.x, dist, distances2.yz);
        indices2 = uvec4(indices2.x, index, indices2.yz);
    } else if (dist < distances2.z) {
        distances2 = vec4(distances2.xy, dist, distances2.z);
        indices2 = uvec4(indices2.xy, index, indices2.z);
    } else if (dist < distances2.w) {
        distances2 = vec4(distances2.xyz, dist);
        indices2 = uvec4(indices2.xyz, index);
    }
    #endif

}

uvec4 fetchIndices(vec2 position) {
    return floatBitsToUint(texelFetch(uVoroIndexBufferTexture, ivec2(position), 0)) - 1u;
}

uvec4 fetchIndices2(vec2 position) {
    return floatBitsToUint(texelFetch(uVoroIndexBuffer2Texture, ivec2(position), 0)) - 1u;
}

void fetchAndSortIndices( inout vec4 distances, inout vec4 distances2, inout uvec4 prevIndices, inout uvec4 prevIndices2, in vec2 samplePoint, in vec2 cellCenter, in float weightOffsetScale, in float prevMaxWeight ) {
    uvec4 indices = fetchIndices(samplePoint);
    sortClosest(distances, distances2, prevIndices, prevIndices2, indices.x, cellCenter, weightOffsetScale, prevMaxWeight);
    sortClosest(distances, distances2, prevIndices, prevIndices2, indices.y, cellCenter, weightOffsetScale, prevMaxWeight);
    sortClosest(distances, distances2, prevIndices, prevIndices2, indices.z, cellCenter, weightOffsetScale, prevMaxWeight);
    sortClosest(distances, distances2, prevIndices, prevIndices2, indices.w, cellCenter, weightOffsetScale, prevMaxWeight);

    #if DOUBLE_INDEX_POOL == 1 && DOUBLE_INDEX_POOL_BUFFER == 1
        uvec4 indices2 = fetchIndices2(samplePoint);
        sortClosest(distances, distances2, prevIndices, prevIndices2, indices2.x, cellCenter, weightOffsetScale, prevMaxWeight);
        sortClosest(distances, distances2, prevIndices, prevIndices2, indices2.y, cellCenter, weightOffsetScale, prevMaxWeight);
        sortClosest(distances, distances2, prevIndices, prevIndices2, indices2.z, cellCenter, weightOffsetScale, prevMaxWeight);
        sortClosest(distances, distances2, prevIndices, prevIndices2, indices2.w, cellCenter, weightOffsetScale, prevMaxWeight);
    #endif
}

Data init(vec2 p) {
    uvec4 indices = uvec4(uint(-1));
    uvec4 indices2 = uvec4(uint(-1));

    uint row = uint(round((1.-vUv.y) * float(iLatticeRows)));
    uint col = uint(round(vUv.x * float(iLatticeCols)));

    indices.x = row * uint(iLatticeCols) + col;
    if (int(indices.x) > iNumCells) {
        indices.x = (row-1u) * uint(iLatticeCols) + col;
    }

    return Data(indices, indices2, vec2(0.), vec4(0.), false, 0.);
}

Data update(vec2 p, float zoomFactor) {
    vec2 fragCoord = gl_FragCoord.xy;
    uvec4 prevIndices = fetchIndices(fragCoord);
    if (indexIsUndefined(prevIndices.x)) return init(p);

    float prevMaxWeight = weightTexData(prevIndices.x);
    prevMaxWeight = max(prevMaxWeight, weightTexData(prevIndices.y));

    bool debugFlag = false;
    float weightOffsetScale = 1.;
    float mediaWeightOffsetScale = 1.;

    #if WEIGHTED_DIST == 1
        weightOffsetScale = WEIGHT_OFFSET_SCALE * min(fetchResolutionScale(), 0.1)/* * 1./float(iNumCells)*/;
        mediaWeightOffsetScale =  weightOffsetScale * WEIGHT_OFFSET_SCALE_MEDIA_MOD;
    #endif

//    vec4 mediaBbox = vec4(vec2(1.), vec2(-1.));
//    vec2 cellNdcCoords;
//    vec2 midPointsSum = vec2(0.0);
//    float mediaWeight;

    uint closestIndex = prevIndices.x;

//    if (bMediaEnabled) {
//        cellNdcCoords = fetchNormalizedCellCoords(closestIndex);
//        mediaWeight = mediaWeightOffsetScale * weightTexData(closestIndex);
//    }

    uvec4 indices = uvec4(-1);
    uvec4 indices2 = uvec4(-1);
    vec4 distances = vec4(FLOAT_INF);
    vec4 distances2 = vec4(FLOAT_INF);

    // pixel search
    #if PIXEL_SEARCH == 1
        if (bPixelSearch) {
            vec2 rad = vec2(PIXEL_SEARCH_RADIUS);
            #if PIXEL_SEARCH_RANDOM_DIR == 1
                uint seed = uint(fragCoord.x) + uint(fragCoord.y);
                rad *= randomDir(seed);
            #endif

            fetchAndSortIndices(distances, distances2, indices, indices2, fragCoord, p, weightOffsetScale, prevMaxWeight);
            fetchAndSortIndices(distances, distances2, indices, indices2, fragCoord + vec2( 1., 0.) * rad, p, weightOffsetScale, prevMaxWeight);
            fetchAndSortIndices(distances, distances2, indices, indices2, fragCoord + vec2( 0., 1.) * rad, p, weightOffsetScale, prevMaxWeight);
            fetchAndSortIndices(distances, distances2, indices, indices2, fragCoord + vec2(-1., 0.) * rad, p, weightOffsetScale, prevMaxWeight);
            fetchAndSortIndices(distances, distances2, indices, indices2, fragCoord + vec2( 0.,-1.) * rad, p, weightOffsetScale, prevMaxWeight);

            #if PIXEL_SEARCH_FULL_RANDOM == 1
                rngSeed = murmur3(uint(fragCoord.x)) ^ murmur3(floatBitsToUint(fragCoord.y)) ^ murmur3(floatBitsToUint(iTime));
                for (int i = 0; i < 16; i++) {
                    sortClosest(distances, distances2, indices, indices2, wrap1d(nextUint()), p, weightOffsetScale, prevMaxWeight);
                }
            #endif
        } else {
            sortClosest(distances, distances2, indices, indices2, closestIndex, p, weightOffsetScale, prevMaxWeight);
        }
    # else
        sortClosest(distances, distances2, indices, indices2, closestIndex, p, weightOffsetScale, prevMaxWeight);
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
        sortClosest(distances, distances2, indices, indices2, neighborsTexData(neighborsPosition+i), p, weightOffsetScale, prevMaxWeight);
    }

    // update closest
    closestIndex = indices.x;

    float scaleMod = 1.;
    // media bbox
    vec4 mediaBbox = vec4(vec2(1.), vec2(-1.));
    if (bMediaEnabled) {

        vec2 midPointsSum = vec2(0.0);
        float mediaWeight = mediaWeightOffsetScale * weightTexData(closestIndex);
        vec2 cellNCoords = fetchNormalizedCellCoords(closestIndex);

        neighborsPosition = neighborsTexData(closestIndex*2u);
        neighborsLength = min(neighborsTexData(closestIndex*2u+1u), MAX_NEIGHBOR_ITERATIONS_LEVEL_1);
        for (uint i = 0u; i < neighborsLength; i++) {
            uint neighborIndex = neighborsTexData(neighborsPosition+i);
            vec2 neighborNCoords = fetchNormalizedCellCoords(neighborIndex);

            float mid = 0.5;
            #if WEIGHTED_DIST == 1
                float neighborMediaWeight = mediaWeightOffsetScale * weightTexData(neighborIndex);
                mid += (mediaWeight - neighborMediaWeight);
            #endif

            vec2 mediaMidNdcPoint = mix(cellNCoords, neighborNCoords, mid);
            midPointsSum += mediaMidNdcPoint;

            mediaBbox.xy = min(mediaBbox.xy, mediaMidNdcPoint);
            mediaBbox.zw = max(mediaBbox.zw, mediaMidNdcPoint);
        }

        vec2 avgCenter = midPointsSum / float(neighborsLength);
//        vec2 avgCenterDiff = avgCenter - cellNdcCoords;
        vec2 avgCenterDiff = (avgCenter - cellNCoords) * MEDIA_BBOX_ADJUSTMENT_SCALE;

        mediaBbox.xy = min(mediaBbox.xy, mediaBbox.xy + avgCenterDiff);
        mediaBbox.zw = max(mediaBbox.zw, mediaBbox.zw + avgCenterDiff);

        float bbX = mediaBbox.z - mediaBbox.x;
        float bbY = mediaBbox.w - mediaBbox.y;

//        vec2 offset = vec2(0.5*MEDIA_BBOX_SCALE);
        vec2 offset = vec2(0.5*MEDIA_BBOX_SCALE*(1./zoomFactor));
        #if LOCK_MEDIA_ASPECT == 1
            float bbMax = max(bbX, bbY/MEDIA_ASPECT);
            float aspect = iResolution.x / iResolution.y;
            offset *= vec2(bbMax/aspect,bbMax*MEDIA_ASPECT);
        #else
            offset *= vec2(bbX,bbY);
        #endif
        mediaBbox.xy = avgCenter - offset;
        mediaBbox.zw = avgCenter + offset;

        #if EDGE_SCALING == 1
//            scaleMod = max(bbX, bbY) / 2.;
            scaleMod = min(bbX, bbY) / 2.;
//            scaleMod = (bbX + bbY) / 2.;
//        scaleMod *= scaleMod;
//                    scaleMod = (bbX * bbY) / 4. * 20.;
//            scaleMod = clamp(scaleMod, 0.15, 0.75);
//            scaleMod = clamp(scaleMod, 0.05, 1.);
//            scaleMod = clamp(sqrt(scaleMod), 0.0, 0.1);
            scaleMod = clamp(sqrt(scaleMod), 0.025, 0.15)* fetchResolutionScale()/* * 1./float(iNumCells)*50000.*/;
        #endif
    }
    #if EDGE_SCALING == 1
    else {
        vec2 rawCellCoords = fetchRawCellCoords(closestIndex);
        float avgXNeighborXDist = (abs(rawCellCoords.x-fetchRawCellCoords(neighborsTexData(neighborsPosition+3u)).x)+abs(rawCellCoords.x-fetchRawCellCoords(neighborsTexData(neighborsPosition+4u)).x)) * 0.5;
        scaleMod = max(1. - (fLatticeCellWidth / avgXNeighborXDist), 0.3);
    }
    #endif

    // edge calc using the other 3 indices
    vec2 cellCoords = fetchCellCoords(closestIndex);
    float weight = weightTexData(closestIndex);
    float weightOffset = weightOffsetScale * weight;
    vec2 minEdgeDists = vec2(0.1);
//    vec2 minEdgeDists = vec2(0.05);


//    calcMinEdgeDists(indices.x, cellCoords, p, minEdgeDists, weight, weightOffset, weightOffsetScale, scaleMod); // todo tmp


    calcMinEdgeDists(indices.y, cellCoords, p, minEdgeDists, weight, weightOffset, weightOffsetScale, scaleMod);
    calcMinEdgeDists(indices.z, cellCoords, p, minEdgeDists, weight, weightOffset, weightOffsetScale, scaleMod);
    calcMinEdgeDists(indices.w, cellCoords, p, minEdgeDists, weight, weightOffset, weightOffsetScale, scaleMod);
    #if DOUBLE_INDEX_POOL == 1
        calcMinEdgeDists(indices2.x, cellCoords, p, minEdgeDists, weight, weightOffset, weightOffsetScale, scaleMod);
        calcMinEdgeDists(indices2.y, cellCoords, p, minEdgeDists, weight, weightOffset, weightOffsetScale, scaleMod);
        calcMinEdgeDists(indices2.z, cellCoords, p, minEdgeDists, weight, weightOffset, weightOffsetScale, scaleMod);
        calcMinEdgeDists(indices2.w, cellCoords, p, minEdgeDists, weight, weightOffset, weightOffsetScale, scaleMod);
    #endif

    return Data(indices, indices2, minEdgeDists, mediaBbox, debugFlag, scaleMod);
}

void main() {
    vec2 p = fetchPCoords();
    vec2 mediaP = fetchNormalizedPCoords();

    float zoomFactor = 1.;

    #if FISHEYE_TEST == 1

        if (fFishEyeMod > 0.) {

            vec2 fragCoord = gl_FragCoord.xy;
            vec2 forceCenterPixel =vec2(fForceCenter.x, iResolution.y - fForceCenter.y);
            vec2 forceCenter = (forceCenterPixel*2.0-iResolution.xy) / iResolution.y;
            vec2 d = p - forceCenter;
            float r = sqrt(dot(d, d));

            float radius = 1.;
            float percent = r / radius;
            float iPercent = radius / r;
            //        float strength = 1.;
            float strength = fFishEyeMod;
            float step = smoothstep(0.0, iPercent, percent);
            //        float strengthMod = 1. - step;
            float strengthMod = .5;
            //        if (step <1.) discard;
            zoomFactor = mix(1.0, step, strength * strengthMod);

            p -= forceCenter;
            p *= zoomFactor;
            p += forceCenter;

//            mediaP -= forceCenter;
//            mediaP *= zoomFactor;
//            mediaP += forceCenter;

            //    p *= normalize(d) * mix(1.0, smoothstep(0.0, radius / r, percent), strength * 0.75);

        }
    #endif

    Data data = update(p, zoomFactor);
    uvec4 indices = data.indices;
    vec3 c = bMediaEnabled ? mediaColor(mediaP, indices.x, data.mediaBbox) : randomColor(indices.x);
    float a = 1.;

//    float scaleMod = data.scaleMod*2.;
//    float scaleMod = data.scaleMod*data.scaleMod*data.scaleMod;
    float scaleMod = data.scaleMod;
    #if EDGE_SCALING
        scaleMod = clamp(scaleMod, 0.05, 0.5);
        scaleMod *= 10.;
    #endif

//    float scaleMod = sqrt(sqrt(data.scaleMod));
    float inverseScaleMod = 1. - scaleMod;

//    if (inverseScaleMod > 1.) {
//        discard;
//    }

    #if DRAW_EDGES == 1
        if (!bPostEnabled) {
            float edge1 = EDGE_1 * fEdge0Mod;
            float edge2 = EDGE_2 * fEdge1Mod;
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
                    //                smoothstep(edge1*scaleMod, edge2*scaleMod*5., data.minEdgeDists.x)
                );
            #endif
        }
    #endif

    voroIndexBufferColor = uintBitsToFloat(indices + 1u);
    #if DOUBLE_INDEX_POOL == 1 && DOUBLE_INDEX_POOL_BUFFER == 1
        voroIndexBuffer2Color = uintBitsToFloat(indices2 + 1u);
    #endif

//    if (focusCenterDist > 425.) {
//    if (focusCenterDist > 725.) {
//        c = fBaseColor;
//    }
    outputColor = vec4(c, a);
//    outputColor = vec4(vec3(smoothstep(edge1, edge2, data.minEdgeDists.x*inverseScaleMod)), 1.);
//    outputColor = vec4(vec3(smoothstep(edge1, edge2, data.minEdgeDists.x)*scaleMod), 1.);
//    outputColor = vec4(vec3(smoothstep(edge1*scaleMod, edge2, data.minEdgeDists.x)), 1.);
//    outputColor = vec4(vec3(smoothstep(edge1*scaleMod*5., edge2*scaleMod*50., data.minEdgeDists.x)), 1.);
//    outputColor = vec4(vec3(smoothstep(edge1*scaleMod, edge2*scaleMod*10., data.minEdgeDists.x)), 1.);
//    outputColor = vec4(vec3(smoothstep(edge1, edge2, data.minEdgeDists.x)), 1.);


    if (bPostEnabled) {
        voroEdgeBufferColor = vec3(data.minEdgeDists.x, data.minEdgeDists.y, data.scaleMod);
    }

//    float r = (data.minEdgeDists.y - data.minEdgeDists.x);
//    voroEdgeBufferColor = vec3(r, data.minEdgeDists.x, data.scaleMod);

}
