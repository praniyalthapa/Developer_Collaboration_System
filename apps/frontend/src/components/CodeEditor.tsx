import Editor, { type OnChange } from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  language: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}

export const CodeEditor = ({
  value,
  language,
  readOnly = false,
  onChange,
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
