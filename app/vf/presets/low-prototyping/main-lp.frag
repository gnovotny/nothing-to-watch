#version 300 es

precision highp float;

#define PI 3.14159265359
#define TAU 2.0 * PI
#define FLOAT_INF uintBitsToFloat(0x7f800000u)
#define EPSILON .0001

#define TRANSPARENT_BG 0
#define Y_SCALE 1.

#define DYNAMIC_MAX_NEIGHBORS 0
#define MAX_NEIGHBORS_LEVEL_1 8u
#define MAX_NEIGHBORS_LEVEL_2 24u
#define MAX_NEIGHBORS_LEVEL_3 48u
#define DEFAULT_MAX_NEIGHBORS MAX_NEIGHBORS_LEVEL_1

#define MEDIA_ENABLED 1
#define MEDIA_HIDE 0
#define MEDIA_GAMMA_CONVERSION_FACTOR 2
#define MEDIA_GRAYSCALE 0
#define MEDIA_BICUBIC_FILTER 0
#define MEDIA_BBOX_SCALE 1. // TODO TMP
//#define MEDIA_BBOX_ADJUSTMENT_SCALE 3.
#define MEDIA_BBOX_ADJUSTMENT_SCALE 1.
#define MEDIA_LOCKED_ASPECT 1
#define MEDIA_ASPECT 1.5
#define MEDIA_ROTATE 0
#define MEDIA_ROTATE_FACTOR 1.
#define MEDIA_FISHEYE 0
#define MEDIA_DEBUG_BBOXES 0

#define NUM_CELLS_BASELINE 50000.
#define DOUBLE_INDEX_POOL 1
#define DOUBLE_INDEX_POOL_EDGES 1
#define DOUBLE_INDEX_POOL_BUFFER 0
#define PIXEL_SEARCH 1
#define PIXEL_SEARCH_RADIUS 16.
#define PIXEL_SEARCH_RANDOM_DIR 0
#define PIXEL_SEARCH_FULL_RANDOM 0

#define FISHEYE 0
#define FISHEYE_BASE_STRENGTH .5
#define FISHEYE_BASE_RADIUS 1.
#define FISHEYE_SQUARED 1

//#define WEIGHTED_DIST 1
#define WEIGHTED_DIST 0
//#define WEIGHT_OFFSET_SCALE 2000.
#define WEIGHT_OFFSET_SCALE 0.25
//#define WEIGHT_OFFSET_SCALE 1.
#define WEIGHT_OFFSET_SCALE_MEDIA_MOD 9.25
#define X_DIST_SCALING 1
//#define X_DIST_SCALING 0
#define DEFAULT_BASE_X_DIST_SCALE 1.5
#define DEFAULT_WEIGHTED_X_DIST_SCALE 1.5
#define X_DIST_SCALING_EDGE_ASPECT_CORRECTION 0 // just seems looks better without it due to extreme vertical elongation and small sizes

#define DRAW_EDGES 1
#define EDGE_SMIN_SCALING 1
#define EDGE_SMIN_SCALING_COMPENSATION 0
#define EDGE_SCALING 1
#define EDGE_SCALING_MODE 0 // mode 1 = media boxes if media enabled
//#define EDGE_0_BASE .009
//#define EDGE_1_BASE .004
//#define EDGE_0_BASE .02
//#define EDGE_1_BASE .0075
#define EDGE_0_BASE .2
#define EDGE_1_BASE .075
//#define EDGE_0_ADDITION 0.009
//#define EDGE_1_ADDITION 0.001
#define EDGE_0_ADDITION 0.00
#define EDGE_1_ADDITION 0.00

//#define EDGE_0_BASE .001
//#define EDGE_1_BASE .0004
//#define EDGE_0_ADDITION 0.
//#define EDGE_1_ADDITION 0.

//#define ROUNDNESS_BASE 0.
#define ROUNDNESS_BASE 0.15
#define ROUNDNESS_ADDITION 0.
#define ROUNDNESS_MIN 0.015
//#define ROUNDNESS_MAX 1.
#define ROUNDNESS_MAX 0.03

#define UNWEIGHTED_EFFECT 1
//#define UNWEIGHTED_MOD_OPACITY 0.5
#define UNWEIGHTED_MOD_OPACITY 1.
#define UNWEIGHTED_MOD_GRAYSCALE 0.

uniform highp sampler2D uCellCoordsTexture;
uniform highp sampler2D uVoroIndexBufferTexture;
uniform highp sampler2D uVoroIndexBuffer2Texture;
uniform highp usampler2D uCellNeighborsTexture;
uniform highp usampler2D uCellNeighborsAltTexture;
uniform highp sampler2D uCellWeightsTexture;
uniform highp usampler2D uCellMediaVersionsTexture;
uniform highp usampler2D uCellIdMapTexture;

uniform mediump sampler2DArray uMediaV0Texture;
uniform mediump sampler2DArray uMediaV1Texture;
uniform mediump sampler2DArray uMediaV2Texture;
uniform mediump sampler2DArray uMediaV3Texture;
uniform ivec3 iStdMediaVersionNumCols;
uniform ivec3 iStdMediaVersionNumRows;
uniform ivec3 iStdMediaVersionNumLayers;
uniform int iVirtMediaVersionNumCols;
uniform int iVirtMediaVersionNumRows;
uniform int iVirtMediaVersionNumLayers;

uniform vec3 iResolution;
uniform int iNumCells;
uniform int iLatticeRows;
uniform int iLatticeCols;
uniform float fLatticeCellWidth;
uniform float fLatticeCellHeight;
uniform int iFocusedIndex;
uniform float iTime;
uniform int iForcedMaxNeighborLevel;
uniform float fRoundnessMod;
uniform float fEdge1Mod;
uniform float fEdge0Mod;
uniform float fFishEyeStrength;
uniform float fFishEyeRadius;
uniform float fWeightOffsetScaleMod;
uniform vec3 fBaseColor;
uniform vec2 fPointer;
uniform vec2 fForceCenter;
uniform float fForceCenterStrengthMod;
uniform bool bDrawEdges;
uniform bool bVoroEdgeBufferOutput;
uniform bool bPixelSearch;
uniform float fUnWeightedEffectMod;
uniform float fBaseXDistScale;
uniform float fWeightedXDistScale;
uniform bool bMediaDistortion;

in vec2 vUv;

layout(location = 0) out vec4 voroIndexBufferColor;
layout(location = 1) out vec4 outputColor;
layout(location = 2) out vec3 voroEdgeBufferColor;
#if DOUBLE_INDEX_POOL == 1 && DOUBLE_INDEX_POOL_BUFFER == 1
    layout(location = 3) out vec4 voroIndexBuffer2Color;
#endif

struct Plot {
    uvec4 indices;
    uvec4 indices2;
    vec2 minEdgeLen;
    vec4 mediaBbox;
    float edgeScaleMod;
    float weight;
    bool debugFlag;
};

const vec3 GRAYSCALE_LUMCOEFF = vec3(0.2125, 0.7154, 0.0721);
const vec4 GRAYSCALE_DUOTONE_DARK = vec4(0.125, 0.125, 0.133, 1);
//const vec4 GRAYSCALE_DUOTONE_DARK = vec4(0., 0., 0., 1);
//const vec4 GRAYSCALE_DUOTONE_LIGHT = vec4(0.996, 0.224, 0.294, 1);
//const vec4 GRAYSCALE_DUOTONE_LIGHT = vec4(0.18, 0.18, 0.188, 1);
//const vec4 GRAYSCALE_DUOTONE_LIGHT = vec4(0.957, 0.957, 0.957, 1);
const vec4 GRAYSCALE_DUOTONE_LIGHT = vec4(0.769, 0.729, 0.69, 1);

vec3 linearToGamma( in vec3 value ) {
    return vec3( pow( value.xyz, vec3( 1.0 / float( MEDIA_GAMMA_CONVERSION_FACTOR ) ) ));
}

vec3 gammaToLinear( in vec3 value ) {
    return vec3( pow( value.xyz, vec3( float( MEDIA_GAMMA_CONVERSION_FACTOR ) ) ));
}

vec3 toGrayscale(vec3 c, float factor) {
    c = linearToGamma(c);
    vec3 gray = vec3(dot(GRAYSCALE_LUMCOEFF, c));
    vec3 duotone = mix(GRAYSCALE_DUOTONE_DARK.rgb, GRAYSCALE_DUOTONE_LIGHT.rgb, gray);
    c = mix(c, duotone, factor);
    c = gammaToLinear(c);
    return c;
}

#if MEDIA_BICUBIC_FILTER == 1
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
#endif

#if PIXEL_SEARCH_RANDOM_DIR == 1
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
#endif

#if PIXEL_SEARCH_FULL_RANDOM == 1
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
#endif

// commutative smoothmin
float cSmin(float a, float b, float r)
{
    float f = max(0., 1. - abs(b - a)/r);
    return min(a, b) - r*.25*f*f;
}

// polynomial-based smoothmin
float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

// exponential-based smooth minimum function, associative and commutative
float sminExp(float a, float b, float k)
{
    float res = exp(-k*a) + exp(-k*b);
    return -log(res)/k;
}

// smooth abs, equivalent to -smin(x, -x, r) - r*.25
float sabs(float x, float r)
{
    float f = max(0.,1.-abs(x + x)/r);
    return abs(x) + r*.25*(f*f - 1.);
}

float dot2(vec2 p) {
    return dot(p,p);
}

float dist(vec2 a, vec2 b) {
    return dot2(a - b);
}

// Converts an integer into a pseudo-random float between 0.0 and 1.0
float randomColorChannel(uint seed) {
    return fract(sin(float(seed) * 78.233) * 43758.5453123);
}

float getBaseXDistScale() {
    #if X_DIST_SCALING == 1
        return DEFAULT_BASE_X_DIST_SCALE;
    #endif
    return 1.;
}

float getWeightedXDistScale() {
    #if X_DIST_SCALING == 1
        return DEFAULT_WEIGHTED_X_DIST_SCALE;
    #endif
    return 1.;
}

float getXDistScale(float weight) {
    float baseXDistScale = getBaseXDistScale();

    #if WEIGHTED_DIST == 1
        float weightedXDistScale = getWeightedXDistScale();
        return baseXDistScale + weight * (weightedXDistScale-baseXDistScale);
    #else
        return baseXDistScale;
    #endif
}

float dist(vec2 p1, vec2 p2, float weight, float weightOffset) {
    vec2 v = p1 - p2;

    #if X_DIST_SCALING == 1
        float scaleX = getXDistScale(weight);
        v.x *= scaleX; // Apply less x weight for vertical elongation
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

vec2 rawCoords(in vec2 screenCoords) {
    return vec2(screenCoords.x, iResolution.y - screenCoords.y);
}

vec2 normalizeCoords(in vec2 screenCoords) {
    return (screenCoords / iResolution.xy) * 2.0 - 1.0;
}

vec2 aspectCoords(in vec2 screenCoords) {
    return (screenCoords*2.0-iResolution.xy) / iResolution.y;
}

vec2 fetchRawCellCoords(uint i) {
    return rawCoords(coordsTexData(int(i)));
}

vec2 fetchCellCoords(uint i) {
    return aspectCoords(fetchRawCellCoords(i));
}

vec2 fetchNormalizedCellCoords(uint i) {
    return normalizeCoords(fetchRawCellCoords(i));
}

vec2 fragCoords() {
    vec2 fragCoord = gl_FragCoord.xy / iResolution.z;
    fragCoord.y *= Y_SCALE;
    return fragCoord;
}

vec2 pCoords() {
    return aspectCoords(fragCoords());
}

vec2 normalizedPCoords() {
    return normalizeCoords(fragCoords());
}

float resolutionScale;
void initResolutionScale() {
    // prev junk method
//    resolutionScale = ((iResolution.x * iResolution.y) / (1920.*1080.));

    // Compute a dynamic scale factor based on resolution
    // This creates a scale that increases as resolution increases
    resolutionScale = length(iResolution.xy) / 1000.0;

    // Alternative scaling approaches:
    // 1. Based on largest dimension
    // resolutionScale = max(iResolution.x, iResolution.y) / 800.0;

    // 2. Based on area (gives more weight to resolution changes)
    // resolutionScale = sqrt(iResolution.x * iResolution.y) / 600.0;
}

float numCellsScale;
void initNumCellsScale() {
    numCellsScale = NUM_CELLS_BASELINE / float(iNumCells);
}

void initGlobals() {
    initResolutionScale();
    initNumCellsScale();
}

float calculateOrientation(vec2 left, vec2 right) {
    vec2 localX = normalize(right - left);
    return atan(localX.y, localX.x);
}

void rotateMediaTileUv(inout vec2 mediaTileUv, in uint index) {
    uint neighborsIndexStart = neighborsTexData(index*2u);
    float angle = calculateOrientation(fetchNormalizedCellCoords(neighborsTexData(neighborsIndexStart+3u)),fetchNormalizedCellCoords(neighborsTexData(neighborsIndexStart+4u)));

    // center origin
    vec2 centerUv = vec2(0.5);
    vec2 pos = mediaTileUv - centerUv;

    // rotate
    angle *= MEDIA_ROTATE_FACTOR;
    float cosAngle = cos(angle);
    float sinAngle = sin(angle);
    vec2 rotatedUv = vec2(
        pos.x * cosAngle - pos.y * sinAngle,
        pos.x * sinAngle + pos.y * cosAngle
    );

    // revert centered origin
    mediaTileUv = rotatedUv + centerUv;
}

// Assigns a random vec3 color based on the primary cell index
void randomCellColor(inout vec3 c, inout float a, in Plot plot) {
    float r = randomColorChannel(plot.indices.x);
    float g = randomColorChannel(plot.indices.x + 1u);
    float b = randomColorChannel(plot.indices.x + 2u);
    c = vec3(r, g, b);
}

void mediaColor(inout vec3 c, inout float a, in Plot plot) {

    uint index = plot.indices.x;
    vec4 mediaBbox = plot.mediaBbox;

    vec2 p = normalizedPCoords();

    vec2 mediaTileUv = (p - mediaBbox.xy) / (mediaBbox.zw - mediaBbox.xy);
    mediaTileUv.y = 1. - mediaTileUv.y;

    bool rotateMedia = MEDIA_ROTATE != 0 || bMediaDistortion;
    if (rotateMedia) {
        rotateMediaTileUv(mediaTileUv, index);
    }

    #if MEDIA_DEBUG_BBOXES == 1  // highlight bbox overflow
        if (mediaTileUv.x < 0.01 || mediaTileUv.x > 0.99 || mediaTileUv.y < 0.01 || mediaTileUv.y > 0.99) {
            c = vec3(1.,0.,0.);
        }
    # else  // obscure bbox inaccuracies and prevent tile bleeding
        mediaTileUv = vec2(clamp(mediaTileUv.x, 0.01, 0.99), clamp(mediaTileUv.y, 0.01, 0.99));
    #endif

    int iMediaVersion = int(mediaVersionTexData(index).x);
    int numLayers;
    int mediaCols;
    int mediaRows;
    // msedge warns that dynamic indexing [] of vectors and matrices is emulated and can be slow so we unfold
    if (iMediaVersion == 0) {
        numLayers = iStdMediaVersionNumLayers.x;
        mediaCols = iStdMediaVersionNumCols.x;
        mediaRows = iStdMediaVersionNumRows.x;
    } else if (iMediaVersion == 1) {
        numLayers = iStdMediaVersionNumLayers.y;
        mediaCols = iStdMediaVersionNumCols.y;
        mediaRows = iStdMediaVersionNumRows.y;
    } else if (iMediaVersion == 2) {
        numLayers = iStdMediaVersionNumLayers.z;
        mediaCols = iStdMediaVersionNumCols.z;
        mediaRows = iStdMediaVersionNumRows.z;
    } else if (iMediaVersion == 3) {
        numLayers = iVirtMediaVersionNumLayers;
        mediaCols = iVirtMediaVersionNumCols;
        mediaRows = iVirtMediaVersionNumRows;
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

    vec2 tileSize = vec2(tileWidth, tileHeight);
    vec2 mediaTexcoord = tileOffset + mediaTileUv * tileSize;

    if (iMediaVersion == 0) {
        #if MEDIA_BICUBIC_FILTER == 1
            vec2 texSize = vec2(textureSize(uMediaV0Texture, 0).xy);
            vec2 tileTexSize = texSize*tileSize;
            c = bicubicFilter(uMediaV0Texture, vec3(mediaTexcoord, float(layer)), texSize).rgb;
        #else
            c = texture(uMediaV0Texture, vec3(mediaTexcoord, float(layer))).rgb;
        #endif
    } else if (iMediaVersion == 1) {
        #if MEDIA_BICUBIC_FILTER == 1
            vec2 texSize = vec2(textureSize(uMediaV1Texture, 0).xy);
            vec2 tileTexSize = texSize*tileSize;
            c = bicubicFilter(uMediaV1Texture, vec3(mediaTexcoord, float(layer)), texSize).rgb;
        #else
            c = texture(uMediaV1Texture, vec3(mediaTexcoord, float(layer))).rgb;
        #endif
    } else if (iMediaVersion == 2) {
        #if MEDIA_BICUBIC_FILTER == 1
            vec2 texSize = vec2(textureSize(uMediaV2Texture, 0).xy);
            vec2 tileTexSize = texSize*tileSize;
            c = bicubicFilter(uMediaV2Texture, vec3(mediaTexcoord, float(layer)), texSize).rgb;
        #else
            c = texture(uMediaV2Texture, vec3(mediaTexcoord, float(layer))).rgb;
        #endif
    } else if (iMediaVersion == 3) {
        #if MEDIA_BICUBIC_FILTER == 1
            vec2 texSize = vec2(textureSize(uMediaV2Texture, 0).xy);
            vec2 tileTexSize = texSize*tileSize;
            c = bicubicFilter(uMediaV3Texture, vec3(mediaTexcoord, float(layer)), texSize).rgb;
        #else
            c = texture(uMediaV3Texture, vec3(mediaTexcoord, float(layer))).rgb;
        #endif
    }

}

void processNeighborMinEdgeLen(in uint neighborIndex, in vec2 cellCoords, in vec2 p, inout vec2 minEdgeLen, in float weight, in float weightOffset, in float weightOffsetScale, in float roundness, in float fisheyeFactor) {
    vec2 neighborCellCoords = fetchCellCoords(neighborIndex);

    #if WEIGHTED_DIST == 1 || X_DIST_SCALING == 1

        float closeWeight = 0.;
        #if WEIGHTED_DIST == 1
            closeWeight = weightTexData(neighborIndex);
        #endif

        vec2 cellOffset = cellCoords - p;
        vec2 neighborCellOffset = neighborCellCoords - p;
        vec2 cellOffsetsDifference = neighborCellOffset - cellOffset;

        #if X_DIST_SCALING == 1
            float scaleX = getXDistScale(max(closeWeight, weight));
            cellOffset.x *= scaleX;
            neighborCellOffset.x *= scaleX;
            cellOffsetsDifference.x *= scaleX;
        #endif

        float baseDist = dot2(cellOffsetsDifference);
        float distFactor = 0.5;

        #if WEIGHTED_DIST == 1
            float dist = baseDist;
            float closeWeightOffset = weightOffsetScale * closeWeight;
            dist -= (closeWeightOffset - weightOffset);
            distFactor = dist / (2. * baseDist);
        #endif

        // essentially the same as simplified variant below, just deconstructed to allow for tweaking
        vec2 direction = cellOffsetsDifference * inversesqrt(baseDist);
//        vec2 correctedDirection = direction * vec2(1.0 / scaleX, 1.0);
//        correctedDirection = normalize(correctedDirection);
        vec2 offset = mix(cellOffset, neighborCellOffset, distFactor);
//        vec2 aspectCorrectedOffset = offset * vec2(1.0 / scaleX, 1.0);
        float len = dot(direction, offset);

        #if X_DIST_SCALING == 1 && X_DIST_SCALING_EDGE_ASPECT_CORRECTION == 1
            // Method 1: Scale based on direction components (more accurate, more expensive)
            // Aspect correction: scale down the contribution of the x-component
            //len *= length(direction * vec2(1.0 / scaleX, 1.0)) / length(direction);

            // Method 2: Post-process the len based on direction angle
            // Calculate how much the direction is aligned with x-axis
            len *= mix(1.0, 1.0 / scaleX, abs(direction.x));
        #endif
    #else
        // simplified variant without weights and x-component dist scaling
        vec2 offset = p - (neighborCellCoords + cellCoords) * 0.5;
        vec2 direction = normalize(cellCoords - neighborCellCoords);
        float len = dot(direction, offset);
    #endif

    #if EDGE_SMIN_SCALING == 1
        roundness *= len *.5 + .5;
    #endif

    // todo could modify len based on:  * (1./fisheyeFactor)
    minEdgeLen.x = cSmin(minEdgeLen.x, len, roundness);
    minEdgeLen.y = min(minEdgeLen.y, len);
}

void processMinEdgeLens(in uvec4 indices, in uvec4 indices2, in vec2 cellCoords, in vec2 p, inout vec2 minEdgeLen, in float weight, in float weightOffset, in float weightOffsetScale, in float roundness, in float fisheyeFactor) {

    processNeighborMinEdgeLen(indices.y, cellCoords, p, minEdgeLen, weight, weightOffset, weightOffsetScale, roundness, fisheyeFactor);
    processNeighborMinEdgeLen(indices.z, cellCoords, p, minEdgeLen, weight, weightOffset, weightOffsetScale, roundness, fisheyeFactor);
    processNeighborMinEdgeLen(indices.w, cellCoords, p, minEdgeLen, weight, weightOffset, weightOffsetScale, roundness, fisheyeFactor);

    #if DOUBLE_INDEX_POOL == 1 && DOUBLE_INDEX_POOL_EDGES == 1
        processNeighborMinEdgeLen(indices2.x, cellCoords, p, minEdgeLen, weight, weightOffset, weightOffsetScale, roundness, fisheyeFactor);
        processNeighborMinEdgeLen(indices2.y, cellCoords, p, minEdgeLen, weight, weightOffset, weightOffsetScale, roundness, fisheyeFactor);
        processNeighborMinEdgeLen(indices2.z, cellCoords, p, minEdgeLen, weight, weightOffset, weightOffsetScale, roundness, fisheyeFactor);
        processNeighborMinEdgeLen(indices2.w, cellCoords, p, minEdgeLen, weight, weightOffset, weightOffsetScale, roundness, fisheyeFactor);
    #endif

    #if EDGE_SMIN_SCALING == 1 && EDGE_SMIN_SCALING_COMPENSATION == 1
        // Totally empirical compensation for smoothing scaling side-effect.
        minEdgeLen.x *= .5 + roundness;
    #endif

    // At the end do some smooth abs
    // on the distance value.
    // This is really optional, since distance function
    // is already continuous, but we can get extra
    // smoothness from it.
    //    minEdgeLen.x = sabs(minEdgeLen.x, .02);
    //    minEdgeLen.x = sabs(minEdgeLen.x, .0001);

    minEdgeLen = max(vec2(minEdgeLen.x, minEdgeLen.y), 0.);



    //    float r = (minEdgeLen.y - minEdgeLen.x);
    //    minEdgeLen.x = r;

    //    minEdgeLen.x = mix(minEdgeLen.x,  minEdgeLen.y, .5); // A mixture of rounded and straight edge values.
    //    minEdgeLen.x = minEdgeLen.y;

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

    float weight;
    float weightOffset;

    #if WEIGHTED_DIST == 1
        weight = weightTexData(index);
        weightOffset = weightOffsetScale * weight;
        weight = weight > 0. ? weight : prevMaxWeight;
    #endif

    float dist = dist(center, fetchCellCoords(index), weight, weightOffset);

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

Plot init(vec2 p) {
    uvec4 indices = uvec4(uint(-1));

    uint row = uint(round((1.-vUv.y) * float(iLatticeRows)));
    uint col = uint(round(vUv.x * float(iLatticeCols)));

    indices.x = row * uint(iLatticeCols) + col;
    if (int(indices.x) > iNumCells) {
        indices.x = (row-1u) * uint(iLatticeCols) + col;
    }

    return Plot(indices, uvec4(uint(-1)), vec2(0.), vec4(0.), 0., 0., false);
}

Plot plot() {

    vec2 p = pCoords();

    vec2 fragCoord = gl_FragCoord.xy;
    uvec4 prevIndices = fetchIndices(fragCoord);
    if (indexIsUndefined(prevIndices.x)) return init(p);

    bool debugFlag = false;

    vec2 forceCenter = rawCoords(fForceCenter);

    float fisheyeFactor = 1.;
    #if FISHEYE == 1
        if (fFishEyeStrength > 0. && fFishEyeRadius > 0.) {

            vec2 forceCenterCoords = aspectCoords(forceCenter);

            vec2 d = p - forceCenterCoords;
            # if FISHEYE_SQUARED == 1
//                float r = sqrt(dot2(d));
                float r = length(d); // length(v) is more or less equivalent to sqrt(dot2(d)) (might be optimized), or 1.0 / inversesqrt(dot(v, v))
                float percent = r / (FISHEYE_BASE_RADIUS * fFishEyeRadius * fForceCenterStrengthMod);
            # else // has straighter borders when not "squared"
                float r = dot2(d);
                float percent = r / pow(FISHEYE_BASE_RADIUS * fFishEyeRadius * fForceCenterStrengthMod, 2.0);
            # endif

            // next 2 lines equivalent to: float step = smoothstep(0.0, 1. / percent, percent);
            float sCPercent = clamp(percent * percent, 0., 1.); // flatten the top by increasing min value: float sCPercent = clamp(percent * percent, 0.5, 1.0), zoom everything in by flatten the top by increasing max value: float sCPercent = clamp(percent * percent, 0., 1.5)
            float step = sCPercent * sCPercent * (3.0 - 2.0 * sCPercent);

            // just playing
//        step *= step*step*step;
//            float step = sCPercent *sCPercent *sCPercent * sCPercent * (3.0 - 2.0  * sCPercent *sCPercent *sCPercent);

//            if (percent > 1.) {
//                if (step > 0.9999999) {
//                    debugFlag = true;
//                }
//            }

            float strength = FISHEYE_BASE_STRENGTH * fFishEyeStrength * fForceCenterStrengthMod;
            fisheyeFactor = mix(1.0, step, strength);

            p -= forceCenterCoords;
//            p *= normalize(d) * fisheyeFactor;
            p *= fisheyeFactor;
            p += forceCenterCoords;

            //    p *= normalize(d) * mix(1.0, smoothstep(0.0, radius / r, percent), strength * 0.75);

        }
    #endif

    float prevMaxWeight;
    float weightOffsetScale = 1.;
    float mediaWeightOffsetScale = 1.;

    #if WEIGHTED_DIST == 1
        weightOffsetScale = WEIGHT_OFFSET_SCALE * fWeightOffsetScaleMod * min(resolutionScale, 0.1)/* * 1./float(iNumCells)*/;
        mediaWeightOffsetScale =  weightOffsetScale * WEIGHT_OFFSET_SCALE_MEDIA_MOD;
        prevMaxWeight = max(weightTexData(prevIndices.x), weightTexData(prevIndices.y));
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
    uint maxNeighborIterations = DEFAULT_MAX_NEIGHBORS;
    #if DYNAMIC_MAX_NEIGHBORS == 1
        if (iForcedMaxNeighborLevel == 1) {
            maxNeighborIterations = MAX_NEIGHBORS_LEVEL_1;
        } else if (iForcedMaxNeighborLevel == 2) {
            maxNeighborIterations = MAX_NEIGHBORS_LEVEL_2;
        } else if (iForcedMaxNeighborLevel == 3) {
            maxNeighborIterations = MAX_NEIGHBORS_LEVEL_3;
        }
    #endif
    uint neighborsPosition = neighborsTexData(indices.x*2u);
    uint neighborsLength = neighborsTexData(indices.x*2u+1u);
    for (uint i = 0u; i < min(neighborsLength, maxNeighborIterations); i++) {
        sortClosest(distances, distances2, indices, indices2, neighborsTexData(neighborsPosition+i), p, weightOffsetScale, prevMaxWeight);
    }

    // update closest
    closestIndex = indices.x;
    vec2 cellCoords = fetchCellCoords(closestIndex);



    vec4 mediaBbox = vec4(vec2(1.), vec2(-1.));
    #if MEDIA_ENABLED == 1

        vec2 midSum = vec2(0.0);
        vec2 cellNCoords = fetchNormalizedCellCoords(closestIndex);

        float reciprocalMediaFisheyeFactor = 1.;
        #if FISHEYE == 1
            if (fFishEyeStrength > 0. && fFishEyeRadius > 0.) {

                bool mediaFisheye = MEDIA_FISHEYE == 1 || bMediaDistortion;
                if (mediaFisheye) {
                    reciprocalMediaFisheyeFactor = 1./ fisheyeFactor;
                } else {
                    vec2 forceCenterCoords = aspectCoords(forceCenter);
                    // vec2 d = cellNCoords - forceCenterNCoords;
                    vec2 d = cellCoords - forceCenterCoords;
                    # if FISHEYE_SQUARED == 1
                        //  float r = sqrt(dot2(d));
                        float r = length(d);
                        float percent = r / (FISHEYE_BASE_RADIUS * fFishEyeRadius * fForceCenterStrengthMod);
                    # else
                        float r = dot2(d);
                        float percent = r / pow(FISHEYE_BASE_RADIUS * fFishEyeRadius * fForceCenterStrengthMod, 2.0);
                    # endif

                    float step = smoothstep(0.0, 1. / percent, percent);

                    float strength = FISHEYE_BASE_STRENGTH * fFishEyeStrength * fForceCenterStrengthMod;
                    reciprocalMediaFisheyeFactor = 1./ mix(1.0, step, strength);
                }

                vec2 forceCenterNCoords = normalizeCoords(forceCenter);
                cellNCoords = (cellNCoords - forceCenterNCoords) * reciprocalMediaFisheyeFactor + forceCenterNCoords;
            }
        #endif

        neighborsPosition = neighborsTexData(closestIndex*2u);
        neighborsLength = min(neighborsTexData(closestIndex*2u+1u), MAX_NEIGHBORS_LEVEL_1);
        for (uint i = 0u; i < neighborsLength; i++) {
            uint neighborIndex = neighborsTexData(neighborsPosition+i);
            vec2 neighborNCoords = fetchNormalizedCellCoords(neighborIndex);

            float midFactor = 0.5;
            #if WEIGHTED_DIST == 1
                float mediaWeight = mediaWeightOffsetScale * weightTexData(closestIndex);
                float neighborMediaWeight = mediaWeightOffsetScale * weightTexData(neighborIndex);
                midFactor += (mediaWeight - neighborMediaWeight);
            #endif

            vec2 mid = mix(cellNCoords, neighborNCoords, midFactor);
            midSum += mid;

            mediaBbox.xy = min(mediaBbox.xy, mid);
            mediaBbox.zw = max(mediaBbox.zw, mid);
        }

        vec2 avgCenter = midSum / float(neighborsLength);
//        vec2 avgCenterDiff = avgCenter - cellNdcCoords;
        vec2 avgCenterDiff = (avgCenter - cellNCoords) * 0.;

        mediaBbox.xy = min(mediaBbox.xy, mediaBbox.xy + avgCenterDiff);
        mediaBbox.zw = max(mediaBbox.zw, mediaBbox.zw + avgCenterDiff);

        float bbX = mediaBbox.z - mediaBbox.x;
        float bbY = mediaBbox.w - mediaBbox.y;

        vec2 offset = vec2(0.5 * MEDIA_BBOX_SCALE * reciprocalMediaFisheyeFactor);
        bool lockedAspect = MEDIA_LOCKED_ASPECT == 1 && !bMediaDistortion;
        if (lockedAspect) {
            float bbMax = max(bbX, bbY / MEDIA_ASPECT);
            float aspect = iResolution.x / iResolution.y;
            offset *= vec2(bbMax / aspect, bbMax * MEDIA_ASPECT);
        } else {
            offset *= vec2(bbX, bbY);
        }

        mediaBbox.xy = avgCenter - offset;
        mediaBbox.zw = avgCenter + offset;

//     bbX = mediaBbox.z - mediaBbox.x;
//     bbY = mediaBbox.w - mediaBbox.y;


    #endif

    float edgeScaleMod = 0.1;
    float roundnessScaleMod = 0.1;
    #if EDGE_SCALING == 1
        #if MEDIA_ENABLED == 1 && EDGE_SCALING_MODE == 1
            //roundnessScaleMod = min(bbX, bbY) / 2.;
            roundnessScaleMod = (bbX + bbY) * 0.5 / 2.;

            //edgeScaleMod = min(bbX, bbY) / 2.;
            edgeScaleMod = (bbX + bbY) * 0.5 / 2.;
        #else
            // this works well for vertically elongated cells but not a good fit otherwise
            float neighborXAvgOffset = (abs(cellCoords.x-fetchCellCoords(neighborsTexData(neighborsPosition+3u)).x)+abs(cellCoords.x-fetchCellCoords(neighborsTexData(neighborsPosition+4u)).x)) * 0.5;
            roundnessScaleMod = neighborXAvgOffset / 2.;
            edgeScaleMod = neighborXAvgOffset / 2.;
        #endif
    #endif




//    float roundness = clamp(roundnessScaleMod * fRoundnessMod * ROUNDNESS_BASE + ROUNDNESS_ADDITION * fRoundnessMod, ROUNDNESS_MIN * fRoundnessMod, ROUNDNESS_MAX * fRoundnessMod);
//    float roundness = clamp(roundnessScaleMod * 0.1 , 0.0085, 0.03) * resolutionScale;
    //    float roundness = clamp(roundnessScaleMod * fRoundnessMod * ROUNDNESS_BASE * getBaseXDistScale() + ROUNDNESS_ADDITION, ROUNDNESS_MIN, ROUNDNESS_MAX);
//    float roundness = clamp(roundnessScaleMod * resolutionScale * getRoundness(), ROUNDNESS_MIN, ROUNDNESS_MAX);

    float roundness = 0.055 * 1./inversesqrt(roundnessScaleMod) * resolutionScale;

    float weight;
    float weightOffset;

    #if WEIGHTED_DIST == 1 || UNWEIGHTED_EFFECT == 1
        weight = weightTexData(closestIndex);
        weightOffset = weightOffsetScale * weight;
    #endif

    vec2 minEdgeLen = vec2(0.1);

    processMinEdgeLens(indices, indices2, cellCoords, p, minEdgeLen, weight, weightOffset, weightOffsetScale, roundness, fisheyeFactor);


    return Plot(indices, indices2, minEdgeLen, mediaBbox, edgeScaleMod, weight, debugFlag);
}

void edgesColor(inout vec3 c, inout float a, in Plot plot) {
    //            float edge0 = EDGE_0_BASE * fEdge0Mod * plot.edgeScaleMod + EDGE_0_ADDITION;
    //            float edge1 = EDGE_1_BASE * fEdge1Mod * plot.edgeScaleMod + EDGE_1_ADDITION;
    //        float edge0 = EDGE_0_BASE * fEdge0Mod  + EDGE_0_ADDITION;
    //        float edge1 = EDGE_1_BASE * fEdge1Mod  + EDGE_1_ADDITION;


    float sminDiff = abs(plot.minEdgeLen.y - plot.minEdgeLen.x);

    //            float edge0 = .005;
    //            float edge0 = .0001 * plot.edgeScaleMod;
    ////            float edge0 = .0001;
    ////            float edge0 = .0001;
    ////            float edge1 = .01;
    ////            float edge1 = .035 * plot.edgeScaleMod;
    //            float edge1 = .04 * plot.edgeScaleMod;


    //        float edge0 = clamp(.001 * plot.edgeScaleMod, 0., 0.015);
    //        float edge1 = clamp(.015 * plot.edgeScaleMod, 0.005, 0.01);

    //        float edge0 = clamp(.009 * plot.scaleMod * resolutionScale, 0.00001, 0.015);
    //        float edge1 = clamp(.045 * plot.scaleMod * resolutionScale, 0.001, 0.01);

    //        float edge0 = .0005;
    //        float edge1 = .009;


    float thickness = 1./inversesqrt(plot.edgeScaleMod) * resolutionScale;

    float edge0 = .000125 * 6. * numCellsScale;
    float edge1 = .00225 * 6. * numCellsScale;

    //            float m = abs(sminDiff - edge1)/edge1;
    //            edge1 *= m;

    //        float m = abs(edge1 - sminDiff)/sminDiff;
    //        edge1 *= m;

    //            edge1 = min(sminDiff, edge1);
    //            float edge1 = clamp(.075 * plot.edgeScaleMod, 0.005, .01);

    float step = smoothstep(edge0, edge1, plot.minEdgeLen.x);

    //                float t = clamp((plot.minEdgeLen.x - edge0) / (edge1 - edge0), 0.0, 1.0);
    //                float step = t * t * (3.0 - 2.0 * t);

    #if TRANSPARENT_BG == 1
        a = mix(1., 0., step);
    #else
        //                vec3 bgColor = !plot.debugFlag ? fBaseColor : vec3(1.,0.,0.);
        //                vec3 bgColor = randomColor(indices.x);
        c = mix(fBaseColor, c, step);
        //                c=vec3(sqrt(sminDiff));
    #endif
}

void postColor(inout vec3 c, inout float a, in Plot plot) {
    #if UNWEIGHTED_EFFECT == 1
        if (fUnWeightedEffectMod > 0.) {
            //        if (indices.x != uint(iFocusedIndex)) {
            //            c = mix(c, fBaseColor, 0.7 * fUnWeightedEffectMod);
            //        }
            c = mix(c, fBaseColor, (1.-UNWEIGHTED_MOD_OPACITY) * fUnWeightedEffectMod * (1.-plot.weight));
            c = toGrayscale(c,UNWEIGHTED_MOD_GRAYSCALE* fUnWeightedEffectMod * (1.-plot.weight));
        }
    #endif

    #if MEDIA_GRAYSCALE != 0
        c = toGrayscale(c, float(MEDIA_GRAYSCALE) / 100.);
    #endif
}

void colorOutput(in vec3 c, in float a, in Plot plot) {
    voroIndexBufferColor = uintBitsToFloat(plot.indices + 1u);
    #if DOUBLE_INDEX_POOL == 1 && DOUBLE_INDEX_POOL_BUFFER == 1
        voroIndexBuffer2Color = uintBitsToFloat(plot.indices2 + 1u);
    #endif
    outputColor = vec4(c, a);
    if (bVoroEdgeBufferOutput) {
        voroEdgeBufferColor = vec3(plot.minEdgeLen.x, plot.minEdgeLen.y, plot.edgeScaleMod);
    }

    //    float r = (plot.minEdgeLen.y - plot.minEdgeLen.x);
    //    voroEdgeBufferColor = vec3(r, plot.minEdgeLen.x, plot.edgeScaleMod);
}

void main() {
    initGlobals();

    Plot plot = plot();

    vec3 c;
    float a = 1.;

    #if MEDIA_ENABLED == 1 && MEDIA_HIDE == 0
        mediaColor(c, a, plot);
    #else
        randomCellColor(c, a, plot);
    #endif

    #if DRAW_EDGES == 1
        if (bDrawEdges) {
            edgesColor(c, a, plot);
        }
    #endif

    postColor(c, a, plot);

    colorOutput(c, a, plot);
}
