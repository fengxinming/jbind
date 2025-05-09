import {
  createShaderProgram,
  createUTexture,
  createVTexture,
  createYTexture,
  initBuffers
} from './shared';
import { getWebGLContext } from './util';

export * from './util';

export class YUVRender {
  el: HTMLCanvasElement;

  private webglContext: WebGLRenderingContext | null;
  private yTexture: WebGLTexture | null = null;
  private uTexture: WebGLTexture | null = null;
  private vTexture: WebGLTexture | null = null;

  constructor(el: HTMLCanvasElement) {
    this.el = el;

    const webglContext = getWebGLContext(el);
    this.webglContext = webglContext;

    if (!webglContext) {
      return;
    }

    const shaderProgram = createShaderProgram(webglContext);
    if (!shaderProgram) {
      return;
    }

    initBuffers(webglContext, shaderProgram);

    this.yTexture = createYTexture(webglContext, shaderProgram);
    this.uTexture = createUTexture(webglContext, shaderProgram);
    this.vTexture = createVTexture(webglContext, shaderProgram);
  }

  get height(): number {
    return this.el.height;
  }

  get width(): number {
    return this.el.width;
  }

  setDimension(width: number, height: number): void {
    const { el } = this;
    el.width = width;
    el.height = height;
  }

  render(data: Uint8Array): void {
    const gl = this.webglContext;
    if (!gl) {
      console.warn('The WebGLRenderingContext instance was not created');
      return;
    }

    const { width, height } = this;

    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.viewport(0, 0, width, height);

    const i420Data = data;
    const yDataLength = width * height;
    const yData = i420Data.subarray(0, yDataLength);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.yTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      width,
      height,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      yData
    );

    const cbDataLength = width * height / 4;
    const cbData = i420Data.subarray(yDataLength, yDataLength + cbDataLength);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.uTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      width / 2,
      height / 2,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      cbData
    );

    const crDataLength = cbDataLength;
    const crData = i420Data.subarray(
      yDataLength + cbDataLength,
      yDataLength + cbDataLength + crDataLength
    );

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.vTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      width / 2,
      height / 2,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      crData
    );

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  clear(): void {
    const { webglContext } = this;
    if (webglContext) {
      webglContext.clear(webglContext.COLOR_BUFFER_BIT);
    }
  }

  dispose(): void {
    this.clear();

    try {
      this.webglContext?.getExtension('WEBGL_lose_context')?.loseContext();
    }
    catch (e) { }

    const { el } = this;
    el.parentNode?.removeChild(el);

    this.webglContext = null;
    this.yTexture = null;
    this.uTexture = null;
    this.vTexture = null;
  }
}
