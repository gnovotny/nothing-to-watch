#version 300 es

precision highp float;
precision highp int;

uniform sampler2D uMainOutputTexture;
uniform sampler2D uVoroEdgeBufferTexture;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

uniform vec3 iResolution; // Size of the viewport in pixels
uniform float iTime; // Size of the viewport in pixels
uniform float fAlphaStrength;
uniform float fEdgeStrength;
uniform vec3 fBaseColor;

//in vec2 u;
in vec2 vUv;
out vec4 fragColor;

#define TAU 6.2831853

// Global time variable.
float tm;

// A slight variation on a function from Nimitz's hash collection, here:
// Quality hashes collection WebGL2 - https://www.shadertoy.com/view/Xt3cDn
vec2 hash22A(vec2 f){

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
    return sin(f*TAU + tm)*.5;
    #endif
}


// 2D 2nd-order Voronoi: Obviously, this is just a rehash of IQ's original. I've tidied
// up those if-statements. Since there's less writing, it should go faster. That's how
// it works, right? :)
//
vec3 VoronoiA(in vec2 p){

    vec2 ip = floor(p) + .5, o; p -= ip;

    vec3 d = vec3(1); // 1.4, etc. "d.z" holds the distance comparison value.

    float minD = 1.;
    vec2 id;

    for(int y =-1; y<=1; y++){
        for(int x =-1; x<=1; x++){

            o = vec2(x, y);
            o += hash22A(ip + o) - p;

            o = abs(o);
            d.z = (o.x + o.y)*.7071; // Manhattan.

            if(d.z<minD){ minD = d.z; id = vec2(x, y) + ip; }
            //d.z = max(max(o.x, o.y), (o.x + o.y)*.7071); // .7071 for an octagon, etc.

            d.y = max(d.x, min(d.y, d.z));
            d.x = min(d.x, d.z);

        }
    }


    float r = (d.y - d.x); // return 1.-d.x; // etc.
    r = clamp(r + .05, 0., .6);

    return vec3(r, id);

}

////////////////

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

//int id = 0; // Object ID. (Not used here).

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




#define STATIC


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

// 2D 2nd-order Voronoi: Obviously, this is just a rehash of IQ's original. I've tidied
// up those if-statements. Since there's less writing, it should go faster. That's how
// it works, right? :)
//
vec3 Voronoi(in vec2 p){

    // Square grid partitioning - ID and local coordinates.
    vec2 ip = floor(p), o; p -= ip + .5;

    vec3 d = vec3(1); // 1.4, etc. "d.z" holds the distance comparison value.

    float minD = 1.; // Minimum distance.
    vec2 id; // Cell ID.

    // Technically, we need a slightly wider search for the random spread we're
    // using, but I doubt anyone will notice.
    for(int y =-1; y<=1; y++){
        for(int x =-1; x<=1; x++){

            o = vec2(x, y);
            o += hash22(ip + o) - p;

            // You coulld sit here all day trying out different distance metrics.
            // metrics.
            //d.z = dot(o, o);
            // More distance metrics.
            //o = vec2(o.y - o.x, o.y + o.x)*.7071;
            //o = rot2(hash22(id + .15).x)*o; //rot2(iTime/8.)*o;//r
            o = abs(o);// + .125;
            //d.z = mix(max(abs(o.x)*.866025 - o.y*.5, (o.y)), dot(o, o), .15);//
            //d.z = max(o.x*.866025 + o.y*.5, o.y);
            //d.z = max(abs(o.x)-(o.y)*.5, abs(o.x)*.5 + (o.y));//
            //d.z = max(abs(o.x)*.866025 - o.y*.5, abs(o.y));
            //d.z = max(abs(o.y)*.866025 - o.x*.5, (o.x));
            //d.z = max(abs(o.x) + o.y*.5, -(o.y)*.8660254);
            //d.z = max(o.x, o.y);
            d.z = (o.x + o.y)*.7071;
            //d.z = max(max(o.x, o.y), (o.x + o.y)*.7071);

            if(d.z<minD){ minD = d.z; id = vec2(x, y) + ip; }

            d.y = max(d.x, min(d.y, d.z));
            d.x = min(d.x, d.z);

        }
    }

    // 2nd order distance (or F2, as some called it), which is the differnce
    // between the 2nd closest site point and the closest one.
    float r = (d.y - d.x); // 1. - d.x, 1. - d.y, etc.


    gV = r;

    return vec3(r, id);

}


// Voronoi ID.
vec2 gVID;

// The height map values. In this case, it's just a Voronoi variation. By the way,
// I could optimize this a lot further.
//float heightMap(vec3 p){
float heightMap(vec2 uv, vec3 p){


//    // Voronoi. Distance and cell ID.
//    vec3 v3 = Voronoi(p.xy*4.); // Range: [0, 1]
    vec3 v3 = Voronoi(p.xy*8.); // Range: [0, 1]

    vec2 pp = p.xy;
//    pp *= 0.25;

    float aspect = iResolution.x / iResolution.y;
    vec2 uv2 = vec2(pp.x * 0.5 + 0.5, pp.y * aspect * 0.5 + 0.5);


    // Vector holds the rounded edge value, straight edge value,
//    vec3 v3 = texture(uVoroEdgeBufferTexture, uv).rgb;
//    vec3 v3 = texture(uVoroEdgeBufferTexture, uv2).rgb;

    float v = v3.x;
//    float v = v3.y;
    gVID = v3.yz;


    // This hash runs between -.5 and .5
    //float v2 = smoothstep(.0, .0, (-r*.5 + hash22(v3.yz + .1).x));
    //
    // Adding fine lines.
    float v2 = smoothstep(.0, .0, (hash22(v3.yz + .1).x + .25));
    //float ln = abs(fract(v*4.) - .5)*4. - 1.;
    //v = clamp(v + v2*smoothstep(0., .0, -ln*.3), 0., 1.);
    v += v2*smoothstep(0., .1, -sin(v*TAU*4.))*.3;

    // Flatening the tops and hashed based inversion, or whatever...
    // I made it all up. :)
//    v = clamp(v + .05, 0., .55);

//    v = mix(v, 1. - v, step(0., hash21(v3.yz + .22)));
//    v = mix(v, 1. - v, step(0., hash21(vec2(.22))));
//    v = mix(v, 1. - v, 1.);

//    v = mix(v, 1. - v, step(0., v - .1));

    return v;
}

// Back plane height map.
float m(vec3 p){

    //    vec2 uv = p.xy * 0.5 + 0.5;
    float aspect = iResolution.x / iResolution.y;
    vec2 uv = vec2(p.x * 0.5 + 0.5, p.y * aspect * 0.5 + 0.5);

    // Voronoi heightmap.
    float h = heightMap(uv, p);

    // A sprinkling of noise.
//    vec3 tx = texture(iChannel1, p.xy*2.).xyz; //tx *= tx;
    vec3 tx = texture(iChannel1, uv).xyz; //tx *= tx;
    float gr = dot(tx, vec3(.299, .587, .114));
    //float gr = hash22(floor(p.xy*32.)/32.).x;
    h *= (1. + gr*.01);

    // Adding the height map to the back plane.
//    return -p.z - (h - .5)*.05;
    return -p.z - (h - .5)*.25;
//    return -p.z - (h - .5)*.5;

}

// Standard normal function. It's not as fast as the tetrahedral calculation,
// but more symmetrical.
vec3 nr(in vec3 p) {

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
        mp.x += m(p + sgn*e)*sgn;
        sgn = -sgn;
        if((i&1)==1){ mp = mp.yzx; e = e.zxy; }
    }

    return normalize(mp);
}

/*
// Cheap shadows are hard. In fact, I'd almost say, shadowing particular scenes with
// limited iterations is impossible... However, I'd be very grateful if someone could
// prove me wrong. :)
float softShadow(vec3 ro, vec3 rd, float lDist, float k){

    // More would be nicer. More is always nicer, but not always affordable. :)
    const int iters = 48;

    float shade = 1.;
    float t = 0.;


    // Max shadow iterations - More iterations make nicer shadows, but slow things down.
    // Obviously, the lowest number to give a decent shadow is the best one to choose.
    for (int i = min(iFrame, 0); i<iters; i++){

        float d = m(ro + rd*t);

        shade = min(shade, k*d/t);
        //shade = min(shade, smoothstep(0., 1., k*h/dist)); // Thanks to IQ for this tidbit.
        // So many options here, and none are perfect: dist += min(h, .2),
        // dist += clamp(h, .01, stepDist), etc.
        t += clamp(d*.8, .01, .25);


        // Early exits from accumulative distance function calls tend to be a good thing.
        if (d<0. || t>lDist) break;
    }

    // Shadow.
    return max(shade, 0.);
}
*/

// I keep a collection of occlusion routines... OK, that sounded really nerdy. :)
// Anyway, I like this one. I'm assuming it's based on IQ's original.
float cAO(in vec3 p, in vec3 n)
{
    float sca = 3., occ = 0.;
    for(int i = 0; i<5; i++){

        float hr = .01 + float(i)*.25/4.;
        float dd = m(n * hr + p);
        occ += (hr - dd)*sca;
        sca *= .75;
    }
    return clamp(1. - occ, 0., 1.);
}


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
float curve(in vec3 p, in float spr, in float amp, in float offs){

    float d = m(p);

    spr /= 450.;

    #if 0
    // Tetrahedral.
    vec2 e = vec2(-spr, spr); // Example: ef = .25;
    float d1 = m(p + e.yxx), d2 = m(p + e.xxy);
    float d3 = m(p + e.xyx), d4 = m(p + e.yyy);
    return clamp((d1 + d2 + d3 + d4 - d*4.)/e.y/2.*amp + offs + .5, 0., 1.);
    #else
    // Cubic.
    vec2 e = vec2(spr, 0); // Example: ef = .5;
    float d1 = m(p + e.xyy), d2 = m(p - e.xyy);
    float d3 = m(p + e.yxy), d4 = m(p - e.yxy);
    float d5 = m(p + e.yyx), d6 = m(p - e.yyx);

    #if 1
    //return clamp((d1 + d2 + d3 + d4 + d5 + d6 - d*6.)/e.x*amp + offs + .05, -.1, .1)/.1;
    return smoothstep(-.05, .05, (d1 + d2 + d3 + d4 + d5 + d6 - d*6.)/e.x/2.*amp + offs);

    #else
    d *= 2.;
    return 1. - smoothstep(-.05, .05, (abs(d1 + d2 - d) + abs(d3 + d4 - d) +
    abs(d5 + d6 - d))/e.x/2.*amp + offs + .0);
    #endif

    #endif

}

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

void main(){

    // Coordinates.
    vec2 u = (gl_FragCoord.xy - iResolution.xy*.5)/iResolution.y;
//    vec2 u = (gl_FragCoord.xy*2.0-iResolution.xy) / iResolution.y;
//    vec2 u = vUv;


    // Time for the "Common" tab.
    tm = iTime;

    //u *= rot2(TAU/24.);

    // Screen bulge.
    //u *= 1. + dot(u, u)*.08;
//    u *= 1. + dot(u, u)*5.58;

    // Unit direction ray, camera origin and light position.
    vec3 r = normalize(vec3(u, 1));
//    vec3 o = vec3(iTime/8., iTime/16., -1);
    vec3 o = vec3(0., 0., -1);
    vec3 l = vec3(.5, 0, 0);

    // Rotate the unit direction ray, and light to match.
//    r.yz *= rot2(.2);
//    r.xz *= rot2(-.2);
//    l.yz *= rot2(.2);
//    l.xz *= rot2(-.2);
    l += o; // Moving the light with the camera.


    // Standard raymarching routine. Raymarching a slightly perturbed back plane front-on
    // doesn't usually require many iterations. Unless you rely on your GPU for warmth,
    // this is a good thing. :)
    float d, t = 0.;

    for(int i=0; i<80;i++){

        d = m(o + r*t);
        // There isn't really a far plane to go beyond, but it's there anyway.
        if(abs(d)<.001 || t>FAR) break;
//        t += d*.7;
        t += d*.07;

    }

    t = min(t, FAR);

    //int svID = id; // Object ID. Unused.
    // Voronoi cell ID.
    vec2 vID = gVID;

    // Set the initial scene color to black.
    vec4 c = vec4(0);

    // If the ray hits something in the scene, light it up.
    if(t<FAR){

        // Position and normal.
        vec3 p = o + r*t, n = nr(p);

        l -= p; // Light to surface vector. Ie: Light direction vector.
        float lDist = max(length(l), .001); // Light to surface distance.
        l /= lDist; // Normalizing the light direction vector.


        // The shadows barely make an impact here, so we may as well
        // save some cycles.
        float sh = 1.;//softShadow(p + n*.0015, l, lDist, 16.);

        // Scene curvature.
        //float spr = 2., amp = 1., offs = .0;
        float spr = 2., amp = 1., offs = .0;
        float crv = curve(p, spr, amp, offs);







        // Obtain the height map (destorted Voronoi) value, and use it to slightly
        // shade the surface. Gives a more shadowy appearance.
//        float hm = heightMap(p);

        float aspect = iResolution.x / iResolution.y;
        vec2 uv = vec2(p.x * 0.5 + 0.5, p.y * aspect * 0.5 + 0.5);

        float hm = heightMap(uv, p);


        // Surface object coloring.

        // Voronoi cell coloring. Subtle for this example, but it's there.
        vec3 cCol = .5 + .45*cos(TAU*hash21(vID + .2)/4. + vec3(0, 1, 2) - .2);


        // Texture.
//        vec3 tx = tex3D(iChannel0, (p), n);
        vec3 tx = tex3D(iChannel0, vec3(uv, p.z), n);
        vec3 oCol = tx;



        oCol = mix(oCol, mix(oCol, oCol*cCol*2., .5), step(0., hm - .55));

        //oCol = vec3(1)*dot(oCol, vec3(.299, .587, .114));


        // Backfill light.
        float backFill = max(dot(vec3(-l.xy, 0.), n), 0.);
        float ns0 = n3D(p*3. + iTime/4.);
        ns0 = smoothstep(-.25, .25, ns0 - .5);
        #if COLOR == 0
        oCol += oCol*mix(vec3(.15, .3, 1), vec3(.25, .2, 1), ns0)*backFill*64.*sh;
        // Faux Fresnel edge glow.
        float fres = pow(max(1. - max(dot(-r, n), 0.), 0.), 4.);
        oCol += oCol*vec3(0, .7, 1)*fres*5.;
        #else
        oCol += oCol*mix(vec3(1, .05, .0), vec3(1, .1, .2), ns0*.5)*backFill*64.*sh;
        // Faux Fresnel edge glow.
        float fres = pow(max(1. - max(dot(-r, n), 0.), 0.), 3.);
        oCol += oCol*vec3(0, .3, 1)*fres*12.;
        #endif


        /*
         // Adding the faux electronic sparks. I kind of made this up as I went along.
         // It requires more effort, but it'll do.
         vec3 sparkCol = vec3(0);
         vec3 f3;
         // Three chromatic light passes.
         for(int i = 0; i<3; i++){

             // Chromatic offset positions.
             vec2 offs = vec2(4.*float(i - 1)/450., 0);
             vec2 q = p.xy - offs;

             // Original Voronoi value.
             vec3 v3 = Voronoi(q *4.);
             float oV = gV;

             // Two animated Voronoi distances.
             float n3 = VoronoiA(rot2(.25)*q*12. + .5 + vec2(-iTime/4., -iTime/3.)*.5).x;
             float n4 = VoronoiA(rot2(-.25)*q*12. + .25 + vec2(-iTime/5., -iTime/4.)*1.).x;
             // Max blending the above outlines to create electron pulses.
             float f = max(smoothstep(0., .15, abs(n4) - .05),
                           smoothstep(0., .15, abs(n3) - .05));
             // Doing the same with a thin strip mask of the original layer to
             // make the electrons pulse through the crevices.
             f = max(f, smoothstep(0., .05, abs(v3.x) - .05));

             // Last minute coloring.
             float ns = n3D(vec3(q, p.z)*2. + iTime/4.);
             // Add to one of the three channels.
             vec3 iCol = mix(cCol, cCol.zyx, smoothstep(-.125, .125, ns - .5));

             sparkCol[i] = iCol[i]; // Color.
             f3[i] = f; // Mask.

         }

         // Applying the electrons.
         oCol = mix(oCol*3. + sparkCol*6., oCol, f3);
 */

        /*

       // Specular reflections.
       vec3 hv = normalize(-r + l);
       vec3 ref = reflect(r, n);
       // Hacky environmental mapping... I should put more effort into this. :)
       vec3 tx2 = eMap(ref, n);
       float specR = pow(max(dot(hv, n), 0.), 8.);
       oCol += specR*tx2*2.;
       */

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



        // Apply the curvature based lines.
        //c.xyz *= crv*1. + .35;
        c.xyz *= 1. - abs(crv - .5)*2.*.8;



        // AO - The effect is probably too subtle, but I'm using it anyway.
        c.xyz *= cAO(p, n);


    }


    // Save to the backbuffer.
    c = vec4(max(c.xyz, 0.), t);


    fragColor = vec4(pow(c.xyz, vec3(1./2.2)), 1);

//    fragColor = c;
}