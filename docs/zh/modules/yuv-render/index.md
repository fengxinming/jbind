# yuv-render

[![npm package](https://nodei.co/npm/yuv-render.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/yuv-render)

[![NPM version](https://img.shields.io/npm/v/yuv-render.svg?style=flat)](https://npmjs.org/package/yuv-render)
[![NPM Downloads](https://img.shields.io/npm/dm/yuv-render.svg?style=flat)](https://npmjs.org/package/yuv-render)
[![jsdelivr](https://data.jsdelivr.com/v1/package/npm/yuv-render/badge)](https://www.jsdelivr.com/package/npm/yuv-render)

> 一个基于 WebGL 的 YUV 视频帧渲染器，提供对 I420 格式视频数据的渲染能力，包含纹理管理、画布控制和资源释放功能。

## 功能特性
- 支持 HTMLCanvasElement 容器绑定
- 自动初始化 WebGL 渲染环境
- 支持动态尺寸调整
- 实现 YUV 三通道纹理分离渲染
- 提供资源清理接口

## 类结构
```typescript
class YUVRender {
  // 属性
  el: HTMLCanvasElement
  private webglContext: WebGLRenderingContext | null
  private yTexture: WebGLTexture | null
  private uTexture: WebGLTexture | null
  private vTexture: WebGLTexture | null

  // 构造方法
  constructor(el: HTMLCanvasElement)

  // 访问器
  get height(): number
  get width(): number

  // 方法
  setDimension(width: number, height: number): void
  render(data: Uint8Array): void
  clear(): void
  dispose(): void
}
```

## API 文档

### `constructor(el: HTMLCanvasElement)`
初始化渲染器，创建 WebGL 上下文并配置着色器程序
- 参数：
  - `el`: 目标 canvas 元素
- 初始化流程：
  1. 获取 WebGL 上下文
  2. 创建着色器程序
  3. 初始化缓冲区
  4. 创建 Y/U/V 三个纹理通道

### `get width(): number`
获取画布当前宽度
- 返回值：`number` 类型的 canvas 宽度值

### `get height(): number`
获取画布当前高度
- 返回值：`number` 类型的 canvas 高度值

### `setDimension(width: number, height: number): void`
设置画布显示尺寸
- 参数：
  - `width`: 画布宽度（像素）
  - `height`: 画布高度（像素）
- 行为说明：
  - 直接修改 canvas.width/canvas.height 属性
  - 会触发 WebGL viewport 的重置

### `render(data: Uint8Array): void`
渲染 YUV 数据到 canvas
- 参数：
  - `data`: I420 格式视频数据（Uint8Array）
- 数据处理流程：
  ```mermaid
  graph TD
    A[输入数据] --> B[分离Y通道]
    A --> C[分离U通道]
    A --> D[分离V通道]
    B --> E[绑定纹理0]
    C --> F[绑定纹理1]
    D --> G[绑定纹理2]
    E --> H[执行渲染]
  ```
- 注意事项：
  - 数据必须符合 I420 格式规范
  - 宽高需预先通过 setDimension 设置
  - 每次调用会重新上传纹理数据

### `clear(): void`
清除画布内容
- 行为说明：
  - 调用 WebGL 的 clear(COLOR_BUFFER_BIT) 方法
  - 用于清除当前帧的渲染结果

### `dispose(): void`
资源清理方法
- 执行动作：
  1. 清除画布内容（调用 clear()）
  2. 主动释放 WebGL 上下文（WEBGL_lose_context）
  3. 移除 canvas 元素
  4. 置空所有引用
- 注意事项：
  - 应在组件销毁时调用
  - 调用后实例不可复用

## 使用示例

<RenderYUV />

::: details 点击查看代码

<<< @/components/RenderYUV.vue

:::