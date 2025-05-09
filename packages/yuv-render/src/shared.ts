const vertexShaderScript = `
attribute vec4 vertexPos;
attribute vec4 texturePos;
varying vec2 textureCoord;
void main(){
    gl_Position = vertexPos; 
    textureCoord = texturePos.xy;
}
`;

const fragmentShaderScript = `
precision highp float;
varying highp vec2 textureCoord;
uniform sampler2D ySampler;
uniform sampler2D uSampler;
uniform sampler2D vSampler;
const mat4 YUV2RGB = mat4(
    1.1643828125, 0, 1.59602734375, -.87078515625,
    1.1643828125, -.39176171875, -.81296875, .52959375,
    1.1643828125, 2.017234375, 0, -1.081390625,
    0, 0, 0, 1
);

void main(void) {
    highp float y = texture2D(ySampler,  textureCoord).r;
    highp float u = texture2D(uSampler,  textureCoord).r;
    highp float v = texture2D(vSampler,  textureCoord).r;
    gl_FragColor = vec4(y, u, v, 1) * YUV2RGB;
}
`;

function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
  // 根据类型创建着色器
  const shader = gl.createShader(type);
  if (shader == null) {
    console.warn('Unable to create shader');
    return null;
  }

  // 设置着色器和脚本
  gl.shaderSource(shader, source);

  // 编译着色器
  gl.compileShader(shader);

  // 检查编译结果
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(
      `Failed to compile ${type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'} shader: ${gl.getShaderInfoLog(shader)}`
    );
  }

  return shader;
}

export function createShaderProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vertexShader: WebGLShader | null = loadShader(gl, gl.VERTEX_SHADER, vertexShaderScript);
  if (!vertexShader) {
    return null;
  }

  const fragmentShader: WebGLShader | null = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderScript);
  if (!fragmentShader) {
    return null;
  }

  const program: WebGLProgram | null = gl.createProgram();
  if (!program) {
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(
      `Program failed to compile: ${gl.getProgramInfoLog(program)}`
    );
  }

  gl.useProgram(program);
  return program;
}

function createTexture(gl: WebGLRenderingContext): WebGLTexture | null {
  const texture: WebGLTexture | null = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return texture;
}

export function createYTexture(gl: WebGLRenderingContext, program: WebGLProgram): WebGLTexture | null {
  const yTexture: WebGLTexture | null = createTexture(gl);
  const ySampler = gl.getUniformLocation(program, 'ySampler');
  gl.uniform1i(ySampler, 0);
  return yTexture;
}

export function createUTexture(gl: WebGLRenderingContext, program: WebGLProgram): WebGLTexture | null {
  const uTexture: WebGLTexture | null = createTexture(gl);
  const uSampler = gl.getUniformLocation(program, 'uSampler');
  gl.uniform1i(uSampler, 1);
  return uTexture;
}

export function createVTexture(gl: WebGLRenderingContext, program: WebGLProgram): WebGLTexture | null {
  const vTexture: WebGLTexture | null = createTexture(gl);
  const vSampler = gl.getUniformLocation(program, 'vSampler');
  gl.uniform1i(vSampler, 2);
  return vTexture;
}

export function initBuffers(gl: WebGLRenderingContext, program: WebGLProgram): void {
  const vertexPosBuffer: WebGLBuffer | null = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([1, 1, -1, 1, 1, -1, -1, -1]),
    gl.STATIC_DRAW
  );

  const vertexPos = gl.getAttribLocation(program, 'vertexPos');
  gl.enableVertexAttribArray(vertexPos);
  gl.vertexAttribPointer(vertexPos, 2, gl.FLOAT, false, 0, 0);

  const texturePosBuffer: WebGLBuffer | null = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texturePosBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([1, 0, 0, 0, 1, 1, 0, 1]),
    gl.STATIC_DRAW
  );

  const texturePos = gl.getAttribLocation(program, 'texturePos');
  gl.enableVertexAttribArray(texturePos);
  gl.vertexAttribPointer(texturePos, 2, gl.FLOAT, false, 0, 0);
}
