const fs = require('fs');
let code = fs.readFileSync('src/components/MenuBar.jsx', 'utf8');

// Update props
code = code.replace(
  "export default function MenuBar({ onOpenSearch, onRunCode, onNewFile, onOpenFile, onSave, onSaveAs, onToggleCurriculum, onToggleTerminal, onEditorCommand, onCollaborate, onExitSession, participants = [], sessionId, currentTheme, onThemeChange }) {",
  "export default function MenuBar({ onZenMode, onOpenSearch, onRunCode, onNewFile, onOpenFile, onSave, onSaveAs, onToggleCurriculum, onToggleTerminal, onEditorCommand, onCollaborate, onExitSession, participants = [], sessionId, currentTheme, onThemeChange }) {"
);

// Update handleAction
code = code.replace(
  "else if (action === 'stub_panel') { alert(`The '${label}' panel is not available in this view.`); }",
  "else if (action === 'stub_panel') { alert(`The '${label}' panel is not available in this view.`); }\n    else if (action === 'zen_mode') { if (onZenMode) onZenMode(); }"
);

fs.writeFileSync('src/components/MenuBar.jsx', code);
console.log("Success");
