const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// 1. Add zenMode state
code = code.replace(
  "const [isSearchOpen, setIsSearchOpen] = useState(false);",
  "const [isSearchOpen, setIsSearchOpen] = useState(false);\n  const [zenMode, setZenMode] = useState(false);\n\n  useEffect(() => {\n    const handleKeyDown = (e) => {\n      if (e.key === 'Escape' && zenMode) {\n        setZenMode(false);\n      }\n    };\n    window.addEventListener('keydown', handleKeyDown);\n    return () => window.removeEventListener('keydown', handleKeyDown);\n  }, [zenMode]);"
);

// 2. Add handleSearchAction support
code = code.replace(
  "case 'collab':",
  "case 'zen_mode':\n        setZenMode(true);\n        break;\n      case 'collab':"
);

// 3. Hide Menu Bar
code = code.replace(
  "{/* Menu Bar */}\n      <div className=\"flex-none\">",
  "{/* Menu Bar */}\n      {!zenMode && (\n      <div className=\"flex-none\">"
);
code = code.replace(
  "onThemeChange={setTheme}\n        />\n      </div>",
  "onThemeChange={setTheme}\n        />\n      </div>\n      )}"
);

// 4. Update Main Workspace padding
code = code.replace(
  "<div className=\"flex-1 flex overflow-hidden p-4 gap-4\">",
  "<div className={`flex-1 flex overflow-hidden ${zenMode ? 'p-0' : 'p-4 gap-4'}`}>"
);

// 5. Hide Activity Bar
code = code.replace(
  "{/* Activity Bar + Explorer */}\n        <div className=\"h-full neon-panel\">",
  "{/* Activity Bar + Explorer */}\n        {!zenMode && (\n        <div className=\"h-full neon-panel\">"
);
code = code.replace(
  "onFileDelete={(name) => {\n              if (files.length <= 1) { alert('Cannot delete the last file.'); return; }\n              setFiles(prev => {\n                const updated = prev.filter(f => f.name !== name);\n                try { localStorage.setItem(\"ide_virtual_files\", JSON.stringify(updated)); } catch(e){}\n                if (workspaceMapRef.current) workspaceMapRef.current.set('files_metadata', updated.map(f => ({ name: f.name, language: f.language })));\n                if (activeFileName === name) setActiveFileName(updated[0].name);\n                return updated;\n              });\n            }}\n          />\n        </div>",
  "onFileDelete={(name) => {\n              if (files.length <= 1) { alert('Cannot delete the last file.'); return; }\n              setFiles(prev => {\n                const updated = prev.filter(f => f.name !== name);\n                try { localStorage.setItem(\"ide_virtual_files\", JSON.stringify(updated)); } catch(e){}\n                if (workspaceMapRef.current) workspaceMapRef.current.set('files_metadata', updated.map(f => ({ name: f.name, language: f.language })));\n                if (activeFileName === name) setActiveFileName(updated[0].name);\n                return updated;\n              });\n            }}\n          />\n        </div>\n        )}"
);

// 6. Update Main Content Area grid
code = code.replace(
  "<div className=\"flex-1 grid grid-cols-[1fr_380px] gap-4 overflow-hidden\">",
  "<div className={`flex-1 ${zenMode ? 'flex flex-col' : 'grid grid-cols-[1fr_380px] gap-4'} overflow-hidden`}>"
);

// 7. Update Editor Section panel
code = code.replace(
  "<div className=\"flex-1 flex flex-col min-h-0 neon-panel\">",
  "<div className={`flex-1 flex flex-col min-h-0 ${zenMode ? '' : 'neon-panel'}`}>"
);

// 8. Hide Terminal Panel
code = code.replace(
  "{/* Terminal Panel */}\n            <div className=\"h-[200px] flex flex-col neon-panel\">",
  "{/* Terminal Panel */}\n            {!zenMode && (\n            <div className=\"h-[200px] flex flex-col neon-panel\">"
);
code = code.replace(
  "</div>\n              </div>\n            </div>\n          </div>",
  "</div>\n              </div>\n            </div>\n            )}\n          </div>"
);

// 9. Hide Execution Visualizer
code = code.replace(
  "{/* RIGHT: Execution Visualizer */}\n          <div className=\"flex flex-col h-full neon-panel\">",
  "{/* RIGHT: Execution Visualizer */}\n          {!zenMode && (\n          <div className=\"flex flex-col h-full neon-panel\">"
);
code = code.replace(
  "onSpeedChange={setSpeed}\n              />\n            </div>\n          </div>\n        </div>",
  "onSpeedChange={setSpeed}\n              />\n            </div>\n          </div>\n          )}\n        </div>"
);

// 10. Hide Status Bar and show ESC prompt
code = code.replace(
  "{/* Status Bar */}\n      <div className=\"flex-none\">",
  "{/* Status Bar */}\n      {!zenMode && (\n      <div className=\"flex-none\">"
);
code = code.replace(
  "<StatusBar language={language} wsConnected={wsConnected} lastSaved={lastSaved} />\n      </div>\n    </motion.div>",
  "<StatusBar language={language} wsConnected={wsConnected} lastSaved={lastSaved} />\n      </div>\n      )}\n      {zenMode && (\n         <motion.div initial={{opacity:0}} animate={{opacity:1}} className=\"absolute top-4 right-4 z-50\">\n            <button onClick={() => setZenMode(false)} className=\"bg-[#a855f7]/20 hover:bg-[#a855f7]/40 text-[#e2e8f0] px-4 py-2 rounded-full border border-[#a855f7]/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] text-xs font-mono font-bold tracking-widest uppercase backdrop-blur-md transition-all\">\n               Exit Zen Mode (ESC)\n            </button>\n         </motion.div>\n      )}\n    </motion.div>"
);

fs.writeFileSync('src/App.jsx', code);
console.log("Success");
