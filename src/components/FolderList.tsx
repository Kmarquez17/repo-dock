import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import type { RootFolder } from "../types/ipc";
import { FolderCard } from "./FolderCard";
import { SearchBar } from "./SearchBar";

interface FolderListProps {
  folders: RootFolder[];
  repoCounts: Map<string, number>;
  search: string;
  onSearchChange: (value: string) => void;
  onOpenFolder: (folder: RootFolder) => void;
  onAddFolder: (name: string, path: string) => Promise<void>;
  onRenameFolder: (id: string, name: string) => void;
  onRemoveFolder: (id: string) => void;
}

export function FolderList({
  folders,
  repoCounts,
  search,
  onSearchChange,
  onOpenFolder,
  onAddFolder,
  onRenameFolder,
  onRemoveFolder,
}: FolderListProps) {
  const [pending, setPending] = useState<{ path: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handlePickFolder() {
    const picked = await window.api.pickFolder();
    if (picked) setPending({ path: picked.path, name: picked.suggestedName });
  }

  async function confirmAdd() {
    if (!pending || !pending.name.trim()) return;
    setSaving(true);
    try {
      await onAddFolder(pending.name.trim(), pending.path);
      setPending(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="folder-view">
      <SearchBar value={search} onChange={onSearchChange} placeholder="Buscar carpeta…" />

      <div className="folder-scroll">
        {pending && (
          <div className="folder-pending">
            <span className="folder-pending-path" title={pending.path}>
              {pending.path}
            </span>
            <div className="folder-pending-row">
              <input
                autoFocus
                value={pending.name}
                placeholder="Nombre de la carpeta"
                onChange={(e) => setPending({ ...pending, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmAdd();
                  if (e.key === "Escape") setPending(null);
                }}
              />
              <button
                className="icon-button icon-button-accent"
                title="Guardar"
                onClick={confirmAdd}
                disabled={saving}
              >
                <Check size={14} />
              </button>
              <button className="icon-button" title="Cancelar" onClick={() => setPending(null)}>
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {folders.length === 0 && !pending && (
          <div className="empty-state">Agrega tu primera carpeta para empezar a listar tus repositorios.</div>
        )}

        <ul className="folder-card-list">
          {folders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              repoCount={repoCounts.get(folder.path) ?? 0}
              onOpen={() => onOpenFolder(folder)}
              onRename={(name) => onRenameFolder(folder.id, name)}
              onRemove={() => onRemoveFolder(folder.id)}
            />
          ))}
        </ul>
      </div>

      <button className="primary-button folder-add-button" onClick={handlePickFolder}>
        <Plus size={14} /> Agregar carpeta
      </button>
    </div>
  );
}
