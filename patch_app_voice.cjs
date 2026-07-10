const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Import VoiceMacroCaster
code = code.replace(
  "import SciFiBackground from './components/SciFiBackground';",
  "import SciFiBackground from './components/SciFiBackground';\nimport VoiceMacroCaster from './components/VoiceMacroCaster';"
);

// Add handleVoiceCommand
code = code.replace(
  "const handleRunCode = () => {",
  `const handleVoiceCommand = (cmd) => {
    switch(cmd) {
      case 'run': handleRunCode(); break;
      case 'zen_mode': setZenMode(true); break;
      case 'exit_zen': setZenMode(false); break;
      case 'new_file': handleNewFile(); break;
      case 'theme_neon': setTheme('neon'); break;
      case 'theme_synthwave': setTheme('synthwave'); break;
      case 'theme_vscode': setTheme('vscode'); break;
      case 'search': setIsSearchOpen(true); break;
      case 'collab': setCollabModalOpen(true); break;
    }
  };

  const handleRunCode = () => {`
);

// Add the component before <SciFiBackground />
code = code.replace(
  "<SciFiBackground />",
  "<SciFiBackground />\n      <VoiceMacroCaster onCommand={handleVoiceCommand} />"
);

fs.writeFileSync('src/App.jsx', code);
console.log("Success");
