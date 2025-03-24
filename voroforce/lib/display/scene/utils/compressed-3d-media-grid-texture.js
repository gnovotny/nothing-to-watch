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

      // These are the key parameters for bilinear filtering
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,

      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,

      // If using mipmaps
      // generateMipmaps: true, // For some compressed formats
      // minFilter: gl.LINEAR_MIPMAP_LINEAR, // Trilinear filtering with mipmaps
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

      if (this.flipY !== this.glState.flipY) {
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.flipY)
        this.glState.flipY = this.flipY
      }

      if (this.premultiplyAlpha !== this.glState.premultiplyAlpha) {
        this.gl.pixelStorei(
          this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
          this.premultiplyAlpha,
        )
        this.glState.premultiplyAlpha = this.premultiplyAlpha
      }

      if (this.unpackAlignment !== this.glState.unpackAlignment) {
        this.gl.pixelStorei(this.gl.UNPACK_ALIGNMENT, this.unpackAlignment)
        this.glState.unpackAlignment = this.unpackAlignment
      }

      if (this.minFilter !== this.state.minFilter) {
        this.gl.texParameteri(
          this.target,
          this.gl.TEXTURE_MIN_FILTER,
          this.minFilter,
        )
        this.state.minFilter = this.minFilter
      }

      if (this.magFilter !== this.state.magFilter) {
        this.gl.texParameteri(
          this.target,
          this.gl.TEXTURE_MAG_FILTER,
          this.magFilter,
        )
        this.state.magFilter = this.magFilter
      }

      if (this.wrapS !== this.state.wrapS) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_S, this.wrapS)
        this.state.wrapS = this.wrapS
      }

      if (this.wrapT !== this.state.wrapT) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_T, this.wrapT)
        this.state.wrapT = this.wrapT
      }

      if (this.wrapR !== this.state.wrapR) {
        this.gl.texParameteri(this.target, this.gl.TEXTURE_WRAP_R, this.wrapR)
        this.state.wrapR = this.wrapR
      }

      if (this.anisotropy && this.anisotropy !== this.state.anisotropy) {
        this.gl.texParameterf(
          this.target,
          this.gl.renderer.getExtension('EXT_texture_filter_anisotropic')
            .TEXTURE_MAX_ANISOTROPY_EXT,
          this.anisotropy,
        )
        this.state.anisotropy = this.anisotropy
      }
    }

    if (this.generateMipmaps) {
      this.gl.generateMipmap(this.target)
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
