import { Geometry, Mesh, Program, Texture, Transform, Triangle } from 'ogl'
import devPointFragmentShader from './shaders/dev/dev-points.frag'
import devPointVertexShader from './shaders/dev/dev-points.vert'
import { Compressed3dMediaGridTexture } from './utils/compressed-3d-media-grid-texture'
import { copyRenderTargetToCanvas } from './utils/copy-render-target-to-canvas'
import { CustomRenderTarget } from './utils/custom-render-target'
import { readPixelsAsync } from './utils/read-pixels-async'

export default class BaseScene {
  baseUniforms = {}
  configUniforms = {}
  mainUniforms = {}

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

    if (!this.renderTargets || this.config.post?.enabled)
      this.devPointsMesh.setParent(this.instance)
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

    if (this.renderTargets) {
      this.app.renderer.instance.render({
        scene: this.mainMesh,
        camera: this.camera,
        target: this.renderTargets[0],
      })

      if (!this.mainMesh.parent && !this.config.post?.enabled) {
        copyRenderTargetToCanvas(
          this.gl,
          this.renderTargets[0],
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

    if (this.renderTargets && !this.config.post?.enabled) {
      this.app.renderer.instance.render({
        scene: this.devPointsMesh,
        camera: this.camera,
        target: this.renderTargets[0],
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

  initRenderTargets(
    count = 1,
    { outputColorIndex, voroIndexBufferColorIndex, ...options } = {},
  ) {
    this.renderTargets = [...Array(count)].map(() => {
      const rt = new CustomRenderTarget(this.gl, options)
      rt.outputColorIndex = outputColorIndex
      rt.voroIndexBufferColorIndex = voroIndexBufferColorIndex
      return rt
    })
    return this.renderTargets
  }

  refreshResolutionUniform(dimensions = this.dimensions) {
    this.resolutionUniform = [
      dimensions.width,
      dimensions.height,
      this.appConfig.renderer?.pixelRatio ?? dimensions.pixelRatio,
    ]
  }

  initMedia() {
    if (!this.globalConfig.media?.enabled) {
      const emptyTex = new Texture(this.gl, {})
      this.mediaTextures = [emptyTex, emptyTex, emptyTex]
      return
    }

    this.mediaTextures = this.globalConfig.media.versions.map(
      ({ width, height, layers }) =>
        new Compressed3dMediaGridTexture(this.gl, {
          width,
          height,
          length: layers,
        }),
    )

    this.loader.addEventListener(
      'mediaLayerLoaded',
      ({ data: { versionIndex, layerIndex, bytes } }) => {
        this.mediaTextures[versionIndex].prepareLayerUpdate(layerIndex, bytes)
      },
    )

    this.loader.loadAllV0MediaLayers()
  }

  updateMedia() {
    if (!this.globalConfig.media?.enabled) return
  }

  initBaseMediaUniforms() {
    return {
      bMediaEnabled: { value: this.globalConfig.media?.enabled ?? false },
      uMediaV0Texture: { value: this.mediaTextures[0] },
      uMediaV1Texture: { value: this.mediaTextures[1] },
      uMediaV2Texture: { value: this.mediaTextures[2] },
      i3NumMediaVersionCols: {
        value: this.globalConfig.media.versions?.map(({ cols }) => cols) ?? [
          0, 0, 0,
        ],
      },
      i3NumMediaVersionRows: {
        value: this.globalConfig.media.versions?.map(({ rows }) => rows) ?? [
          0, 0, 0,
        ],
      },
      i3NumMediaVersionLayers: {
        value: this.globalConfig.media.versions?.map(
          ({ layers }) => layers,
        ) ?? [0, 0, 0],
      },
    }
  }

  initBaseUniforms() {
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
      iLatticeCols: { value: cols },
      iLatticeRows: { value: rows },
      bForceMaxQuality: { value: false },
      fRoundnessMod: { value: 1 },
      fEdgeMod: { value: 1 },
      fEdgeSmoothnessMod: { value: 1 },
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

  async getCellIndexByPointer(pointer) {
    const rt = this.renderTargets?.[0]
    if (!rt) return

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, rt.buffer)

    if (rt.textures.length > 1) {
      this.gl.readBuffer(
        this.gl.COLOR_ATTACHMENT0 + (rt.voroIndexBufferColorIndex ?? 0),
      )
    }
    const data = new Uint32Array(4) // Float32Array texture but packed as uint
    await readPixelsAsync(
      this.gl,
      pointer.x * (rt.width / this.dimensions.width),
      rt.height - pointer.y * (rt.height / this.dimensions.height),
      1,
      1,
      data,
      this.gl.RGBA,
      this.gl.FLOAT,
    )

    const index = data[0] - 1
    if (index >= 0) {
      return index
    }
  }

  dispose() {}
}
