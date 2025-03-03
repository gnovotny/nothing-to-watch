#version 300 es

precision highp float;

uniform highp sampler2D uCellCoordsTexture;
uniform highp sampler2D uVoroIndexBufferTexture;
uniform highp usampler2D uCellNeighborsTexture;
uniform highp sampler2D uCellWeightsTexture;
uniform highp usampler2D uCellMediaVersionsTexture;
uniform highp usampler2D uCellIdMapTexture;

uniform vec3 iResolution;

uniform bool bMediaEnabled;

uniform mediump sampler2DArray uMediaV0Texture;
uniform mediump sampler2DArray uMediaV1Texture;
uniform mediump sampler2DArray uMediaV2Texture;

uniform ivec3 i3NumMediaVersionCols;
uniform ivec3 i3NumMediaVersionRows;
uniform ivec3 i3NumMediaVersionLayers;


uniform int iLatticeRows;
uniform int iLatticeCols;

uniform int iNumCells;
uniform int iFocusedIndex;

in vec2 vUv;
out vec4 fragColor[2];

#define DEBUG_MEDIA_BBOXES 0
//#define Y_FACTOR 4.5
#define Y_FACTOR 1.
#define MEDIA_UV_ROTATE_FACTOR 1
#define ROUNDNESS 0.01
#define EPSILON .0001
#define EARLY_EXIT_OPTIMIZATION 0
#define WEIGHT_MOD 10.
#define WEIGHT_MOD_MEDIA 30.

struct TextureData {
    ivec2 ids;
    vec2 dists;
};

struct Data {
    ivec2 ids;
    vec2 dists;
    float minEdgeDist;
    vec4 mediaBbox;
    bool debugFlag;
};

//smoothmin function by iq
float smin( float a, float b, float k )
{
    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );
    return mix( b, a, h ) - k*h*(1.0-h);
}

float mapRange(float value, float min1, float max1, float min2, float max2) {
    return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

vec2 ndcToUv(vec2 ndc) {
    return (ndc + 1.0) * 0.5;
}

float dot2(vec2 p) {
    return dot(p,p);
}

float dist(vec2 a, vec2 b) {
//    return distance(a, b);
    return dot2(a - b);
}

// Converts an integer into a pseudo-random float between 0.0 and 1.0
float randomColorChannel(int seed) {
    return fract(sin(float(seed) * 78.233) * 43758.5453123);
}

// Generates a random vec3 color based on an integer
vec3 randomColor(int seed) {
    float r = randomColorChannel(seed);
    float g = randomColorChannel(seed + 1);
    float b = randomColorChannel(seed + 2);
    return vec3(r, g, b);
}

float weightedDist(vec2 p1, vec2 p2, float weight) {
    return dist(p1, p2) - weight;
}

uint cellIdTexData(int index) {
    int textureWidth = textureSize(uCellIdMapTexture, 0).x;
    return texelFetch(uCellIdMapTexture, ivec2(index % textureWidth, index / textureWidth), 0).r;
}

uvec2 mediaVersionTexData(int index) {
    int textureWidth = textureSize(uCellMediaVersionsTexture, 0).x;
    return texelFetch(uCellMediaVersionsTexture, ivec2(index % textureWidth, index / textureWidth), 0).rg;
}

float weightTexData(int index) {
    int textureWidth = textureSize(uCellWeightsTexture, 0).x;
    return texelFetch(uCellWeightsTexture, ivec2(index % textureWidth, index / textureWidth), 0).r;
}

int neighborsTexData(int index) {
    int textureWidth = textureSize(uCellNeighborsTexture, 0).x;
    return int(texelFetch(uCellNeighborsTexture, ivec2(index % textureWidth, index / textureWidth), 0).r);
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

vec2 getCellCoords(int i) {
    vec2 screenCoords = coordsTexData(i);
    return (vec2(screenCoords.x, iResolution.y - screenCoords.y)*2.0-iResolution.xy) / iResolution.y;
}

vec2 getNormalizedCellCoords(int i) {
    vec2 coords = coordsTexData(i);
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

float calculateOrientation(vec2 top, vec2 right, vec2 bottom, vec2 left) {
    vec2 localX = normalize(right - left);
    float angle = atan(localX.y, localX.x);
//    return angle + 1.5708;
    return angle;
}

vec3 getMediaColor(int cellId, vec4 mediaBbox) {

    vec2 p = getNormalizedPCoords();

    vec2 mediaTileUv = (p - mediaBbox.xy) / (mediaBbox.zw - mediaBbox.xy);
    mediaTileUv.y = 1. - mediaTileUv.y;

    #if MEDIA_UV_ROTATE_FACTOR != 0
        ivec2 nIndexAndLength = ivec2(neighborsTexData(cellId*2),neighborsTexData(cellId*2+1));
        float angle = calculateOrientation(getNormalizedCellCoords(neighborsTexData(nIndexAndLength.x+1)),getNormalizedCellCoords(neighborsTexData(nIndexAndLength.x+3)),getNormalizedCellCoords(neighborsTexData(nIndexAndLength.x+5)),getNormalizedCellCoords(neighborsTexData(nIndexAndLength.x+7)));

        // Move origin to center of the box
        vec2 centerUv = vec2(0.5, 0.5);
        vec2 pos = mediaTileUv - centerUv;

        // Rotate around center
        float cosAngle = cos(angle * float(MEDIA_UV_ROTATE_FACTOR));
        float sinAngle = sin(angle * float(MEDIA_UV_ROTATE_FACTOR));
        vec2 rotatedUv = vec2(
            pos.x * cosAngle - pos.y * sinAngle,
            pos.x * sinAngle + pos.y * cosAngle
        );

        // Move back from center
        mediaTileUv = rotatedUv + centerUv;
    #endif


    #if DEBUG_MEDIA_BBOXES == 1  // highlight bbox limits
        if (mediaTileUv.x < 0.01 || mediaTileUv.x > 0.99 || mediaTileUv.y < 0.01 || mediaTileUv.y > 0.99) {
            return vec3(1.,0.,0.);
        }
    # else  // obscure bbox inaccuracies
        mediaTileUv = vec2(clamp(mediaTileUv.x, 0.01, 0.99), clamp(mediaTileUv.y, 0.01, 0.99));
    #endif

    int mediaLayers = i3NumMediaVersionLayers.x;
    int mediaCols = i3NumMediaVersionCols.x;
    int mediaRows = i3NumMediaVersionRows.x;

    int mediaVersion = int(mediaVersionTexData(cellId).x);

    if (mediaVersion == 1) {
        mediaLayers = i3NumMediaVersionLayers.y;
        mediaCols = i3NumMediaVersionCols.y;
        mediaRows = i3NumMediaVersionRows.y;
    } else if (mediaVersion == 2) {
        mediaLayers = i3NumMediaVersionLayers.z;
        mediaCols = i3NumMediaVersionCols.z;
        mediaRows = i3NumMediaVersionRows.z;
    }

    int mediaCapacity = mediaCols * mediaRows;

    int realCellId = int(cellIdTexData(cellId));
    int layer = realCellId / mediaCapacity;
    if (layer > mediaLayers) layer = layer % mediaLayers;
    int tileIndex = realCellId % mediaCapacity;

    int tileRow = tileIndex / mediaCols;
    int tileCol = tileIndex % mediaCols;

    float tileWidth = 1.0 / float(mediaCols);
    float tileHeight = 1.0 / float(mediaRows);

    vec2 tileOffset = vec2((float(tileCol)) * tileWidth, (float(tileRow)) * tileHeight);
    vec2 mediaTexcoord = tileOffset + mediaTileUv * vec2(tileWidth, tileHeight);

    if (mediaVersion == 1) {
        return texture(uMediaV1Texture, vec3(mediaTexcoord, float(layer))).rgb;
    } else if (mediaVersion == 2) {
        return texture(uMediaV2Texture, vec3(mediaTexcoord, float(layer))).rgb;
    }
    return texture(uMediaV0Texture, vec3(mediaTexcoord, float(layer))).rgb;
}

Data updateData(vec2 p, TextureData textureData) {
//    p.y /= 3.5;
    bool debugFlag = false;

    ivec2 ids = textureData.ids;
    vec2 dists = textureData.dists;

    ivec2 nIndexAndLength = ivec2(neighborsTexData(ids.x*2),neighborsTexData(ids.x*2+1));

    vec2 cellCoords = getCellCoords(ids.x);
    vec2 cell2Coords = getCellCoords(ids.y);

    float avgXNeighborDist = 1.;

    float distToFocusedCell = 0.;
    int maxNeighborIterations = min(nIndexAndLength.y, 8);
    if (iFocusedIndex != -1) {
        if (ids.x != iFocusedIndex) {
            vec2 focusedCellCoords = getCellCoords(iFocusedIndex);
            distToFocusedCell = dist(cellCoords, focusedCellCoords);

            if (distToFocusedCell < 0.5) {
                maxNeighborIterations = min(nIndexAndLength.y, 56);
            }
        } else {
            maxNeighborIterations = min(nIndexAndLength.y, 56);
        }

//        avgXNeighborDist = (dist(focusedCellCoords, getCellCoords(neighborsTexData(neighborsTexData(iFocusedIndex*2)+3))) + dist(focusedCellCoords, getCellCoords(neighborsTexData(neighborsTexData(iFocusedIndex*2)+7)))) * 0.5;
    }

    float texWeight = weightTexData(ids.x);
    float texWeight2 = weightTexData(ids.y);
    float weightMod = WEIGHT_MOD * getResolutionMod() * 1./float(iNumCells);


//    if (texWeight > 0.) {
//        avgXNeighborDist = (dist(cellCoords, getCellCoords(neighborsTexData(nIndexAndLength.x+3))) + dist(cellCoords, getCellCoords(neighborsTexData(nIndexAndLength.x+7)))) * 0.5;
//    }
    
    float weight = weightMod * avgXNeighborDist * texWeight;
    float weight2 = weightMod * avgXNeighborDist * texWeight2;
    float cellDist = weightedDist(p, cellCoords, weight);
    float cell2Dist = weightedDist(p, cell2Coords, weight2);
    vec4 mediaBbox = vec4(vec2(1.), vec2(-1.));
    float minEdgeDist = 0.;

    bool skipNearestSearch = false;

//    if (cellDist < dists.x && cell2Dist > dists.y) {
//        skipNearestSearch = true;
//    }


    if (!skipNearestSearch) {

//        for (int i = 0; i < min(nIndexAndLength.y, texWeight > 0.05 ? iFocusedIndex == ids.x ? 56 : 56 : 8); i++) {
        for (int i = 0; i < maxNeighborIterations; i++) {
            int neighborId = neighborsTexData(nIndexAndLength.x+i);
            if (neighborId == ids.x) continue;
            vec2 neighborCellCoords = getCellCoords(neighborId);

            float neighborTexWeight = weightTexData(neighborId);

//            if (neighborTexWeight > 0. && avgXNeighborDist == 1.) {
//                avgXNeighborDist = (dist(neighborCellCoords, getCellCoords(neighborsTexData(neighborsTexData(neighborId*2)+3))) + dist(neighborCellCoords, getCellCoords(neighborsTexData(neighborsTexData(neighborId*2)+7)))) * 0.5;
//            }

            float neighborWeight = weightMod * avgXNeighborDist * neighborTexWeight;

            float d = weightedDist(p, neighborCellCoords, neighborWeight);

            if (cellDist > d) {

                cell2Dist = cellDist;
                ids.y = ids.x;
                cell2Coords = cellCoords;
                weight2 = weight;
                texWeight2 = texWeight;

                cellDist = d;
                ids.x = neighborId;
                cellCoords = neighborCellCoords;
                weight = neighborWeight;

//                #if EARLY_EXIT_OPTIMIZATION == 1
//                break;
//                #endif
//                #if EARLY_EXIT_OPTIMIZATION == 2
//                return Data(ids, dists, minEdgeDist, mediaBbox, false);
//                #endif

            } else if (cell2Dist > d) {
                cell2Dist = d;
                ids.y = neighborId;
                cell2Coords = neighborCellCoords;
                weight2 = neighborWeight;
                texWeight2 = neighborTexWeight;
            }

        }
    }

    vec2 cellNdcCoords;
    vec2 midPointsSum = vec2(0.0);
    float mediaWeight;
//    float mediaWeightMod = WEIGHT_MOD_MEDIA * getResolutionMod();
    float mediaWeightMod =  weightMod * 3.;

    if (bMediaEnabled) {
         cellNdcCoords = getNormalizedCellCoords(ids.x);
         mediaWeight = mediaWeightMod * weightTexData(ids.x);
    }

    minEdgeDist = 0.1;
    nIndexAndLength = ivec2(neighborsTexData(ids.x*2),neighborsTexData(ids.x*2+1));

//    for (int i = 0; i < min(nIndexAndLength.y, texWeight > 0.05 ? iFocusedIndex == ids.x ? 56 : 56 : 8); i++) {
    for (int i = 0; i < maxNeighborIterations; i++) {
        int neighborId = neighborsTexData(nIndexAndLength.x+i);
        vec2 neighborCellCoords = getCellCoords(neighborId);

        if (neighborId == ids.x) continue;

        float neighborTexWeight = weightTexData(neighborId);
        float neighborWeight = weightMod * neighborTexWeight;

        vec2 mr = cellCoords - p;
        vec2 r = neighborCellCoords - p;
        vec2 dr = r - mr;
        float d = dot2(dr);
        float d2 = d + weight - neighborWeight;

//        if (d>EPSILON) {
            float mf = d2 / (2.*d);
            float newLen = dot( mix(mr.xy,r,mf), dr*(1./sqrt(d)) );
            minEdgeDist = smin( minEdgeDist, newLen, ROUNDNESS );
//        }

        if (bMediaEnabled && i < min(nIndexAndLength.y, 8)) {
            vec2 neighborNdcCoords = getNormalizedCellCoords(neighborId);

            float neighborMediaWeight = mediaWeightMod * weightTexData(neighborId);

            vec2 mediaMidNdcPoint = mix(cellNdcCoords, neighborNdcCoords, 0.5 + (mediaWeight - neighborMediaWeight) );
            midPointsSum += mediaMidNdcPoint;

            mediaBbox.xy = min(mediaBbox.xy, mediaMidNdcPoint);
            mediaBbox.zw = max(mediaBbox.zw, mediaMidNdcPoint);
        }
    }


    if (bMediaEnabled) {

        vec2 avgCenter = midPointsSum / float(min(nIndexAndLength.y, 8));
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

    return Data(ids, vec2(cellDist, cell2Dist), minEdgeDist, mediaBbox, debugFlag);
}

//Data initData(vec2 p) {
//    float minDist = 10000.0;
//    float secondMinDist = 10000.0;
//    int id = -1;
//    int id2 = -1;
//
//    for(int i = 0; i < iNumCells; i++) {
//        vec2 cell = getCellCoords(i);
//
//        float weight = 0.;
//
//        float d = dist(p, cell) - weight;
//        if (minDist > d) {
//
//            secondMinDist = minDist;
//            id2 = id;
//
//            id = i;
//            minDist = d;
//        } else if (secondMinDist > d) {
//            secondMinDist = d;
//            id2 = i;
//        }
//    }
//
//    return Data(ivec2(id, id2), vec2(minDist, secondMinDist),  0., vec4(0.), false);
//}

Data initData(vec2 p) {
    float minDist = 10000.0;
    float secondMinDist = 10000.0;
    int id = -1;
    int id2 = -1;

    int row = int(round((1.-vUv.y) * float(iLatticeRows)));
    int col = int(round(vUv.x * float(iLatticeCols)));

    id = (row) * iLatticeCols + col;

    return Data(ivec2(id, id2), vec2(minDist, secondMinDist),  0., vec4(0.), false);
}

TextureData getTextureData() {
    vec4 c = texture(uVoroIndexBufferTexture, vUv);
    ivec2 ids = ivec2(c.r - 1., c.g - 1.);
    vec2 dists = c.ba;
    return TextureData(ids, dists);
}

bool textureIdIsUndefined(int id) {
    return id == -1;
}

Data getData() {
    vec2 p = getPCoords();
    TextureData textureData = getTextureData();
//    return initData(p);
    if (textureIdIsUndefined(textureData.ids.x)) {
        return initData(p);
    } else {
        return updateData(p, textureData);
    }
}

void main() {

    Data data = getData();
    ivec2 ids = data.ids;
    vec2 dists = data.dists;

    vec3 c = bMediaEnabled ? getMediaColor(ids.x, data.mediaBbox) : randomColor(ids.x);
//    vec3 c = randomColor(ids.x);

    c = mix(
        c,
        vec3(0.),
//        smoothstep(.01, .001, minLen)
        smoothstep(.005, .001, data.minEdgeDist)
//        smoothstep(.0005, .0003, data.minEdgeDist)
//        smoothstep(.0003, .0001, data.minEdgeDist)
    );

    fragColor[0] = vec4(ids.x + 1, ids.y + 1, dists); // data output
    fragColor[1] = vec4(c, 1.); // color output
}
