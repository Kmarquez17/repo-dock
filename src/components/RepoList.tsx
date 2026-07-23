import type { InstalledIdes, RepoInfo } from "../types/ipc";
import { RepoItem } from "./RepoItem";

interface RepoListProps {
  repos: RepoInfo[];
  installedIdes: InstalledIdes;
  loading: boolean;
  hasRootFolders: boolean;
  onOpen: (idePath: string, repo: RepoInfo) => void;
  onOpenToken: (repo: RepoInfo) => void;
}

export function RepoList({ repos, installedIdes, loading, hasRootFolders, onOpen, onOpenToken }: RepoListProps) {
  if (loading) {
    return <div className="empty-state">Buscando repositorios…</div>;
  }

  if (!hasRootFolders) {
    return <div className="empty-state">Agrega una carpeta raíz para empezar a listar tus repositorios.</div>;
  }

  if (repos.length === 0) {
    return <div className="empty-state">Sin resultados.</div>;
  }

  return (
    <ul className="repo-list">
      {repos.map((repo) => (
        <RepoItem key={repo.path} repo={repo} installedIdes={installedIdes} onOpen={onOpen} onOpenToken={onOpenToken} />
      ))}
    </ul>
  );
}
