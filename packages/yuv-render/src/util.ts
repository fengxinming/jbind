const validContextNames = [
  'webgl',
  'experimental-webgl',
  'moz-webgl',
  'webkit-3d'
];

export function getWebGLContext(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
  let gl: WebGLRenderingContext | null = null;
  let nameIndex = 0;
  while (!gl && nameIndex < validContextNames.length) {
    const contextName = validContextNames[nameIndex];
    try {
      gl = canvas.getContext(contextName) as WebGLRenderingContext;
    }
    catch (e) {
      gl = null;
    }
    if (!gl || typeof gl.getParameter !== 'function') {
      gl = null;
    }
    ++nameIndex;
  }

  return gl;
}

export function isWebglSupported(): boolean {
  return !!getWebGLContext(document.createElement('canvas'));
}
