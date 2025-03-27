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
  }

  initScene() {
    this.scene = new Scene(this)
  }

  initDevTools() {
    this.handleDevTools = ({ value: devTools }) => {
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

  getCellIndicesByPointer(pointer) {
    return this.scene.getCellIndicesByPointer(pointer)
  }

  dispose() {
    this.renderer.dispose()
    this.scene.dispose()
    this.store.removeEventListener('devTools', this.handleDevTools)
  }
}
