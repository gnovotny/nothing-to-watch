export enum VOROFORCE_MODE {
  preview = 0,
  select = 1,
  intro = 2,
}

export const DEFAULT_VOROFORCE_MODE: VOROFORCE_MODE = VOROFORCE_MODE.preview

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
