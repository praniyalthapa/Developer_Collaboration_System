import * as Y from "yjs";
import type * as monacoTypes from "monaco-editor";

type MonacoNamespace = typeof monacoTypes;
type CodeEditor = monacoTypes.editor.IStandaloneCodeEditor;

/**
 * Binds a Yjs text type to a Monaco editor model for real-time collaborative
 * editing. Remote changes are translated into *minimal* editor edits (not a
 * full-document replace), so each user's caret and selection stay put while
 * someone else types — the thing plain "set the whole value" sync gets wrong.
 *
 * We deliberately use the Monaco instance the editor was created with (passed
 * from `onMount`) rather than importing `monaco-editor` directly, so ranges and
 * models always come from the same Monaco.
 *
 * Returns a cleanup function that detaches both listeners.
 */
export const bindMonacoYjs = (
  ytext: Y.Text,
  editor: CodeEditor,
  monaco: MonacoNamespace,
): (() => void) => {
  const model = editor.getModel();
  if (!model) return () => undefined;

  const doc = ytext.doc;
  // Tag transactions we originate so our own YText observer ignores them.
  const origin = { source: "monaco-binding" };
  let applyingRemote = false;

  // Seed the editor with whatever the shared document currently holds.
  const initial = ytext.toString();
  if (model.getValue() !== initial) {
    applyingRemote = true;
    model.setValue(initial);
    applyingRemote = false;
  }

  // Yjs -> Monaco: walk the CRDT delta and build the equivalent editor edits.
  const observer = (event: Y.YTextEvent, transaction: Y.Transaction): void => {
    if (transaction.origin === origin) return;
    applyingRemote = true;
    const edits: monacoTypes.editor.IIdentifiedSingleEditOperation[] = [];
    let index = 0;
    for (const op of event.delta) {
      if (op.retain != null) {
        index += op.retain;
      } else if (typeof op.insert === "string") {
        const pos = model.getPositionAt(index);
        edits.push({
          range: new monaco.Range(
            pos.lineNumber,
            pos.column,
            pos.lineNumber,
            pos.column,
          ),
          text: op.insert,
          forceMoveMarkers: true,
        });
        // An insertion consumes no offset in the *original* model, so `index`
        // stays put — all edits are expressed against the pre-edit document.
      } else if (op.delete != null) {
        const from = model.getPositionAt(index);
        const to = model.getPositionAt(index + op.delete);
        edits.push({
          range: new monaco.Range(
            from.lineNumber,
            from.column,
            to.lineNumber,
            to.column,
          ),
          text: "",
        });
        index += op.delete;
      }
    }
    model.applyEdits(edits);
    applyingRemote = false;
  };
  ytext.observe(observer);

  // Monaco -> Yjs: mirror local edits into the shared text. Apply highest-offset
  // changes first so earlier offsets remain valid as we mutate.
  const disposable = model.onDidChangeContent((event) => {
    if (applyingRemote || !doc) return;
    doc.transact(() => {
      const changes = [...event.changes].sort(
        (a, b) => b.rangeOffset - a.rangeOffset,
      );
      for (const change of changes) {
        if (change.rangeLength > 0) {
          ytext.delete(change.rangeOffset, change.rangeLength);
        }
        if (change.text) {
          ytext.insert(change.rangeOffset, change.text);
        }
      }
    }, origin);
  });

  return () => {
    ytext.unobserve(observer);
    disposable.dispose();
  };
};
