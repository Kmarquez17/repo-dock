import { useState } from "react";
import { Pencil, Trash2, Check, X, Folder } from "lucide-react";
import type { RootFolder } from "../types/ipc";

interface FolderCardProps {
  folder: RootFolder;
  repoCount: number;
  onOpen: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
}

export function FolderCard({ folder, repoCount, onOpen, onRename, onRemove }: FolderCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(folder.name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function saveRename() {
    const trimmed = name.trim();
    if (trimmed && trimmed !== folder.name) onRename(trimmed);
    setEditing(false);
  }

  function cancelRename() {
    setName(folder.name);
    setEditing(false);
  }

  return (
    <li className="folder-card">
      {editing ? (
        <div className="folder-card-edit">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveRename();
              if (e.key === "Escape") cancelRename();
            }}
          />
          <button className="icon-button icon-button-accent" title="Guardar" onClick={saveRename}>
            <Check size={14} />
          </button>
          <button className="icon-button" title="Cancelar" onClick={cancelRename}>
            <X size={14} />
          </button>
        </div>
      ) : (
        <button className="folder-card-main" onClick={onOpen}>
          <span className="folder-card-icon">
            <Folder size={18} />
          </span>
          <div className="folder-card-text">
            <span className="folder-name">{folder.name}</span>
            <span className="folder-path" title={folder.path}>
              {folder.path}
            </span>
          </div>
          <span className="folder-repo-count" title="Repositorios encontrados">
            {repoCount}
          </span>
        </button>
      )}

      {!editing && (
        <div className="folder-card-actions">
          {confirmingDelete ? (
            <>
              <button
                className="icon-button icon-button-danger"
                title="Confirmar eliminar"
                onClick={() => {
                  onRemove();
                  setConfirmingDelete(false);
                }}
              >
                <Check size={14} />
              </button>
              <button className="icon-button" title="Cancelar" onClick={() => setConfirmingDelete(false)}>
                <X size={14} />
              </button>
            </>
          ) : (
            <>
              <button className="icon-button" title="Renombrar" onClick={() => setEditing(true)}>
                <Pencil size={14} />
              </button>
              <button className="icon-button" title="Quitar" onClick={() => setConfirmingDelete(true)}>
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
