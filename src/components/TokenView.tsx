import { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import type { GitRemoteInfo, RepoInfo } from "../types/ipc";

interface TokenViewProps {
  repo: RepoInfo;
}

export function TokenView({ repo }: TokenViewProps) {
  const [info, setInfo] = useState<GitRemoteInfo | null>(null);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInfo(null);
    setToken("");
    setStatus(null);
    window.api.getRemoteInfo(repo.path).then(setInfo);
  }, [repo.path]);

  async function handleUpdate() {
    if (!token.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      const result = await window.api.updateRemoteToken(repo.path, token.trim());
      if (result.ok) {
        setStatus({ ok: true, message: "Token actualizado en el remote." });
        setToken("");
      } else {
        setStatus({ ok: false, message: result.error });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="token-view">
      <div className="token-header">
        <KeyRound size={18} />
        <div className="token-header-text">
          <span className="repo-name">{repo.name}</span>
          <span className="repo-path" title={repo.path}>
            {repo.path}
          </span>
        </div>
      </div>

      {!info && <div className="empty-state">Consultando remote…</div>}

      {info && "error" in info && <div className="token-message token-message-error">{info.error}</div>}

      {info && "protocol" in info && info.protocol === "ssh" && (
        <div className="token-message">
          Este repositorio usa SSH ({info.host}); la actualización de token no aplica.
        </div>
      )}

      {info && "protocol" in info && info.protocol === "other" && (
        <div className="token-message">No se pudo interpretar el remote de este repositorio.</div>
      )}

      {info && "protocol" in info && info.protocol === "https" && (
        <>
          <div className="token-detected">
            Detectado: <strong>{info.host}</strong>
          </div>
          <div className="token-input-row">
            <input
              type={showToken ? "text" : "password"}
              placeholder="Nuevo token de acceso"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
              autoFocus
            />
            <button
              className="icon-button"
              title={showToken ? "Ocultar" : "Mostrar"}
              onClick={() => setShowToken((v) => !v)}
            >
              {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <button className="primary-button" onClick={handleUpdate} disabled={saving || !token.trim()}>
            {saving ? "Actualizando…" : "Actualizar token"}
          </button>
        </>
      )}

      {status && (
        <div className={`token-message ${status.ok ? "token-message-ok" : "token-message-error"}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}
