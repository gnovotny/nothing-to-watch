export enum VOROFORCE_MODE {
  preview = 0,
  select = 1,
  intro = 2,
}

// export const DEFAULT_VOROFORCE_MODE: VOROFORCE_MODE = VOROFORCE_MODE.preview
export const DEFAULT_VOROFORCE_MODE: VOROFORCE_MODE = VOROFORCE_MODE.select

export enum VOROFORCE_PRESET {
  mobile = 'mobile',
  minimal = 'minimal',
  minimalPrototyping = 'minimalPrototyping',
  contours = 'contours',
  depth = 'depth',
}

export enum DEVICE_CLASS {
  mobile = 0,
  low = 1,
  mid = 2,
  high = 3,
}

export const PRESET_ITEMS = [
  {
    id: VOROFORCE_PRESET.minimal,
    name: 'Minimal',
    videoSrc: '/tmp.webm',
  },
  {
    id: VOROFORCE_PRESET.contours,
    name: 'Contours',
    // features: ['Special effects'],
    videoSrc: '/tmp.webm',
    recommendedDeviceClass: DEVICE_CLASS.mid,
  },
  {
    id: VOROFORCE_PRESET.depth,
    name: 'Depth',
    // features: ['Raymarching'],
    videoSrc: '/tmp.webm',
    recommendedDeviceClass: DEVICE_CLASS.high,
  },
]

export enum CELL_LIMIT {
  xxs = 5000,
  xs = 10000,
  sm = 25000,
  md = 50000,
  lg = 100000,
}

export const CELL_LIMIT_ITEMS = [
  {
    value: CELL_LIMIT.xxs,
    label: '5,000',
  },
  {
    value: CELL_LIMIT.xs,
    label: '10,000',
    recommendedDeviceClass: DEVICE_CLASS.low,
  },
  {
    value: CELL_LIMIT.sm,
    label: '25,000',
    recommendedDeviceClass: DEVICE_CLASS.mid,
  },
  {
    value: CELL_LIMIT.md,
    label: '50,000',
    recommendedDeviceClass: DEVICE_CLASS.mid,
  },
  {
    value: CELL_LIMIT.lg,
    label: '100,000',
    recommendedDeviceClass: DEVICE_CLASS.high,
  },
]

export const DEVICE_CLASS_ITEMS = [
  {
    id: DEVICE_CLASS.low,
    name: '🥔 Potato',
  },
  {
    id: DEVICE_CLASS.mid,
    name: '😐 Mid-range',
  },
  {
    id: DEVICE_CLASS.high,
    name: '💪 High-end',
  },
]

export const OBSCURE_VISUAL_DEFECTS = true
