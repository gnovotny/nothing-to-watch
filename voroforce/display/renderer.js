import { Renderer as OGLRenderer } from 'ogl'
import { mergeConfigs } from '../utils'

export default class Renderer {
  constructor(app) {
    this.initProperties(app)
    this.handleConfig()
    this.initInstance()
  }

  initProperties(app) {
    this.app = app
    this.store = this.app.store
    this.config = this.app.config.renderer
    this.canvas = this.app.canvas
    this.dimensions = this.app.dimensions
  }

  handleConfig() {
    if (this.config.backgroundColor) {
      this.canvas.style.backgroundColor = this.config.backgroundColor
    }
  }

  initInstance() {
    const {
      depth,
      preserveDrawingBuffer,
      alpha,
      premultipliedAlpha,
      antialias,
      clearColor,
      backgroundColor,
    } = this.config

    this.instance = new OGLRenderer({
      canvas: this.canvas,
      alpha,
      premultipliedAlpha,
      antialias,
      depth,
      preserveDrawingBuffer,
      dpr: this.getPixelRatio(),
      width: this.dimensions.width,
      height: this.dimensions.height,
    })

    this.gl = this.instance.gl

    if (backgroundColor) this.canvas.style.backgroundColor = backgroundColor
    if (clearColor) this.gl.clearColor(...clearColor)

    this.initScissor()
  }

  getPixelRatio(dimensions = this.dimensions) {
    return this.config.pixelRatio ?? dimensions.pixelRatio
  }

  resize(dimensions = this.dimensions) {
    this.instance.dpr = this.getPixelRatio()
    this.instance.setSize(dimensions.width, dimensions.height)
    this.resizeScissor()
  }

  initScissor() {
    if (!this.config.scissor?.enabled) return
    this.resizeScissor()
    this.instance.gl.enable(this.instance.gl.SCISSOR_TEST)
  }

  resizeScissor(newConfig) {
    if (newConfig)
      this.config.scissor = mergeConfigs(this.config.scissor, newConfig)
    const config = this.config.scissor
    if (!config?.enabled) return

    const pixelRatio = this.getPixelRatio()

    const padding = config?.padding ?? 0
    const offsetTop = config?.offset?.top ?? 0
    const offsetBottom = config?.offset?.bottom ?? 0
    const offsetLeft = config?.offset?.left ?? 0
    const offsetRight = config?.offset?.right ?? 0
    const width = this.dimensions.width
    const height = this.dimensions.height
    this.instance.setScissor(
      (width - padding * 2 - offsetRight - offsetLeft) * pixelRatio,
      (height - padding * 2 - offsetTop - offsetBottom) * pixelRatio,
      (padding + offsetLeft) * pixelRatio,
      (padding + offsetTop) * pixelRatio,
    )
  }

  update() {
    if (this.app.scene.instance.children.length === 0) return
    this.instance.render({
      scene: this.app.scene.instance,
      camera: this.app.controls?.camera,
    })
  }

  dispose() {}
}
