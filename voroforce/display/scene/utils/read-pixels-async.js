const clientWaitAsync = (gl, sync, flags = 0, interval_ms = 10) => {
  return new Promise((resolve, reject) => {
    const check = () => {
      const res = gl.clientWaitSync(sync, flags, 0)
      if (res === gl.WAIT_FAILED) {
        reject()
        return
      }
      if (res === gl.TIMEOUT_EXPIRED) {
        setTimeout(check, interval_ms)
        return
      }
      resolve()
    }
    check()
  })
}

export const readPixelsAsync = (
  gl,
  x,
  y,
  width,
  height,
  buffer,
  format = gl.RGBA,
  type = gl.UNSIGNED_BYTE,
) => {
  const bufpak = gl.createBuffer()
  gl.bindBuffer(gl.PIXEL_PACK_BUFFER, bufpak)
  gl.bufferData(gl.PIXEL_PACK_BUFFER, buffer.byteLength, gl.STREAM_READ)
  gl.readPixels(x, y, width, height, format, type, 0)
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0)
  if (!sync) return null
  gl.flush()
  return clientWaitAsync(gl, sync, 0, 10).then(() => {
    gl.deleteSync(sync)
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, bufpak)
    gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, buffer)
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null)
    gl.deleteBuffer(bufpak)
    return buffer
  })
}
