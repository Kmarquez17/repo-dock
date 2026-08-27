import type { InstalledIdes, RepoInfo } from "../types/ipc";
import { RepoItem } from "./RepoItem";

export interface FavoriteGroup {
  folderPath: string;
  folderName: string;
  repos: RepoInfo[];
}

interface FavoritesViewProps {
  groups: FavoriteGroup[];
  installedIdes: InstalledIdes;
  favorites: Set<string>;
  onOpen: (idePath: string, repo: RepoInfo) => void;
  onOpenToken: (repo: RepoInfo) => void;
  onToggleFavorite: (repo: RepoInfo) => void;
}

export function FavoritesView({
  groups,
  installedIdes,
  favorites,
  onOpen,
  onOpenToken,
  onToggleFavorite,
}: FavoritesViewProps) {
  if (groups.length === 0) {
    return (
      <div className="empty-state">Todavía no marcaste favoritos. Tocá la estrella de un repositorio para anclarlo acá.</div>
    );
  }

  return (
    <div className="favorites-view">
      {groups.map((group) => (
        <section key={group.folderPath} className="favorites-group">
          <h3 className="favorites-group-title">{group.folderName}</h3>
          <ul className="repo-list repo-list-plain">
            {group.repos.map((repo) => (
              <RepoItem
                key={repo.path}
                repo={repo}
                installedIdes={installedIdes}
                isFavorite={favorites.has(repo.path)}
                onOpen={onOpen}
                onOpenToken={onOpenToken}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
