import type { InstalledIdes } from "../types/ipc";

interface SettingsPanelProps {
  installedIdes: InstalledIdes;
}

export function SettingsPanel({ installedIdes }: SettingsPanelProps) {
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
    </div>
  );
}
