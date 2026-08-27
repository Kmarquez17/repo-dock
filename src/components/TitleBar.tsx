import { ArrowLeft, Settings, Star, X } from "lucide-react";

interface TitleBarProps {
  title: string;
  showBack: boolean;
  onBack: () => void;
  favoritesActive: boolean;
  onToggleFavorites: () => void;
  settingsActive: boolean;
  onToggleSettings: () => void;
  onHide: () => void;
}

export function TitleBar({
  title,
  showBack,
  onBack,
  favoritesActive,
  onToggleFavorites,
  settingsActive,
  onToggleSettings,
  onHide,
}: TitleBarProps) {
  return (
    <header className="title-bar">
      <span className="title-bar-drag">
        {showBack && (
          <button className="icon-button title-bar-back" title="Atrás" onClick={onBack}>
            <ArrowLeft size={15} />
          </button>
        )}
        <span className="title-bar-name">{title}</span>
      </span>
      <div className="title-bar-actions">
        <button
          className={`icon-button ${favoritesActive ? "icon-button-active" : ""}`}
          title="Favoritos"
          onClick={onToggleFavorites}
        >
          <Star size={15} />
        </button>
        <button
          className={`icon-button ${settingsActive ? "icon-button-active" : ""}`}
          title="Ajustes"
          onClick={onToggleSettings}
        >
          <Settings size={15} />
        </button>
        <button className="icon-button" title="Ocultar" onClick={onHide}>
          <X size={15} />
        </button>
      </div>
    </header>
  );
}
