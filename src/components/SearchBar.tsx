import { RefreshCw } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function SearchBar({ value, onChange, placeholder = "Buscar…", onRefresh, refreshing }: SearchBarProps) {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus
      />
      {onRefresh && (
        <button className="icon-button" title="Actualizar lista" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={14} className={refreshing ? "icon-spin" : undefined} />
        </button>
      )}
    </div>
  );
}
