import { useEffect, useState } from "react";
import type { InstalledIdes, TokenUpdateResult, UpdateStatus } from "../types/ipc";

interface SettingsPanelProps {
  installedIdes: InstalledIdes;
}

const MODIFIER_KEYS = new Set(["Control", "Alt", "Shift", "Meta"]);

const NAMED_KEYS: Record<string, string> = {
  " ": "Space",
  ArrowUp: "Up",
  ArrowDown: "Down",
  ArrowLeft: "Left",
  ArrowRight: "Right",
  Tab: "Tab",
  Backspace: "Backspace",
  Delete: "Delete",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
  Insert: "Insert",
};

function keyToAcceleratorPart(key: string): string | null {
  if (MODIFIER_KEYS.has(key)) return null;
  if (key.length === 1) return key.toUpperCase();
  if (/^F([1-9]|1[0-9]|2[0-4])$/.test(key)) return key;
  return NAMED_KEYS[key] ?? null;
}

function buildAccelerator(e: KeyboardEvent): string | null {
  const key = keyToAcceleratorPart(e.key);
  if (!key) return null;

  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("CommandOrControl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (parts.length === 0) return null;

  parts.push(key);
  return parts.join("+");
}

function formatAccelerator(accelerator: string): string {
  return accelerator.replace("CommandOrControl", "Ctrl");
}

function updateStatusLabel(status: UpdateStatus): string {
  switch (status.state) {
    case "idle":
      return "Sin chequear todavía.";
    case "checking":
      return "Buscando actualizaciones…";
    case "available":
      return `Nueva versión ${status.version} disponible, descargando…`;
    case "not-available":
      return "Estás en la última versión.";
    case "downloading":
      return `Descargando actualización… ${status.percent}%`;
    case "downloaded":
      return `Versión ${status.version} lista. Se instala al reiniciar la app.`;
    case "error":
      return `Error al buscar actualizaciones: ${status.message}`;
  }
}

export function SettingsPanel({ installedIdes }: SettingsPanelProps) {
  const [shortcut, setShortcutState] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [shortcutStatus, setShortcutStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [autostart, setAutostartState] = useState(false);
  const [autostartLoading, setAutostartLoading] = useState(false);
  const [appVersion, setAppVersion] = useState("");
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ state: "idle" });

  useEffect(() => {
    window.api.getShortcut().then(setShortcutState);
    window.api.getAutostart().then(setAutostartState);
    window.api.getAppVersion().then(setAppVersion);
    window.api.getUpdateStatus().then(setUpdateStatus);
    return window.api.onUpdateStatus(setUpdateStatus);
  }, []);

  useEffect(() => {
    if (!capturing) return;

    function handleKeyDown(e: KeyboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape") {
        setCapturing(false);
        return;
      }

      const accelerator = buildAccelerator(e);
      if (!accelerator) return;

      setCapturing(false);
      window.api.setShortcut(accelerator).then((result: TokenUpdateResult) => {
        if (result.ok) {
          setShortcutState(accelerator);
          setShortcutStatus({ ok: true, message: "Atajo actualizado." });
        } else {
          setShortcutStatus({ ok: false, message: result.error });
        }
      });
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [capturing]);

  async function handleAutostartToggle() {
    setAutostartLoading(true);
    const next = await window.api.setAutostart(!autostart);
    setAutostartState(next);
    setAutostartLoading(false);
  }

  const checkingUpdate = updateStatus.state === "checking" || updateStatus.state === "downloading";

  return (
    <div className="settings-panel">
      <section>
        <h3>IDEs detectados</h3>
        <ul className="ide-status-list">
          <li>
            <span>VS Code</span>
            <span className={installedIdes.vscode ? "status-ok" : "status-missing"}>
              {installedIdes.vscode ? "Instalado" : "No detectado"}
            </span>
          </li>
          <li>
            <span>Cursor</span>
            <span className={installedIdes.cursor ? "status-ok" : "status-missing"}>
              {installedIdes.cursor ? "Instalado" : "No detectado"}
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h3>Atajo global</h3>
        <div className="settings-row">
          <span>Mostrar / ocultar RepoDock</span>
          <button
            className="shortcut-badge"
            onClick={() => {
              setShortcutStatus(null);
              setCapturing(true);
            }}
          >
            {capturing ? "Presioná una combinación…" : shortcut ? formatAccelerator(shortcut) : "No asignado"}
          </button>
        </div>
        {capturing && <div className="settings-hint">Esc para cancelar.</div>}
        {shortcutStatus && (
          <div className={`token-message ${shortcutStatus.ok ? "token-message-ok" : "token-message-error"}`}>
            {shortcutStatus.message}
          </div>
        )}
      </section>

      <section>
        <h3>Inicio con Windows</h3>
        <label className="settings-row">
          <span>Iniciar RepoDock al encender Windows</span>
          <input
            type="checkbox"
            className="toggle-switch"
            checked={autostart}
            disabled={autostartLoading}
            onChange={handleAutostartToggle}
          />
        </label>
      </section>

      <section>
        <h3>Versión</h3>
        <div className="settings-row">
          <span>Instalada</span>
          <span className="status-ok">{appVersion || "…"}</span>
        </div>
        <div
          className={`token-message ${
            updateStatus.state === "error"
              ? "token-message-error"
              : updateStatus.state === "downloaded"
                ? "token-message-ok"
                : ""
          }`}
        >
          {updateStatusLabel(updateStatus)}
        </div>
        {updateStatus.state === "downloaded" ? (
          <button className="primary-button" onClick={() => window.api.installUpdate()}>
            Reiniciar e instalar
          </button>
        ) : (
          <button
            className="primary-button"
            disabled={checkingUpdate}
            onClick={() => window.api.checkForUpdates()}
          >
            {checkingUpdate ? "Buscando…" : "Buscar actualizaciones"}
          </button>
        )}
      </section>
    </div>
  );
}
