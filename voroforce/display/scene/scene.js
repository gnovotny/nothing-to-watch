import { Texture } from 'ogl'
import BaseScene from './base-scene'
import swap from './utils/swap'

export default class Scene extends BaseScene {
  initCustom() {
    super.initCustom()

    this.initRenderTargets(2, {
      attachments: [
        {
          name: 'voroIndexBuffer',
          textureOptions: {
            format: this.gl.RGBA,
            internalFormat: this.gl.RGBA32F,
            type: this.gl.FLOAT,
            minFilter: this.gl.NEAREST,
          },
        },
        {
          name: 'output',
        },
        ...(this.config.post?.enabled
          ? [
              {
                name: 'voroEdgeBuffer',
                textureOptions: {
                  format: this.gl.RGBA,
                  internalFormat: this.gl.RGBA32F,
                  type: this.gl.FLOAT,
                  // minFilter: this.gl.NEAREST,
                },
              },
            ]
          : []),
      ],
    })
    this.inactiveRenderTarget = this.renderTargets[1]
  }

  initCustomDataTextures() {
    this.initCellCoordsTexture()
    this.initCellNeighborsTexture()
    this.initCellWeightsTexture()
    this.initCellMediaVersionsTexture()
    this.initCellIdsTexture()
  }

  beforeUpdateCustom() {
    this.cellCoordsTexture.needsUpdate = true
    this.cellWeightsTexture.needsUpdate = true
    this.cellMediaVersionsTexture.needsUpdate = true
  }

  afterUpdateCustom() {
    if (!this.config.main?.enabled) return

    this.swapRenderTargets()

    this.mainCustomUniforms.uVoroIndexBufferTexture.value =
      this.inactiveRenderTarget.voroIndexBuffer.texture // output to input

    if (this.config.post?.enabled) {
      this.postCustomUniforms.uMainOutputTexture.value =
        this.inactiveRenderTarget.output.texture

      this.postCustomUniforms.uVoroEdgeBufferTexture.value =
        this.inactiveRenderTarget.voroEdgeBuffer.texture
    }
  }

  swapRenderTargets() {
    swap(this.renderTargets)
    this.activeRenderTarget = this.renderTargets[0]
    this.inactiveRenderTarget = this.renderTargets[1]
  }

  refreshCustom() {
    this.cellNeighborsTexture.needsUpdate = true
  }

  initMainCustomUniforms() {
    this.mainCustomUniforms = {
      uCellCoordsTexture: {
        value: this.cellCoordsTexture,
      },
      uCellNeighborsTexture: {
        value: this.cellNeighborsTexture,
      },
      uCellWeightsTexture: {
        value: this.cellWeightsTexture,
      },
      uCellMediaVersionsTexture: {
        value: this.cellMediaVersionsTexture,
      },
      uCellIdMapTexture: {
        value: this.cellIdsTexture,
      },
      uVoroIndexBufferTexture: {
        value: this.inactiveRenderTarget.voroIndexBuffer.texture,
      },
    }
    return {
      ...this.initCustomUniforms(),
      ...this.mainCustomUniforms,
    }
  }

  initPostCustomUniforms() {
    this.postCustomUniforms = {
      uVoroEdgeBufferTexture: {
        value: this.inactiveRenderTarget.voroEdgeBuffer.texture,
      },
      uMainOutputTexture: {
        value: this.inactiveRenderTarget.output.texture,
      },
    }
    return {
      ...this.initCustomUniforms(),
      ...this.postCustomUniforms,
    }
  }

  initCustomUniforms() {
    this.customUniforms = {}
    return this.customUniforms
  }

  initCellNeighborsTexture() {
    this.cellNeighborsTexture = new Texture(this.gl, {
      width: this.store.get('sharedCellNeighborsTextureWidth'),
      height: this.store.get('sharedCellNeighborsTextureHeight'),
      image: this.store.get('sharedCellNeighbors'),
      format: this.gl.RED_INTEGER,
      internalFormat: this.gl.R32UI,
      type: this.gl.UNSIGNED_INT,
      wrapS: this.gl.CLAMP_TO_EDGE,
      wrapT: this.gl.CLAMP_TO_EDGE,
      minFilter: this.gl.NEAREST,
      magFilter: this.gl.NEAREST,
      generateMipmaps: false,
      flipY: false,
    })
  }

  initCellWeightsTexture() {
    this.cellWeightsTexture = new Texture(this.gl, {
      width: this.store.get('sharedCellWeightsTextureWidth'),
      height: this.store.get('sharedCellWeightsTextureHeight'),
      image: this.store.get('sharedCellWeights'),
      format: this.gl.RED,
      internalFormat: this.gl.R32F,
      type: this.gl.FLOAT,
      // internalFormat: this.gl.R16F,
      // type: this.gl.HALF_FLOAT,
      wrapS: this.gl.CLAMP_TO_EDGE,
      wrapT: this.gl.CLAMP_TO_EDGE,
      minFilter: this.gl.NEAREST,
      magFilter: this.gl.NEAREST,
      generateMipmaps: false,
      flipY: false,
    })
  }

  initCellMediaVersionsTexture() {
    this.cellMediaVersionsTexture = new Texture(this.gl, {
      width: this.store.get('sharedCellMediaVersionsTextureWidth'),
      height: this.store.get('sharedCellMediaVersionsTextureHeight'),
      image: this.store.get('sharedCellMediaVersions'),
      format: this.gl.RG_INTEGER,
      internalFormat: this.gl.RG16UI,
      type: this.gl.UNSIGNED_SHORT,
      // type: this.gl.UNSIGNED_INT,
      wrapS: this.gl.CLAMP_TO_EDGE,
      wrapT: this.gl.CLAMP_TO_EDGE,
      minFilter: this.gl.NEAREST,
      magFilter: this.gl.NEAREST,
      generateMipmaps: false,
      flipY: false,
    })
  }

  initCellIdsTexture() {
    this.cellIdsTexture = new Texture(this.gl, {
      width: this.store.get('sharedCellIdsTextureWidth'),
      height: this.store.get('sharedCellIdsTextureHeight'),
      image: this.store.get('sharedCellIds'),
      format: this.gl.RED_INTEGER,
      internalFormat: this.gl.R32UI,
      type: this.gl.UNSIGNED_INT,
      wrapS: this.gl.CLAMP_TO_EDGE,
      wrapT: this.gl.CLAMP_TO_EDGE,
      minFilter: this.gl.NEAREST,
      magFilter: this.gl.NEAREST,
      generateMipmaps: false,
      flipY: false,
    })
  }
}
