import { Icon } from "./icons";

interface LanguageOption {
  id: string;
  label: string;
  color: string;
}

const LANGUAGES: LanguageOption[] = [
  { id: "javascript", label: "JavaScript", color: "#f7df1e" },
  { id: "typescript", label: "TypeScript", color: "#3178c6" },
  { id: "python", label: "Python", color: "#3776ab" },
  { id: "java", label: "Java", color: "#f89820" },
  { id: "go", label: "Go", color: "#00add8" },
];

interface LanguageSelectProps {
  value: string;
  onChange: (language: string) => void;
}

export const LanguageSelect = ({ value, onChange }: LanguageSelectProps) => {
  const current = LANGUAGES.find((lang) => lang.id === value) ?? LANGUAGES[0];

  return (
    <div className="dropdown">
      <div
        tabIndex={0}
        role="button"
        className="btn btn-sm gap-2 border border-base-content/15 bg-base-100/70 font-normal"
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: current.color }}
        />
        <span className="font-mono text-xs">{current.label}</span>
        <svg className="h-3.5 w-3.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </div>
      <ul
        tabIndex={0}
        className="surface menu dropdown-content z-50 mt-2 w-48 p-1.5"
      >
        {LANGUAGES.map((lang) => (
          <li key={lang.id}>
            <button
              type="button"
              onClick={() => {
                onChange(lang.id);
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
              }}
              className={`gap-2.5 ${lang.id === value ? "bg-primary/10 text-primary" : ""}`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: lang.color }}
              />
              <span className="font-mono text-sm">{lang.label}</span>
              {lang.id === value ? (
                <Icon name="check" className="ml-auto h-4 w-4" />
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
