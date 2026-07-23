import type { ProjectType } from "./types/ipc";

export const PROJECT_TYPE_META: Record<ProjectType, { label: string; color: string }> = {
  react: { label: "React", color: "#61dafb" },
  vue: { label: "Vue", color: "#42b883" },
  angular: { label: "Angular", color: "#dd0031" },
  electron: { label: "Electron", color: "#9feaf9" },
  node: { label: "Node", color: "#8cc84b" },
  dotnet: { label: ".NET", color: "#8a2be2" },
  python: { label: "Python", color: "#ffd43b" },
  go: { label: "Go", color: "#00add8" },
  rust: { label: "Rust", color: "#dea584" },
  java: { label: "Java", color: "#f89820" },
  php: { label: "PHP", color: "#787cb5" },
  git: { label: "Git", color: "#f05033" },
  unknown: { label: "?", color: "#777" },
};
