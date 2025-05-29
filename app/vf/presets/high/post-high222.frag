#version 300 es

precision highp float;
precision highp int;

uniform highp sampler2D uMainOutputTexture;
uniform highp sampler2D uVoroEdgeBufferTexture;
uniform highp sampler2D uVoroIndexBufferTexture;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

uniform vec3 iResolution;
uniform float iTime;
uniform float fAlphaStrength;
uniform float fEdgeStrength;
uniform vec3 fBaseColor;
uniform vec2 fForceCenter;

//in vec2 u;
in vec2 vUv;

layout(location = 0) out vec4 outputColor;
layout(location = 1) out vec4 voroIndexBufferColor;

#define TAU 6.2831853

#define FISHEYE_TEST 0

////////////////

vec4 fetchIndices(vec2 position) {
    //    return floatBitsToUint(texelFetch(uVoroIndexBufferTexture, ivec2(position), 0)) - 1u;
    return texelFetch(uVoroIndexBufferTexture, ivec2(position), 0);
    //    return floatBitsToUint(texture(uVoroIndexBufferTexture, position)) - 1u;
}

#define FAR 8.

int objID = 0; // Object ID. (Not used here).



// Scene object ID, and individual cell IDs. Used for coloring.
vec2 cellID; // Individual Voronoi cell IDs.



float gV;


// Voronoi ID.
vec2 gVID;


float heightMap(vec2 uv){

//    vec2 pp = p.xy;
//    //    pp *= 0.25;

    vec3 v3 = texture(uVoroEdgeBufferTexture, uv).rgb;

    float v = v3.x;
    gVID = v3.yz;

//    if(v<0.015){
    if(v<0.01){
        objID = 1;

    } else {
        objID = 0;
    }

    //    v *= 5.5;
    v *= 51.5;

    v = clamp(v + .05, 0., .55);
    //    v = clamp(v + .05, 0., 3.95); // higher


    //    v = 1. - v; // reversed z

    return v;
}

// Back plane height map.
float m(vec3 p){

    //    vec2 uv = p.xy * 0.5 + 0.5;
    float aspect = iResolution.x / iResolution.y;
    vec2 uv = vec2(p.x * 0.5 + 0.5, p.y * aspect * 0.5 + 0.5);

    // Voronoi heightmap.
    float h = heightMap(uv);

    // Adding the height map to the back plane.
    //    return -p.z - (h - .5)*.05;
    return -p.z - (h - .5)*.25;
    //    return -p.z - (h - .5)*.5;

}



void main(){

    // Coordinates.
    vec2 fragCoord = gl_FragCoord.xy / iResolution.z;
//    vec2 u = (fragCoord - iResolution.xy*.5)/iResolution.y;
        vec2 u = (fragCoord*2.0-iResolution.xy) / (iResolution.y > iResolution.x ? iResolution.y : iResolution.x);

    vec2 forceCenterPixel =vec2(fForceCenter.x, iResolution.y - fForceCenter.y);
//    vec2 forceCenter = (forceCenterPixel*2.0-iResolution.xy) / iResolution.y;
    vec2 forceCenter = (forceCenterPixel*2.0-iResolution.xy) / (iResolution.y > iResolution.x ? iResolution.y : iResolution.x);

//    u -= forceCenter;

    // TODO
    //    u *= 1.14;
//        u *= 1.2;

        vec3 o = vec3(forceCenter, -1);
        vec3 oo = vec3(forceCenter, -1);



    // Unit direction ray.
//    vec3 r = normalize(vec3(u, 1));
    vec3 r = vec3(u, 1);

    r.xy -= forceCenter;


    float d, t = 0.;

    //    for(int i=0; i<1;i++){
//        for(int i=0; i<20;i++){
//        for(int i=0; i<40;i++){
    for(int i=0; i<80;i++){

        vec3 pp = oo + r*t;
        vec3 p = o + r*t;

        d = m(oo + r*t);
        // There isn't really a far plane to go beyond, but it's there anyway.
        if(abs(d)<.001 || t>FAR) break;
        //        t += d*.7;
        //        t += d*.56;
        t += d*.07;
//                t += d*.14;
//                t += d*.28;
        //        t += d*.3;

    }



    // Voronoi cell ID.
    vec2 vID = gVID;

    // Set the initial scene color to black.
    vec4 c = vec4(0);

    //    uvec4 indices = uvec4(uint(-1));
    vec4 indices;

    // If the ray hits something in the scene, light it up.
    if(t<FAR){

        // Position and normal.
//        vec3 p = oo + r;
        vec3 pp = oo + r*t;
        vec3 p = o + r*t;
//        vec3 p = o + r;
//        vec3 p = vec3(u, 1.);



        // Obtain the height map (destorted Voronoi) value, and use it to slightly
        // shade the surface. Gives a more shadowy appearance.
        //        float hm = heightMap(p);

        float aspect = iResolution.x / iResolution.y;
        vec2 uv = vec2(pp.x * 0.5 + 0.5, pp.y * aspect * 0.5 + 0.5);

        //        indices = fetchIndices(uv);
        indices = fetchIndices(uv*iResolution.xy);

        float hm = heightMap(uv);

        int svObjID = objID; // Object ID. Unused.
        // Surface object coloring.


        // Texture.
        vec3 tx;
        if (svObjID == 1) {
        } else {
            tx = texture(uMainOutputTexture, uv).rgb;
        }

        vec3 oCol = tx;


        c.xyz = oCol;
    }

    outputColor = vec4(c.xyz, 1);
    voroIndexBufferColor = indices;
}