import { Texture } from 'ogl'

export class DynamicMediaGridArrayTexture extends Texture {
  constructor(gl, args) {
    super(gl, {
      ...args,
      target: gl.TEXTURE_2D_ARRAY,

      // These are the key parameters for bilinear filtering
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,

      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,

      // If using mipmaps
      // generateMipmaps: true, // For some compressed formats
      // minFilter: gl.LINEAR_MIPMAP_LINEAR, // Trilinear filtering with mipmaps
    })

    const {
      realCols: cols,
      realRows: rows,
      tileWidth,
      tileHeight,
    } = args.mediaVersion
    this.cols = cols
    this.rows = rows
    this.layerCapacity = cols * rows
    this.tileWidth = tileWidth
    this.tileHeight = tileHeight

    // const maxLayers = gl.getParameter(gl.MAX_ARRAY_TEXTURE_LAYERS)
    // this.length = Math.min(
    //   Math.ceil(this.length / this.layerCapacity),
    //   maxLayers,
    // )
    // console.log('this.length', this.length)
    // console.log(`Maximum 2D texture array layers: ${maxLayers}`)

    this.length = 10

    this.bind()
    // Initialize the texture storage with aligned dimensions
    // gl.texStorage3D(
    //   gl.TEXTURE_2D_ARRAY,
    //   1, // (1 for no mipmaps)
    //   // this.internalFormat,
    //   gl.RGBA8,
    //   this.width,
    //   this.height,
    //   this.length, // (number of layers)
    // )

    // this.gl.texSubImage3D(
    //   this.gl.TEXTURE_2D_ARRAY,
    //   0,
    //   0,
    //   0,
    //   // index,
    //   trueIndex,
    //   this.tileWidth,
    //   this.tileHeight,
    //   1,
    //   this.format,
    //   this.type,
    //   bytes,
    // )

    // gl.texImage3D(
    //   this.gl.TEXTURE_2D_ARRAY,
    //   0,
    //   this.gl.RGBA, // internal format
    //   this.width, // width
    //   this.height, // height
    //   this.length, //1, this.length, // depth
    //   0, // border (must be 0)
    //   this.gl.RGBA, // format
    //   this.gl.UNSIGNED_BYTE, // type
    //   null, // data
    // )

    gl.texStorage3D(
      gl.TEXTURE_2D_ARRAY,
      1, // mipmap levels
      this.gl.RGBA8,
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
      // index++
      const tileIndex = index % this.layerCapacity
      const tileRow = Math.floor(tileIndex / this.cols)
      const tileCol = tileIndex % this.cols

      // console.log('tileIndex', tileIndex, tileRow, tileCol)
      const trueIndex = Math.floor(index / this.layerCapacity)
      // console.log('trueIndex', trueIndex)
      const virtualIndex = trueIndex % this.length
      // console.log(
      //   'virtualIndex',
      //   index,
      //   trueIndex,
      //   virtualIndex,
      //   tileCol,
      //   tileRow,
      // )
      // console.log('bytes', bytes)
      this.gl.texSubImage3D(
        this.gl.TEXTURE_2D_ARRAY,
        0,
        tileCol * this.tileWidth,
        tileRow * this.tileHeight,
        // index,
        // trueIndex,
        // 0,
        virtualIndex,
        this.tileWidth,
        this.tileHeight,
        1,
        this.format,
        this.type,
        bytes,
      )

      // this.gl.texSubImage3D(
      //     this.gl.TEXTURE_2D_ARRAY,
      //     0,
      //     0,
      //     0,
      //     index,
      //     this.globalConfig.media.width,
      //     this.globalConfig.media.height,
      //     1,
      //     this.gl.RGBA,
      //     this.gl.UNSIGNED_BYTE,
      //     media.image,
      // )
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
