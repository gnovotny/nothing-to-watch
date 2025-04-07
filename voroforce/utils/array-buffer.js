export const arrayBuffer = (length, shared = false) =>
  new (shared && typeof SharedArrayBuffer !== 'undefined'
    ? SharedArrayBuffer
    : ArrayBuffer)(length)
