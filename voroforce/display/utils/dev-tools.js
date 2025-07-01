// import * as forceFunctions from '../steps/force/forces'

import { isObject } from '../../utils'

export function setupDevTools(devTools, app, config) {
  const d = devTools.paneFolders[1]

  // const dRenderer = d.addFolder({
  //   title: 'Renderer',
  //   expanded: true,
  // })
  //
  // dRenderer
  //   .addBinding(config.renderer, 'backgroundColor', {
  //     view: 'color',
  //   })
  //   .on('change', () => {
  //     app.canvas.style.backgroundColor = config.renderer.backgroundColor
  //   }).label = 'Background color'

  // dRenderer
  //   .addBinding(config.renderer, 'pixelRatio', {
  //     step: 0.1,
  //     min: 0.5,
  //     max: 3,
  //   })
  //   .on('change', () => {
  //     app.renderer.pixelRatio = config.renderer.pixelRatio
  //     app.renderer.resize()
  //     app.scene.resize()
  //   }).label = 'Pixel ratio'

  const dMain = d.addFolder({
    title: 'Main',
    expanded: true,
  })

  Object.keys(config.scene.main.uniforms).forEach((key) => {
    if (isObject(config.scene.main.uniforms[key].value)) return
    dMain
      .addBinding(config.scene.main.uniforms[key], 'value')
      .on('change', () => {
        app.scene.refreshCustom()
      }).label = key
  })

  // dMain
  //   .addBinding(config.main, 'padding', {
  //     step: 0.01,
  //     min: -1,
  //     max: 1,
  //   })
  //   .on('change', () => {
  //     app.scene.refreshCustom()
  //   }).label = 'Cell padding'
  //
  // dMain
  //   .addBinding(config.main, 'borderRadius', {
  //     step: 0.01,
  //     min: 0,
  //     max: 1,
  //   })
  //   .on('change', () => {
  //     app.scene.refreshCustom()
  //   }).label = 'Cell border radius'
}
