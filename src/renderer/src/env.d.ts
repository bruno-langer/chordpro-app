/// <reference types="vite/client" />
declare global {
  interface Window {
    // electron: typeof import('@electron-toolkit/preload');
    // api: typeof import('@renderer/api');
    library: typeof import('@preload/index');
  }
}
