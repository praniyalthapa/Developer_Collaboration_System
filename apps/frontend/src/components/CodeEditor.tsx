import Editor, { type OnChange, type OnMount } from "@monaco-editor/react";

interface CodeEditorProps {
  language: string;
  /**
   * Controlled value. Omit in collaborative mode — the Yjs binding set up via
   * `onMount` owns the model instead, and a controlled value would fight it.
   */
  value?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onMount?: OnMount;
}

export const CodeEditor = ({
  language,
  value,
  readOnly = false,
  onChange,
  onMount,
}: CodeEditorProps) => {
  const handleChange: OnChange = (next) => {
    if (!readOnly && onChange) {
      onChange(next ?? "");
    }
  };

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={handleChange}
      onMount={onMount}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        scrollBeyondLastLine: false,
        readOnly,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
        padding: { top: 16, bottom: 16 },
      }}
    />
  );
};
