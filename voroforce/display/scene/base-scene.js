import { Geometry, Mesh, Program, Texture, Transform, Triangle } from 'ogl'
import devPointFragmentShader from './shaders/dev/dev-points.frag'
import devPointVertexShader from './shaders/dev/dev-points.vert'
import { CompressedMediaGridArrayTexture } from './utils/compressed-media-grid-array-texture'
import { copyRenderTargetToCanvas } from './utils/copy-render-target-to-canvas'
import { NoDepthMultiRenderTarget } from './utils/no-depth-multi-render-target'
import { DynamicMediaGridArrayTexture } from './utils/dynamic-media-grid-array-texture'
import { readPixelsAsync } from './utils/read-pixels-async'

export default class BaseScene {
  constructor(app) {
    this.init(app)
  }

  init(app) {
    this.initProperties(app)
    this.initCustom()
    this.initMedia()
    this.initMeshes()
  }

  initProperties(app) {
    this.app = app
    this.store = app.store
    this.ticker = this.store.get('ticker')
    this.globalConfig = this.store.get('config')
    this.appConfig = this.app.config
    this.config = this.appConfig.scene
    this.gl = this.app.renderer.gl
    this.loader = this.store.get('loader')
    this.cells = this.app.cells
    this.pointer = this.store.get('sharedPointer')
    this.sharedData = this.store.get('sharedData')
    this.numCells = this.cells.length
    this.dimensions = this.app.dimensions
    this.camera = this.app.controls?.camera
    this.instance = new Transform()
    this.refreshResolutionUniform(this.dimensions)
  }

  initCustom() {
    this.initCustomDataTextures()
  }

  initCustomDataTextures() {}

  initMeshes() {
    this.initMain()
    this.initPost()
    this.initDev()
  }

  update() {
    this.beforeUpdate()

    this.updateMedia()
    this.updateMain()
    this.updatePost()
    this.updateDev()

    this.afterUpdate()
  }

  beforeUpdate() {
    if (this.mainBaseUniforms) {
      const { rows, cols } = this.globalConfig.lattice

      this.mainBaseUniforms.iLatticeCols.value = cols
      this.mainBaseUniforms.iLatticeRows.value = rows
    }

    if (this.baseUniforms) {
      if (this.cells.focused)
        this.baseUniforms.iFocusedIndex.value = this.cells.focused.index

      this.baseUniforms.iTime.value = this.ticker.elapsed / 1000
      this.baseUniforms.fPointer.value = this.getPointer()
      this.baseUniforms.fForceCenter.value = this.getForceCenter()
    }

    this.beforeUpdateCustom()
  }
  afterUpdate() {
    this.afterUpdateCustom()
  }

  beforeUpdateCustom() {}
  afterUpdateCustom() {}

  resize(dimensions = this.dimensions) {
    this.refreshResolutionUniform(dimensions)
    this.resizeMain()
    this.resizePost()
    this.resizeDev()
    this.refreshCustom()
  }

  initMain() {
    if (!this.config.main?.enabled) return

    this.mainProgram = this.initProgram(
      this.config.main,
      this.initMainUniforms(),
    )

    this.mainMesh = new Mesh(this.gl, {
      geometry: this.initGeometry(this.config.main),
      program: this.mainProgram,
    })

    if (!this.renderTargets && !this.config.post?.enabled)
      this.mainMesh.setParent(this.instance)
  }

  initPost() {
    if (!this.config.post?.enabled) return

    this.postProgram = this.initProgram(
      this.config.post,
      this.initPostUniforms(),
    )

    this.postMesh = new Mesh(this.gl, {
      geometry: this.initGeometry(this.config.post),
      program: this.postProgram,
    })

    this.postMesh.setParent(this.instance)
  }

  initDev() {
    if (!this.config.dev?.enabled) return

    if (!this.devPointsMesh) {
      this.devPointsGeometry = new Geometry(this.gl, {
        position: {
          size: 2,
          data: this.store.get('sharedCellCoords'),
        },
      })

      this.devPointsProgram = new Program(this.gl, {
        vertex: devPointVertexShader,
        fragment: devPointFragmentShader,
        uniforms: {
          iResolution: { value: this.resolutionUniform },
        },
        transparent: true,
      })

      this.devPointsMesh = new Mesh(this.gl, {
        geometry: this.devPointsGeometry,
        program: this.devPointsProgram,
        mode: this.gl.POINTS,
      })
    }

    if (!this.renderTargets || this.config.post?.enabled)
      this.devPointsMesh.setParent(this.instance)
  }

  stopDev() {
    if (!this.devPointsMesh) return
    this.devPointsMesh.setParent(null)
  }

  resizeMain() {
    if (!this.config.main?.enabled) return

    this.mainProgram.uniforms.iResolution.value = this.resolutionUniform
    this.renderTargets?.forEach((target) =>
      target.setSize(this.app.canvas.width, this.app.canvas.height),
    )
  }

  resizePost() {
    if (!this.config.post?.enabled) return

    this.postProgram.uniforms.iResolution.value = this.resolutionUniform
  }

  resizeDev() {
    if (this.devPointsProgram) {
      this.devPointsProgram.uniforms.iResolution.value = this.resolutionUniform
    }
  }

  updateMain() {
    if (!this.config.main?.enabled) return

    if (this.activeRenderTarget) {
      this.app.renderer.instance.render({
        scene: this.mainMesh,
        camera: this.camera,
        target: this.activeRenderTarget,
      })

      if (!this.mainMesh.parent && !this.config.post?.enabled) {
        copyRenderTargetToCanvas(
          this.gl,
          this.activeRenderTarget,
          this.app.canvas,
        )
      }
    }
  }

  updatePost() {
    if (!this.config.post?.enabled) return
  }

  updateDev() {
    if (!this.config.dev?.enabled) return
    this.devPointsGeometry.attributes.position.needsUpdate = true

    if (this.activeRenderTarget && !this.config.post?.enabled) {
      this.app.renderer.instance.render({
        scene: this.devPointsMesh,
        camera: this.camera,
        target: this.activeRenderTarget,
        clear: false,
      })
    }
  }

  refreshCustom() {}

  initGeometry(config) {
    return new Triangle(this.gl, {
      depth: config.depth,
    })
  }

  initProgram(config, uniforms) {
    return new Program(this.gl, {
      vertex: config.vertexShader,
      fragment: config.fragmentShader,
      uniforms,
    })
  }

  initRenderTargets(count = 1, options = {}) {
    this.renderTargets = [...Array(count)].map(
      () => new NoDepthMultiRenderTarget(this.gl, options),
    )
    this.activeRenderTarget = this.renderTargets[0]
    return this.renderTargets
  }

  refreshResolutionUniform(dimensions = this.dimensions) {
    this.resolutionUniform = [
      dimensions.width,
      dimensions.height,
      this.appConfig.renderer?.pixelRatio ?? dimensions.pixelRatio,
    ]
  }

  getCompressedMediaVersions() {
    const compressedMediaVersions = this.globalConfig.media.versions.filter(
      ({ type }) => !type || type === 'compressed',
    )
    compressedMediaVersions.length = 3
    return compressedMediaVersions
  }

  getUnCompressedMediaVersions() {
    return this.globalConfig.media.versions.filter(
      ({ type }) => type && type !== 'compressed',
    )
  }

  initMedia() {
    if (!this.globalConfig.media?.enabled) {
      const emptyTex = new Texture(this.gl, {})
      this.compressedMediaTextures = this.getCompressedMediaVersions().map(
        () => emptyTex,
      )
      this.mediaTextures = this.globalConfig.media.versions
        .filter(({ type }) => type && type !== 'compressed')
        .map(() => emptyTex)

      return
    }

    this.compressedMediaTextures = this.getCompressedMediaVersions().map(
      (mediaVersion) => {
        if (!mediaVersion) return new Texture(this.gl, {})
        const { width, height, layers } = mediaVersion
        return new CompressedMediaGridArrayTexture(this.gl, {
          width,
          height,
          length: layers,
          compressionFormat: this.globalConfig.media.compressionFormat,
        })
      },
    )

    this.mediaTextures = this.getUnCompressedMediaVersions().map(
      (mediaVersion) => {
        const { width, height, layers } = mediaVersion
        return new DynamicMediaGridArrayTexture(this.gl, {
          width,
          height,
          length: layers,
          mediaVersion,
        })
      },
    )

    this.loader.addEventListener(
      'mediaLayerLoaded',
      ({ data: { versionIndex, layerIndex, bytes, type, compression } }) => {
        if (!type || type === 'compressed') {
          this.compressedMediaTextures[versionIndex].prepareLayerUpdate?.(
            layerIndex,
            bytes,
          )
        } else {
          // TODO
          this.mediaTextures[versionIndex - 3].prepareLayerUpdate(
            layerIndex,
            bytes,
          )
        }
      },
    )

    switch (this.globalConfig.media.preload) {
      case 'v0':
        this.loader.preloadAllMediaLayersVersion0()
        break
      case 'first':
        this.loader.preloadFirstMediaLayerAllGridVersions()
        break
    }
  }

  updateMedia() {
    if (!this.globalConfig.media?.enabled) return
  }

  initBaseMediaUniforms() {
    const compressedMediaVersions = this.getCompressedMediaVersions()
    return {
      bMediaEnabled: { value: this.globalConfig.media?.enabled ?? false },
      uMediaV0Texture: { value: this.compressedMediaTextures[0] },
      uMediaV1Texture: { value: this.compressedMediaTextures[1] },
      uMediaV2Texture: { value: this.compressedMediaTextures[2] },
      uMediaV3Texture: { value: this.mediaTextures[0] },
      iStdNumMediaVersionCols: {
        value: compressedMediaVersions?.map((v) => v?.cols ?? 0) ?? [0, 0, 0],
      },
      iStdNumMediaVersionRows: {
        value: compressedMediaVersions?.map((v) => v?.rows ?? 0) ?? [0, 0, 0],
      },
      iStdNumMediaVersionLayers: {
        value: compressedMediaVersions?.map((v) => v?.layers ?? 0) ?? [0, 0, 0],
      },
    }
  }

  getPointer() {
    return [
      this.pointer?.x ?? this.cells?.focused?.x ?? 0,
      this.pointer?.y ?? this.cells?.focused?.y ?? 0,
    ]
  }

  getForceCenter() {
    const centerX = this.sharedData?.forceCenterX ?? 0
    const centerY = this.sharedData?.forceCenterY ?? 0
    return [centerX, centerY]
  }

  initBaseUniforms() {
    if (!this.baseUniforms) {
      this.baseUniforms = {
        ...this.initBaseMediaUniforms(),
        iResolution: {
          value: this.resolutionUniform,
        },
        iFocusedIndex: { value: this.cells?.focused?.index ?? -1 },
        iNumCells: {
          value: this.cells.length,
        },
        iTime: { value: 0 },
        fPointer: { value: this.getPointer() },
        fForceCenter: { value: this.getForceCenter() },
      }
    }

    return this.baseUniforms
  }

  getConfigUniforms(config) {
    const uniforms = config.uniforms ?? {}
    Object.entries(uniforms).forEach(([k, v]) => {
      if (k.startsWith('iChannel')) {
        uniforms[k] = {
          value: new Texture(this.gl, {
            width: v.width,
            height: v.height,
          }),
        }
        const u = uniforms[k]
        this.loader.load(v.src, (image) => {
          u.value.image = image
        })
      }
    })

    // return kVsToUniforms(config.uniforms)
    return uniforms
  }

  initConfigUniforms() {
    if (!this.configUniforms)
      this.configUniforms = this.getConfigUniforms(this.config)

    return this.configUniforms
  }

  initMainBaseUniforms() {
    const { cellWidth, cellHeight, rows, cols } = this.globalConfig.lattice

    this.mainBaseUniforms = {
      fLatticeCellWidth: { value: cellWidth },
      fLatticeCellHeight: { value: cellHeight },
      iLatticeCols: { value: cols },
      iLatticeRows: { value: rows },
      bForceMaxQuality: { value: false },
      iForceMaxNeighborLevel: { value: 0 },
      fRoundnessMod: { value: 1 },
      fEdge1Mod: { value: 1 },
      fEdge0Mod: { value: 1 },
      fBaseColor: { value: [0, 0, 0] },
      bPostEnabled: { value: this.config.post?.enabled },
    }
    return {
      ...this.initBaseUniforms(),
      ...this.mainBaseUniforms,
    }
  }

  initMainCustomUniforms() {
    return {}
  }

  initMainConfigUniforms() {
    return {
      ...this.initConfigUniforms(),
      ...this.getConfigUniforms(this.config.main),
    }
  }

  initMainUniforms() {
    this.mainUniforms = {
      ...this.initMainBaseUniforms(),
      ...this.initMainCustomUniforms(),
      ...this.initMainConfigUniforms(),
    }
    return this.mainUniforms
  }

  initPostBaseUniforms() {
    return this.initBaseUniforms()
  }

  initPostCustomUniforms() {
    return {}
  }

  initPostConfigUniforms() {
    return {
      ...this.initConfigUniforms(),
      ...this.getConfigUniforms(this.config.post),
    }
  }

  initPostUniforms() {
    return {
      ...this.initPostBaseUniforms(),
      ...this.initPostCustomUniforms(),
      ...this.initPostConfigUniforms(),
    }
  }

  initCellCoordsTexture() {
    this.cellCoordsTexture = new Texture(this.gl, {
      width: this.store.get('sharedCellCoordsTextureWidth'),
      height: this.store.get('sharedCellCoordsTextureHeight'),
      image: this.store.get('sharedCellCoords'),
      format: this.gl.RG,
      internalFormat: this.gl.RG32F,
      type: this.gl.FLOAT,
      wrapS: this.gl.CLAMP_TO_EDGE,
      wrapT: this.gl.CLAMP_TO_EDGE,
      minFilter: this.gl.NEAREST,
      magFilter: this.gl.NEAREST,
      generateMipmaps: false,
      flipY: false,
    })
  }

  async getPositionCellIndices(position) {
    const rt = this.renderTargets?.[0]
    if (!rt) return

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, rt.buffer)

    if (rt.textures.length > 1) {
      this.gl.readBuffer(
        this.gl.COLOR_ATTACHMENT0 + (rt.voroIndexBuffer?.index ?? 0),
      )
    }
    const data = new Uint32Array(4) // Float32Array texture but packed as uint
    await readPixelsAsync(
      this.gl,
      position.x * (rt.width / this.dimensions.width),
      rt.height - position.y * (rt.height / this.dimensions.height),
      1,
      1,
      data,
      this.gl.RGBA,
      this.gl.FLOAT,
    )

    const index = data[0] - 1
    const index2 = data[1] - 1
    const index3 = data[2] - 1
    const index4 = data[3] - 1
    if (index >= 0) {
      return [index, index2, index3, index4]
    }
  }

  dispose() {}
}
