const fs = require('fs');
let code = fs.readFileSync('src/components/MenuBar.jsx', 'utf8');

const targetStr = "{ label: 'Word Wrap', shortcut: 'Alt+Z', action: 'editor.action.toggleWordWrap' }";
const replacementStr = targetStr + ",\n      { type: 'divider' },\n      { label: 'Zen Mode', action: 'zen_mode' }";

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/components/MenuBar.jsx', code);
    console.log("Success");
} else {
    console.log("Target string not found");
}
