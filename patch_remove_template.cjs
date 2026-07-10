const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const targetSelect = `                  <select
                    onChange={(e) => {
                      const templateName = e.target.value;
                      if (!templateName) return;
                      const langBoilerplates = BOILERPLATES[language] || {};
                      const templateCode = langBoilerplates[templateName];
                      if (templateCode) {
                        handleCodeChange(templateCode);
                      }
                      e.target.value = "";
                    }}
                    className="text-[11px] font-mono tracking-wide bg-[#1a1525]/40 text-[#c9d1d9] border border-white/10 rounded-md px-3 py-1 outline-none cursor-pointer hover:border-[#00f5ff]/50 focus:border-[#00f5ff] focus:shadow-[0_0_10px_rgba(0,245,255,0.3)] transition-all"
                  >
                    <option value="">Load Template ⌄</option>
                    {Object.keys(BOILERPLATES[language] || {}).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>`;

if (code.includes(targetSelect)) {
    code = code.replace(targetSelect, '');
    fs.writeFileSync('src/App.jsx', code);
    console.log("Success");
} else {
    console.log("Target string not found");
}
