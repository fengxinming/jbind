# yuv-render

[![npm package](https://nodei.co/npm/yuv-render.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/yuv-render)

[![NPM version](https://img.shields.io/npm/v/yuv-render.svg?style=flat)](https://npmjs.org/package/yuv-render)
[![NPM Downloads](https://img.shields.io/npm/dm/yuv-render.svg?style=flat)](https://npmjs.org/package/yuv-render)
[![jsdelivr](https://data.jsdelivr.com/v1/package/npm/yuv-render/badge)](https://www.jsdelivr.com/package/npm/yuv-render)

> **A lightweight Promise-based XHR library** that wraps traditional `XMLHttpRequest` into a Promise interface to simplify asynchronous request development.

---

## **Installation**

::: code-group

```bash [npm]
npm add yuv-render
```
```bash [pnpm]
pnpm add yuv-render
```
```bash [yarn]
yarn add yuv-render
```
```html [html]
<script src="https://cdn.jsdelivr.net/npm/yuv-render/dist/index.umd.min.js"></script>
<script>
  const { ajax } = XhrPromisify;
  // GET request
  ajax({
    url: 'https://api.example.com/data',
    method: 'GET'
  })
  .then(response => {
    console.log('Response data:', response);
  })
  .catch(error => {
    console.error('Request failed:', error);
  });
</script>
```

:::

---

## Documentation

For detailed usage instructions and API references, please visit the official documentation:

👉 [View Full Documentation](https://fengxinming.github.io/util/modules/yuv-render/)

---

## **Quick Start**
### Basic Usage
```javascript
import { ajax } from 'yuv-render';

// GET request
ajax({
  url: 'https://api.example.com/data',
  method: 'GET'
})
.then(response => {
  console.log('Response data:', response);
})
.catch(error => {
  console.error('Request failed:', error);
});

// Simplified syntax (async/await)
async function fetchData() {
  try {
    const response = await ajax({ url: '/api/data' });
    console.log(response);
  } catch (error) {
    console.error(error);
  }
}
```

---

## **Advanced Usage**
### Abort Requests
```javascript
const controller = new AbortController();
const { signal } = controller;

ajax({
  url: '/api/long-polling',
  signal
}).then(...);

// Abort the request manually
controller.abort();
```

### Custom Headers
```javascript
ajax({
  url: '/api/protected',
  headers: {
    'Authorization': 'Bearer your_token'
  }
});
```

---

## **Error Handling**
All exceptions throw an `AjaxError` object with the following properties:
```typescript
class AjaxError extends Error {
  code: string; // Error code (e.g., `ERR_NETWORK`)
  status?: number; // HTTP status code (if available)
  statusText?: string; // HTTP status text (if available)
  data?: any; // Response data (if available)
  request?: XMLHttpRequest; // Original request object (if available)
}
```

### **Error Types**
| Error Code | Type | Description |
|------------|------|-------------|
| `ABORT_ERR` | `AjaxError` | Request was manually aborted |
| `ERR_NETWORK` | `AjaxError` | Network error (e.g., DNS resolution failure) |
| `ERR_HTTP_REQUEST_TIMEOUT` | `AjaxError` | Request timeout |
| `ERR_BAD_REQUEST` | `AjaxError` | HTTP 4xx status code error |
| `ERR_BAD_RESPONSE` | `AjaxError` | HTTP 5xx status code error |

---

## **Browser Support**

![Chrome](https://raw.github.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![Safari](https://raw.github.com/alrra/browser-logos/master/src/safari/safari_48x48.png) | ![Opera](https://raw.github.com/alrra/browser-logos/master/src/opera/opera_48x48.png) | ![Edge](https://raw.github.com/alrra/browser-logos/master/src/edge/edge_48x48.png) |
--- | --- | --- | --- | --- |
Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ |
