const fs = require('fs');
const lines = fs.readFileSync('src/App.jsx', 'utf8').split('\n');

const out = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('onSpeedChange={setSpeed}')) {
        out.push(lines[i]);
        out.push(lines[i+1]);
        out.push(lines[i+2]);
        out.push(lines[i+3]);
        out.push('          )}'); // insert missing brace
        i += 3;
    } else {
        out.push(lines[i]);
    }
}
fs.writeFileSync('src/App.jsx', out.join('\n'));
