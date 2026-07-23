import { useEffect, useRef, useState } from "react";
import { MoreVertical, FolderOpen, Terminal, KeyRound, Code2, MousePointer2 } from "lucide-react";
import type { InstalledIdes, RepoInfo } from "../types/ipc";

interface RepoActionsMenuProps {
  repo: RepoInfo;
  installedIdes: InstalledIdes;
  onOpen: (idePath: string, repo: RepoInfo) => void;
  onOpenToken: (repo: RepoInfo) => void;
}

export function RepoActionsMenu({ repo, installedIdes, onOpen, onOpenToken }: RepoActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggleOpen() {
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setOpenUpward(window.innerHeight - rect.bottom < 220);
    }
    setOpen((v) => !v);
  }

  function runAndClose(action: () => void) {
    action();
    setOpen(false);
  }

  return (
    <div className="repo-actions" ref={containerRef}>
      <button className="icon-button" title="Acciones" onClick={toggleOpen}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className={`repo-actions-menu ${openUpward ? "repo-actions-menu-up" : ""}`}>
          <div className="repo-actions-menu-title">{repo.name}</div>

          {installedIdes.vscode && (
            <button
              className="repo-actions-item"
              onClick={() => runAndClose(() => onOpen(installedIdes.vscode!, repo))}
            >
              <Code2 size={14} /> VS Code
            </button>
          )}
          {installedIdes.cursor && (
            <button
              className="repo-actions-item"
              onClick={() => runAndClose(() => onOpen(installedIdes.cursor!, repo))}
            >
              <MousePointer2 size={14} /> Cursor
            </button>
          )}
          <button
            className="repo-actions-item"
            onClick={() => runAndClose(() => window.api.openInExplorer(repo.path))}
          >
            <FolderOpen size={14} /> Directorio
          </button>
          <button className="repo-actions-item" onClick={() => runAndClose(() => window.api.openTerminal(repo.path))}>
            <Terminal size={14} /> Terminal
          </button>
          <button className="repo-actions-item" onClick={() => runAndClose(() => onOpenToken(repo))}>
            <KeyRound size={14} /> Token
          </button>
        </div>
      )}
    </div>
  );
}
