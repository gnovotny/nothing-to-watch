#version 300 es

precision highp float;

#define PI 3.14159265359
#define TAU 2.0 * PI
#define FLOAT_INF uintBitsToFloat(0x7f800000u)
#define EPSILON .0001

#define NUM_CELLS_SCALE_BASELINE 50000.
#define TRANSPARENCY 0
#define Y_SCALE 1.
#define X_SCALE 1.

#define DYNAMIC_MAX_NEIGHBORS 0
#define MAX_NEIGHBORS_LEVEL_1 8u
#define MAX_NEIGHBORS_LEVEL_2 24u
#define MAX_NEIGHBORS_LEVEL_3 48u

#define DOUBLE_INDEX_POOL 1
#define DOUBLE_INDEX_POOL_EDGES 1
#define DOUBLE_INDEX_POOL_BUFFER 0
#define PIXEL_SEARCH_ALLOWED 1
#define PIXEL_SEARCH_RADIUS 16.
#define PIXEL_SEARCH_RANDOM_DIR 0
#define PIXEL_SEARCH_FULL_RANDOM 0

#define FISHEYE 1
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
#define X_DIST_SCALING_EDGE_ASPECT_CORRECTION 0 // just looks better without it due to extreme vertical elongation and small sizes

#define MEDIA_ENABLED 1
#define MEDIA_HIDDEN 0
#define MEDIA_GAMMA_CONVERSION_FACTOR 2
#define MEDIA_GRAYSCALE 0
#define MEDIA_BICUBIC_FILTER 0
#define MEDIA_BBOX_SCALE 1.
//#define MEDIA_BBOX_ADJUSTMENT_SCALE 3.
#define MEDIA_BBOX_ADJUSTMENT_SCALE 1.
#define MEDIA_BBOX_EDGE_BORDER_COMPENSATION 1
#define MEDIA_LOCKED_ASPECT 1
#define MEDIA_ASPECT 1.5
#define MEDIA_ROTATE 0
#define MEDIA_ROTATE_FACTOR 1.
#define MEDIA_FISHEYE 0
#define MEDIA_DEBUG_BBOXES 0

#define EDGES_VISIBLE 1
#define EDGE_SMIN_SCALING 1
#define EDGE_SMIN_SCALING_COMPENSATION 0
#define EDGE_CELL_SCALING 1
#define EDGE_CELL_SCALING_MODE 0 // mode 1 = media boxes if media enabled
//#define EDGE_BORDER_THICKNESS_BASE 0.135
#define EDGE_BORDER_THICKNESS_BASE 0.075
#define EDGE_CELL_SCALING_BORDER_THICKNESS 0
//#define EDGE_BORDER_THICKNESS_MIN 0.
//#define EDGE_BORDER_THICKNESS_MAX 1.
#define EDGE_BORDER_SMOOTHNESS_BASE 0.95 // defined as a percentage of border thickness
#define EDGE_CELL_SCALING_BORDER_SMOOTHNESS 0
//#define EDGE_BORDER_SMOOTHNESS_MIN 0.
//#define EDGE_BORDER_SMOOTHNESS_MAX 1.
//#define EDGE_BORDER_ROUNDNESS_BASE 0.055
#define EDGE_BORDER_ROUNDNESS_BASE 0.155
#define EDGE_CELL_SCALING_BORDER_ROUNDNESS 1
//#define EDGE_BORDER_ROUNDNESS_MIN 0.
//#define EDGE_BORDER_ROUNDNESS_MAX 1.

#define POST_UNWEIGHTED_EFFECT 1
//#define POST_UNWEIGHTED_MOD_OPACITY 0.5
#define POST_UNWEIGHTED_MOD_OPACITY 1.
#define POST_UNWEIGHTED_MOD_GRAYSCALE 0.

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
uniform float fBorderRoundnessMod;
uniform float fEdge1Mod;
uniform float fEdge0Mod;
uniform float fCenterForceFishEyeStrength;
uniform float fCenterForceFishEyeRadius;
uniform float fWeightOffsetScaleMod;
uniform vec3 fBaseColor;
uniform vec2 fPointer;
uniform vec2 fCenterForce;
uniform float fCenterForceStrengthMod;
uniform bool bDrawEdges;
uniform bool bVoroEdgeBufferOutput;
uniform bool bPixelSearch;
uniform float fUnweightedEffectMod;
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
    vec2 edge;
    float edgeStep;
    vec4 mediaBbox;
    float cellScale;
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

#if PIXEL_SEARCH_ALLOWED
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
#endif

float cheapSqrt(float a) {
    return 1./inversesqrt(a);
}

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
    fragCoord.y /= Y_SCALE;
    fragCoord.x /= X_SCALE;
    return fragCoord;
}

vec2 pCoords() {
    return aspectCoords(fragCoords());
}

vec2 normalizedPCoords() {
    return normalizeCoords(fragCoords());
}

/* GLOBALS */
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
//     resolutionScale = sqrt(iResolution.x * iResolution.y) / 600.0;

//    if (resolutionScale < 0.9) discard;

//    resolutionScale = clamp(resolutionScale, 0.5, 1.5);
    resolutionScale = cheapSqrt(resolutionScale);
}

float numCellsScale;
void initNumCellsScale() {
    numCellsScale = NUM_CELLS_SCALE_BASELINE / float(iNumCells);
    numCellsScale = cheapSqrt(numCellsScale);
}

vec2 centerForce;
vec2 centerForceCoords;
void initCenterForce() {
    centerForce = rawCoords(fCenterForce);
    centerForceCoords = aspectCoords(centerForce);
}

void initGlobals() {
    initResolutionScale();
    initNumCellsScale();
    initCenterForce();
}
/* GLOBALS END */

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

void applyMediaBboxFisheye(inout vec2 cellNCoords, inout float reciprocalMediaFisheyeFactor, in vec2 cellCoords, in float fisheyeFactor) {
    if (fCenterForceFishEyeStrength == 0. || fCenterForceFishEyeRadius == 0.) return;

    bool mediaFisheye = MEDIA_FISHEYE == 1 || bMediaDistortion;
    if (mediaFisheye) {
        reciprocalMediaFisheyeFactor = 1./ fisheyeFactor;
    } else {
        // vec2 d = cellNCoords - centerForceNCoords;
        vec2 d = cellCoords - centerForceCoords;
        # if FISHEYE_SQUARED == 1
            float r = length(d);
            float percent = r / (FISHEYE_BASE_RADIUS * fCenterForceFishEyeRadius * fCenterForceStrengthMod);
        # else
            float r = dot2(d);
            float percent = r / pow(FISHEYE_BASE_RADIUS * fCenterForceFishEyeRadius * fCenterForceStrengthMod, 2.0);
        # endif

        float step = smoothstep(0.0, 1. / percent, percent);

        float strength = FISHEYE_BASE_STRENGTH * fCenterForceFishEyeStrength * fCenterForceStrengthMod;
        reciprocalMediaFisheyeFactor = 1./ mix(1.0, step, strength);
    }

    vec2 centerForceNCoords = normalizeCoords(centerForce);
    cellNCoords = (cellNCoords - centerForceNCoords) * reciprocalMediaFisheyeFactor + centerForceNCoords;
}

void calcMediaBbox(in uint index, inout vec4 mediaBbox, in vec2 cellCoords, in float fisheyeFactor, in float edgeBorder) {
    vec2 midSum = vec2(0.0);
    vec2 cellNCoords = fetchNormalizedCellCoords(index);

    float reciprocalMediaFisheyeFactor = 1.;
    #if FISHEYE == 1
        applyMediaBboxFisheye(cellNCoords, reciprocalMediaFisheyeFactor, cellCoords, fisheyeFactor);
    #endif

    uint neighborsPosition = neighborsTexData(index*2u);
    uint neighborsLength = min(neighborsTexData(index*2u+1u), MAX_NEIGHBORS_LEVEL_1);
    for (uint i = 0u; i < neighborsLength; i++) {
        uint neighborIndex = neighborsTexData(neighborsPosition+i);
        vec2 neighborNCoords = fetchNormalizedCellCoords(neighborIndex);

        float midFactor = 0.5;
        #if WEIGHTED_DIST == 1
            float mediaWeight = mediaWeightOffsetScale * weightTexData(index);
            float neighborMediaWeight = mediaWeightOffsetScale * weightTexData(neighborIndex);
            midFactor += (mediaWeight - neighborMediaWeight);
        #endif

        vec2 mid = mix(cellNCoords, neighborNCoords, midFactor);
        midSum += mid;

        mediaBbox.xy = min(mediaBbox.xy, mid);
        mediaBbox.zw = max(mediaBbox.zw, mid);
    }

    vec2 avgCenter = midSum / float(neighborsLength);
//    vec2 avgCenterDiff = (avgCenter - cellNCoords);
    vec2 avgCenterDiff = vec2(0.);

    mediaBbox.xy = min(mediaBbox.xy, mediaBbox.xy + avgCenterDiff);
    mediaBbox.zw = max(mediaBbox.zw, mediaBbox.zw + avgCenterDiff);

    float bbX = mediaBbox.z - mediaBbox.x;
    float bbY = mediaBbox.w - mediaBbox.y;


    // TODO
    #if EDGE_CELL_SCALING == 1
    #if EDGE_CELL_SCALING_MODE == 1
        //            //cellScale = min(bbX, bbY) / 2.;
    //            cellScale = (bbX + bbY) * 0.5 / 2.;
    #endif
    #endif

    #if MEDIA_BBOX_EDGE_BORDER_COMPENSATION == 1
        bbX -= edgeBorder;
        bbY -= edgeBorder;
    #endif

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
}

void processNeighborEdge(in uint neighborIndex, in vec2 cellCoords, in vec2 p, inout vec2 edge, in float weight, in float weightOffset, in float weightOffsetScale, in float borderRoundness, in float fisheyeFactor) {
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

        // essentially the same as simplified variant below, just deconstructed to allow for dist metric tweaking
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
        borderRoundness *= len *.5 + .5;
    #endif

    // todo could modify len based on:  * (1./fisheyeFactor)
    edge.x = cSmin(edge.x, len, borderRoundness);
    edge.y = min(edge.y, len);
}

void calcEdge(in uvec4 indices, in uvec4 indices2, in vec2 cellCoords, in vec2 p, inout vec2 edge, in float weight, in float weightOffset, in float weightOffsetScale, in float borderRoundness, in float fisheyeFactor) {

    processNeighborEdge(indices.y, cellCoords, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, fisheyeFactor);
    processNeighborEdge(indices.z, cellCoords, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, fisheyeFactor);
    processNeighborEdge(indices.w, cellCoords, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, fisheyeFactor);

    #if DOUBLE_INDEX_POOL == 1 && DOUBLE_INDEX_POOL_EDGES == 1
        processNeighborEdge(indices2.x, cellCoords, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, fisheyeFactor);
        processNeighborEdge(indices2.y, cellCoords, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, fisheyeFactor);
        processNeighborEdge(indices2.z, cellCoords, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, fisheyeFactor);
        processNeighborEdge(indices2.w, cellCoords, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, fisheyeFactor);
    #endif

    #if EDGE_SMIN_SCALING == 1 && EDGE_SMIN_SCALING_COMPENSATION == 1
        // Totally empirical compensation for smoothing scaling side-effect.
        edge.x *= .5 + borderRoundness;
    #endif

    // At the end do some smooth abs
    // on the distance value.
    // This is really optional, since distance function
    // is already continuous, but we can get extra
    // smoothness from it.
    //    edge.x = sabs(edge.x, .0001);

    edge = max(vec2(edge.x, edge.y), 0.);
}

void sortClosest(
    inout vec4 distances,
    inout vec4 distances2,
    inout uvec4 indices,
    inout uvec4 indices2,
    uint index,
    vec2 p,
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

    float d = dist(p, fetchCellCoords(index), weight, weightOffset);

    if (d < distances.x) {
        distances = vec4(d, distances.xyz);
        indices = uvec4(index, indices.xyz);
    } else if (d < distances.y) {
        distances = vec4(distances.x, d, distances.yz);
        indices = uvec4(indices.x, index, indices.yz);
    } else if (d < distances.z) {
        distances = vec4(distances.xy, d, distances.z);
        indices = uvec4(indices.xy, index, indices.z);
    } else if (d < distances.w) {
        distances = vec4(distances.xyz, d);
        indices = uvec4(indices.xyz, index);
    }
    #if DOUBLE_INDEX_POOL == 1
    else if (d < distances2.x) {
        distances2 = vec4(d, distances2.xyz);
        indices2 = uvec4(index, indices2.xyz);
    } else if (d < distances2.y) {
        distances2 = vec4(distances2.x, d, distances2.yz);
        indices2 = uvec4(indices2.x, index, indices2.yz);
    } else if (d < distances2.z) {
        distances2 = vec4(distances2.xy, d, distances2.z);
        indices2 = uvec4(indices2.xy, index, indices2.z);
    } else if (d < distances2.w) {
        distances2 = vec4(distances2.xyz, d);
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

void fetchAndSortIndices( inout vec4 distances, inout vec4 distances2, inout uvec4 prevIndices, inout uvec4 prevIndices2, in vec2 samplePoint, in vec2 p, in float weightOffsetScale, in float prevMaxWeight ) {
    uvec4 indices = fetchIndices(samplePoint);
    sortClosest(distances, distances2, prevIndices, prevIndices2, indices.x, p, weightOffsetScale, prevMaxWeight);
    sortClosest(distances, distances2, prevIndices, prevIndices2, indices.y, p, weightOffsetScale, prevMaxWeight);
    sortClosest(distances, distances2, prevIndices, prevIndices2, indices.z, p, weightOffsetScale, prevMaxWeight);
    sortClosest(distances, distances2, prevIndices, prevIndices2, indices.w, p, weightOffsetScale, prevMaxWeight);

    #if DOUBLE_INDEX_POOL == 1 && DOUBLE_INDEX_POOL_BUFFER == 1
        uvec4 indices2 = fetchIndices2(samplePoint);
        sortClosest(distances, distances2, prevIndices, prevIndices2, indices2.x, p, weightOffsetScale, prevMaxWeight);
        sortClosest(distances, distances2, prevIndices, prevIndices2, indices2.y, p, weightOffsetScale, prevMaxWeight);
        sortClosest(distances, distances2, prevIndices, prevIndices2, indices2.z, p, weightOffsetScale, prevMaxWeight);
        sortClosest(distances, distances2, prevIndices, prevIndices2, indices2.w, p, weightOffsetScale, prevMaxWeight);
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

    return Plot(indices, uvec4(uint(-1)), vec2(0.), 0., vec4(0.), 0., 0., false);
}

void applyFisheye(inout vec2 p, inout float fisheyeFactor) {
    if (fCenterForceFishEyeStrength == 0. || fCenterForceFishEyeRadius == 0.) return;

    vec2 d = p - centerForceCoords;
    # if FISHEYE_SQUARED == 1
        // float r = sqrt(dot2(d));
        float r = length(d); // length(v) is more or less equivalent to sqrt(dot2(d)) (might be optimized), or 1.0 / inversesqrt(dot(v, v))
        float percent = r / (FISHEYE_BASE_RADIUS * fCenterForceFishEyeRadius * fCenterForceStrengthMod);
    # else // has straighter borders when not "squared"
        float r = dot2(d);
        float percent = r / pow(FISHEYE_BASE_RADIUS * fCenterForceFishEyeRadius * fCenterForceStrengthMod, 2.0);
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

    float strength = FISHEYE_BASE_STRENGTH * fCenterForceFishEyeStrength * fCenterForceStrengthMod;
    fisheyeFactor = mix(1.0, step, strength);

    p -= centerForceCoords;
    //            p *= normalize(d) * fisheyeFactor;
    p *= fisheyeFactor;
    p += centerForceCoords;

    //    p *= normalize(d) * mix(1.0, smoothstep(0.0, radius / r, percent), strength * 0.75);
}

void calcIndices(inout uvec4 indices, inout uvec4 indices2, inout uint neighborsPosition, in vec2 p, in uint index, in float weightOffsetScale, in float prevMaxWeight) {

    vec2 fragCoord = gl_FragCoord.xy; // todo

    vec4 distances = vec4(FLOAT_INF);
    vec4 distances2 = vec4(FLOAT_INF);

    // pixel search
    if (PIXEL_SEARCH_ALLOWED == 1 && bPixelSearch) {
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
        sortClosest(distances, distances2, indices, indices2, index, p, weightOffsetScale, prevMaxWeight);
    }

    // neighbors search
    uint maxNeighborIterations = MAX_NEIGHBORS_LEVEL_1;
    #if DYNAMIC_MAX_NEIGHBORS == 1
        if (iForcedMaxNeighborLevel == 2) {
            maxNeighborIterations = MAX_NEIGHBORS_LEVEL_2;
        } else if (iForcedMaxNeighborLevel == 3) {
            maxNeighborIterations = MAX_NEIGHBORS_LEVEL_3;
        }
    #endif
    neighborsPosition = neighborsTexData(indices.x * 2u);
    uint neighborsLength = neighborsTexData(indices.x * 2u + 1u);
    for (uint i = 0u; i < min(neighborsLength, maxNeighborIterations); i++) {
        sortClosest(distances, distances2, indices, indices2, neighborsTexData(neighborsPosition+i), p, weightOffsetScale, prevMaxWeight);
    }
}

Plot plot() {

    vec2 p = pCoords();

    vec2 fragCoord = gl_FragCoord.xy; // todo
    uvec4 prevIndices = fetchIndices(fragCoord);
    if (indexIsUndefined(prevIndices.x)) return init(p);

    bool debugFlag = false;

    float fisheyeFactor = 1.;
    #if FISHEYE == 1
        applyFisheye(p, fisheyeFactor);
    #endif

    float prevMaxWeight;
    float weightOffsetScale = 1.;
    float mediaWeightOffsetScale = 1.;

    #if WEIGHTED_DIST == 1
        weightOffsetScale = WEIGHT_OFFSET_SCALE * fWeightOffsetScaleMod * min(resolutionScale, 0.1)/* * 1./float(iNumCells)*/;
        mediaWeightOffsetScale =  weightOffsetScale * WEIGHT_OFFSET_SCALE_MEDIA_MOD;
        prevMaxWeight = max(weightTexData(prevIndices.x), weightTexData(prevIndices.y));
    #endif

    // closest cell index
    uint index = prevIndices.x;
    uvec4 indices = uvec4(-1);
    uvec4 indices2 = uvec4(-1);
    uint neighborsPosition;
    calcIndices(indices, indices2, neighborsPosition, p, index, weightOffsetScale, prevMaxWeight);

    // update closest
    index = indices.x;
    vec2 cellCoords = fetchCellCoords(index);

    float cellScale = 0.1;
    float borderThicknessScale = 0.1;
    float borderSmoothnessScale = 1.;
    float borderRoundnessScale = 0.1;
    #if EDGE_CELL_SCALING == 1 && (MEDIA_ENABLED == 0 || EDGE_CELL_SCALING_MODE != 1)
        // this only works well for vertically elongated cells
        float neighborXAvgOffset = (abs(cellCoords.x - fetchCellCoords(neighborsTexData(neighborsPosition + 3u)).x) + abs(cellCoords.x - fetchCellCoords(neighborsTexData(neighborsPosition + 4u)).x)) * 0.5;
        cellScale = neighborXAvgOffset / 2.;
        #if EDGE_CELL_SCALING_BORDER_THICKNESS == 1
            borderThicknessScale = cellScale;
        #endif
        #if EDGE_CELL_SCALING_BORDER_SMOOTHNESS == 1
            borderSmoothnessScale = cellScale * 10.;
        #endif
        #if EDGE_CELL_SCALING_BORDER_ROUNDNESS == 1
            borderRoundnessScale = cellScale;
        #endif
    #endif

    float borderThickness = EDGE_BORDER_THICKNESS_BASE * borderThicknessScale * resolutionScale * (numCellsScale * 0.5 + 0.5);
//    #if defined(EDGE_BORDER_THICKNESS_MIN) && defined(EDGE_BORDER_THICKNESS_MAX)
//        borderThickness = clamp(borderThickness, EDGE_BORDER_THICKNESS_MIN * resolutionScale * numCellsScale, EDGE_BORDER_THICKNESS_MAX * resolutionScale * numCellsScale);
//    #endif

    float borderSmoothness = EDGE_BORDER_SMOOTHNESS_BASE * borderSmoothnessScale / (numCellsScale * 0.125 + 0.875);
//    #if defined(EDGE_BORDER_SMOOTHNESS_MIN) && defined(EDGE_BORDER_SMOOTHNESS_MAX)
//        borderSmoothness = clamp(borderSmoothness, EDGE_BORDER_SMOOTHNESS_MIN * resolutionScale * numCellsScale, EDGE_BORDER_SMOOTHNESS_MAX * resolutionScale * numCellsScale);
//    #endif

    float edgeStepStart = (1. - borderSmoothness) * borderThickness;
    float edgeStepEnd = borderThickness;

    float borderRoundness = EDGE_BORDER_ROUNDNESS_BASE * cheapSqrt(borderRoundnessScale) * fBorderRoundnessMod * resolutionScale;
//    #if defined(EDGE_BORDER_ROUNDNESS_MIN) && defined(EDGE_BORDER_ROUNDNESS_MAX)
//        borderRoundness = clamp(borderRoundness, EDGE_BORDER_ROUNDNESS_MIN * fBorderRoundnessMod * resolutionScale, EDGE_BORDER_ROUNDNESS_MAX * fBorderRoundnessMod * resolutionScale);
//    #endif

    vec4 mediaBbox = vec4(vec2(1.), vec2(-1.));
    #if MEDIA_ENABLED == 1
        calcMediaBbox(index, mediaBbox, cellCoords, fisheyeFactor, edgeStepStart*2.);
    #endif

    float weight;
    float weightOffset;
    #if WEIGHTED_DIST == 1 || POST_UNWEIGHTED_EFFECT == 1
        weight = weightTexData(index);
        weightOffset = weightOffsetScale * weight;
    #endif

    vec2 edge = vec2(0.1);
    calcEdge(indices, indices2, cellCoords, p, edge, weight, weightOffset, weightOffsetScale, borderRoundness, fisheyeFactor);

//    float edgeStep = smoothstep(borderSmoothness, borderThickness, edge.x);
    float edgeStep = smoothstep(edgeStepStart, edgeStepEnd, edge.x);

    return Plot(indices, indices2, edge, edgeStep, mediaBbox, cellScale, weight, debugFlag);
}

#if EDGES_VISIBLE == 1
void edgesColor(inout vec3 c, inout float a, in Plot plot) {
    if (!bDrawEdges) return;

//    float smoothness = EDGE_BORDER_SMOOTHNESS_BASE * numCellsScale;
//    float thickness = EDGE_BORDER_THICKNESS_BASE * numCellsScale;
//    float step = smoothstep(smoothness, thickness, plot.edge.x);

    float step = plot.edgeStep;

    //                float t = clamp((plot.edge.x - edge0) / (edge1 - edge0), 0.0, 1.0);
    //                float step = t * t * (3.0 - 2.0 * t);

    #if TRANSPARENCY == 1
        a = mix(1., 0., step);
    #else
        // vec3 bgColor = !plot.debugFlag ? fBaseColor : vec3(1.,0.,0.);
        // vec3 bgColor = randomColor(indices.x);
        c = mix(fBaseColor, c, step);
    #endif
}
#endif

void postEffectsColor(inout vec3 c, inout float a, in Plot plot) {
    #if POST_UNWEIGHTED_EFFECT == 1
        if (fUnweightedEffectMod > 0.) {
            //        if (indices.x != uint(iFocusedIndex)) {
            //            c = mix(c, fBaseColor, 0.7 * fUnweightedEffectMod);
            //        }
            c = mix(c, fBaseColor, (1.-POST_UNWEIGHTED_MOD_OPACITY) * fUnweightedEffectMod * (1.-plot.weight));
            c = toGrayscale(c,POST_UNWEIGHTED_MOD_GRAYSCALE* fUnweightedEffectMod * (1.-plot.weight));
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
        voroEdgeBufferColor = vec3(plot.edge, plot.cellScale);
    }
}

void main() {
    initGlobals();
    Plot plot = plot();

    vec3 c;
    float a = 1.;
    #if MEDIA_ENABLED == 1 && MEDIA_HIDDEN == 0
        mediaColor(c, a, plot);
    #else
        randomCellColor(c, a, plot);
    #endif
    #if EDGES_VISIBLE == 1
        edgesColor(c, a, plot);
    #endif
    postEffectsColor(c, a, plot);

    colorOutput(c, a, plot);
}
