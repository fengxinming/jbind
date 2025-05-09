# yuv-render

[![npm package](https://nodei.co/npm/yuv-render.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/yuv-render)

[![NPM version](https://img.shields.io/npm/v/yuv-render.svg?style=flat)](https://npmjs.org/package/yuv-render)
[![NPM Downloads](https://img.shields.io/npm/dm/yuv-render.svg?style=flat)](https://npmjs.org/package/yuv-render)
[![jsdelivr](https://data.jsdelivr.com/v1/package/npm/yuv-render/badge)](https://www.jsdelivr.com/package/npm/yuv-render)

> A WebGL-based YUV video frame renderer providing I420 format video data rendering capabilities, featuring texture management, canvas control, and resource release functions.

## Features
- Supports HTMLCanvasElement container binding
- Automatically initializes WebGL rendering environment
- Supports dynamic size adjustment
- Implements YUV triple-channel texture separated rendering
- Provides resource cleanup interface

## Class Structure
```typescript
class YUVRender {
  // Properties
  el: HTMLCanvasElement
  private webglContext: WebGLRenderingContext | null
  private yTexture: WebGLTexture | null
  private uTexture: WebGLTexture | null
  private vTexture: WebGLTexture | null

  // Constructor
  constructor(el: HTMLCanvasElement)

  // Accessors
  get height(): number
  get width(): number

  // Methods
  setDimension(width: number, height: number): void
  render(data: Uint8Array): void
  clear(): void
  dispose(): void
}
```

## API Documentation

### `constructor(el: HTMLCanvasElement)`
Initializes the renderer, creates WebGL context and configures shader program
- Parameters:
  - `el`: Target canvas element
- Initialization process:
  1. Obtain WebGL context
  2. Create shader program
  3. Initialize buffers
  4. Create Y/U/V three texture channels

### `get width(): number`
Gets current canvas width
- Returns: `number` type canvas width value

### `get height(): number`
Gets current canvas height
- Returns: `number` type canvas height value

### `setDimension(width: number, height: number): void`
Sets canvas display dimensions
- Parameters:
  - `width`: Canvas width in pixels
  - `height`: Canvas height in pixels
- Behavior:
  - Directly modifies canvas.width/canvas.height property
  - Triggers WebGL viewport reset

### `render(data: Uint8Array): void`
Renders YUV data to canvas
- Parameters:
  - `data`: I420 formatted video data (Uint8Array)
- Data processing flow:
  ```mermaid
  graph TD
    A[Input Data] --> B[Extract Y Channel]
    A --> C[Extract U Channel]
    A --> D[Extract V Channel]
    B --> E[Bind Texture 0]
    C --> F[Bind Texture 1]
    D --> G[Bind Texture 2]
    E --> H[Execute Rendering]
  ```
- Notes:
  - Data must comply with I420 format specification
  - Dimensions must be set through setDimension in advance
  - Texture data will be re-uploaded on each call

### `clear(): void`
Clears canvas content
- Behavior:
  - Calls WebGL's clear(COLOR_BUFFER_BIT) method
  - Used to clear current frame rendering results

### `dispose(): void`
Resource cleanup method
- Actions performed:
  1. Clear canvas content (call clear())
  2. Actively release WebGL context (WEBGL_lose_context)
  3. Remove canvas element
  4. Nullify all references
- Notes:
  - Should be called when component is destroyed
  - Instance becomes non-reusable after invocation

## Usage Example

<RenderYUV />

::: details View Code

<<< @/components/RenderYUV.vue

:::