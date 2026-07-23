/// <reference types="vite/client" />

import type { RepoLauncherApi } from "./types/ipc";

declare global {
  interface Window {
    api: RepoLauncherApi;
  }
}
