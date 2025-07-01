// import * as forceFunctions from '../steps/force/forces'

export function setupDevTools(devTools, onChange, config, globalConfig) {
  const d = devTools.paneFolders[0]
  // devTools.pane.onChange(onChange)

  const tab = d.addTab({
    pages: [{ title: 'General' }, { title: 'Forces' }],
  })
  const dGeneral = tab.pages[0]

  const parameters = config.steps.force.parameters
  const parameterBindings = [
    dGeneral.addBinding(parameters, 'alpha', {
      step: 0.05,
      min: 0,
      max: 1,
    }),
    // dGeneral.addBinding(parameters, 'alphaTarget', {
    //   step: 0.05,
    //   min: 0,
    //   max: 1,
    // }),
    // dGeneral.addBinding(parameters, 'alphaDecay', {
    //   step: 0.05,
    //   min: 0,
    //   max: 1,
    // }),
    // dGeneral.addBinding(parameters, 'alphaMin', {
    //   step: 0.05,
    //   min: 0,
    //   max: 1,
    // }),
    // .on('change', onChange).label = 'alphaMin'
    dGeneral.addBinding(parameters, 'velocityDecay', {
      step: 0.05,
      min: 0,
      max: 1,
    }),
  ]

  if (globalConfig.multiThreading?.enabled) {
    parameterBindings.forEach((binding) => {
      binding.on('change', onChange)
    })
  }

  // const dForces = tab.pages[1]
  // const dForcesFolder1 = dForces.addFolder({
  //   title: 'List',
  //   expanded: true,
  // })
  // const dForcesFolder2 = dForces.addFolder({
  //   title: 'Actions',
  //   expanded: true,
  // })
  // const forceFolders = []
  //
  // const handleForce = (force, index) => {
  //   const { type, strength, ...rest } = force
  //   const forceFolder = dForcesFolder1.addFolder({
  //     title: `Force ${index + 1}`,
  //     expanded: true,
  //   })
  //   forceFolders.push(forceFolder)
  //   forceFolder
  //     .addBinding(force, 'type', {
  //       options: {
  //         Lattice: 'lattice',
  //         Origin: 'origin',
  //         Push: 'push',
  //         'Radial push old': 'radial',
  //         'Radial push old (squarish)': 'radialSquarish',
  //         'Grid Test': 'gridTest',
  //         'Grid Test 2': 'gridTest2',
  //         'Collide (poor perf)': 'collide',
  //         'Mover Tmp': 'moverTmp',
  //         'Radial rectangle': 'radialRectangle',
  //       },
  //     })
  //     .on('change', onChange).label = 'Type'
  //   forceFolder.addBinding(force, 'enabled').on('change', onChange).label =
  //     'Enabled'
  //   forceFolder
  //     .addBinding(force, 'strength', {
  //       step: 0.01,
  //       min: 0,
  //       max: 1,
  //     })
  //     .on('change', onChange).label = 'Strength'
  // }
  // const handleForces = () => {
  //   config.forces.forEach((force, index) => {
  //     handleForce(force, index)
  //   })
  // }
  //
  // handleForces()
  //
  // const createButtons = () => {
  //   dForcesFolder2
  //     .addButton({
  //       title: 'Add Force',
  //     })
  //     .on('click', () => {
  //       const newForce = { enabled: false, strength: 0.1, type: 'origin' }
  //       config.forces.push(newForce)
  //       handleForce(newForce, config.forces.length - 1)
  //     })
  //
  //   dForcesFolder2
  //     .addButton({
  //       title: 'Remove last Force',
  //     })
  //     .on('click', () => {
  //       forceFolders[forceFolders.length - 1].dispose()
  //       config.forces.pop()
  //     })
  // }
  //
  // createButtons()
}
