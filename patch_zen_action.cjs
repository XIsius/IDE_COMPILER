const fs = require('fs');
let code = fs.readFileSync('src/components/NeuralSearchModal.jsx', 'utf8');

const targetStr = "{ id: 'theme', label: 'Cycle Visual Matrix (Theme)', icon: Zap, shortcut: 'Cmd+K T', type: 'action' },";
const replacementStr = targetStr + "\n  { id: 'zen_mode', label: 'Enter Focus Zen Mode', icon: Zap, type: 'action' },";

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replacementStr);
    fs.writeFileSync('src/components/NeuralSearchModal.jsx', code);
    console.log("Success");
} else {
    console.log("Target string not found");
}
