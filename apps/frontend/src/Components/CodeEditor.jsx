import { useRef } from "react";
import Editor from "@monaco-editor/react";

const CodeEditor = ({ 
	code, 
	onChange, 
	readOnly = false 
}) => {
	const editorRef = useRef(null);

	const handleEditorDidMount = (editor) => {
		editorRef.current = editor;
		editor.focus();
	};

	const handleEditorChange = (value) => {
		if (onChange && !readOnly) {
			onChange(value || "");
		}
	};

	return (
		<div className="h-full w-full">
			<Editor
				height="100%"
				language="javascript"
				value={code}
				onChange={handleEditorChange}
				onMount={handleEditorDidMount}
				theme="vs-dark"
				options={{
					minimap: { enabled: false },
					fontSize: 14,
					lineNumbers: "on",
					roundedSelection: false,
					scrollBeyondLastLine: false,
					readOnly: readOnly,
					automaticLayout: true,
					tabSize: 2,
					wordWrap: "on",
					padding: { top: 16, bottom: 16 },
					suggestOnTriggerCharacters: true,
					quickSuggestions: true,
					formatOnPaste: true,
					formatOnType: true,
				}}
			/>
		</div>
	);
};

export default CodeEditor;