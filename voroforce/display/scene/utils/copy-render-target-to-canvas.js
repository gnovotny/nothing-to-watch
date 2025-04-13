export const copyRenderTargetToCanvas = (gl, rt, canvas) => {
  gl.bindFramebuffer(gl.READ_FRAMEBUFFER, rt.buffer)

  if (rt.textures.length > 1) {
    gl.readBuffer(gl.COLOR_ATTACHMENT0 + (rt.output?.index ?? 0))
  }

  gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null) // This binds the canvas as the draw framebuffer

  // Specify the area to copy
  gl.blitFramebuffer(
    0,
    0,
    rt.width,
    rt.height, // Source rectangle (the off-screen buffer)
    0,
    0,
    canvas.width,
    canvas.height, // Destination rectangle (the canvas)
    gl.COLOR_BUFFER_BIT, // Mask (copy only color data)
    gl.NEAREST, // Filtering (use NEAREST for pixel-perfect or LINEAR for smooth)
  )

  gl.readBuffer(gl.COLOR_ATTACHMENT0)
}
