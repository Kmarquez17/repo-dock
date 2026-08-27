import { useEffect, useState } from "react";
import { GitBranch, Star } from "lucide-react";
import type { InstalledIdes, RepoGitStatus, RepoInfo } from "../types/ipc";
import { PROJECT_TYPE_META } from "../projectTypeMeta";
import { RepoActionsMenu } from "./RepoActionsMenu";

interface RepoItemProps {
  repo: RepoInfo;
  installedIdes: InstalledIdes;
  isFavorite: boolean;
  onOpen: (idePath: string, repo: RepoInfo) => void;
  onOpenToken: (repo: RepoInfo) => void;
  onToggleFavorite: (repo: RepoInfo) => void;
}

export function RepoItem({ repo, installedIdes, isFavorite, onOpen, onOpenToken, onToggleFavorite }: RepoItemProps) {
  const meta = PROJECT_TYPE_META[repo.type];
  const [status, setStatus] = useState<RepoGitStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus(null);
    window.api.getRepoStatus(repo.path).then((result) => {
      if (!cancelled) setStatus(result);
    });
    return () => {
      cancelled = true;
    };
  }, [repo.path]);

  return (
    <li className="repo-item">
      <div className="repo-item-main">
        <button
          className={`icon-button repo-favorite-toggle ${isFavorite ? "icon-button-accent" : ""}`}
          title={isFavorite ? "Quitar de favoritos" : "Marcar como favorito"}
          onClick={() => onToggleFavorite(repo)}
        >
          <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <span className="repo-badge" style={{ backgroundColor: meta.color }} title={meta.label}>
          {meta.label.slice(0, 2).toUpperCase()}
        </span>
        <div className="repo-item-text">
          <span className="repo-name">{repo.name}</span>
          <span className="repo-path" title={repo.path}>
            {repo.path}
          </span>
          {status?.branch && (
            <span className={`repo-git-status ${status.dirty ? "repo-git-status-dirty" : ""}`}>
              <GitBranch size={11} />
              {status.branch}
              {status.dirty && <span className="repo-git-dirty-dot" title="Cambios sin commitear" />}
            </span>
          )}
        </div>
      </div>
      <RepoActionsMenu repo={repo} installedIdes={installedIdes} onOpen={onOpen} onOpenToken={onOpenToken} />
    </li>
  );
}
