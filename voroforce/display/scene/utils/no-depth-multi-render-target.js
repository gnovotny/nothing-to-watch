import { Texture } from 'ogl'

export class NoDepthMultiRenderTarget {
  constructor(
    gl,
    {
      // width = gl.canvas.clientWidth,
      // height = gl.canvas.clientHeight,
      width = gl.canvas.width,
      height = gl.canvas.height,
      target = gl.FRAMEBUFFER,
      attachments = [{}],
    } = {},
  ) {
    this.gl = gl
    this.width = width
    this.height = height
    this.buffer = this.gl.createFramebuffer()
    this.target = target
    this.gl.renderer.bindFramebuffer(this)

    this.textures = []
    this.attachments = []
    const drawBuffers = []

    // create and attach required num of color textures
    for (let i = 0; i < attachments.length; i++) {
      const attachment = { ...attachments[i] }
      attachment.index = i
      this.attachments.push(attachment)
      this[attachment.name] = attachment

      const {
        wrapS = gl.CLAMP_TO_EDGE,
        wrapT = gl.CLAMP_TO_EDGE,
        minFilter = gl.LINEAR,
        magFilter = minFilter,
        type = gl.UNSIGNED_BYTE,
        format = gl.RGBA,
        internalFormat = format,
        unpackAlignment,
        premultiplyAlpha,
      } = attachment.textureOptions ?? {}

      const texture = new Texture(gl, {
        width,
        height,
        wrapS,
        wrapT,
        minFilter,
        magFilter,
        type,
        format,
        internalFormat,
        unpackAlignment,
        premultiplyAlpha,
        flipY: false,
        generateMipmaps: false,
      })
      this.textures.push(texture)
      attachment.texture = texture
      texture.update()
      this.gl.framebufferTexture2D(
        this.target,
        this.gl.COLOR_ATTACHMENT0 + i,
        this.gl.TEXTURE_2D,
        texture.texture,
        0 /* level */,
      )
      drawBuffers.push(this.gl.COLOR_ATTACHMENT0 + i)
    }

    // For multi-render targets shader access
    if (drawBuffers.length > 1) this.gl.renderer.drawBuffers(drawBuffers)

    this.gl.renderer.bindFramebuffer({ target: this.target })
  }

  setSize(width, height) {
    if (this.width === width && this.height === height) return

    this.width = width
    this.height = height
    this.gl.renderer.bindFramebuffer(this)

    for (let i = 0; i < this.textures.length; i++) {
      const texture = this.textures[i]
      texture.width = width
      texture.height = height
      texture.needsUpdate = true
      texture.update()
      this.gl.framebufferTexture2D(
        this.target,
        this.gl.COLOR_ATTACHMENT0 + i,
        this.gl.TEXTURE_2D,
        texture.texture,
        0 /* level */,
      )
    }

    this.gl.renderer.bindFramebuffer({ target: this.target })
  }
}
