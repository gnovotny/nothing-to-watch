import * as TweakpaneEssentialsPlugin from '@tweakpane/plugin-essentials'
import { Pane as Tweakpane } from 'tweakpane'

export default class DevTools {
  pane
  paneFolders

  constructor(config) {
    this.pane = new Tweakpane({
      title: 'Devtools',
      expanded: config.expanded,
    })
    this.pane.registerPlugin(TweakpaneEssentialsPlugin)
    this.fpsGraph = this.pane.addBlade({
      view: 'fpsgraph',
    })

    this.paneFolders = [
      this.pane.addFolder({
        title: 'Simulation',
        expanded: config.expandedFolders.simulation,
      }),
      this.pane.addFolder({
        title: 'Display',
        expanded: config.expandedFolders.display,
      }),
    ]
  }

  update() {}

  dispose() {
    this.pane.dispose()
  }
}
