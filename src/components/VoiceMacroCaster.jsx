import React, { useState, useEffect, useRef } from 'react';
import { Mic, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VoiceMacroCaster({ onCommand }) {
    const [isListening, setIsListening] = useState(false);
    const [lastCommand, setLastCommand] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [supported, setSupported] = useState(true);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                setLastCommand(transcript);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
                processCommand(transcript);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setLastCommand(`Error: ${event.error}`);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            setSupported(false);
        }
    }, []);

    const processCommand = (text) => {
        if (text.includes('run') || text.includes('execute') || text.includes('play')) {
            onCommand('run');
        } else if (text.includes('zen') || text.includes('focus') || text.includes('distraction free')) {
            onCommand('zen_mode');
        } else if (text.includes('new file') || text.includes('create file')) {
            onCommand('new_file');
        } else if (text.includes('theme neon')) {
            onCommand('theme_neon');
        } else if (text.includes('theme synth') || text.includes('theme wave') || text.includes('synthwave')) {
            onCommand('theme_synthwave');
        } else if (text.includes('theme dark') || text.includes('theme default') || text.includes('theme code')) {
            onCommand('theme_vscode');
        } else if (text.includes('search') || text.includes('find') || text.includes('neural')) {
            onCommand('search');
        } else if (text.includes('collaborate') || text.includes('party') || text.includes('team')) {
            onCommand('collab');
        } else if (text.includes('close') || text.includes('exit')) {
             if (text.includes('zen')) {
                 onCommand('exit_zen');
             }
        }
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (e) {
                console.error(e);
            }
        }
    };

    if (!supported) return null;

    return (
        <>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleListening}
                title="Voice Cast Macro"
                className={`fixed bottom-24 right-8 z-50 p-4 rounded-full shadow-2xl flex items-center justify-center transition-all ${
                    isListening 
                        ? 'bg-[#ff3e6c] text-white shadow-[0_0_20px_rgba(255,62,108,0.6)] animate-pulse' 
                        : 'bg-[#1a1525]/80 border border-[#00f5ff]/30 text-[#00f5ff] hover:bg-[#00f5ff]/20 backdrop-blur-md'
                }`}
            >
                {isListening ? <Mic size={24} /> : <Zap size={24} />}
            </motion.button>

            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-40 right-8 z-50 bg-[#1a1525]/90 border border-[#a855f7]/50 text-white px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(168,85,247,0.4)] backdrop-blur-md font-mono text-sm"
                    >
                        <span className="text-[#a855f7]">Cast:</span> "{lastCommand}"
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
