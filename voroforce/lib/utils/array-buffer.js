export const arrayBuffer = (length, shared = false) =>
  new (shared ? SharedArrayBuffer : ArrayBuffer)(length)
