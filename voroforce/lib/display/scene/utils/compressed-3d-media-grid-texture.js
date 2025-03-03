import { Texture } from 'ogl'

export class Compressed3dMediaGridTexture extends Texture {
  constructor(gl, args) {
    const ext = gl.getExtension('WEBGL_compressed_texture_s3tc')
    if (!ext) {
      // Extension not supported
      console.error('S3TC texture compression not supported')
    }
    super(gl, {
      ...args,
      target: gl.TEXTURE_2D_ARRAY,
      internalFormat: ext.COMPRESSED_RGB_S3TC_DXT1_EXT,
    })

    this.compressedTexExt = ext

    this.bind()

    // Initialize the texture storage with aligned dimensions
    gl.texStorage3D(
      gl.TEXTURE_2D_ARRAY,
      1, // mipmap levels
      ext.COMPRESSED_RGB_S3TC_DXT1_EXT,
      this.width,
      this.height,
      this.length, // (number of layers)
    )
  }

  bind() {
    // Already bound to active texture unit
    if (this.glState.textureUnits[this.glState.activeTextureUnit] === this.id)
      return
    this.gl.bindTexture(this.target, this.texture)
    this.glState.textureUnits[this.glState.activeTextureUnit] = this.id
  }

  pendingLayerUpdates = []

  update(textureUnit = 0) {
    // Make sure that texture is bound to its texture unit
    if (
      this.pendingLayerUpdates.length > 0 ||
      this.glState.textureUnits[textureUnit] !== this.id
    ) {
      // set active texture unit to perform texture functions
      this.gl.renderer.activeTexture(textureUnit)
      this.bind()
    }

    this.pendingLayerUpdates.forEach(({ index, bytes }) => {
      this.gl.compressedTexSubImage3D(
        this.gl.TEXTURE_2D_ARRAY,
        0,
        0,
        0,
        index,
        this.width,
        this.height,
        1,
        // media.internalFormat,
        this.compressedTexExt.COMPRESSED_RGB_S3TC_DXT1_EXT,
        bytes,
      )
    })

    this.pendingLayerUpdates = []
  }

  prepareLayerUpdate(index, bytes) {
    this.pendingLayerUpdates.push({
      index,
      bytes,
    })
  }
}
