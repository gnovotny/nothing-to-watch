attribute vec2 position;
uniform vec3 iResolution; // Size of the viewport in pixels

vec2 ndc(vec2 screenPos) {
    return vec2(
        (screenPos.x / iResolution.x) * 2.0 - 1.0,
        (screenPos.y / iResolution.y) * -2.0 + 1.0
    );
}

void main() {
    gl_Position = vec4(ndc(position), 0.0, 1.0);
    gl_PointSize = 5.0; // Set the point size if drawing points
}
