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
uniform ivec3 i3NumMediaVersionCols;
uniform ivec3 i3NumMediaVersionRows;
uniform ivec3 i3NumMediaVersionLayers;

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
//#define Y_FACTOR 4.5
#define Y_FACTOR 1.
#define MEDIA_UV_ROTATE_FACTOR 1
//#define ROUNDNESS 0.03
#define ROUNDNESS 0.02
//#define ROUNDNESS 0.01
//#define ROUNDNESS 0.0
#define EARLY_EXIT_OPTIMIZATION 0
#define WEIGHT_MOD 10.
#define WEIGHT_MOD_MEDIA 30.

struct Data {
    uvec4 indices;
    vec2 minEdgeDists;
    vec4 mediaBbox;
    bool debugFlag;
    float scaleMod;
};

/* START TMP SECTION */
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
/* END TMP SECTION */

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

float weightedDist(vec2 p1, vec2 p2, float weight) {
    return dist(p1, p2) - weight;
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

vec2 getCellCoords(uint i) {
    vec2 screenCoords = coordsTexData(int(i));
    return (vec2(screenCoords.x, iResolution.y - screenCoords.y)*2.0-iResolution.xy) / iResolution.y;
}

vec2 getRawCellCoords(uint i) {
    vec2 screenCoords = coordsTexData(int(i));
    return vec2(screenCoords.x, iResolution.y - screenCoords.y);
}

vec2 getNormalizedCellCoords(uint i) {
    vec2 coords = coordsTexData(int(i));
    return normalizeCoords(vec2(coords.x, iResolution.y - coords.y));
}

vec2 getPCoords() {
    vec2 fragCoord = gl_FragCoord.xy / iResolution.z;
    //    fragCoord.y /= Y_FACTOR;
    return (fragCoord.xy*2.0-iResolution.xy) / iResolution.y;
}

vec2 getNormalizedPCoords() {
    vec2 fragCoord = gl_FragCoord.xy / iResolution.z;
    fragCoord.y /= Y_FACTOR;
    return normalizeCoords(fragCoord);
}

float getResolutionMod() {
    return ((iResolution.x * iResolution.y) / (1920.*1080.));
}

float calculateOrientation(vec2 left, vec2 right) {
    vec2 localX = normalize(right - left);
    float angle = atan(localX.y, localX.x);
//    return angle + 1.5708;
    return angle;
}

void rotateMediaTileUv(inout vec2 mediaTileUv, in uint index) {
    uint neighborIndex = neighborsTexData(index*2u);
    float angle = calculateOrientation(getNormalizedCellCoords(neighborsTexData(neighborIndex+3u)),getNormalizedCellCoords(neighborsTexData(neighborIndex+4u)));

    // center origin
    vec2 centerUv = vec2(0.5, 0.5);
    vec2 pos = mediaTileUv - centerUv;

    // rotate
    angle *= float(MEDIA_UV_ROTATE_FACTOR);
    float cosAngle = cos(angle);
    float sinAngle = sin(angle);
    vec2 rotatedUv = vec2(
        pos.x * cosAngle - pos.y * sinAngle,
        pos.x * sinAngle + pos.y * cosAngle
    );

    // uncenter origin
    mediaTileUv = rotatedUv + centerUv;
}

vec3 mediaColor(uint index, vec4 mediaBbox) {

    vec2 p = getNormalizedPCoords();

    vec2 mediaTileUv = (p - mediaBbox.xy) / (mediaBbox.zw - mediaBbox.xy);
    mediaTileUv.y = 1. - mediaTileUv.y;

    #if MEDIA_UV_ROTATE_FACTOR != 0
        rotateMediaTileUv(mediaTileUv, index);
    #endif

    #if DEBUG_MEDIA_BBOXES == 1  // highlight bbox limits
        if (mediaTileUv.x < 0.01 || mediaTileUv.x > 0.99 || mediaTileUv.y < 0.01 || mediaTileUv.y > 0.99) {
            return vec3(1.,0.,0.);
        }
    # else  // obscure bbox inaccuracies and prevent tile bleeding
        mediaTileUv = vec2(clamp(mediaTileUv.x, 0.01, 0.99), clamp(mediaTileUv.y, 0.01, 0.99));
    #endif

    int iMediaVersion = int(mediaVersionTexData(index).x);

    int numLayers = i3NumMediaVersionLayers[iMediaVersion];
    int mediaCols = i3NumMediaVersionCols[iMediaVersion];
    int mediaRows = i3NumMediaVersionRows[iMediaVersion];


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

void sortClosest(
    inout vec4 distances,
    inout uvec4 indices,
    uint index,
    vec2 center
) {
    if (indexIsUndefined(index) || any(equal(indices, uvec4(index)))) {
        return;
    }

    vec2 coords = getRawCellCoords(index);
    float dist = length(center - coords);

    if (dist < distances[0]) {
        distances = vec4(dist, distances.xyz);
        indices = uvec4(index, indices.xyz);
    } else if (dist < distances[1]) {
        distances = vec4(distances.x, dist, distances.yz);
        indices = uvec4(indices.x, index, indices.yz);
    } else if (dist < distances[2]) {
        distances = vec4(distances.xy, dist, distances.z);
        indices = uvec4(indices.xy, index, indices.z);
    } else if (dist < distances[3]) {
        distances = vec4(distances.xyz, dist);
        indices = uvec4(indices.xyz, index);
    }
}

uvec4 fetchClosest(vec2 position, sampler2D voroBuffer) {
    //    return floatBitsToUint(texelFetch(voroBuffer, ivec2(position), 0));
    vec4 c = texelFetch(voroBuffer, ivec2(position), 0);
    return floatBitsToUint(c) - 1u;
}

void fetchAndSortClosest( inout vec4 distances, inout uvec4 idList, in vec2 samplePoint, in vec2 cellCenter ) {
    uvec4 indices = fetchClosest(samplePoint, uVoroIndexBufferTexture);

    for (int i = 0; i < 4; i++) {
        sortClosest(distances, idList, indices[i], cellCenter);
    }
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



Data updateData(vec2 p, uvec4 prevIndices) {
    bool debugFlag = false;
    float weightMod = WEIGHT_MOD * getResolutionMod() * 1./float(iNumCells);

    vec4 mediaBbox = vec4(vec2(1.), vec2(-1.));
    vec2 cellNdcCoords;
    vec2 midPointsSum = vec2(0.0);
    float mediaWeight;
    //    float mediaWeightMod = WEIGHT_MOD_MEDIA * getResolutionMod();
    float mediaWeightMod =  weightMod * 3.;


    uint closestIndex = prevIndices.x;

    if (bMediaEnabled) {
        cellNdcCoords = getNormalizedCellCoords(closestIndex);
        mediaWeight = mediaWeightMod * weightTexData(closestIndex);
    }


    bool highQuality = false;
    uint maxNeighborIterations = GLOBAL_MAX_NEIGHBOR_ITERATIONS;

    if (iForceMaxNeighborLevel == 1) {
        maxNeighborIterations = MAX_NEIGHBOR_ITERATIONS_LEVEL_1;
    } else if (iForceMaxNeighborLevel == 2) {
        maxNeighborIterations = MAX_NEIGHBOR_ITERATIONS_LEVEL_2;
    } else if (iForceMaxNeighborLevel == 3) {
        maxNeighborIterations = MAX_NEIGHBOR_ITERATIONS_LEVEL_3;
    }

//    if (bForceMaxQuality) {
//        highQuality = true;
//        maxNeighborIterations = MAX_NEIGHBOR_ITERATIONS_LEVEL_3;
//    } else {
//        float distToFocusedCell = 0.;
//        if (iFocusedIndex != -1) {
//            if (closestIndex != uint(iFocusedIndex)) {
//                vec2 focusedCellCoords = getCellCoords(uint(iFocusedIndex));
//                vec2 cellCoords = getCellCoords(closestIndex);
//                distToFocusedCell = dist(cellCoords, focusedCellCoords);
//
//                if (distToFocusedCell < 0.5) {
//                    highQuality = true;
//                    maxNeighborIterations = MAX_NEIGHBOR_ITERATIONS_LEVEL_3;
//                    //                discard;
//                } else if (distToFocusedCell < 0.75) {
//                    maxNeighborIterations = MAX_NEIGHBOR_ITERATIONS_LEVEL_2;
//                }
//            } else {
//                highQuality = true;
//                maxNeighborIterations = MAX_NEIGHBOR_ITERATIONS_LEVEL_3;
//            }
//
//            //        avgXNeighborDist = (dist(focusedCellCoords, getCellCoords(neighborsTexData(neighborsTexData(iFocusedIndex*2)+3))) + dist(focusedCellCoords, getCellCoords(neighborsTexData(neighborsTexData(iFocusedIndex*2)+7)))) * 0.5;
//        }
//    }


        highQuality = true;
    vec2 fragCoord = gl_FragCoord.xy;

    uvec4 indices = uvec4(-1);
    vec4 bestDistances = vec4(FLOAT_INF);

    //    float rad = 4.0;
    float rad = 16.0;
    //    float rad = 32.0;

    //    sortClosest(bestDistances, indices, ids[0], fragCoord);

    //    uvec2 nIndexAndLength2 = uvec2(neighborsTexData(ids.x*2u),neighborsTexData(ids.x*2u+1u));
    //    for (uint i = 0u; i < min(nIndexAndLength2.y, maxNeighborIterations); i++) {
    //        uint neighborId = neighborsTexData(nIndexAndLength2.x+i);
    //        sortClosest(bestDistances, indices, neighborId, fragCoord);
    //    }

    if (highQuality) {
        fetchAndSortClosest(bestDistances, indices, fragCoord, fragCoord);
//        uint seed = uint(fragCoord.x) + uint(fragCoord.y);
        //        fetchAndSortClosest(bestDistances, indices, fragCoord + randomDir(seed) * rad, fragCoord);
        //        fetchAndSortClosest(bestDistances, indices, fragCoord + randomDir(seed) * rad, fragCoord);
        //        fetchAndSortClosest(bestDistances, indices, fragCoord + randomDir(seed) * rad, fragCoord);
        //        fetchAndSortClosest(bestDistances, indices, fragCoord + randomDir(seed) * rad, fragCoord);

        fetchAndSortClosest(bestDistances, indices, fragCoord + vec2( 1., 0.) * rad, fragCoord);
        fetchAndSortClosest(bestDistances, indices, fragCoord + vec2( 0., 1.) * rad , fragCoord);
        fetchAndSortClosest(bestDistances, indices, fragCoord + vec2(-1., 0.) * rad, fragCoord);
        fetchAndSortClosest(bestDistances, indices, fragCoord + vec2( 0.,-1.) * rad, fragCoord);


        //        rngSeed = murmur3(uint(fragCoord.x)) ^ murmur3(floatBitsToUint(fragCoord.y)) ^ murmur3(floatBitsToUint(iTime));
        //        for (int i = 0; i < 16; i++) {
        //            sortClosest(bestDistances, indices, wrap1d(nextUint()), fragCoord);
        //        }
    } else {
        sortClosest(bestDistances, indices, closestIndex, fragCoord);
    }

    uint neighborsPosition = neighborsTexData(indices.x*2u);
    uint neighborsLength = neighborsTexData(indices.x*2u+1u);
    for (uint i = 0u; i < min(neighborsLength, maxNeighborIterations); i++) {
        uint neighborIndex = neighborsTexData(neighborsPosition+i);
        sortClosest(bestDistances, indices, neighborIndex, fragCoord);

        if (bMediaEnabled && i < min(neighborsLength, MAX_NEIGHBOR_ITERATIONS_LEVEL_1)) {
            vec2 neighborNdcCoords = getNormalizedCellCoords(neighborIndex);

            float neighborMediaWeight = mediaWeightMod * weightTexData(neighborIndex);

            vec2 mediaMidNdcPoint = mix(cellNdcCoords, neighborNdcCoords, 0.5 + (mediaWeight - neighborMediaWeight) );
            midPointsSum += mediaMidNdcPoint;

            mediaBbox.xy = min(mediaBbox.xy, mediaMidNdcPoint);
            mediaBbox.zw = max(mediaBbox.zw, mediaMidNdcPoint);
        }
    }

    closestIndex = indices.x;


    vec2 cellCoords = getCellCoords(closestIndex);
    vec2 minEdgeDists = vec2(0.1);



    for (uint i = 1u; i < 4u; i++) {
        uint neighborId = indices[i];
        vec2 neighborCellCoords = getCellCoords(neighborId);

        vec2 mr = cellCoords - p;
        vec2 r = neighborCellCoords - p;
        vec2 dr = r - mr;
        float d = dot2(dr);
        float d2 = d;

        float mf = d2 / (2.*d);
        float newLen = dot( mix(mr.xy,r,mf), dr*(1./sqrt(d)) );
        //                    minEdgeDist = smin( minEdgeDist, newLen, ROUNDNESS );
        //        minEdgeDist = smin2( minEdgeDist, newLen, ROUNDNESS );
        minEdgeDists.x = smin2(minEdgeDists.x, newLen, (newLen*.5 + .5)*fRoundnessMod*ROUNDNESS);
        minEdgeDists.y = min(minEdgeDists.y, newLen);

    }




    if (highQuality || bMediaEnabled) {
//        if (bMediaEnabled) {
//            cellNdcCoords = getNormalizedCellCoords(closestIndex);
//            mediaWeight = mediaWeightMod * weightTexData(closestIndex);
//        }
//        uint neighborsPosition = neighborsTexData(closestIndex*2u);
//        uint neighborsLength = neighborsTexData(closestIndex*2u+1u);
//        for (uint i = 0u; i < min(neighborsLength, maxNeighborIterations); i++) {
//            uint neighborId = neighborsTexData(neighborsPosition+i);
//            vec2 neighborCellCoords = getCellCoords(neighborId);
//
//
//            if (bMediaEnabled && i < min(neighborsLength, MAX_NEIGHBOR_ITERATIONS_LEVEL_1)) {
//                vec2 neighborNdcCoords = getNormalizedCellCoords(neighborId);
//
//                float neighborMediaWeight = mediaWeightMod * weightTexData(neighborId);
//
//                vec2 mediaMidNdcPoint = mix(cellNdcCoords, neighborNdcCoords, 0.5 + (mediaWeight - neighborMediaWeight) );
//                midPointsSum += mediaMidNdcPoint;
//
//                mediaBbox.xy = min(mediaBbox.xy, mediaMidNdcPoint);
//                mediaBbox.zw = max(mediaBbox.zw, mediaMidNdcPoint);
//            }
//
//            if (!highQuality) continue;
//            if (neighborId == closestIndex || neighborId == indices.y || neighborId == indices.z || neighborId == indices.w) continue;
//
//            vec2 mr = cellCoords - p;
//            vec2 r = neighborCellCoords - p;
//            vec2 dr = r - mr;
//            float d = dot2(dr);
//            float d2 = d;
//
//            float mf = d2 / (2.*d);
//            float newLen = dot( mix(mr.xy,r,mf), dr*(1./sqrt(d)) );
//            //            minEdgeDist = smin( minEdgeDist, newLen, ROUNDNESS );
//            //        minEdgeDist = smin2( minEdgeDist, newLen, ROUNDNESS );
//            minEdgeDist = smin2(minEdgeDist, newLen, (newLen*.5 + .5)*ROUNDNESS);
//            //            minEdgeDist = min( minEdgeDist, newLen );
//
//        }

        if (bMediaEnabled) {

            vec2 avgCenter = midPointsSum / float(min(neighborsLength, MAX_NEIGHBOR_ITERATIONS_LEVEL_1));
            //        vec2 avgCenterDiff = ( avgCenter - cellNdcCoords)*3.8;
            vec2 avgCenterDiff = ( avgCenter - cellNdcCoords);

            mediaBbox.xy = min(mediaBbox.xy, mediaBbox.xy + avgCenterDiff);
            mediaBbox.zw = max(mediaBbox.zw, mediaBbox.zw + avgCenterDiff);

            float bbX = mediaBbox.z - mediaBbox.x;
            float bbY = mediaBbox.w - mediaBbox.y;

            //        mediaBbox.xy = avgCenter - vec2(bbX,bbY)*0.5;
            //        mediaBbox.zw = avgCenter + vec2(bbX,bbY)*0.5;

            float bbMax = max(bbX, bbY/1.5);
            float aspect = iResolution.x / iResolution.y;
            mediaBbox.xy = avgCenter - vec2(bbMax/aspect,bbMax*1.5)*0.5;
            mediaBbox.zw = avgCenter + vec2(bbMax/aspect,bbMax*1.5)*0.5;
        }
    }

    return Data(indices, minEdgeDists, mediaBbox, debugFlag, 0.);
}

Data initData(vec2 p) {
    uvec4 indices = uvec4(uint(-1));

    uint row = uint(round((1.-vUv.y) * float(iLatticeRows)));
    uint col = uint(round(vUv.x * float(iLatticeCols)));

    indices.x = row * uint(iLatticeCols) + col;
    if (int(indices.x) > iNumCells) {
        indices.x = (row-1u) * uint(iLatticeCols) + col;
    }

    return Data(indices, vec2(0.), vec4(0.), false, 0.);
}

uvec4 getPrevIndices() {
    vec4 c = texelFetch(uVoroIndexBufferTexture, ivec2(gl_FragCoord.xy), 0);
    return floatBitsToUint(c) - 1u;
}

Data getData() {
    vec2 p = getPCoords();
    uvec4 prevIndices = getPrevIndices();
    if (indexIsUndefined(prevIndices.x)) {
        return initData(p);
    } else {
        return updateData(p, prevIndices);
    }
}

void main() {

    Data data = getData();
    uvec4 indices = data.indices;

    vec3 c = bMediaEnabled ? mediaColor(indices.x, data.mediaBbox) : randomColor(indices.x);

//    float weightMod = WEIGHT_MOD * getResolutionMod() * 1./float(iNumCells);

//    float w = data.weight * weightMod;


//    float mod = (data.mediaBbox.z - data.mediaBbox.x) * 50.;
    //    float mod = 1.;
//    float edgeMod = 0.75;


    float edge1 = .005 * fEdgeSmoothnessMod;
    float edge2 = .001 * fEdgeMod;

    c = mix(
        c,
        vec3(0.),
        smoothstep(edge1, edge2, data.minEdgeDists.x)
    );

    float a = 1.;
//    a = mix(
//        1.,
//        0.,
//        smoothstep(edge1, edge2, data.minEdgeDists.x)
//    );

    voroIndexBufferColor = uintBitsToFloat(indices + 1u);
//    outputColor = vec4(c, 1.);
    outputColor = vec4(c, a);

//    voroEdgeBufferColor = a;
//    voroEdgeBufferColor = mix(a, 0.0, 1.0 -(abs(data.minEdgeDist) - 0.) * 7.25);
    voroEdgeBufferColor = vec2(data.minEdgeDists.x,data.minEdgeDists.y);
}
