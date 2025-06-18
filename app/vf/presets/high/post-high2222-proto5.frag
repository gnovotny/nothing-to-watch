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
uniform vec2 fCenterForce;
uniform float fCenterForceStrengthMod;


//in vec2 u;
in vec2 vUv;

layout(location = 0) out vec4 outputColor;
layout(location = 1) out vec4 voroIndexBufferColor;

#define TAU 6.2831853

#define BULGE_TEST 0

////////////////

vec4 fetchIndices(vec2 position) {
    //    return floatBitsToUint(texelFetch(uVoroIndexBufferTexture, ivec2(position), 0)) - 1u;
    return texelFetch(uVoroIndexBufferTexture, ivec2(position), 0);
    //    return floatBitsToUint(texture(uVoroIndexBufferTexture, position)) - 1u;
}

float dot2(vec2 p) {
    return dot(p,p);
}

// Microfaceted normal distribution function.
float D_GGX(float NoH, float roughness) {
    float alpha = pow(roughness, 4.);
    float b = (NoH*NoH*(alpha - 1.) + 1.);
    return alpha/(3.14159265*b*b);
}

// Surface geometry function.
float G1_GGX_Schlick(float NoV, float roughness) {
    //float r = roughness; // original
    float r = .5 + .5*roughness; // Disney remapping.
    float k = (r*r)/2.;
    float denom = NoV*(1. - k) + k;
    return max(NoV, .001)/denom;
}

float G_Smith(float NoV, float NoL, float roughness) {
    float g1_l = G1_GGX_Schlick(NoL, roughness);
    float g1_v = G1_GGX_Schlick(NoV, roughness);
    return g1_l*g1_v;
}

// Bidirectional Reflectance Distribution Function (BRDF).
//
// If you want a quick crash course in BRDF, see the following:
// Microfacet BRDF: Theory and Implementation of Basic PBR Materials
// https://www.youtube.com/watch?v=gya7x9H3mV0&t=730s
//
vec3 BRDF(vec3 col, vec3 n, vec3 l, vec3 v,
float type, float rough, float fresRef){

    vec3 h = normalize(v + l); // Half vector.

    // Standard BRDF dot product calculations.
    float nv = clamp(dot(n, v), 0., 1.);
    float nl = clamp(dot(n, l), 0., 1.);
    float nh = clamp(dot(n, h), 0., 1.);
    float vh = clamp(dot(v, h), 0., 1.);


    // Specular microfacet (Cook- Torrance) BRDF.
    //
    // F0 for dielectics in range [0., .16]
    // Default FO is (.16 * .5^2) = .04
    // Common Fresnel values, F(0), or F0 here.
    // Water: .02, Plastic: .05, Glass: .08, Diamond: .17
    // Copper: vec3(.95, .64, .54), Aluminium: vec3(.91, .92, .92), Gold: vec3(1, .71, .29),
    // Silver: vec3(.95, .93, .88), Iron: vec3(.56, .57, .58).
    vec3 f0 = vec3(.16*(fresRef*fresRef));
    // For metals, the base color is used for F0.
    f0 = mix(f0, col, type);
    vec3 F = f0 + (1. - f0)*pow(1. - vh, 5.);  // Fresnel-Schlick reflected light term.
    // Microfacet distribution... Most dominant term.
    float D = D_GGX(nh, rough);
    // Geometry self shadowing term.
    float G = G_Smith(nv, nl, rough);
    // Combining the terms above.
    vec3 spec = F*D*G/(4.*max(nv, .001));


    // Diffuse calculations.
    vec3 diff = vec3(nl);
    diff *= 1. - F; // If not specular, use as diffuse (optional).
    diff *= (1. - type); // No diffuse for metals.


    // Combining diffuse and specular.
    // You could specify a specular color, multiply it by the base
    // color, or multiply by a constant. It's up to you.
    return (col*diff + spec*3.14159265);

}

// Color scheme - Bluish grey: 0, Reddish pink: 1.
#define COLOR 1

#define FAR 8.

int objID = 0; // Object ID. (Not used here).

// Standard 2D rotation formula.
mat2 rot2(in float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }


// Tri-Planar blending function. Based on an old Nvidia writeup:
// GPU Gems 3 - Ryan Geiss: https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch01.html
vec3 tex3D( sampler2D tex, in vec3 p, in vec3 n ){

    n = max((abs(n) - .2), .001);
    n /= (n.x + n.y + n.z ); // Roughly normalized.

    p = (texture(tex, p.yz)*n.x + texture(tex, p.zx)*n.y + texture(tex, p.xy)*n.z).xyz;

    // Loose sRGB to RGB conversion to counter final value gamma correction...
    // in case you're wondering.
    return p*p;
}


// Compact, self-contained version of IQ's 3D value noise function. I have a transparent noise
// example that explains it, if you require it.
float n3D(vec3 p){

    const vec3 s = vec3(7, 157, 113);
    vec3 ip = floor(p); p -= ip;
    vec4 h = vec4(0., s.yz, s.y + s.z) + dot(ip, s);
    p = p*p*(3. - 2.*p); //p *= p*p*(p*(p * 6. - 15.) + 10.);
    h = mix(fract(sin(mod(h, TAU))*43758.5453), fract(sin(mod(h + s.x, TAU))*43758.5453), p.x);
    h.xy = mix(h.xz, h.yw, p.y);
    return mix(h.x, h.y, p.z); // Range: [0, 1].
}



// Scene object ID, and individual cell IDs. Used for coloring.
vec2 cellID; // Individual Voronoi cell IDs.

/*
// Commutative smooth maximum function. Provided by Tomkh, and taken
// from Alex Evans's (aka Statix) talk:
// http://media.lolrus.mediamolecule.com/AlexEvans_SIGGRAPH-2015.pdf
// Credited to Dave Smith @media molecule.
float smax(float a, float b, float k){

   float f = max(0., 1. - abs(b - a)/k);
   return max(a, b) + k*.25*f*f;
}


// Commutative smooth minimum function. Provided by Tomkh, and taken
// from Alex Evans's (aka Statix) talk:
// http://media.lolrus.mediamolecule.com/AlexEvans_SIGGRAPH-2015.pdf
// Credited to Dave Smith @media molecule.
float smin(float a, float b, float k){

   float f = max(0., 1. - abs(b - a)/k);
   return min(a, b) - k*.25*f*f;
}
*/

// Fabrice's fork of "Integer Hash - III" by IQ: https://shadertoy.com/view/4tXyWN
float hash21(vec2 f){

    // The first line relates to ensuring that icosahedron vertex identification
    // points snap to the exact same position in order to avoid hash inaccuracies.
    uvec2 p = floatBitsToUint(f + 16384.);
    p = 1664525U*(p>>1U^p.yx);
    return float(1103515245U*(p.x^(p.y>>3U)))/float(0xffffffffU);
}

//#define STATIC
// A slight variation on a function from Nimitz's hash collection, here:
// Quality hashes collection WebGL2 - https://www.shadertoy.com/view/Xt3cDn
vec2 hash22(vec2 f){

    // Fabrice Neyret's vec2 to unsigned uvec2 conversion. I hear that it's not
    // that great with smaller numbers, so I'm fudging an increase.
    uvec2 p = floatBitsToUint(f + 1024.);

    // Modified from: iq's "Integer Hash - III" (https://www.shadertoy.com/view/4tXyWN)
    // Faster than "full" xxHash and good quality.
    p = 1103515245U*((p>>1U)^(p.yx));
    uint h32 = 1103515245U*((p.x)^(p.y>>3U));
    uint n = h32^(h32>>16);

    uvec2 rz = uvec2(n, n*48271U);
    #ifdef STATIC
    // Standard uvec2 to vec2 conversion with wrapping and normalizing.
    return (vec2((rz>>1)&uvec2(0x7fffffffU))/float(0x7fffffff) - .5);
    #else
    f = vec2((rz>>1)&uvec2(0x7fffffffU))/float(0x7fffffff);
    return sin(f*TAU + iTime)*.5;
    #endif
}


float gV;


// Voronoi ID.
vec2 gVID;

// The height map values. In this case, it's just a Voronoi variation. By the way,
// I could optimize this a lot further.
//float heightMap(vec3 p){
//float heightMap(vec2 uv, vec3 p){
//
//    vec2 pp = p.xy;
//    //    pp *= 0.25;
//
//    float aspect = iResolution.x / iResolution.y;
//    vec2 uv2 = vec2(pp.x * 0.5 + 0.5, pp.y * aspect * 0.5 + 0.5);
//
//    // Vector holds the rounded edge value, straight edge value,
//    //    vec3 v3 = texture(uVoroEdgeBufferTexture, uv).rgb;
//    vec3 v3 = texture(uVoroEdgeBufferTexture, uv2).rgb;
//
//    float v = v3.x;
//    //    float v = v3.y;
//    gVID = v3.yz;
//
//    //    v *= 5.5;
//    v *= 51.5;
//
//    // This hash runs between -.5 and .5
//    //float v2 = smoothstep(.0, .0, (-r*.5 + hash22(v3.yz + .1).x));
//    //
//    // Adding fine lines.
//    float v2 = smoothstep(.0, .0, (hash22(v3.yz + .1).x + .25));
//    //float ln = abs(fract(v*4.) - .5)*4. - 1.;
//    //v = clamp(v + v2*smoothstep(0., .0, -ln*.3), 0., 1.);
//    //    v += v2*smoothstep(0., .1, -sin(v*TAU*4.))*.3;
//
//    // Flatening the tops and hashed based inversion, or whatever...
//    // I made it all up. :)
//    v = clamp(v + .05, 0., .55);
//
//    v = mix(v, 1. - v, step(0., hash21(v3.yz + .22)));
//    //    v = mix(v, 1. - v, step(0., hash21(vec2(.22))));
//    //    v = mix(v, 1. - v, 1.);
//
//    v = mix(v, 1. - v, step(0., v - .1));
//
//    return v;
//}

float heightMap(vec2 uv){


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
float m(vec3 p, float percent){

//    vec2 uv = p.xy * 0.5 + 0.5;
    float aspect = iResolution.x / iResolution.y;
    vec2 uv = vec2(p.x / aspect * 0.5 + 0.5, p.y * 0.5 + 0.5);

    // Voronoi heightmap.
    float h = heightMap(uv);

    //    // A sprinkling of noise.
    //    //    vec3 tx = texture(iChannel1, p.xy*2.).xyz; //tx *= tx;
    //    //    vec3 tx = texture(iChannel1, uv).xyz; //tx *= tx;
    //    vec3 tx = texture(uMainOutputTexture, uv).xyz; //tx *= tx;
    //    float gr = dot(tx, vec3(.299, .587, .114));
    //    //    float gr = dot(tx, tx);
    //    //float gr = hash22(floor(p.xy*32.)/32.).x;
    //    h *= (1. + gr*.01);

    // Adding the height map to the back plane.
    //    return -p.z - (h - .5)*.05;
    return -p.z - (h - .5)*percent;
//    return -p.z - (h - .5)*.25;
    //    return -p.z - (h - .5)*.5;

}

// Standard normal function. It's not as fast as the tetrahedral calculation,
// but more symmetrical.
vec3 nr(in vec3 p, float percent) {

    //const vec2 e = vec2(.001, 0);
    //return normalize(vec3(map(p + e.xyy) - map(p - e.xyy),
    //                      map(p + e.yxy) - map(p - e.yxy),
    //                      map(p + e.yyx) - map(p - e.yyx)));

    // This mess is an attempt to speed up compiler time by contriving a break... It's
    // based on a suggestion by IQ. I think it works, but I really couldn't say for sure.
    float sgn = 1.;
    vec3 e = vec3(.0025, 0, 0), mp = e.zzz; // Spalmer's clever zeroing.
    //    for(int i = min(iFrame, 0); i<6; i++){
    for(int i = 0; i<6; i++){
        mp.x += m(p + sgn*e, percent)*sgn;
        sgn = -sgn;
        if((i&1)==1){ mp = mp.yzx; e = e.zxy; }
    }

    return normalize(mp);
}

// Cheap shadows are hard. In fact, I'd almost say, shadowing particular scenes with
// limited iterations is impossible... However, I'd be very grateful if someone could
// prove me wrong. :)
//float softShadow(vec3 ro, vec3 rd, float lDist, float k){
//
//    // More would be nicer. More is always nicer, but not always affordable. :)
//    const int iters = 48;
//
//    float shade = 1.;
//    float t = 0.;
//
//
//    // Max shadow iterations - More iterations make nicer shadows, but slow things down.
//    // Obviously, the lowest number to give a decent shadow is the best one to choose.
////    for (int i = min(iFrame, 0); i<iters; i++){
//    for (int i = 0; i<iters; i++){
//
//        float d = m(ro + rd*t, percent);
//
//        shade = min(shade, k*d/t);
//        //shade = min(shade, smoothstep(0., 1., k*h/dist)); // Thanks to IQ for this tidbit.
//        // So many options here, and none are perfect: dist += min(h, .2),
//        // dist += clamp(h, .01, stepDist), etc.
//        t += clamp(d*.8, .01, .25);
//
//
//        // Early exits from accumulative distance function calls tend to be a good thing.
//        if (d<0. || t>lDist) break;
//    }
//
//    // Shadow.
//    return max(shade, 0.);
//}

// I keep a collection of occlusion routines... OK, that sounded really nerdy. :)
// Anyway, I like this one. I'm assuming it's based on IQ's original.
//float cAO(in vec3 p, in vec3 n)
//{
//    float sca = 3., occ = 0.;
//    for(int i = 0; i<5; i++){
//
//        float hr = .01 + float(i)*.25/4.;
//        float dd = m(n * hr + p);
//        occ += (hr - dd)*sca;
//        sca *= .75;
//    }
//    return clamp(1. - occ, 0., 1.);
//}


/*
// Standard hue rotation formula... compacted down a bit.
vec3 rotHue(vec3 p, float a){

    vec2 cs = sin(vec2(1.570796, 0) + a);

    mat3 hr = mat3(.299,  .587,  .114,  .299, .587,  .114,   .299,   .587, .114) +
        	  mat3(.701, -.587, -.114, -.299, .413, -.114,  -.300,  -.588, .886)*cs.x +
        	  mat3(.168,  .330, -.497, -.328, .035,  .292,  1.250, -1.050, .203)*cs.y;

    return clamp(p*hr, 0., 1.);
}
*/


// Slightly modified version of Nimitz's curve function. The tetrahedral and normal six
// tap versions are in there. If four taps gives you what you want, then that'd be the
// one to use.
//
// I think it's based on a discrete finite difference approximation to the continuous
// Laplace differential operator? Either way, it gives you the curvature of a surface,
// which is pretty handy.
//
// Original usage (I think?) - Cheap curvature: https://www.shadertoy.com/view/Xts3WM
// Other usage: Xyptonjtroz: https://www.shadertoy.com/view/4ts3z2
//
// spr: sample spread, amp: amplitude, offs: offset.
//float curve(in vec3 p, in float spr, in float amp, in float offs){
//
//    float d = m(p);
//
//    spr /= 450.;
//
//    #if 0
//    // Tetrahedral.
//    vec2 e = vec2(-spr, spr); // Example: ef = .25;
//    float d1 = m(p + e.yxx), d2 = m(p + e.xxy);
//    float d3 = m(p + e.xyx), d4 = m(p + e.yyy);
//    return clamp((d1 + d2 + d3 + d4 - d*4.)/e.y/2.*amp + offs + .5, 0., 1.);
//    #else
//    // Cubic.
//    vec2 e = vec2(spr, 0); // Example: ef = .5;
//    float d1 = m(p + e.xyy), d2 = m(p - e.xyy);
//    float d3 = m(p + e.yxy), d4 = m(p - e.yxy);
//    float d5 = m(p + e.yyx), d6 = m(p - e.yyx);
//
//    #if 1
//    //return clamp((d1 + d2 + d3 + d4 + d5 + d6 - d*6.)/e.x*amp + offs + .05, -.1, .1)/.1;
//    return smoothstep(-.05, .05, (d1 + d2 + d3 + d4 + d5 + d6 - d*6.)/e.x/2.*amp + offs);
//
//    #else
//    d *= 2.;
//    return 1. - smoothstep(-.05, .05, (abs(d1 + d2 - d) + abs(d3 + d4 - d) +
//    abs(d5 + d6 - d))/e.x/2.*amp + offs + .0);
//    #endif
//
//    #endif
//
//}

// Simple environment mapping. Pass the reflected vector in and create some
// colored noise with it. The normal is redundant here, but it can be used
// to pass into a 3D texture mapping function to produce some interesting
// environmental reflections.
//
// More sophisticated environment mapping:
// UI easy to integrate - XT95
// https://www.shadertoy.com/view/ldKSDm
vec3 eMap(vec3 rd, vec3 sn){

    vec3 sRd = rd; // Save rd, just for some mixing at the end.

    // Add a time component, scale, then pass into the noise function.
    rd.xy -= iTime*.25;
    rd *= 3.;

    //vec3 tx = tex3D(iChannel0, rd/3., sn);
    //float c = dot(tx*tx, vec3(.299, .587, .114));

    float c = n3D(rd)*.57 + n3D(rd*2.)*.28 + n3D(rd*4.)*.15; // Noise value.
    c = smoothstep(0.5, 1., c); // Darken and add contast for more of a spotlight look.

    vec3 col = vec3(c, c*c, c*c*c*c); // Simple, warm coloring.
    //vec3 col = vec3(min(c*1.5, 1.), pow(c, 2.5), pow(c, 12.)).zyx; // More color.

    // Mix in some more red to tone it down and return.
    return mix(col, col.zyx, n3D(rd*2.));

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

vec2 fragCoords() {
    vec2 fragCoord = gl_FragCoord.xy / iResolution.z;
    return fragCoord;
}

vec2 normalizedPCoords() {
    return normalizeCoords(fragCoords());
}

vec2 pCoords() {
    return aspectCoords(fragCoords());
}

float heightMod = 1.;

void main(){

    vec2 u = pCoords();
    vec2 centerForce = aspectCoords(rawCoords(fCenterForce.xy));
//    vec2 relativeCenterForce = fCenterForceStrengthMod * centerForce;
    vec2 relativeCenterForce = centerForce;

    float rad = length(u - relativeCenterForce);
//    float percent = 1. - rad / 2.;
//    float percent = clamp(1. - rad / 2., 0., 1.);
//    float percent = clamp(1. - rad, 0., 1.);
    float percent = clamp(1. - rad / 4., 0.1, .7);
//    float percent = clamp(rad, 0., .5);
//    float percent = clamp(1. - rad / 2., 0.25, 0.5);
//    float percent = 1.;


//    u *= 0.5;
//    u -= relativeCenterForce;
//    u -= mix(vec2(0.), relativeCenterForce, percent);



//    vec3 o = vec3(u, -1);
    vec3 o = vec3(mix(u, relativeCenterForce, percent), -1);
//    vec3 l = vec3(.5, 0, 0);
    vec3 l = vec3(0, 0, 4.5);
    l += o; // Moving the light with the camera.

//    u -= mix(vec2(0.), relativeCenterForce, percent);
    u -= relativeCenterForce*percent;

    // Unit direction ray.
    vec3 r = normalize(vec3(u, 4));
//    vec3 r = normalize(vec3(u, 4. * percent));
//    vec3 r = normalize(vec3(u, 4. / percent));
//    vec3 r = vec3(u, 6);

    // Standard raymarching routine. Raymarching a slightly perturbed back plane front-on doesn't usually require many iterations.
    float d, t = 0.;
    // position
    vec3 p;

    float iterations = 80. * percent;
    float flooredIterations = floor(iterations);

    float tAddition = 0.;

    //    for(int i=0; i<1;i++){
//        for(int i=0; i<20;i++){
//    for(int i=0; i<40;i++) {
    for(int i=0; i<int(flooredIterations);i++){

        t += tAddition;

        p = o + r*t;
        d = m(p, percent);
        // There isn't really a far plane to go beyond, but it's there anyway.
        if(abs(d)<.001 || t>FAR) break;
//      t += d*.07*percent;
//        tAddition = d*.14 * (1./percent);
        tAddition = d*.14 * percent;
//      t += d*.14;
//      t += d*.07*(1./percent);
//        t += d*.14;
//      t += d*.28;

    }

    t += tAddition * (iterations- flooredIterations);

    p = o + r*t;
    d = m(p, percent);
    // There isn't really a far plane to go beyond, but it's there anyway.
//    if(!(abs(d)<.001 || t>FAR)) {
//        //      t += d*.07*percent;
//        t += d*.07 * (iterations- flooredIterations);
//    }





    t = min(t, FAR);

    // Voronoi cell ID.
    vec2 vID = gVID;

    // initial scene color
    vec4 c = vec4(0);

    //    uvec4 indices = uvec4(uint(-1));
    vec4 indices;

    // If the ray hits something in the scene, light it up.
    if(t<FAR){

        // normal.
        vec3 n = nr(p, percent);

        l -= p; // Light to surface vector. Ie: Light direction vector.
        float lDist = max(length(l), .001); // Light to surface distance.
        l /= lDist; // Normalizing the light direction vector.


        // The shadows barely make an impact here, so we may as well
        // save some cycles.
        float sh = 1.;
//        float sh = softShadow(p + n*.0015, l, lDist, 16.);

        // Scene curvature.
//        float spr = 2., amp = 1., offs = .0;
//        float crv = curve(p, spr, amp, offs);


//        vec2 uv = p.xy * 0.5 + 0.5;
        float aspect = iResolution.x / iResolution.y;
        vec2 uv = vec2(p.x / aspect * 0.5 + 0.5, p.y * 0.5 + 0.5);


        // Obtain the height map (destorted Voronoi) value, and use it to slightly
        // shade the surface. Gives a more shadowy appearance.
        float hm = heightMap(uv);

        //        indices = fetchIndices(uv);
        indices = fetchIndices(uv*iResolution.xy);

        int svObjID = objID; // Object ID. Unused.
        // Surface object coloring.

        // Voronoi cell coloring. Subtle for this example, but it's there.
        vec3 cCol = .5 + .45*cos(TAU*hash21(vID + .2)/4. + vec3(0, 1, 2) - .2);


        // Texture.
        vec3 tx;
        //        tx = tex3D(iChannel0, (p), n);
        //        tx = tex3D(iChannel0, vec3(uv, p.z), n);
        //                tx = tex3D(uMainOutputTexture, vec3(uv, p.z), n);

        if (svObjID == 1) {
//            tx = tex3D(iChannel0, vec3(uv, p.z), n);
            tx = vec3(0.05);
        } else {
//            tx = tex3D(uMainOutputTexture, vec3(uv, p.z), n);
            tx = texture(uMainOutputTexture, uv).rgb;
        }

        vec3 oCol = tx;


        if (svObjID == 1) {




//            oCol = mix(oCol, mix(oCol, oCol*cCol*2., .5), step(0., hm - .55));

            //oCol = vec3(1)*dot(oCol, vec3(.299, .587, .114));


            // Backfill light.
            float backFill = max(dot(vec3(-l.xy, 0.), n), 0.);
            float ns0 = n3D(p*3. + iTime/4.);
            ns0 = smoothstep(-.25, .25, ns0 - .5);
            oCol += oCol*mix(vec3(.0, .0, .0), vec3(.01, .01, .01), ns0)*backFill*sh;
            // Faux Fresnel edge glow.
            float fres = pow(max(1. - max(dot(-r, n), 0.), 0.), 4.);
            oCol += oCol*fres;





            // Specular reflections.
            vec3 hv = normalize(-r + l);
            vec3 ref = reflect(r, n);
            // Hacky environmental mapping... I should put more effort into this. :)
            vec3 tx2 = eMap(ref, n);
            float specR = pow(max(dot(hv, n), 0.), 8.);
            oCol += specR*tx2*2.;


            // Faux shadowing.
            float shade = hm + .02;
            oCol *= min(vec3(pow(shade, .8))*1.6, 1.);
            // Alternative.
            //oCol *= smoothstep(0., .55, hm)*.8 + .2;



            #if 1
            // Hacky BDRF lighting.
            //
            // Quick Lighting Tech - blackle
            // https://www.shadertoy.com/view/ttGfz1
            // Studio and outdoor.
            //float ambience = pow(length(sin(n*2.)*.45 + .5), 2.);
            float ambience = length(sin(n*2.)*.5 + .5)/sqrt(3.)*smoothstep(-1., 1., -n.z)*1.5;

            // Make some of the flat tops metallic.
            float matType = hm<.55? 0. : 1.; // Dialectric or metallic.
            float roughness = tx.x; // Texture based roughness.
            // TODO setting reflectance to 0 solves a lot of issues
            float reflectance = tx.x*2.; // Texture based reflectivity.

            oCol *= 1. + matType; // Brighter metallic colors.
            roughness *= 1. + matType; // Rougher metallic surfaces.

            // Cook-Torrance based lighting.
            vec3 ct = BRDF(oCol, n, l, -r, matType, roughness, reflectance);

            // Combining the ambient and microfaceted terms to form the final color:
            // None of it is technically correct, but it does the job. Note the hacky
            // ambient shadow term. Shadows on the microfaceted metal doesn't look
            // right without it... If an expert out there knows of simple ways to
            // improve this, feel free to let me know. :)
            c.xyz = (oCol*ambience*(sh*.75 + .25) + ct*(sh));

            #else
            // Blinn Phong.
            float df = max(dot(l, n), 0.); // Diffuse.
            //df = pow(df, 2.)*.65 + pow(df, 4.)*.75;
            float sp = pow(max(dot(reflect(-l, n), -r), 0.), 8.); // Specular.
            // Fresnel term. Good for giving a surface a bit of a reflective glow.
            float fr = pow( clamp(dot(n, r) + 1., .0, 1.), 2.);

            // Regular diffuse and specular terms.
            c.xyz = oCol*(df*vec3(1, .97, .92)*2.*sh + vec3(1, .6, .2)*sp*sh + .1);
            #endif

            c = vec4(pow(c.xyz, vec3(1./1.7)), 1);

        } else {
            c.xyz = oCol;
        }

        // Apply the curvature based lines.
        //c.xyz *= crv*1. + .35;
//        c.xyz *= 1. - abs(crv - .5)*2.*.8;

        // AO effect
//        c.xyz *= cAO(p, n);

    }


    // Save to the backbuffer.
    c = vec4(max(c.xyz, 0.), t);


    //    fragColor = vec4(pow(c.xyz, vec3(1./2.2)), 1);
    outputColor = c;
//    outputColor = vec4(vec3(percent), 1.);

//        outputColor = mix(outputColor, texture(uMainOutputTexture, vUv), 0.5);

    //    fragColor = c;

    //    voroIndexBufferColor = uintBitsToFloat(indices + 1u);
    //    voroIndexBufferColor = uintBitsToFloat(indices + 1u);
    voroIndexBufferColor = indices;
}