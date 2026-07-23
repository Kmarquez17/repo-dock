import { useEffect, useMemo, useState } from "react";
import { TitleBar } from "./components/TitleBar";
import { SearchBar } from "./components/SearchBar";
import { RepoList } from "./components/RepoList";
import { SettingsPanel } from "./components/SettingsPanel";
import { FolderList } from "./components/FolderList";
import { TokenView } from "./components/TokenView";
import type { InstalledIdes, RepoInfo, RootFolder } from "./types/ipc";
import "./App.css";

type View =
  | { name: "folders" }
  | { name: "repos"; folder: RootFolder }
  | { name: "token"; repo: RepoInfo; folder: RootFolder }
  | { name: "settings" };

function App() {
  const [rootFolders, setRootFolders] = useState<RootFolder[]>([]);
  const [repos, setRepos] = useState<RepoInfo[]>([]);
  const [installedIdes, setInstalledIdes] = useState<InstalledIdes>({ vscode: null, cursor: null });
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
      const [folders, ides] = await Promise.all([window.api.getRootFolders(), window.api.detectIdes()]);
      setRootFolders(folders);
      setInstalledIdes(ides);
      await refreshRepos();
    })();
  }, []);

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
    if (view.name !== "repos") return;
    setView({ name: "token", repo, folder: view.folder });
  }

  function goBack() {
    if (view.name === "token") {
      setView({ name: "repos", folder: view.folder });
    } else {
      setView({ name: "folders" });
    }
  }

  function toggleSettings() {
    setView(view.name === "settings" ? { name: "folders" } : { name: "settings" });
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
    if (!query) return scoped;
    return scoped.filter((repo) => repo.name.toLowerCase().includes(query));
  }, [repos, search, view]);

  const title =
    view.name === "repos"
      ? view.folder.name
      : view.name === "token"
        ? view.repo.name
        : view.name === "settings"
          ? "Ajustes"
          : "RepoDock";

  return (
    <div className="app-shell">
      <TitleBar
        title={title}
        showBack={view.name !== "folders"}
        onBack={goBack}
        settingsActive={view.name === "settings"}
        onToggleSettings={toggleSettings}
        onHide={() => window.api.hideWindow()}
      />

      {view.name === "settings" && <SettingsPanel installedIdes={installedIdes} />}

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
            loading={loading}
            hasRootFolders={rootFolders.length > 0}
            onOpen={handleOpen}
            onOpenToken={openToken}
          />
        </>
      )}

      {view.name === "token" && <TokenView repo={view.repo} />}
    </div>
  );
}

export default App;
