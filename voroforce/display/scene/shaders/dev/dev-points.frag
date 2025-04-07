precision mediump float;
void main() {
    vec2 coord = gl_PointCoord  * 2.0 - 1.0;
    float dist = dot(coord, coord);
    if (dist > 1.0) {
        discard; // Discard fragments outside the circle
    }
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red color
}
