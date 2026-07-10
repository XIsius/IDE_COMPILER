import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, File, Settings, Play, Users, Cpu, X, Zap, Terminal, Mic } from 'lucide-react';

const ACTIONS = [
  { id: 'run', label: 'Execute Code Sequence', icon: Play, shortcut: 'Cmd+Enter', type: 'action' },
  { id: 'collab', label: 'Initialize Neural Link (Collaborate)', icon: Users, shortcut: 'Cmd+I', type: 'action' },
  { id: 'settings', label: 'System Configuration', icon: Settings, shortcut: 'Cmd+,', type: 'action' },
  { id: 'ai_tutor', label: 'Consult AI Core (Tutor)', icon: Cpu, shortcut: 'Cmd+T', type: 'action' },
  { id: 'theme', label: 'Cycle Visual Matrix (Theme)', icon: Zap, shortcut: 'Cmd+K T', type: 'action' },
  { id: 'zen_mode', label: 'Enter Focus Zen Mode', icon: Zap, type: 'action' },
  { id: 'terminal', label: 'Launch Terminal', icon: Terminal, shortcut: 'Cmd+~', type: 'action' },
  { id: 'file_main', label: 'main.py', icon: File, type: 'file' },
  { id: 'file_util', label: 'utils.c', icon: File, type: 'file' },
  { id: 'file_config', label: 'config.json', icon: File, type: 'file' }
];

export default function NeuralSearchModal({ isOpen, onClose, onAction }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('neural_search_history');
      const parsed = saved ? JSON.parse(saved) : []; return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser.");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        setQuery(speechResult);
      };
      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === 'not-allowed') alert('Microphone access denied. Please allow microphone access in your browser to use voice search.');
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const saveToHistory = (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const newHistory = [trimmed, ...history.filter(item => item !== trimmed)].slice(0, 5);
    setHistory(newHistory);
    try { try { localStorage.setItem('neural_search_history', JSON.stringify(newHistory)); } catch(e) { console.error(e); } } catch(e) { console.error(e); }
  };
  const inputRef = useRef(null);

  const filtered = ACTIONS.filter(a => a.label.toLowerCase().includes(query.toLowerCase()) || (a.shortcut && a.shortcut.toLowerCase().includes(query.toLowerCase())));

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) {
        saveToHistory(query);
        onAction(filtered[activeIndex].id);
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20, filter: 'hue-rotate(90deg)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'hue-rotate(0deg)' }}
            exit={{ opacity: 0, scale: 0.95, y: -20, filter: 'hue-rotate(-90deg)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-[#0a0515]/80 border border-[#a855f7]/50 rounded-2xl shadow-[0_0_80px_rgba(168,85,247,0.3)] overflow-hidden"
            style={{ backdropFilter: 'blur(30px)' }}
          >
            {/* Animated Gradient Border effect */}
            <div className="absolute inset-0 z-[-1] bg-gradient-to-r from-[#a855f7]/0 via-[#00f5ff]/10 to-[#a855f7]/0 animate-pulse" />

            {/* Header / Search Input */}
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
                <div className="flex gap-2 items-center">
                  <button
                    onClick={isListening ? undefined : startListening}
                    className={`p-1.5 rounded-full transition-colors ${
                      isListening 
                        ? 'bg-[#ff3e6c]/20 text-[#ff3e6c] shadow-[0_0_15px_rgba(255,62,108,0.5)] animate-pulse' 
                        : 'bg-transparent text-[#00f5ff]/50 hover:text-[#00f5ff] hover:bg-[#00f5ff]/10'
                    }`}
                    title="Voice Search"
                  >
                    <Mic size={16} />
                  </button>
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
            </div>

            {/* Results */}
            <div className="max-h-[50vh] overflow-y-auto py-2 px-2 custom-scrollbar">
              {filtered.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="px-6 py-12 text-center text-[#64748b] text-sm"
                >
                  <Cpu className="mx-auto mb-4 opacity-40 text-[#ff3e6c]" size={48} />
                  <span className="text-[#ff3e6c] uppercase tracking-widest font-mono shadow-[#ff3e6c]">NO NEURAL PATHWAYS FOUND FOR "{query}"</span>
                </motion.div>
              ) : (
                filtered.map((action, idx) => {
                  const isActive = idx === activeIndex;
                  const Icon = action.icon;
                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => {
                        onAction(action.id);
                        onClose();
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={`flex items-center justify-between px-4 py-3 mb-1 rounded-xl cursor-pointer transition-all ${
                        isActive ? 'bg-[#a855f7]/20 border border-[#a855f7]/60 shadow-[0_0_20px_rgba(168,85,247,0.3)] scale-[1.01]' : 'border border-transparent hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${isActive ? 'bg-[#00f5ff]/20 text-[#00f5ff] shadow-[0_0_15px_rgba(0,245,255,0.4)]' : 'bg-black/30 text-[#64748b]'}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-mono text-[14px] ${isActive ? 'text-[#e2e8f0] font-bold' : 'text-[#94a3b8]'}`}>
                            {action.label}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-[#a855f7]/60">
                            {action.type === 'action' ? 'System Process' : 'Data Node'}
                          </span>
                        </div>
                      </div>
                      {action.shortcut && (
                        <div className="flex gap-1.5">
                          {action.shortcut.split('+').map(k => (
                            <span key={k} className={`text-[11px] font-mono px-2 py-1 rounded border ${isActive ? 'border-[#00f5ff]/50 bg-[#00f5ff]/20 text-[#00f5ff] shadow-[0_0_10px_rgba(0,245,255,0.3)]' : 'border-[#64748b]/30 bg-black/40 text-[#64748b]'}`}>
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-3 border-t border-[#a855f7]/30 bg-[#000000]/40 flex items-center justify-between text-[11px] text-[#64748b] font-mono relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(90deg, rgba(168,85,247,0.1) 1px, transparent 1px), linear-gradient(rgba(168,85,247,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <div className="flex gap-6 relative z-10">
                <span className="flex items-center gap-2"><span className="bg-[#a855f7]/20 text-[#00f5ff] px-1.5 rounded font-bold border border-[#00f5ff]/30">↑↓</span> Navigate</span>
                <span className="flex items-center gap-2"><span className="bg-[#a855f7]/20 text-[#00f5ff] px-1.5 rounded font-bold border border-[#00f5ff]/30">↵</span> Execute</span>
              </div>
              <div className="flex items-center gap-2 relative z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ffa3] animate-pulse shadow-[0_0_8px_#00ffa3]" />
                <div className="text-[#00ffa3] tracking-widest uppercase text-[10px]">
                  Link Active
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
