import React, { useState, useEffect, useRef } from 'react';
import { Play, ChevronRight, Terminal, Plus, Trash2, X, Star } from 'lucide-react';
import MonacoEditorWithCommands from './components/Editor/MonacoEditor';
import { motion } from 'framer-motion';
import MenuBar from './components/MenuBar';
import ActivityBar from './components/ActivityBar';
import StatusBar from './components/StatusBar';
import EditorTabs from './components/EditorTabs';
import ExecutionVisualizer from './components/ExecutionVisualizer/ExecutionVisualizer';
import TerminalPanel from './components/TerminalPanel';
import CollaborationModal from './components/CollaborationModal';
import AuthModal from './components/AuthModal';
import NeuralSearchModal from './components/NeuralSearchModal.jsx';
import SettingsModal from './components/SettingsModal';
import useExecutionPlayback from './hooks/useExecutionPlayback';
import SciFiBackground from './components/SciFiBackground';
import VoiceMacroCaster from './components/VoiceMacroCaster';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { WebsocketProvider } from 'y-websocket';
import './index.css';

const BOILERPLATES = {
  python: {
    "Hello World": 'print("Hello, World!")',
    "DFS": 'def dfs(graph, start, visited=None):\n    if visited is None:\n        visited = set()\n    visited.add(start)\n    for next_node in graph[start] - visited:\n        dfs(graph, next_node, visited)\n    return visited',
    "BFS": 'from collections import deque\n\ndef bfs(graph, start):\n    visited = set([start])\n    queue = deque([start])\n    while queue:\n        vertex = queue.popleft()\n        for neighbor in graph[vertex]:\n            if neighbor not in visited:\n                visited.add(neighbor)\n                queue.append(neighbor)\n    return visited',
    "Binary Search": 'def binary_search(arr, low, high, x):\n    if high >= low:\n        mid = (high + low) // 2\n        if arr[mid] == x:\n            return mid\n        elif arr[mid] > x:\n            return binary_search(arr, low, mid - 1, x)\n        else:\n            return binary_search(arr, mid + 1, high, x)\n    else:\n        return -1'
  },
  c: {
    "Hello World": '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}',
    "Binary Search": '#include <stdio.h>\n\nint binarySearch(int arr[], int l, int r, int x) {\n    if (r >= l) {\n        int mid = l + (r - l) / 2;\n        if (arr[mid] == x) return mid;\n        if (arr[mid] > x) return binarySearch(arr, l, mid - 1, x);\n        return binarySearch(arr, mid + 1, r, x);\n    }\n    return -1;\n}\n\nint main() {\n    // test code here\n    return 0;\n}'
  },
  cpp: {
    "Hello World": '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
    "BFS": '#include <iostream>\n#include <vector>\n#include <queue>\nusing namespace std;\n\nvoid bfs(vector<vector<int>>& graph, int start) {\n    vector<bool> visited(graph.size(), false);\n    queue<int> q;\n    visited[start] = true;\n    q.push(start);\n    while (!q.empty()) {\n        int node = q.front();\n        q.pop();\n        cout << node << " ";\n        for (int neighbor : graph[node]) {\n            if (!visited[neighbor]) {\n                visited[neighbor] = true;\n                q.push(neighbor);\n            }\n        }\n    }\n}\n\nint main() {\n    return 0;\n}'
  }
};

function App() {

  const workspaceDocRef = useRef(null);
  const workspaceMapRef = useRef(null);
  const providerRef = useRef(null);
  const monacoBindingRef = useRef(null);
  const defaultFiles = [{ name: 'main.py', content: 'print("Hello World")', language: 'python' }];
  const [files, setFiles] = useState(() => {
    const saved = localStorage.getItem('ide_virtual_files');
    const parsed = saved ? JSON.parse(saved) : defaultFiles; return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultFiles;
  });
  const [activeFileName, setActiveFileName] = useState(files[0]?.name || 'main.py');


  const activeFile = files.find(f => f.name === activeFileName) || files[0] || defaultFiles[0];

  const [theme, setTheme] = useState(() => localStorage.getItem('ide_theme') || 'default');

  useEffect(() => {
    try { localStorage.setItem("ide_theme", theme); } catch(e){}
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const [code, setCode] = useState(activeFile.content);
  const [language, setLanguage] = useState(activeFile.language);
  const [output, setOutput] = useState('');
  const [execEvents, setExecEvents] = useState([]);
  const [traces, setTraces] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [yjsReady, setYjsReady] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  const filesRef = useRef(files);
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  useEffect(() => {
    const interval = setInterval(() => {
      let filesToSave = filesRef.current;
      if (workspaceDocRef.current) {
         filesToSave = filesToSave.map(f => {
            const ytext = workspaceDocRef.current.getText(f.name);
            const content = ytext ? ytext.toString() : f.content;
            return { ...f, content };
         });
      }
      try { localStorage.setItem('ide_virtual_files', JSON.stringify(filesToSave)); } catch(e) { console.error(e); }
      setLastSaved(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  const [activeActivity, setActiveActivity] = useState('explorer');
  const [activeBottomTab, setActiveBottomTab] = useState('output');



  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && zenMode) {
        setZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zenMode]);
  const ws = useRef(null);
  const editorRef = useRef(null);

  // Collaboration State
  const urlParams = new URLSearchParams(window.location.search);
  const initialSessionId = urlParams.get('session');

  useEffect(() => {
    const token = urlParams.get('token');
    if (token) {
      localStorage.setItem('ide_token', token);
      alert('Logged in with Google successfully!');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  const [collabModalOpen, setCollabModalOpen] = useState(!!initialSessionId);
  const [sessionId, setSessionId] = useState(null);

  const activeYText = yjsReady && sessionId && workspaceDocRef.current 
      ? workspaceDocRef.current.getText(activeFileName) 
      : null;
  const awareness = yjsReady && sessionId && providerRef.current 
      ? providerRef.current.awareness 
      : null;
  const [username, setUsername] = useState('');
  const [participants, setParticipants] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [editorFontFamily, setEditorFontFamily] = useState("'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  
  const handleJoinSession = (id, uname) => {
    setSessionId(id);
    setUsername(uname);
    setCollabModalOpen(false);
    window.history.pushState({}, '', `/?session=${id}`);
  };

  const handleExitSession = () => {
    setShowReviewModal(true);
  };

  const submitReviewAndExit = () => {
    // Optionally log or send the review data to a backend
    console.log("User Review:", { rating: reviewRating, feedback: reviewText });
    
    // Clear session and state
    setSessionId(null);
    setUsername('');
    setParticipants([]);
    setShowReviewModal(false);
    setReviewRating(0);
    setReviewText('');
    window.history.pushState({}, '', `/`);
  };

  // Sync virtual workspace metadata (filenames, languages) over Yjs if collaborating

  useEffect(() => {
    if (!sessionId) return;
    const ydoc = new Y.Doc();
    workspaceDocRef.current = ydoc;
    providerRef.current = new WebsocketProvider(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/yjs/${sessionId}-workspace`, `${sessionId}-workspace`, ydoc);
    const ymap = ydoc.getMap('workspace');
    workspaceMapRef.current = ymap;

    providerRef.current.awareness.setLocalStateField('user', {
      name: username || 'Guest',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16)
    });

    const updateParticipants = () => {
      const states = Array.from(providerRef.current.awareness.getStates().values());
      setParticipants(states.filter(s => s.user).map(s => s.user));
    };
    providerRef.current.awareness.on('change', updateParticipants);
    setYjsReady(true);
    updateParticipants();

    ymap.observe(() => {
      const syncedFiles = ymap.get('files_metadata');
      if (syncedFiles) {
        setFiles(prev => {
           // Merge content from previous files
           return syncedFiles.map(sf => {
              const prevF = prev.find(p => p.name === sf.name);
              return { ...sf, content: prevF ? prevF.content : '' };
           });
        });
      }
    });
    
    providerRef.current.on('sync', (isSynced) => {
      if (isSynced && !ymap.get('files_metadata')) {
         ymap.set('files_metadata', files.map(f => ({ name: f.name, language: f.language })));
         files.forEach(f => {
            const ytext = ydoc.getText(f.name);
            if (ytext.toString() === '') {
                ytext.insert(0, f.content);
            }
         });
      }
    });

    return () => { 
      setYjsReady(false);
      providerRef.current.awareness.setLocalState(null);
      providerRef.current.destroy(); 
      ydoc.destroy(); 
    };
  }, [sessionId]);

  // Sync editor state when switching tabs
  useEffect(() => {
    const file = files.find(f => f.name === activeFileName);
    if (file) {
      setCode(file.content);
      setLanguage(file.language);
    }
  }, [activeFileName, files]);


  useEffect(() => {
    if (files.length > 0 && !files.find(f => f.name === activeFileName)) {
      setActiveFileName(files[0].name);
    }
  }, [files, activeFileName]);

  // Auto-save active file on code change
  const handleCodeChange = (newCode) => {
    setCode(newCode);
    setFiles(prev => {
      const updated = prev.map(f => f.name === activeFileName ? { ...f, content: newCode } : f);
      // try { localStorage.setItem("ide_virtual_files", JSON.stringify(updated)); } catch(e){}
      return updated;
    });
  };

  // Execution playback hook
  const {
    state: execState,
    play, pause, stepForward, stepBack, reset, setSpeed,
  } = useExecutionPlayback(execEvents);

  const handleEditorCommand = (commandId) => {
    if (editorRef.current) editorRef.current.triggerCommand(commandId);
  };

  // WebSocket connection
  useEffect(() => {
    let reconnectTimeout;
    const connectWebSocket = () => {
      if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) return;
      const wsUrl = sessionId ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/execute/${sessionId}` : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/execute/local`;
      ws.current = new WebSocket(wsUrl);
      ws.current.onopen = () => setWsConnected(true);
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'exec_event') {
          if (data.event.type === 'print_output') {
             setOutput(prev => prev + (data.event.output_text || ''));
          } else if (data.event.type === 'input_request') {
             setOutput(prev => prev + `\x1b[1;33m${data.event.prompt || ''}\x1b[0m`);
          }
          setExecEvents(prev => [...prev, data.event]);
        } else if (data.type === 'execution_complete') {
          if (data.has_error) {
            setOutput(prev => prev + '❌ ' + data.output + '\n');
          } else {
            setOutput(prev => prev + data.output);
          }
        } else if (data.type === 'execution_output') {
          setOutput(prev => prev + data.output);
        } else if (data.type === 'array_update') {
          setTraces(prev => [...prev, data.trace_data]);
        }
      };
      ws.current.onclose = () => { setWsConnected(false); reconnectTimeout = setTimeout(connectWebSocket, 2000); };
      ws.current.onerror = () => setWsConnected(false);
    };
    connectWebSocket();
    return () => { clearTimeout(reconnectTimeout); if (ws.current) { ws.current.onclose = null; ws.current.close(); } };
  }, [sessionId]);

  const handleNewFile = () => {
    if (files.length >= 5) { alert('Maximum of 5 files allowed for guest sessions.'); return; }
    const newName = `untitled${files.length + 1}.py`;
    const newFiles = [...files, { name: newName, content: '', language: 'python' }];
    setFiles(newFiles);
    localStorage.setItem('ide_virtual_files', JSON.stringify(newFiles));
    if (workspaceMapRef.current) workspaceMapRef.current.set('files_metadata', newFiles.map(f => ({ name: f.name, language: f.language })));
    setActiveFileName(newName);
    setOutput(''); setExecEvents([]); setTraces([]); reset(); 
  };

  const handleOpenFile = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.py,.c,.cpp,.txt';
    input.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      if (files.length >= 5 && !files.find(f => f.name === file.name)) {
        alert('Maximum of 5 files allowed for guest sessions. Please delete a file first.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => { 
        let lang = 'python';
        if (file.name.endsWith('.c')) lang = 'c';
        else if (file.name.endsWith('.cpp')) lang = 'cpp';
        
        setFiles(prev => {
          let updated = [...prev];
          const existingIdx = updated.findIndex(f => f.name === file.name);
          if (existingIdx >= 0) updated[existingIdx] = { name: file.name, content: ev.target.result, language: lang };
          else updated.push({ name: file.name, content: ev.target.result, language: lang });
          try { localStorage.setItem("ide_virtual_files", JSON.stringify(updated)); } catch(e){}
          if (workspaceMapRef.current) workspaceMapRef.current.set('files_metadata', updated.map(f => ({ name: f.name, language: f.language })));
          return updated;
        });
        setActiveFileName(file.name);
        setExecEvents([]); setTraces([]); reset(); 
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleSaveFile = () => { 
     localStorage.setItem('ide_virtual_files', JSON.stringify(files)); 
     alert('Workspace saved to local storage!'); 
  };

  const handleSaveAs = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = activeFileName;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleSearchAction = (actionId) => {
    switch(actionId) {
      case 'run':
        handleRunCode();
        break;
      case 'zen_mode':
        setZenMode(true);
        break;
      case 'collab':
        handleCollaborate();
        break;
      case 'settings':
        setShowSettings(true);
        break;
      case 'ai_tutor':
        setOutput(prev => prev + '\n\x1b[1;36m[AI Core] Checking neural pathways... No major code anomalies detected. You are writing excellent code!\x1b[0m\n');
        setActiveBottomTab('output');
        break;
      case 'theme':
        handleThemeChange((theme === 'synthwave' ? 'neon' : (theme === 'neon' ? 'vscode' : 'synthwave')));
        break;
      case 'file_main':
        if (files.some(f => f.name === 'main.py')) setActiveFileName('main.py');
        break;
      case 'file_util':
        if (files.some(f => f.name === 'utils.c')) setActiveFileName('utils.c');
        break;
      case 'file_config':
        if (files.some(f => f.name === 'config.json')) setActiveFileName('config.json');
        break;
    }
  };

  const handleVoiceCommand = (cmd) => {
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

  const handleRunCode = () => {
    setOutput(''); setExecEvents([]); setTraces([]); reset();
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ code, language }));
      setTimeout(play, 500);
    } else {
      setOutput('⚠ Connecting to server... Please try again in a moment.\n');
      if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
        const wsUrl = sessionId ? `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/execute/${sessionId}` : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws/execute/local`;
        ws.current = new WebSocket(wsUrl);
        ws.current.onopen = () => { setWsConnected(true); setOutput(''); ws.current.send(JSON.stringify({ code, language })); };
        ws.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.type === 'exec_event') {
            if (data.event.type === 'print_output') {
               setOutput(prev => prev + (data.event.output_text || ''));
            } else if (data.event.type === 'input_request') {
               setOutput(prev => prev + `\x1b[1;33m${data.event.prompt || ''}\x1b[0m`);
            }
            setExecEvents(prev => [...prev, data.event]);
          } else if (data.type === 'execution_complete') {
            if (data.has_error) {
              setOutput(prev => prev + '❌ ' + data.output + '\n');
            } else {
              setOutput(prev => prev + data.output);
            }
          } else if (data.type === 'execution_output') {
            setOutput(prev => prev + data.output);
          } else if (data.type === 'array_update') {
            setTraces(prev => [...prev, data.trace_data]);
          }
        };
        ws.current.onclose = () => setWsConnected(false);
      }
    }
  };

  const handleActivityClick = (id) => {
    if (id === 'account') {
      setShowAuthModal(true);
      return;
    }
    if (id === 'settings') {
      setShowSettingsModal(true);
      return;
    }
    if (id === 'search') {
      setIsSearchOpen(true);
      return;
    }
    setActiveActivity(prev => prev === id ? null : id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="ide-shell flex flex-col h-screen w-screen bg-transparent overflow-hidden text-white relative z-0"
    >
      <SciFiBackground />
      <VoiceMacroCaster onCommand={handleVoiceCommand} />
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      <SettingsModal 
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        fontSize={editorFontSize}
        setFontSize={setEditorFontSize}
        fontFamily={editorFontFamily}
        setFontFamily={setEditorFontFamily}
      />
      <CollaborationModal 
        isOpen={collabModalOpen} 
        onClose={() => setCollabModalOpen(false)} 
        onJoinSession={handleJoinSession}
        initialSessionId={initialSessionId}
      />
      
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center">
          <div className="bg-[#1e1e1e] border border-gray-700 rounded-xl shadow-2xl w-[400px] overflow-hidden flex flex-col p-6">
            <h2 className="text-xl font-bold text-white mb-2">Leave Session</h2>
            <p className="text-gray-400 text-sm mb-6">How was your collaboration experience?</p>
            
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => setReviewRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star 
                    size={32} 
                    className={star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'} 
                  />
                </button>
              ))}
            </div>

            <textarea 
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell us what you liked or what could be improved..."
              className="bg-[#2d2d2d] border border-gray-600 rounded-lg p-3 text-sm text-white outline-none focus:border-blue-500 resize-none h-24 mb-6"
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2 rounded-lg font-medium bg-[#3c3c3c] hover:bg-[#4d4d4d] text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={submitReviewAndExit}
                className="flex-1 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Exit Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Bar */}
      {!zenMode && (
      <div className="flex-none">
        <MenuBar
          onZenMode={() => setZenMode(true)}
          onRunCode={handleRunCode}
          onNewFile={handleNewFile}
          onOpenFile={handleOpenFile}
          onSave={handleSaveFile}
          onSaveAs={handleSaveAs}
          onToggleCurriculum={() => { }}
          onToggleTerminal={() => { }}
          onEditorCommand={handleEditorCommand}
          onCollaborate={() => setCollabModalOpen(true)}
          onExitSession={handleExitSession}
          onOpenSearch={() => setIsSearchOpen(true)}
          participants={participants}
          sessionId={sessionId}
          currentTheme={theme}
          onThemeChange={setTheme}
        />
      </div>
      )}

      {/* Main Workspace: Activity Bar + Content */}
      <div className={`flex-1 flex overflow-hidden ${zenMode ? 'p-0' : 'p-4 gap-4'}`}>
        {/* Activity Bar + Explorer */}
        {!zenMode && (
        <div className="h-full neon-panel">
          <ActivityBar 
            activeItem={activeActivity} 
            onItemClick={handleActivityClick} 
            files={files}
            activeFileName={activeFileName}
            onFileSelect={setActiveFileName}
            onFileCreate={handleNewFile}
            onFileRename={(oldName, newName) => {
              if (oldName === newName) return;
              if (files.some(f => f.name === newName)) { alert('File already exists'); return; }
              setFiles(prev => {
                const updated = prev.map(f => {
                  if (f.name === oldName) {
                    let lang = f.language;
                    if (newName.endsWith('.py')) lang = 'python';
                    else if (newName.endsWith('.c')) lang = 'c';
                    else if (newName.endsWith('.cpp')) lang = 'cpp';
                    return { ...f, name: newName, language: lang };
                  }
                  return f;
                });
                try { localStorage.setItem("ide_virtual_files", JSON.stringify(updated)); } catch(e){}
                if (workspaceMapRef.current) workspaceMapRef.current.set('files_metadata', updated.map(f => ({ name: f.name, language: f.language })));
                return updated;
              });
              if (activeFileName === oldName) setActiveFileName(newName);
            }}
            onFileDelete={(name) => {
              if (files.length <= 1) { alert('Cannot delete the last file.'); return; }
              setFiles(prev => {
                const updated = prev.filter(f => f.name !== name);
                try { localStorage.setItem("ide_virtual_files", JSON.stringify(updated)); } catch(e){}
                if (workspaceMapRef.current) workspaceMapRef.current.set('files_metadata', updated.map(f => ({ name: f.name, language: f.language })));
                if (activeFileName === name) setActiveFileName(updated[0].name);
                return updated;
              });
            }}
          />
        </div>
        )}

        {/* Main Content Area */}
        <div className={`flex-1 ${zenMode ? 'flex flex-col' : 'grid grid-cols-[1fr_380px] gap-4'} overflow-hidden`}>

          {/* LEFT: Editor + Terminal */}
          <div className="flex flex-col gap-4 overflow-hidden h-full">

            {/* Editor Section */}
            <div className={`flex-1 flex flex-col min-h-0 ${zenMode ? '' : 'neon-panel'}`}>
              <EditorTabs 
                files={files}
                activeFileName={activeFileName}
                onFileSelect={setActiveFileName}
                onFileClose={(name) => {
                  if (files.length <= 1) { alert('Cannot close the last file.'); return; }
                  setFiles(prev => {
                    const updated = prev.filter(f => f.name !== name);
                    try { localStorage.setItem("ide_virtual_files", JSON.stringify(updated)); } catch(e){}
                    if (activeFileName === name) setActiveFileName(updated[0].name);
                    return updated;
                  });
                }}
              />

              {/* Editor toolbar / breadcrumb */}
              <div className="border-b border-[#a855f7]/30 p-2 flex justify-between bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-2 px-2">
                  <span className="text-[#8b949e] text-[13px] font-mono">src</span>
                  <ChevronRight size={14} className="text-[#6e7681]" />
                  <span className="text-[#c9d1d9] text-[13px] font-mono font-bold tracking-wide">{activeFileName}</span>
                </div>
                <div className="flex gap-3 pr-2">

                  <select 
                     value={language} 
                     onChange={(e) => {
                        const newLang = e.target.value;
                        setLanguage(newLang);
                        setFiles(prev => {
                           const updated = prev.map(f => f.name === activeFileName ? { ...f, language: newLang } : f);
                           try { localStorage.setItem("ide_virtual_files", JSON.stringify(updated)); } catch(e){}
                           return updated;
                        });
                     }} 
                     className="text-[11px] font-mono tracking-wide bg-[#1a1525]/40 text-[#c9d1d9] border border-white/10 rounded-md px-3 py-1 outline-none cursor-pointer hover:border-[#a855f7]/50 focus:border-[#a855f7] focus:shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all"
                  >
                    <option value="python">Python 3 ⌄</option>
                    <option value="c">C (GCC) ⌄</option>
                    <option value="cpp">C++ (GCC) ⌄</option>
                  </select>
                  <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="bg-[#1a1525]/80 hover:bg-[#a855f7]/20 border border-[#a855f7]/60 text-white px-4 py-1 rounded flex items-center gap-1.5 text-[11px] font-bold tracking-widest transition-all shadow-[0_0_10px_rgba(168,85,247,0.3)] uppercase" 
                    onClick={handleRunCode}
                  >
                    <Play size={12} className="text-[#c084fc]" fill="currentColor" />
                    RUN
                  </motion.button>
                </div>
              </div>

              {/* Monaco Editor Container */}
              <div className="flex-1 min-h-0 relative">
                <MonacoEditorWithCommands
                  ref={editorRef}
                  language={language}
                  value={code}
                  onCodeChange={handleCodeChange}
                  yText={activeYText}
                  awareness={awareness}
                  activeLine={execState.activeLine}
                  editorFontSize={editorFontSize}
                  editorFontFamily={editorFontFamily}
                  sessionId={sessionId}
                  username={username}
                  activeFileName={activeFileName}
                />
              </div>
            </div>

            {/* Terminal Panel */}
            {!zenMode && (
            <div className="h-[200px] flex flex-col neon-panel">
              {/* Terminal tab bar */}
              <div className="bottom-panel-header">
                <div className="bottom-panel-tabs">
                  <button 
                    className={`bottom-panel-tab ${activeBottomTab === 'terminal' ? 'active' : ''}`}
                    onClick={() => setActiveBottomTab('terminal')}
                  >
                    TERMINAL
                  </button>
                  <button 
                    className={`bottom-panel-tab ${activeBottomTab === 'output' ? 'active' : ''}`}
                    onClick={() => setActiveBottomTab('output')}
                  >
                    OUTPUT
                  </button>
                  <button className="bottom-panel-tab text-gray-500 cursor-not-allowed">
                    DEBUG CONSOLE
                  </button>
                  <button className="bottom-panel-tab text-gray-500 cursor-not-allowed">
                    PROBLEMS
                    <span className="problems-badge">0</span>
                  </button>
                </div>
                <div className="bottom-panel-actions">
                  <button className="panel-action-btn" title="New Terminal">
                    <Plus size={16} />
                  </button>
                  <button className="panel-action-btn" title="Kill Terminal">
                    <Trash2 size={16} />
                  </button>
                  <button className="panel-action-btn" title="Close Panel">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-[#0d0d14] relative" style={{ minHeight: 0 }}>
                {/* TERMINAL TAB */}
                <div style={{ display: activeBottomTab === 'terminal' ? 'block' : 'none', height: '100%', width: '100%' }}>
                  <TerminalPanel ws={ws} play={play} output={output} />
                </div>
                {/* OUTPUT TAB */}
                <div style={{ display: activeBottomTab === 'output' ? 'block' : 'none', height: '100%', width: '100%', padding: '12px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap', color: '#e5e5e5' }}>
                  {output || 'No output generated yet.'}
                </div>
              </div>
            </div>
            )}
          </div>

          {/* RIGHT: Execution Visualizer */}
          {!zenMode && (
          <div className="flex flex-col h-full neon-panel">
            <div className="h-full w-full flex flex-col overflow-hidden">
              <ExecutionVisualizer
                execState={execState}
                traces={traces}
                onPlay={play}
                onPause={pause}
                onStepForward={stepForward}
                onStepBack={stepBack}
                onReset={reset}
                onSpeedChange={setSpeed}
              />
            </div>
          </div>
          )}

        </div>
      </div>

      <NeuralSearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        onAction={handleSearchAction} 
      />
      {/* Status Bar */}
      {!zenMode && (
      <div className="flex-none">
        <StatusBar language={language} wsConnected={wsConnected} lastSaved={lastSaved} />
      </div>
      )}
      {zenMode && (
         <motion.div initial={{opacity:0}} animate={{opacity:1}} className="absolute top-4 right-4 z-50">
            <button onClick={() => setZenMode(false)} className="bg-[#a855f7]/20 hover:bg-[#a855f7]/40 text-[#e2e8f0] px-4 py-2 rounded-full border border-[#a855f7]/50 shadow-[0_0_15px_rgba(168,85,247,0.3)] text-xs font-mono font-bold tracking-widest uppercase backdrop-blur-md transition-all">
               Exit Zen Mode (ESC)
            </button>
         </motion.div>
      )}
    </motion.div>
  );
}

export default App;
 
