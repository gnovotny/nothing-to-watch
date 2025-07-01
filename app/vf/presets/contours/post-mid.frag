#version 300 es

precision highp float;
precision highp int;

uniform sampler2D uMainOutputTexture;
uniform sampler2D uVoroEdgeBufferTexture;
uniform sampler2D iChannel0;

uniform vec3 iResolution;
uniform float iTime;
uniform float fAlphaStrength;
uniform float fEdgeStrength;
uniform vec3 fBaseColor;

//in vec2 u;
in vec2 vUv;
out vec4 fragColor;

// Scene object ID, and individual cell IDs. Used for coloring.
float objID; // The rounded web lattice, or the individual Voronoi cells.
//vec2 cellID; // Individual Voronoi cell IDs.


// Standard 2D rotation formula.
mat2 r2(in float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

// The bump function. Used for bump mapping, coloring and shading.
float bumpFunc(vec2 p){

    // Vector holds the rounded edge value, straight edge value,
    vec3 v = texture(uVoroEdgeBufferTexture, vec2(p.x, p.y)).rgb;

//    v.x *= 0.75;
//    v.y *= 0.75;

    float c = v.x; // Rounded edge value.

    float scaleMod = v.z;
    scaleMod = clamp(scaleMod, 0.05, 0.5);
//    scaleMod *= 20.;
    scaleMod *= 10.;

//    float ew = .05; // Border threshold value. Bigger numbers mean thicker borders.
//    float ew = .07; // Border threshold value. Bigger numbers mean thicker borders.
//    float ew = .07*v.z; // Border threshold value. Bigger numbers mean thicker borders.
//    ew *= fEdgeStrength;

    float EDGE_1 = .007;
    float EDGE_2 = .001;

//    float edge1 = EDGE_1*scaleMod;
//    float edge2 = EDGE_2*scaleMod*10.;
    float edge1 = EDGE_1;
    float edge2 = EDGE_2*10.;

//    objID = smoothstep(edge1, edge2, v.x);
//    objID = smoothstep(edge1*v.z, edge2*v.z*5., v.x);
//    objID = mix(0.,1.,smoothstep(edge1, edge2, v.x));
    objID = mix(1.,0.,smoothstep(edge1, edge2, v.x));

//if(objID == 1.){
//    discard;
//}

    // If the Voronoi value is under the threshold, produce a web like contoured border.
//    if(c<ew){
//    if(c<EDGE_1){
//    if(c<edge1){
    if(objID > 0.5){

//        c = mix(v.x,  v.y, .75);

//        objID = 1.; // Voronoi web border ID.

        c = abs(c - edge1)/edge1; // Normalize the domain to a range of zero to one.
//        c = (objID-0.5)*2.; // Normalize the domain to a range of zero to one.

        // Add the contoured pattern to the web border.
        c = smoothstep(0., .25, c)/4. + clamp(-cos(c*6.283*1.5) - .5, 0., 1.);

    }
    else { // Over the threshold? Use the regular Voronoi cell value.

//        objID = 0.;
        c = mix(v.x,  v.y, .75); // A mixture of rounded and straight edge values.
        c = (c - edge1)/(1. - edge1); // Normalize the domain to a range of zero to one.
        c = clamp(c + cos(c*6.283*24.)*.002, 0., 1.); // Add some ridges.
    }

    return c; // Return the object (bordered Voronoi) value.

}


void main(){
    vec4 baseCol = texture(uMainOutputTexture, vUv);
    if (fAlphaStrength <= 0. || fEdgeStrength <= 0.) {
        fragColor = baseCol;
        return;
    }

    vec2 fragCoord = gl_FragCoord.xy;
    //SETUP.
    //
    // Aspect correct screen coordinates.
//    vec2 uv = (fragCoord - iResolution.xy*.5)/min(iResolution.y, 800.);
    vec2 uv = vUv;

    // Very subtle screen warping, for that bulbous fish-eye look.
//    vec2 aspect = vec2(iResolution.y/iResolution.x, 1);
//    uv *= 1. + dot(uv*aspect, uv*aspect)*.05;

    // Unit direction ray.
    vec3 r = normalize(vec3(uv.xy, 1.));

    // Scaling and movement.
//    vec2 p = uv*3.5 + vec2(0, iTime*.5);
    vec2 p = uv;

    // The webbed Voronoi value.
    float c = bumpFunc(p);

    // Saving the ID.
    float svObjID = objID;

    // 3D screen hit point. Just a flat plane at the zero point on the Z-axix.
    vec3 sp = vec3(p, 0.);

    // Two lights, set back from the plane, and rotating about the XY plane on
    // opposite sides of an ellipse, or something to that effect.
    vec3 lp = sp + vec3(-1.3*sin(iTime/2.), .8*cos(iTime/2.), -.5);
    vec3 lp2 = sp + vec3(1.3*sin(iTime/2.), -.8*cos(iTime/2.), -.5);

    // Fake hit-point height value. Normally, you'd cast a ray to the hit point, but 
    // since it's a simple bump mapped example, we're estimating it.
    sp.z -= c*.1;


    // BUMP MAPPING AND EDGING. Pretty standard stuff. 
    //
    vec2 e = vec2(8./iResolution.y, 0); // Sample spred.
    float bf = .4; // Bump factor.

    // If we hit the webbing section, reduce the sample spread. It's a bit of fake
    // trickery to reduce artifacts on the webbing portion.
    if (svObjID>.5) { e.x = 2./iResolution.y; }

    float fx = (bumpFunc(p - e) - bumpFunc(p + e)); // Nearby horizontal samples.
    float fy = (bumpFunc(p - e.yx) - bumpFunc(p + e.yx)); // Nearby vertical samples.
    vec3 n = normalize(vec3(fx, fy, -e.x/bf)); // Bumped normal.

    float edge = abs(c*2. - fx) + abs(c*2. - fy); // Edge value.


    // TEXTURE AND COLORING.
    //
    // Texture sample with fake height information added.
//    vec3 tx = texture(iChannel0, (p + n.xy*.125)*.25).xyz;
//    vec3 tx = texture(iChannel0, (p + n.xy*.125)).xyz;
//    tx *= tx; // sRGB to linear.

//    vec3 tx = vec3(0.2);
//    vec3 tx = vec3(1.);

//    tx = smoothstep(0., .5, tx); // Accentuating the color a bit.

    // Object color. Initialize to the texture value.
//    vec3 oCol = tx *.025;
//    vec3 oCol = tx *.05;
//    vec3 oCol = tx *fBaseColor;
//    vec3 oCol = tx *.15;
//    vec3 oCol = tx *.9;

    vec3 oCol = fBaseColor;

    bool isWeb = svObjID>.5;

    oCol = mix(baseCol.rgb, oCol, svObjID);

//    if(isWeb) { // The webbing portion.
//
////        oCol *= vec3(1.2, .8, .4); // Uncomment for gold webbing.
////        oCol *= vec3(1.4, 1, .7);
//        oCol *= .025;
////        oCol *= .9;
////        oCol = vec3(1.,0.,0.);
//
//    }
//    else { // The cell portion. Do what you want here.
//
////        oCol = vec3(1.,0.,0.);
//        oCol = baseCol.rgb;
////        // Uncomment for colored cells, etc.
////        #if CELL_COLOR == 1
////        oCol *= vec3(1.4, 1, .7);
////        #elif CELL_COLOR == 2
////        oCol *= vec3(.9, 1.1, 1.3);
////        #else
////        oCol *= vec3(1.1, 1.4, .7);
////        #endif
//
//    }


    //oCol *= vec3(1.2, 1, .84); // Warmer coloring.
    //oCol *= vec3(.9, 1.1, 1.3); // Cooler coloring.


    // LIGHTING.
    //
    float lDist = length(lp - sp); // Light distance one.
    float atten = 1./(1. + lDist*lDist*.5); // Light one attenuation.
    vec3 l = (lp - sp)/max(lDist, .001); // Light one direction (normalized).
    float diff = max(max(dot(l, n), 0.), 0.); // Diffuse value one.
    float spec = pow(max(dot(reflect(l, n), r), 0.), 64.); // Specular value one.


    float lDist2 = length(lp2 - sp); // Light distance two.
    float atten2 = 1./(1. + lDist2*lDist2*.5); // Light two attenuation.
    vec3 l2 = (lp2 - sp)/max(lDist2, .001); // Light two direction (normalized).
    float diff2 = max(max(dot(l2, n), 0.), 0.); // Diffuse value two.
    float spec2 = pow(max(dot(reflect(l2, n), r), 0.), 64.); // Specular value twp.


    // Ramping up the power and increasing the intensity of the diffuse values to 
    // give more of a metallic look.
    diff = pow(diff, 4.)*2.;
    diff2 = pow(diff2, 4.)*2.;


    // Combining the texture and lighting information above.

    vec3 col = oCol;

//    if (isWeb) {
        // Light one.
        vec3 webCol = col;
    webCol *= (diff*vec3(.5, .7, 1) + .25 + vec3(.25, .5, 1)*spec*32.)*atten*.5;

        // Adding light two.
    webCol += oCol*(diff2*vec3(1, .7, .5) + .25 + vec3(1, .3, .1)*spec2*32.)*atten2*.5;

        // Apply the edging. This provides fake AO, depth information, etc. Comment it out, and
        // the example becomes very 2-dimensional.
    webCol *= edge;

    col = mix(col, sqrt(max(webCol, 0.)), svObjID);
//    }


    // POSTPROCESSING, SCREEN PRESENTATION, ETC.
    //
    //col *= vec3(1.5, 1., .6); // Warmer coloring.
    //col *= vec3(.9, 1.2, 1.4); // Cooler coloring.

    // Subtle vignette.
//    vec2 u = fragCoord/iResolution.xy;
//    col *= pow(16.*u.x*u.y*(1. - u.x)*(1. - u.y) , .125);
    // Colored variation.
    //col = mix(pow(min(vec3(1.5, 1, 1)*col, 1.), vec3(1, 3, 16)), col,
    //pow(16.*u.x*u.y*(1. - u.x)*(1. - u.y) , .125)*.75 + .25);

    // Rough gamma correction.
//    if (isWeb) {
//        col = sqrt(max(col, 0.));
//    }
    fragColor = mix(baseCol, vec4(col, 1), fAlphaStrength);
//    fragColor = vec4(vec3(objID), 1.);

}