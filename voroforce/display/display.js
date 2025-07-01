import Renderer from './renderer'
import Scene from './scene'
import { setupDevTools } from './utils/dev-tools'

export default class Display {
  constructor(store) {
    this.initGlobals(store)
    this.initProperties()
    this.initComponents()
  }

  initGlobals(store) {
    this.store = store
    this.globalConfig = this.store.get('config')
    this.config = this.globalConfig.display
  }

  initProperties() {
    this.canvas = this.store.get('canvas')
    this.cells = this.store.get('cells')
    this.dimensions = this.store.get('dimensions')
  }

  initComponents() {
    this.initRenderer()
    this.initScene()
    this.initDevTools()
  }

  initRenderer() {
    this.renderer = new Renderer(this)
    this.gl = this.renderer.gl
    this.handleRendererCompatibility()
  }

  handleRendererCompatibility() {
    const media = this.globalConfig.media
    if (!media?.enabled) return

    const compressionFormats = {
      dds: 'WEBGL_compressed_texture_s3tc',
      ktx: 'WEBGL_compressed_texture_etc',
    }

    const compressionFormatKeys = Object.keys(compressionFormats)

    const index = compressionFormatKeys.indexOf(media.compressionFormat)
    if (index === -1) {
      throw new Error('Media compression format must be either dds or ktx.')
    }

    if (!this.gl.getExtension(compressionFormats[media.compressionFormat])) {
      media.compressionFormat =
        compressionFormatKeys[(index + 1) % compressionFormatKeys.length]
      if (!this.gl.getExtension(compressionFormats[media.compressionFormat])) {
        throw new Error('All compression formats are not supported.')
      }
    }
  }

  initScene() {
    this.scene = new Scene(this)
  }

  initDevTools() {
    this.handleDevTools = ({ value: devTools }) => {
      if (!devTools) return
      setupDevTools(devTools, this, this.config)
    }
    this.store.addEventListener('devTools', this.handleDevTools)
  }

  resize(dimensions) {
    this.renderer.resize(dimensions)
    this.scene.resize(dimensions)
  }

  update() {
    this.scene.update()
    this.renderer.update()
  }

  getPositionCellIndices(position) {
    return this.scene.getPositionCellIndices(position)
  }

  dispose() {
    this.renderer.dispose()
    this.scene.dispose()
    this.store.removeEventListener('devTools', this.handleDevTools)
  }
}
