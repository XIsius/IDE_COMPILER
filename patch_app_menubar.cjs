const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

code = code.replace(
  "onRunCode={handleRunCode}",
  "onZenMode={() => setZenMode(true)}\n          onRunCode={handleRunCode}"
);

fs.writeFileSync('src/App.jsx', code);
console.log("Success");
