const fs = require('fs');
let content = fs.readFileSync('src/components/NeuralSearchModal.jsx', 'utf8');

// Add history state
if (!content.includes('const [history, setHistory]')) {
    content = content.replace(
        "const [activeIndex, setActiveIndex] = useState(0);",
        `const [activeIndex, setActiveIndex] = useState(0);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('neural_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveToHistory = (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const newHistory = [trimmed, ...history.filter(item => item !== trimmed)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('neural_search_history', JSON.stringify(newHistory));
  };`
    );
}

// Update Enter keydown
if (content.includes('if (filtered[activeIndex]) {') && !content.includes('saveToHistory(query);')) {
    content = content.replace(
        `if (filtered[activeIndex]) {
        onAction(filtered[activeIndex].id);`,
        `if (filtered[activeIndex]) {
        saveToHistory(query);
        onAction(filtered[activeIndex].id);`
    );
}

// Update onClick
if (content.includes('onAction(action.id);') && !content.includes('saveToHistory(query);')) {
    content = content.replace(
        `onClick={() => {
                        onAction(action.id);`,
        `onClick={() => {
                        saveToHistory(query);
                        onAction(action.id);`
    );
}

// Update UI
if (content.includes('<!-- Header / Search Input -->') || content.includes('{/* Header / Search Input */}')) {
    const uiStrOld = `{/* Header / Search Input */}
            <div className="flex items-center px-4 py-4 border-b border-[#a855f7]/30 bg-[#1a1525]/60 relative">
              <Search className="text-[#00f5ff] mr-3 drop-shadow-[0_0_10px_rgba(0,245,255,0.8)]" size={24} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Access Neural Matrix..."
                className="flex-1 bg-transparent border-none outline-none text-[#e2e8f0] placeholder-[#00f5ff]/40 text-xl font-medium tracking-wide font-mono"
              />
              <div className="flex gap-2">
                <span className="text-[10px] text-[#00f5ff]/80 border border-[#00f5ff]/40 px-2 py-1 rounded bg-[#00f5ff]/10 flex items-center shadow-[0_0_12px_rgba(0,245,255,0.3)] uppercase tracking-widest font-bold">
                  ESC to Abort
                </span>
              </div>
            </div>`;

    const uiStrNew = `{/* Header / Search Input */}
            <div className="flex flex-col border-b border-[#a855f7]/30 bg-[#1a1525]/60 relative">
              <div className="flex items-center px-4 py-4">
                <Search className="text-[#00f5ff] mr-3 drop-shadow-[0_0_10px_rgba(0,245,255,0.8)]" size={24} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Access Neural Matrix..."
                  className="flex-1 bg-transparent border-none outline-none text-[#e2e8f0] placeholder-[#00f5ff]/40 text-xl font-medium tracking-wide font-mono"
                />
                <div className="flex gap-2">
                  <span className="text-[10px] text-[#00f5ff]/80 border border-[#00f5ff]/40 px-2 py-1 rounded bg-[#00f5ff]/10 flex items-center shadow-[0_0_12px_rgba(0,245,255,0.3)] uppercase tracking-widest font-bold">
                    ESC to Abort
                  </span>
                </div>
              </div>
              
              {/* Search History */}
              {history.length > 0 && (
                <div className="px-4 pb-3 flex gap-2 overflow-x-auto custom-scrollbar items-center">
                  <span className="text-[10px] text-[#64748b] uppercase tracking-widest font-mono mr-2">History:</span>
                  {history.map((h, i) => (
                    <button 
                      key={i}
                      onClick={() => {
                        setQuery(h);
                        inputRef.current?.focus();
                      }}
                      className="text-[10px] text-[#00f5ff] bg-[#00f5ff]/10 hover:bg-[#00f5ff]/20 px-2.5 py-1 rounded border border-[#00f5ff]/30 transition-colors whitespace-nowrap font-mono shadow-[0_0_8px_rgba(0,245,255,0.15)] flex items-center gap-1.5"
                    >
                      {h}
                      <X 
                        size={10} 
                        className="opacity-50 hover:opacity-100 hover:text-[#ff3e6c] transition-colors" 
                        onClick={(e) => {
                          e.stopPropagation();
                          const newHistory = history.filter(item => item !== h);
                          setHistory(newHistory);
                          localStorage.setItem('neural_search_history', JSON.stringify(newHistory));
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>`;

    content = content.replace(uiStrOld, uiStrNew);
}

fs.writeFileSync('src/components/NeuralSearchModal.jsx', content);
