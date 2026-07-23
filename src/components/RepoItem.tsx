import type { InstalledIdes, RepoInfo } from "../types/ipc";
import { PROJECT_TYPE_META } from "../projectTypeMeta";
import { RepoActionsMenu } from "./RepoActionsMenu";

interface RepoItemProps {
  repo: RepoInfo;
  installedIdes: InstalledIdes;
  onOpen: (idePath: string, repo: RepoInfo) => void;
  onOpenToken: (repo: RepoInfo) => void;
}

export function RepoItem({ repo, installedIdes, onOpen, onOpenToken }: RepoItemProps) {
  const meta = PROJECT_TYPE_META[repo.type];

  return (
    <li className="repo-item">
      <div className="repo-item-main">
        <span className="repo-badge" style={{ backgroundColor: meta.color }} title={meta.label}>
          {meta.label.slice(0, 2).toUpperCase()}
        </span>
        <div className="repo-item-text">
          <span className="repo-name">{repo.name}</span>
          <span className="repo-path" title={repo.path}>
            {repo.path}
          </span>
        </div>
      </div>
      <RepoActionsMenu repo={repo} installedIdes={installedIdes} onOpen={onOpen} onOpenToken={onOpenToken} />
    </li>
  );
}
