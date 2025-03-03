import config from '√/config'
import voroforce, { mergeConfigs } from '√/lib'

const urlParams = new URLSearchParams(window.location.search)
const slug = urlParams.get('slug')
const cellsOverride = urlParams.get('cells')

async function init() {
  const instance = voroforce(
    document.querySelector('#voroforce'),
    mergeConfigs(config, {
      ...(cellsOverride ? { cells: Number.parseInt(cellsOverride) } : {}),
      devTools: {
        enabled: true,
        expanded: false,
      },
    }),
  )

  instance.store.addEventListener('devTools', ({ value: { pane } }) => {
    if (pane) {
      const cellSizePresets = [20, 100, 500, 1000, 2000, 5000, 10000, 25000]
      pane
        .addBinding({ cells: instance.cells.length }, 'cells', {
          index: 2,
          view: 'radiogrid',
          groupName: 'cells',
          size: [4, 2],
          cells: (x, y) => ({
            title: `${cellSizePresets[y * 4 + x]}`,
            value: cellSizePresets[y * 4 + x],
          }),
          label: 'Cells',
        })
        .on('change', ({ value }) => {
          window.location.href = `${window.location.href.split('?')[0]}?slug=${slug ?? ''}&cells=${Math.round(value)}`
        })

      let cellCountChangeReloadTimeout
      pane
        .addBlade({
          index: 3,
          view: 'slider',
          label: '',
          min: 1,
          max: 25000,
          format: (v) => Math.round(v),
          value: instance.cells.length,
        })
        .on('change', ({ value }) => {
          clearTimeout(cellCountChangeReloadTimeout)
          cellCountChangeReloadTimeout = setTimeout(() => {
            window.location.href = `${window.location.href.split('?')[0]}?slug=${slug ?? ''}&cells=${Math.round(value)}`
          }, 1000)
        })
    }
  })
}

if (document.readyState !== 'loading') {
  init()
} else {
  document.addEventListener('DOMContentLoaded', () => {
    init()
  })
}
