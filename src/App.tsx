import { useEffect, useMemo, useState } from "react";
import { TitleBar } from "./components/TitleBar";
import { SearchBar } from "./components/SearchBar";
import { RepoList } from "./components/RepoList";
import { FavoritesView } from "./components/FavoritesView";
import { SettingsPanel } from "./components/SettingsPanel";
import { FolderList } from "./components/FolderList";
import { TokenView } from "./components/TokenView";
import type { InstalledIdes, RepoInfo, RootFolder } from "./types/ipc";
import "./App.css";

type View =
  | { name: "folders" }
  | { name: "repos"; folder: RootFolder }
  | { name: "favorites" }
  | { name: "token"; repo: RepoInfo; back: View }
  | { name: "settings" };

function App() {
  const [rootFolders, setRootFolders] = useState<RootFolder[]>([]);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [installedIdes, setInstalledIdes] = useState<InstalledIdes>({ vscode: null, cursor: null });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>({ name: "folders" });

  async function refreshRepos() {
    setLoading(true);
    try {
      const list = await window.api.scanRepos();
      setRepos(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const [folders, ides, favoriteList] = await Promise.all([
        window.api.getRootFolders(),
        window.api.detectIdes(),
        window.api.getFavorites(),
      ]);
      setRootFolders(folders);
      setInstalledIdes(ides);
      setFavorites(new Set(favoriteList));
      await refreshRepos();
    })();
  }, []);

  async function handleToggleFavorite(repo: RepoInfo) {
    const updated = await window.api.toggleFavorite(repo.path);
    setFavorites(new Set(updated));
  }

  useEffect(() => {
    setSearch("");
  }, [view.name]);

  async function handleAddFolder(name: string, folderPath: string) {
    const updated = await window.api.addRootFolder(folderPath, name);
    setRootFolders(updated);
    await refreshRepos();
  }

  async function handleRenameFolder(id: string, name: string) {
    const updated = await window.api.updateRootFolder(id, name);
    setRootFolders(updated);
  }

  async function handleRemoveFolder(id: string) {
    const updated = await window.api.removeRootFolder(id);
    setRootFolders(updated);
    await refreshRepos();
  }

  async function handleOpen(idePath: string, repo: RepoInfo) {
    await window.api.openInIde(idePath, repo.path);
  }

  function openFolder(folder: RootFolder) {
    setView({ name: "repos", folder });
  }

  function openToken(repo: RepoInfo) {
    if (view.name !== "repos" && view.name !== "favorites") return;
    setView({ name: "token", repo, back: view });
  }

  function goBack() {
    if (view.name === "token") {
      setView(view.back);
    } else {
      setView({ name: "folders" });
    }
  }

  function toggleSettings() {
    setView(view.name === "settings" ? { name: "folders" } : { name: "settings" });
  }

  function toggleFavoritesView() {
    setView(view.name === "favorites" ? { name: "folders" } : { name: "favorites" });
  }

  const repoCountByFolder = useMemo(() => {
    const counts = new Map<string, number>();
    for (const repo of repos) {
      counts.set(repo.rootFolder, (counts.get(repo.rootFolder) ?? 0) + 1);
    }
    return counts;
  }, [repos]);

  const filteredFolders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rootFolders;
    return rootFolders.filter((folder) => folder.name.toLowerCase().includes(query));
  }, [rootFolders, search]);

  const filteredRepos = useMemo(() => {
    if (view.name !== "repos") return [];
    const scoped = repos.filter((repo) => repo.rootFolder === view.folder.path);
    const query = search.trim().toLowerCase();
    const matched = query ? scoped.filter((repo) => repo.name.toLowerCase().includes(query)) : scoped;
    return [...matched].sort((a, b) => {
      const favA = favorites.has(a.path) ? 0 : 1;
      const favB = favorites.has(b.path) ? 0 : 1;
      if (favA !== favB) return favA - favB;
      return 0;
    });
  }, [repos, search, view, favorites]);

  const favoriteGroups = useMemo(() => {
    const byFolder = new Map<string, RepoInfo[]>();
    for (const repo of repos) {
      if (!favorites.has(repo.path)) continue;
      const list = byFolder.get(repo.rootFolder);
      if (list) list.push(repo);
      else byFolder.set(repo.rootFolder, [repo]);
    }
    return Array.from(byFolder.entries())
      .map(([folderPath, folderRepos]) => ({
        folderPath,
        folderName: rootFolders.find((f) => f.path === folderPath)?.name ?? folderPath,
        repos: folderRepos,
      }))
      .sort((a, b) => a.folderName.localeCompare(b.folderName, "es", { sensitivity: "base" }));
  }, [repos, favorites, rootFolders]);

  const title =
    view.name === "repos"
      ? view.folder.name
      : view.name === "token"
        ? view.repo.name
        : view.name === "settings"
          ? "Ajustes"
          : view.name === "favorites"
            ? "Favoritos"
            : "RepoDock";

  return (
    <div className="app-shell">
      <TitleBar
        title={title}
        showBack={view.name !== "folders"}
        onBack={goBack}
        favoritesActive={view.name === "favorites"}
        onToggleFavorites={toggleFavoritesView}
        settingsActive={view.name === "settings"}
        onToggleSettings={toggleSettings}
        onHide={() => window.api.hideWindow()}
      />

      {view.name === "settings" && <SettingsPanel installedIdes={installedIdes} />}

      {view.name === "favorites" && (
        <FavoritesView
          groups={favoriteGroups}
          installedIdes={installedIdes}
          favorites={favorites}
          onOpen={handleOpen}
          onOpenToken={openToken}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {view.name === "folders" && (
        <FolderList
          folders={filteredFolders}
          repoCounts={repoCountByFolder}
          search={search}
          onSearchChange={setSearch}
          onOpenFolder={openFolder}
          onAddFolder={handleAddFolder}
          onRenameFolder={handleRenameFolder}
          onRemoveFolder={handleRemoveFolder}
        />
      )}

      {view.name === "repos" && (
        <>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar repositorio…"
            onRefresh={refreshRepos}
            refreshing={loading}
          />
          <RepoList
            repos={filteredRepos}
            installedIdes={installedIdes}
            favorites={favorites}
            loading={loading}
            hasRootFolders={rootFolders.length > 0}
            onOpen={handleOpen}
            onOpenToken={openToken}
            onToggleFavorite={handleToggleFavorite}
          />
        </>
      )}

      {view.name === "token" && <TokenView repo={view.repo} />}
    </div>
  );
}

export default App;
