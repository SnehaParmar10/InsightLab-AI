'use client';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Send, Settings, FolderOpen, User, Menu, ChevronLeft, Play, RefreshCw, Trash2, MoreVertical, Copy, History, BookOpen, Brain, X, ChevronRight, Zap, Trophy, CheckCircle, XCircle, Lightbulb, Cpu, RotateCcw, Target, ArrowRight, Loader2, LogOut, FlaskConical, FileText, Gamepad2, Calculator } from 'lucide-react';
import SimulatorTab from './SimulatorTab';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { osiLayerData, osiSimSteps } from './constants/osiData';


export default function WorkspacePage() {
    const { logout, user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('notes'); 

    
    const [sidebarOpen, setSidebarOpen] = useState(false); 
    const [sidebarLocked, setSidebarLocked] = useState(false); 
    const [mobileCanvasOpen, setMobileCanvasOpen] = useState(false);

    
    const [selectedOsiLayer, setSelectedOsiLayer] = useState(null);
    const [simStep, setSimStep] = useState(0);
    const [simRunning, setSimRunning] = useState(false);
    const [simLogs, setSimLogs] = useState([]);
    const [assembledHeaders, setAssembledHeaders] = useState([]);

    
    const [conversations, setConversations] = useState([]);
    const [activeConvId, setActiveConvId] = useState(null);
    const [activeMessageIndex, setActiveMessageIndex] = useState(null);

    const [messages, setMessages] = useState([
        { sender: 'ai', text: 'Loading your learning sessions...' }
    ]);
    const [quizQuestions, setQuizQuestions] = useState([]);
    const [loadingQuiz, setLoadingQuiz] = useState(false);
    const [notes, setNotes] = useState(null);
    const [loadingChat, setLoadingChat] = useState(false);
    const [thinkingPhase, setThinkingPhase] = useState(null); // null | 'thinking' | 'typing'
    const [typingText, setTypingText] = useState('');
    const [pendingAiMsg, setPendingAiMsg] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [simulationSuggestions, setSimulationSuggestions] = useState(null);
    const [isGenerating, setIsGenerating] = useState(null);
    const [selectedText, setSelectedText] = useState('');
    const [selectionPosition, setSelectionPosition] = useState(null);
    const chatEndRef = useRef(null);
    const getApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL !== undefined) {
        return process.env.NEXT_PUBLIC_API_URL;
    }
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
            return `http://${hostname}:5000`;
        }
    }
    return '/_/backend';
};

    const API = getApiUrl();

    const [currentQ, setCurrentQ] = useState(0);
    const [selectedAns, setSelectedAns] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [quizDone, setQuizDone] = useState(false);
    const [conceptRequestId, setConceptRequestId] = useState(null);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const fetchInitialConversations = async () => {
            try {
                const res = await fetch(`${API}/api/ai/conversations`, {
                    credentials: 'include'
                });
                if (res.status === 401) {
                    router.push('/login');
                    return;
                }
                if (!res.ok) throw new Error("Failed to fetch conversations");
                const data = await res.json();
                
                if (data.length > 0) {
                    setConversations(data);
                    
                    const savedId = localStorage.getItem('activeConvId');
                    const restoreConv = (savedId && data.some(c => c.id === savedId))
                        ? data.find(c => c.id === savedId)
                        : data[0];
                    
                    setActiveConvId(restoreConv.id);
                    localStorage.setItem('activeConvId', restoreConv.id);
                    
                    // Fetch messages
                    const msgRes = await fetch(`${API}/api/ai/conversations/${restoreConv.id}/messages`, {
                        credentials: 'include'
                    });
                    const msgData = await msgRes.json();
                    setMessages(msgData.length > 0 ? msgData : [
                        { sender: 'ai', text: 'Hi! How can I assist you? Ask me anything about networking or algorithms to get started.' }
                    ]);
                    
                    // Set quiz state
                    if (restoreConv.quizQuestions) {
                        setQuizQuestions(restoreConv.quizQuestions);
                    } else {
                        setQuizQuestions([]);
                    }
                    const qState = restoreConv.quizState || {};
                    setCurrentQ(qState.currentQ || 0);
                    setSelectedAns(qState.selectedAns !== undefined ? qState.selectedAns : null);
                    setSubmitted(qState.submitted || false);
                    setScore(qState.score || 0);
                    setQuizDone(qState.quizDone || false);

                    
                    // Set active message index and notes of the last AI message
                    let lastAiMsgIdx = null;
                    for (let i = msgData.length - 1; i >= 0; i--) {
                        if (msgData[i].sender === 'ai' && msgData[i].notes) {
                            lastAiMsgIdx = i;
                            break;
                        }
                    }
                    if (lastAiMsgIdx !== null) {
                        setActiveMessageIndex(lastAiMsgIdx);
                        setNotes(msgData[lastAiMsgIdx].notes);
                    } else {
                        setActiveMessageIndex(null);
                        setNotes(null);
                    }
                } else {
                    // Create default conversation
                    const newRes = await fetch(`${API}/api/ai/conversations`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ title: 'OSI Model and Networking' })
                    });
                    const newConv = await newRes.json();
                    setConversations([newConv]);
                    setActiveConvId(newConv.id);
                    
                    // Create first welcome message in DB
                    await fetch(`${API}/api/ai/conversations/${newConv.id}/messages`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            sender: 'ai',
                            text: 'Hi! How can I assist you? Ask me anything about networking or algorithms to get started.'
                        })
                    });
                    
                    setMessages([
                        { sender: 'ai', text: 'Hi! How can I assist you? Ask me anything about networking or algorithms to get started.' }
                    ]);
                    setNotes(null);
                    setActiveMessageIndex(null);
                    setQuizQuestions([]);
                    setCurrentQ(0);
                    setScore(0);
                    setQuizDone(false);
                }
            } catch (err) {
                console.error("Initial load conversations error:", err);
                const localDefaultConv = {
                    id: 'offline_1',
                    title: 'OSI Model and Networking (Offline)',
                    quizQuestions: [
                        { q: "What is the time complexity of Binary Search?", opts: ["O(N)", "O(log N)", "O(N²)", "O(1)"], ans: 1 },
                        { q: "Which OSI layer handles logical IP addressing?", opts: ["Layer 1", "Layer 2", "Layer 3", "Layer 4"], ans: 2 },
                        { q: "TCP operates at which OSI layer?", opts: ["Layer 3", "Layer 4", "Layer 5", "Layer 6"], ans: 1 }
                    ],
                    quizState: { currentQ: 0, selectedAns: null, submitted: false, score: 0, quizDone: false }
                };
                setConversations([localDefaultConv]);
                setActiveConvId('offline_1');
                setMessages([
                    { sender: 'ai', text: '⚠️ Connection issue with backend server. Operating in Offline Local Sandbox mode. Please make sure the backend processes are fully restarted (`npm run dev`).' },
                    { sender: 'ai', text: 'Hi! Ask me anything about science or programming to start an offline visual learning session.' }
                ]);
                setNotes(null);
                setActiveMessageIndex(null);
                setQuizQuestions(localDefaultConv.quizQuestions);
                setCurrentQ(0);
                setScore(0);
                setQuizDone(false);
            }
        };
        fetchInitialConversations();
    }, []);

    const updateActiveConv = (updates) => {
        setConversations(prev => prev.map(c => {
            if (c.id === activeConvId) {
                return { ...c, ...updates };
            }
            return c;
        }));
    };

    // Auto-scroll chat to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, thinkingPhase]);

    // Typewriter effect — runs when pendingAiMsg is set
    useEffect(() => {
        if (!pendingAiMsg) return;
        setThinkingPhase('typing');
        
        // Immediately load the notes so they appear while text is typing
        if (pendingAiMsg.notes) setNotes(pendingAiMsg.notes);
        const words = pendingAiMsg.text.split(' ');
        let i = 0;
        setTypingText('');
        
        // Max duration 0.5 seconds. Update every 20ms -> max 25 ticks.
        const wordsPerTick = Math.max(1, Math.ceil(words.length / 25));
        
        const interval = setInterval(() => {
            i += wordsPerTick;
            setTypingText(words.slice(0, i).join(' '));
            if (i >= words.length) {
                clearInterval(interval);
                // Commit the full message to messages array
                setMessages(prev => [...prev, pendingAiMsg]);
                setPendingAiMsg(null);
                setTypingText('');
                setThinkingPhase(null);
            }
        }, 20);
        return () => clearInterval(interval);
    }, [pendingAiMsg]);

    const handleMessageClick = (msg, index) => {
        if (msg.sender === 'ai') {
            if (msg.notes !== undefined) {
                setNotes(msg.notes);
            }
            setActiveMessageIndex(index);
            if (window.innerWidth < 1024) {
                setMobileCanvasOpen(true);
            }
        }
    };

    const switchConversation = async (newId) => {
        // Save current active state on the backend (fire-and-forget)
        if (activeConvId) {
            fetch(`${API}/api/ai/conversations/${activeConvId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    quizQuestions,
                    quizState: { currentQ, selectedAns, submitted, score, quizDone }
                })
            }).catch(e => console.error("Failed to save state on switch:", e));
        }

        const target = conversations.find(c => c.id === newId);
        if (target) {
            setActiveConvId(newId);
            localStorage.setItem('activeConvId', newId);
            
            try {
                // Fetch messages and refresh conversation list in parallel for speed
                const [msgRes, convRes] = await Promise.all([
                    fetch(`${API}/api/ai/conversations/${newId}/messages`, { credentials: 'include' }),
                    fetch(`${API}/api/ai/conversations`, { credentials: 'include' })
                ]);
                
                const msgData = await msgRes.json();

                if (convRes.ok) {
                    const freshConvs = await convRes.json();
                    setConversations(freshConvs);
                }

                setMessages(msgData.length > 0 ? msgData : [
                    { sender: 'ai', text: 'Hi! Ask me anything about science or programming to start a new visual learning session.' }
                ]);
                
                if (target.quizQuestions) {
                    setQuizQuestions(target.quizQuestions);
                } else {
                    setQuizQuestions([]);
                }
                
                const qState = target.quizState || {};
                setCurrentQ(qState.currentQ || 0);
                setSelectedAns(qState.selectedAns !== undefined ? qState.selectedAns : null);
                setSubmitted(qState.submitted || false);
                setScore(qState.score || 0);
                setQuizDone(qState.quizDone || false);
                setConceptRequestId(target.conceptRequestId || null);

                // Set notes/simulation of the last AI message containing notes
                let lastAiMsgIdx = null;
                for (let i = msgData.length - 1; i >= 0; i--) {
                    if (msgData[i].sender === 'ai' && msgData[i].notes) {
                        lastAiMsgIdx = i;
                        break;
                    }
                }
                if (lastAiMsgIdx !== null) {
                    setActiveMessageIndex(lastAiMsgIdx);
                    setNotes(msgData[lastAiMsgIdx].notes);
                } else {
                    setActiveMessageIndex(null);
                    setNotes(null);
                }
            } catch (err) {
                console.error("Failed to switch conversation:", err);
            }
        }
    };

    const handleNewChat = async () => {
        // Save current active state on backend (fire-and-forget)
        if (activeConvId) {
            fetch(`${API}/api/ai/conversations/${activeConvId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    quizQuestions,
                    quizState: { currentQ, selectedAns, submitted, score, quizDone }
                })
            }).catch(e => console.error("Failed to save state on new chat:", e));
        }

        // Create new conversation in DB
        try {
            const nextTitle = `New Chat ${conversations.length + 1}`;
            const res = await fetch(`${API}/api/ai/conversations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title: nextTitle })
            });
            const newConv = await res.json();
            
            // Create welcome message in DB (fire-and-forget)
            fetch(`${API}/api/ai/conversations/${newConv.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    sender: 'ai',
                    text: 'Hi! Ask me anything about science or programming to start a new visual learning session.'
                })
            }).catch(e => console.error("Failed to save welcome message:", e));

            setConversations(prev => [newConv, ...prev]);
            setActiveConvId(newConv.id);
            localStorage.setItem('activeConvId', newConv.id);
            setMessages([
                { sender: 'ai', text: 'Hi! Ask me anything about science or programming to start a new visual learning session.' }
            ]);
            setNotes(null);
            setQuizQuestions([]);
            setCurrentQ(0);
            setSelectedAns(null);
            setSubmitted(false);
            setScore(0);
            setQuizDone(false);
            setActiveMessageIndex(null);
            setConceptRequestId(null);
        } catch (err) {
            console.error("Failed to create new chat:", err);
            const localId = 'offline_' + Date.now();
            const newConv = {
                id: localId,
                title: `New Chat ${conversations.length + 1} (Offline)`,
                messages: [
                    { sender: 'ai', text: 'Hi! Ask me anything about science or programming to start an offline visual learning session.' }
                ],
                notes: null,
                simulation: null,
                simulationSuggestions: null,
                quizQuestions: [],
                currentQ: 0,
                selectedAns: null,
                submitted: false,
                score: 0,
                quizDone: false,
                activeMessageIndex: null,
                conceptRequestId: null
            };
            setConversations(prev => [newConv, ...prev]);
            setActiveConvId(localId);
            setMessages(newConv.messages);
            setNotes(null);
            setQuizQuestions([]);
            setCurrentQ(0);
            setSelectedAns(null);
            setSubmitted(false);
            setScore(0);
            setQuizDone(false);
            setActiveMessageIndex(null);
            setConceptRequestId(null);
        }
    };

    const handleDeleteConversation = async (convId, e) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this chat session?")) return;
        
        try {
            const res = await fetch(`${API}/api/ai/conversations/${convId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!res.ok) throw new Error("Failed to delete conversation");
            
            const updatedList = conversations.filter(c => c.id !== convId);
            setConversations(updatedList);
            toast.success("Session deleted");
            
            if (activeConvId === convId) {
                if (updatedList.length > 0) {
                    switchConversation(updatedList[0].id);
                } else {
                    setActiveConvId(null);
                    localStorage.removeItem('activeConvId');
                    setMessages([]);
                    setNotes(null);
                    setQuizQuestions([]);
                    setCurrentQ(0);
                    setScore(0);
                    setQuizDone(false);
                    setActiveMessageIndex(null);
                    setConceptRequestId(null);
                }
            }
        } catch (err) {
            console.error("Delete conversation error:", err);
            toast.error("Failed to delete session.");
        }
    };

    const handleQuizSubmit = async () => {
        if (selectedAns === null) return;
        const correct = selectedAns === quizQuestions[currentQ].ans;
        const newScore = correct ? score + 1 : score;
        if (correct) setScore(newScore);
        setSubmitted(true);
        updateActiveConv({ score: newScore, submitted: true });

        // Update quizState in local messages state for History panel
        if (activeMessageIndex !== null) {
            setMessages(prev => prev.map((msg, idx) =>
                idx === activeMessageIndex
                    ? { ...msg, quizState: { currentQ, selectedAns, submitted: true, score: newScore, quizDone: false } }
                    : msg
            ));
        }

        // Save quiz state to backend (fire-and-forget)
        if (activeConvId) {
            fetch(`${API}/api/ai/conversations/${activeConvId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    quizQuestions,
                    quizState: { currentQ, selectedAns, submitted: true, score: newScore, quizDone }
                })
            }).catch(e => console.error("Failed to sync quiz submission state:", e));
        }
    };

    const handleNextQ = async () => {
        const isFinished = currentQ + 1 >= quizQuestions.length;
        const nextVal = currentQ + 1;
        const newQuizDone = isFinished;

        if (isFinished) {
            setQuizDone(true);
            updateActiveConv({ quizDone: true });

            // Update quizState in local messages state — mark as done with final score
            if (activeMessageIndex !== null) {
                setMessages(prev => prev.map((msg, idx) =>
                    idx === activeMessageIndex
                        ? { ...msg, quizState: { currentQ, selectedAns: null, submitted: false, score, quizDone: true } }
                        : msg
                ));
            }

            if (conceptRequestId) {
                try {
                    const finalScore = Math.round((score / quizQuestions.length) * 100);
                    await fetch(`${API}/api/ai/quiz/attempt`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            conceptRequestId,
                            score: finalScore
                        })
                    });
                    console.log("Successfully logged quiz attempt to database!");
                } catch (e) {
                    console.error("Failed to persist quiz attempt:", e);
                }
            }
        } else {
            setCurrentQ(nextVal);
            setSelectedAns(null);
            setSubmitted(false);
            updateActiveConv({ currentQ: nextVal, selectedAns: null, submitted: false });

            // Update quizState in local messages state
            if (activeMessageIndex !== null) {
                setMessages(prev => prev.map((msg, idx) =>
                    idx === activeMessageIndex
                        ? { ...msg, quizState: { currentQ: nextVal, selectedAns: null, submitted: false, score, quizDone: false } }
                        : msg
                ));
            }
        }

        // Sync new quizState to backend (fire-and-forget)
        if (activeConvId) {
            fetch(`${API}/api/ai/conversations/${activeConvId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    quizQuestions,
                    quizState: { 
                        currentQ: isFinished ? currentQ : nextVal, 
                        selectedAns: null, 
                        submitted: false, 
                        score, 
                        quizDone: newQuizDone 
                    }
                })
            }).catch(e => console.error("Failed to sync quiz next state:", e));
        }
    };

    const handleTabSwitch = async (tab) => {
        setActiveTab(tab);
    };

    const handleClearMessageField = async (messageId, fieldType) => {
        if (!activeConvId || !messageId) return;
        
        let updates = {};
        if (fieldType === 'quiz') {
            updates = { quizQuestions: null, quizState: null };
        } else if (fieldType === 'notes') {
            updates = { notes: null };
        } else if (fieldType === 'simulator') {
            updates = { simulation: null };
        }
        
        if (activeConvId === 'offline_1' || (typeof messageId === 'string' && messageId.includes('offline'))) {
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, ...updates } : m));
            toast.success(`Removed from history.`);
            return;
        }
        
        try {
            const res = await fetch(`${API}/api/ai/conversations/${activeConvId}/messages/${messageId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(updates)
            });
            
            if (res.ok) {
                setMessages(prev => prev.map(m => m.id === messageId ? { ...m, ...updates } : m));
                toast.success(`Removed from history.`);
            } else {
                toast.error(`Failed to remove from history.`);
            }
        } catch (error) {
            console.error("Error clearing message field:", error);
            toast.error("An error occurred while removing from history.");
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!activeConvId) return;
        if (activeConvId === 'offline_1' || (messageId && typeof messageId === 'string' && messageId.includes('offline'))) {
            setMessages(prev => prev.filter(m => m.id !== messageId));
            return;
        }
        
        try {
            const res = await fetch(`${API}/api/ai/conversations/${activeConvId}/messages/${messageId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to delete message');
            }
            setMessages(prev => prev.filter(m => m.id !== messageId));
            
            // If the deleted message was active, clear the active states
            if (activeMessageIndex !== null) {
                const deletedMsgIndex = messages.findIndex(m => m.id === messageId);
                if (activeMessageIndex === deletedMsgIndex) {
                    setActiveMessageIndex(null);
                    setNotes(null);
                } else if (deletedMsgIndex < activeMessageIndex) {
                    // Adjust index if a previous message was deleted
                    setActiveMessageIndex(activeMessageIndex - 1);
                }
            }
            toast.success('Message deleted');
        } catch (err) {
            console.error("Delete message error:", err);
            toast.error("Failed to delete message");
        }
    };

    const resetQuiz = async () => {
        setCurrentQ(0);
        setSelectedAns(null);
        setSubmitted(false);
        setScore(0);
        setQuizDone(false);
        updateActiveConv({ currentQ: 0, selectedAns: null, submitted: false, score: 0, quizDone: false });

        if (activeConvId) {
            try {
                await fetch(`${API}/api/ai/conversations/${activeConvId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        quizQuestions,
                        quizState: { currentQ: 0, selectedAns: null, submitted: false, score: 0, quizDone: false }
                    })
                });
            } catch (e) {
                console.error("Failed to reset quiz state in DB:", e);
            }
        }
    };

    
    const bsArray = [2, 5, 8, 12, 16, 23, 38, 44, 56, 72];
    const bsTargetVal = 23;
    const [bsStep, setBsStep] = useState(-1);
    const [bsLow, setBsLow] = useState(0);
    const [bsHigh, setBsHigh] = useState(bsArray.length - 1);
    const [bsMid, setBsMid] = useState(null);
    const [bsFound, setBsFound] = useState(false);
    const [bsRunning, setBsRunning] = useState(false);
    const [bsLog, setBsLog] = useState([]);

    const startBinarySearch = () => {
        setBsStep(0); setBsLow(0); setBsHigh(bsArray.length - 1);
        setBsMid(null); setBsFound(false); setBsLog([]);
        setBsRunning(true);
        let low = 0, high = bsArray.length - 1, step = 0;
        const runStep = () => {
            if (low > high) {
                setBsLog(p => [...p, `❌ Not found! Search exhausted.`]);
                setBsRunning(false); return;
            }
            const mid = Math.floor((low + high) / 2);
            setBsLow(low); setBsHigh(high); setBsMid(mid); setBsStep(step);
            setBsLog(p => [...p, `Step ${step+1}: low=${low} high=${high} mid=${mid} → arr[${mid}]=${bsArray[mid]}`]);
            if (bsArray[mid] === bsTargetVal) {
                setBsFound(true); setBsRunning(false);
                setBsLog(p => [...p, `✅ Found ${bsTargetVal} at index ${mid}!`]);
                return;
            } else if (bsArray[mid] < bsTargetVal) {
                low = mid + 1;
                setBsLog(p => [...p, `  → Target > arr[mid], move low to ${low}`]);
            } else {
                high = mid - 1;
                setBsLog(p => [...p, `  → Target < arr[mid], move high to ${high}`]);
            }
            step++;
            setTimeout(runStep, 900);
        };
        setTimeout(runStep, 300);
    };
    const resetBs = () => { setBsStep(-1); setBsLow(0); setBsHigh(bsArray.length-1); setBsMid(null); setBsFound(false); setBsRunning(false); setBsLog([]); };

    const runSimulationStep = (stepIndex) => {
        const step = osiSimSteps[stepIndex];
        setSimLogs(prev => [...prev, `${step.name}: ${step.log}`]);
        
        setAssembledHeaders(prev => {
            if (step.layer === 7) {
                return [{ tag: step.tag, class: step.class }];
            } else if (step.layer === 2) {
                
                return [
                    { tag: "Eth Hdr", class: step.class },
                    ...prev,
                    { tag: "Eth Tail", class: "bg-blue-600 text-white border-blue-800" }
                ];
            } else if (step.layer === 1) {
                
                return prev;
            } else {
                
                return [{ tag: step.tag, class: step.class }, ...prev];
            }
        });
    };

    const startEncapsulation = () => {
        if (simRunning) return;
        setSimRunning(true);
        setSimStep(1);
        setSimLogs([]);
        setAssembledHeaders([]);

        let current = 0;
        const runNext = () => {
            if (current < osiSimSteps.length) {
                runSimulationStep(current);
                setSimStep(current + 1);
                current++;
                setTimeout(runNext, 1200);
            } else {
                setSimRunning(false);
            }
        };
        runNext();
    };

    const resetEncapsulator = () => {
        setSimStep(0);
        setSimRunning(false);
        setSimLogs([]);
        setAssembledHeaders([]);
    };
    const [inputValue, setInputValue] = useState('');

    const handleSend = async (e, textOverride = null) => {
        if (e) e.preventDefault();
        const textToSend = textOverride || inputValue;
        if (!textToSend.trim() || loadingChat) return;

        const userMsg = { sender: 'user', text: textToSend, createdAt: new Date().toISOString() };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        if (!textOverride) setInputValue('');
        setLoadingChat(true);
        setThinkingPhase('thinking');

        const currentActive = conversations.find(c => c.id === activeConvId);
        let titleUpdate = {};
        if (currentActive && (currentActive.title.startsWith("New Chat") || (messages.length === 1 && messages[0].text.startsWith("Hi! Ask me")))) {
            titleUpdate.title = textToSend.length > 25 ? textToSend.substring(0, 25) + '...' : textToSend;
        }

        updateActiveConv({ messages: updatedMessages, ...titleUpdate });

        try {
            // Strip heavy HTML (notes/simulation) from history to avoid 413 Payload Too Large
            const minimalMessages = updatedMessages.map(m => ({
                sender: m.sender,
                text: m.text
            }));

            const res = await fetch(`${API}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ messages: minimalMessages, conversationId: activeConvId })
            });
            
            let data;
            try {
                data = await res.json();
            } catch (jsonErr) {
                throw new Error(`Server connection failed (Status: ${res.status}). The backend may be restarting.`);
            }
            
            if (!res.ok) throw new Error(data.error || 'Failed to get AI response');

            const finalUserMsg = { 
                ...userMsg, 
                id: data.userMsgId || userMsg.id 
            };

            const aiMsg = {
                id: data.aiMsgId || undefined,
                sender: 'ai',
                text: data.text,
                notes: data.notes || null,
                simulation: data.simulation || null,
                simulation_suggestions: data.simulation_suggestions || null,
                createdAt: new Date().toISOString()
            };

            // Switch from thinking → typewriter
            setThinkingPhase(null);
            
            // Reconstruct final messages array without mutating the old one
            const baseMessages = messages.map(m => m);
            const finalMessages = [...baseMessages, finalUserMsg, aiMsg];
            
            setActiveMessageIndex(finalMessages.length - 1);
            setMessages([...baseMessages, finalUserMsg]);
            updateActiveConv({ messages: finalMessages, notes: data.notes || null });
            setPendingAiMsg(aiMsg);
        } catch (error) {
            console.error("Chat error:", error);
            setThinkingPhase(null);
            const finalMessages = [...updatedMessages, { sender: 'ai', text: `⚠️ Error: ${error.message}` }];
            setMessages(finalMessages);
            updateActiveConv({ messages: finalMessages });
        } finally {
            setLoadingChat(false);
        }
    };

    const handleGenerateQuiz = async () => {
        setLoadingQuiz(true);
        const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user')?.text || "OSI Model and Networking";

        try {
            const res = await fetch(`${API}/api/ai/quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ topic: lastUserMsg, conversationId: activeConvId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Unknown error');
            if (data.questions && data.questions.length > 0) {
                setQuizQuestions(data.questions);
                setCurrentQ(0);
                setSelectedAns(null);
                setSubmitted(false);
                setScore(0);
                setQuizDone(false);
                setConceptRequestId(data.conceptRequestId || null);

                // Find the latest AI message index and update its quizQuestions in local state
                // so the History panel can read it immediately
                const latestAiMsgIdx = [...messages].map((m, i) => ({ m, i }))
                    .reverse()
                    .find(({ m }) => m.sender === 'ai')?.i;

                // Use latestAiMsgIdx OR current activeMessageIndex (whichever is valid)
                const targetMsgIdx = latestAiMsgIdx !== undefined ? latestAiMsgIdx : activeMessageIndex;

                if (targetMsgIdx !== null && targetMsgIdx !== undefined) {
                    setActiveMessageIndex(targetMsgIdx);
                    setMessages(prev => prev.map((msg, idx) =>
                        idx === targetMsgIdx
                            ? { ...msg, quizQuestions: data.questions, quizState: { currentQ: 0, score: 0, submitted: false, quizDone: false } }
                            : msg
                    ));
                }

                updateActiveConv({
                    quizQuestions: data.questions,
                    currentQ: 0,
                    selectedAns: null,
                    submitted: false,
                    score: 0,
                    quizDone: false,
                    conceptRequestId: data.conceptRequestId || null
                });
            }
        } catch (error) {
            console.error("Quiz gen error:", error);
            toast.error(`Failed to generate quiz: ${error.message}`);
        } finally {
            setLoadingQuiz(false);
        }
    };


    

    // The local handleNotesMouseUp has been replaced by the global handleGlobalMouseUp in useEffect

    const handleExplainSelection = () => {
        if (!selectedText) return;
        const query = `Please explain this part from the notes: "${selectedText}"`;
        handleSend(null, query);
        setActiveTab('chat');
        setSelectionPosition(null);
        setSelectedText('');
        window.getSelection().removeAllRanges();
    };

    const handleAnalyzeConversation = async () => {
        if (!activeConvId) return;
        setIsAnalyzing(true);
        // Do not wipe previous suggestions so they remain visible
        try {
            const res = await fetch(`${API}/api/ai/simulation/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ conversationId: activeConvId })
            });
            const data = await res.json();
            if (res.ok && data.suggestions) {
                // Append new suggestions to existing ones
                setSimulationSuggestions(prev => prev ? [...prev, ...data.suggestions] : data.suggestions);
            } else {
                toast.error(data.error || 'Failed to analyze conversation');
            }
        } catch (error) {
            console.error("Analysis error:", error);
            toast.error("An error occurred during analysis.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateSimulation = async (title) => {
        if (!activeConvId) {
            toast.error("No active conversation found.");
            return;
        }
        if (!title) {
            toast.error("Error: Lab title is missing. Please try generating suggestions again.");
            return;
        }
        
        setIsGenerating(title);
        // Provide immediate feedback that the button was clicked
        toast.loading(`Starting generation for: ${title}`, { id: "generate-sim", duration: 3000 });
        
        try {
            const res = await fetch(`${API}/api/ai/simulation/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ conversationId: activeConvId, title })
            });
            const data = await res.json();
            
            toast.dismiss("generate-sim"); // clear loading toast
            
            if (res.ok && data.simulation && data.newMessages) {
                // Update conversation history with the newly created messages
                setMessages(prev => [...prev, ...data.newMessages]);
                toast.success("Lab generated successfully!");
                // Switch to the newly appended message containing the simulation
                setTimeout(() => {
                    setActiveMessageIndex(messages.length + 1); // since 2 messages are added, the AI one is at the end
                    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
                }, 100);
            } else {
                toast.error(data.error || 'Failed to generate simulation. The backend might have crashed.');
            }
        } catch (error) {
            console.error("Simulation generation error:", error);
            toast.dismiss("generate-sim");
            toast.error(`Error: ${error.message || 'An error occurred while generating.'}`);
        } finally {
            setIsGenerating(null);
        }
    };

    // Global keyboard shortcuts (Using Alt key to avoid browser conflicts like Ctrl+N for new window)
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore if typing in an input or textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            // Use Alt key instead of Ctrl/Cmd to prevent browser default hijacking (like New Window, Save Page, Browser History)
            if (e.altKey) {
                const key = e.key.toLowerCase();
                if (key === 'h') {
                    e.preventDefault();
                    setShowHistory(prev => !prev);
                } else if (key === 'c') {
                    e.preventDefault();
                    setSidebarLocked(prev => {
                        const newState = !prev;
                        setSidebarOpen(newState);
                        return newState;
                    });
                } else if (key === 's') {
                    e.preventDefault();
                    setActiveTab('simulator');
                } else if (key === 'q') {
                    e.preventDefault();
                    setActiveTab('quiz');
                } else if (key === 'n') {
                    e.preventDefault();
                    setActiveTab('notes');
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle text selection globally to show 'Explain this' button
    useEffect(() => {
        const handleSelectionChange = () => {
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed) {
                setSelectionPosition(null);
                setSelectedText('');
            }
        };

        const handleGlobalMouseUp = () => {
            setTimeout(() => {
                const selection = window.getSelection();
                if (!selection || selection.isCollapsed) return;
                
                const text = selection.toString().trim();
                if (text.length > 0) {
                    try {
                        const range = selection.getRangeAt(0);
                        const rect = range.getBoundingClientRect();
                        // Only show if the selection is visible on screen
                        if (rect.width > 0 && rect.height > 0) {
                            setSelectedText(text);
                            setSelectionPosition({
                                top: rect.top - 40,
                                left: rect.left + rect.width / 2,
                            });
                        }
                    } catch (e) {
                        // getRangeAt might fail in some edge cases
                    }
                }
            }, 10); // Small timeout allows browser to finish selection update
        };

        document.addEventListener('selectionchange', handleSelectionChange);
        document.addEventListener('mouseup', handleGlobalMouseUp);
        return () => {
            document.removeEventListener('selectionchange', handleSelectionChange);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, []);

    const isSidebarVisible = sidebarOpen || sidebarLocked;

    return (
        <div className="h-screen bg-[#0a0c10] text-slate-200 flex flex-col font-mono selection:bg-slate-700 selection:text-white relative overflow-hidden">
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes pulse-dot { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
                @keyframes fadeIn { from { opacity:0; transform:translateY(2px); } to { opacity:1; transform:translateY(0); } }
                
                /* Fluid Professional Logo Animation Timeline */
                @keyframes morphCapsuleLeft {
                  0% { transform: translateX(0); opacity: 1; }
                  15% { transform: translateX(-4px); opacity: 1; }
                  30%, 100% { transform: translateX(-20px); opacity: 0; }
                }
                @keyframes morphCapsuleRight {
                  0% { transform: translateX(0); opacity: 1; }
                  15% { transform: translateX(4px); opacity: 1; }
                  30%, 100% { transform: translateX(20px); opacity: 0; }
                }
                @keyframes morphPencil {
                  0%, 25% { opacity: 0; transform: scale(0.7) rotate(-15deg); }
                  32%, 55% { opacity: 1; transform: scale(1) rotate(0deg); }
                  62%, 100% { opacity: 0; transform: scale(0.8); }
                }
                @keyframes morphSplitLeftEraserToCC {
                  0%, 55% { opacity: 0; transform: translateX(-10px) scale(0.8); }
                  65%, 95% { opacity: 1; transform: translateX(0) scale(1); }
                  100% { opacity: 0; }
                }
                @keyframes morphSplitMiddleToI {
                  0%, 55% { opacity: 0; transform: translateY(10px) rotate(-90deg); }
                  65%, 95% { opacity: 1; transform: translateY(0) rotate(0deg); }
                  100% { opacity: 0; }
                }
                @keyframes morphSplitNibToAI {
                  0%, 55% { opacity: 0; transform: translateX(10px) scale(0.8); }
                  65%, 95% { opacity: 1; transform: translateX(0) scale(1); }
                  100% { opacity: 0; }
                }
                
                /* === Liquid Glass & Steel Chroma System === */
                :root {
                    --steel-light: #f1f5f9;
                    --steel-medium: #94a3b8;
                    --steel-dark: #334155;
                    --chroma-border: rgba(255, 255, 255, 0.08);
                    --glass-bg: rgba(255, 255, 255, 0.02);
                    --glass-bg-hover: rgba(255, 255, 255, 0.05);
                    --glass-border: rgba(255, 255, 255, 0.07);
                    --glass-border-active: rgba(255, 255, 255, 0.2);
                }
                
                /* Frosted liquid glass effect */
                .liquid-glass {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%) !important;
                    backdrop-filter: blur(24px) saturate(120%) !important;
                    -webkit-backdrop-filter: blur(24px) saturate(120%) !important;
                    border: 1px solid rgba(255, 255, 255, 0.08) !important;
                    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05), 0 8px 32px 0 rgba(0, 0, 0, 0.3) !important;
                }
                
                .steel-glow {
                    box-shadow: 0 0 16px rgba(255, 255, 255, 0.05);
                }
                
                /* Tabs styles - minimalist steel chroma */
                .tab-active {
                    background: rgba(255, 255, 255, 0.06) !important;
                    border: 1px solid rgba(255, 255, 255, 0.15) !important;
                    color: #ffffff !important;
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 12px rgba(255, 255, 255, 0.05);
                }
                
                .msg-ai-glow {
                    background: rgba(255, 255, 255, 0.01);
                    border: 1px solid rgba(255, 255, 255, 0.04);
                    transition: all 0.2s ease;
                }
                .msg-ai-glow:hover {
                    background: rgba(255, 255, 255, 0.02);
                    border-color: rgba(255, 255, 255, 0.1);
                }
                .msg-active-glow {
                    border-color: rgba(255, 255, 255, 0.25) !important;
                    background: rgba(255, 255, 255, 0.03) !important;
                    box-shadow: 0 0 16px rgba(255, 255, 255, 0.04);
                }
                
                .user-msg-bg {
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                /* Monochrome progress bar */
                .steel-progress {
                    background: linear-gradient(90deg, #334155, #94a3b8, #f1f5f9);
                    background-size: 200% 100%;
                }
                
                /* Buttons - Chrome steel */
                .btn-steel {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: #e2e8f0;
                    transition: all 0.2s ease;
                }
                .btn-steel:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.09);
                    border-color: rgba(255, 255, 255, 0.25);
                    color: #ffffff;
                }
                
                .sidebar-active {
                    background: rgba(255, 255, 255, 0.04);
                    border-color: rgba(255, 255, 255, 0.15) !important;
                }
                
                .quiz-option {
                    background: rgba(255, 255, 255, 0.01);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    transition: all 0.15s ease;
                }
                .quiz-option:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.03);
                    border-color: rgba(255, 255, 255, 0.15);
                }
                .quiz-option-selected {
                    border-color: rgba(255, 255, 255, 0.3) !important;
                    background: rgba(255, 255, 255, 0.05) !important;
                }
                .quiz-option-correct {
                    border-color: rgba(14, 184, 154, 0.4) !important;
                    background: rgba(14, 184, 154, 0.04) !important;
                    color: #2dd4bf !important;
                }
                .quiz-option-wrong {
                    border-color: rgba(239, 68, 68, 0.4) !important;
                    background: rgba(239, 68, 68, 0.04) !important;
                    color: #f87171 !important;
                }
                .msg-fade-in { animation: fadeIn 0.2s ease-out; }

                @keyframes kimiBlink {
                    0%, 92%, 100% { transform: scaleY(1); }
                    96% { transform: scaleY(0.1); }
                }
                @keyframes kimiScan {
                    0%, 100% { transform: translateX(0) scale(1); }
                    25% { transform: translateX(-3px) scale(0.9); }
                    50% { transform: translateX(0) scale(1.1); }
                    75% { transform: translateX(3px) scale(0.9); }
                }
                .kimi-eye-blink {
                    animation: kimiBlink 4s infinite;
                    transform-origin: center;
                }
                .kimi-pupil-scan {
                    animation: kimiScan 3s infinite ease-in-out;
                }
            ` }} />

            <div className="flex-1 flex overflow-hidden relative">

                <aside
                    onMouseLeave={() => { setSidebarOpen(false); setSidebarLocked(false); }}
                    className={`absolute lg:relative top-0 bottom-0 left-0 z-40 flex flex-col justify-between space-y-4 transition-all duration-300 ease-in-out liquid-glass ${isSidebarVisible
                            ? 'w-56 opacity-100 translate-x-0 p-4'
                            : 'w-0 opacity-0 -translate-x-full pointer-events-none p-0 overflow-hidden border-none'
                        }`}
                >
                    {/* Top Section: Profile, Logout, New Chat, Close Button */}
                    <div className="flex flex-col gap-3 pb-3 border-b border-white/10 shrink-0">
                        <div className="flex items-center justify-between lg:justify-end">
                            <div className="flex lg:hidden items-center gap-1">
                                <button 
                                    onClick={() => router.push('/profile')} 
                                    title="My Profile" 
                                    className="p-1 rounded-lg hover:bg-white/5 transition-all"
                                >
                                    <img 
                                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}&backgroundColor=0f172a&textColor=38bdf8`} 
                                        alt="Profile" 
                                        className="w-6 h-6 rounded-full object-cover shadow-sm border border-white/10" 
                                    />
                                </button>
                                <button 
                                    onClick={logout} 
                                    title="Sign Out" 
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5 hover:text-red-400 transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Always show close button on mobile, or if not locked */}
                            <button 
                                onClick={() => { setSidebarOpen(false); setSidebarLocked(false); }} 
                                className="text-slate-500 hover:text-white hover:bg-white/10 rounded p-1.5 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <button
                            onClick={() => {
                                handleNewChat();
                                if (window.innerWidth < 1024) {
                                    setSidebarOpen(false);
                                }
                            }}
                            className="w-full py-2 rounded-lg text-xs font-semibold transition-all text-center border border-white/10 bg-white/2 hover:bg-white/5 hover:border-white/20 text-slate-300 shadow-sm"
                        >
                            + New Chat
                        </button>
                    </div>

                    {/* Scrollable Conversation List */}
                    <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {conversations.map(conv => {
                            const isActive = conv.id === activeConvId;
                            if (isActive) {
                                return (
                                    <div key={conv.id} className="flex items-center justify-between p-2.5 rounded-lg text-xs select-none sidebar-active border">
                                        <div className="flex items-center gap-2 truncate">
                                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:'#ffffff', animation:'pulse-dot 2s ease infinite'}} />
                                            <span className="truncate font-semibold text-white">{conv.title}</span>
                                        </div>
                                        <button 
                                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                                            className="p-1 hover:text-red-400 transition-colors shrink-0 text-slate-500"
                                            title="Delete session"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            } else {
                                return (
                                    <div 
                                        key={conv.id} 
                                        onClick={() => {
                                            switchConversation(conv.id);
                                            if (window.innerWidth < 1024) {
                                                setSidebarOpen(false);
                                            }
                                        }}
                                        className="flex items-center justify-between text-slate-500 hover:text-slate-200 p-2.5 rounded-lg hover:bg-white/4 transition-all cursor-pointer group"
                                        style={{borderBottom:'1px solid transparent'}}
                                    >
                                        <span className="truncate text-xs">{conv.title}</span>
                                        <button 
                                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all shrink-0 text-slate-500"
                                            title="Delete session"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                );
                            }
                        })}
                    </div>
                </aside>
                
                {/* Mobile overlay for sidebar */}
                {isSidebarVisible && (
                    <div 
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
                        onClick={() => { setSidebarOpen(false); setSidebarLocked(false); }}
                    />
                )}

                <section className={`flex-1 flex-col min-h-0 overflow-hidden liquid-glass border-r ${mobileCanvasOpen ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="h-14 flex px-4 gap-3 items-center shrink-0 border-b bg-transparent" style={{borderColor:'rgba(255,255,255,0.06)'}}>
                        <button
                            onClick={() => {
                                if (!sidebarLocked) {
                                    setSidebarOpen(true);
                                    setSidebarLocked(true);
                                } else {
                                    setSidebarLocked(false);
                                    if (window.innerWidth < 1024) setSidebarOpen(false);
                                }
                            }}
                            className={`p-2 rounded-lg border transition-all duration-200 z-50 ${sidebarLocked
                                    ? 'text-white bg-[rgba(255,255,255,0.06)] shadow-[0_0_8px_rgba(255,255,255,0.15)]'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'
                                }`}
                            style={{borderColor: sidebarLocked ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}}
                        >
                            <Menu className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 select-none px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-400/20 to-slate-300/10 border border-slate-300/20 backdrop-blur-md shadow-[0_4px_16px_rgba(148,163,184,0.15)]">
                            <Brain className="w-5 h-5 text-slate-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                            <span className="text-lg font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-400 via-white to-slate-400 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]">
                                ConceptCraft <span className="text-[0.65em] opacity-80 font-extrabold uppercase ml-0.5 tracking-wider">AI</span>
                            </span>
                        </div>
                        <button
                            onClick={() => setMobileCanvasOpen(true)}
                            className={`ml-auto lg:hidden p-2 rounded-lg border border-white/10 bg-white/5 text-slate-300 items-center gap-2 text-xs font-bold hover:bg-white/10 transition-colors ${mobileCanvasOpen ? 'hidden' : 'flex'}`}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            Canvas
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-5">
                        {messages.map((msg, index) => {
                            if (msg.text?.startsWith('Generated simulation for:') || msg.text?.startsWith('Here is the interactive lab for:')) {
                                return null;
                            }
                            return (
                                <div key={index} className={`flex flex-col group/msg msg-fade-in ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                
                                {/* Avatar & Name Row (Placed above the message) */}
                                <div className={`flex items-center gap-2 mb-1.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {msg.sender === 'ai' ? (
                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center select-none shrink-0 overflow-hidden bg-[#0b0e11] border border-white/10">
                                            <img src="/kimi-eye.gif" alt="AI Avatar" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center select-none shrink-0 overflow-hidden bg-slate-800 border border-white/10">
                                            <img 
                                                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}&backgroundColor=0f172a&textColor=38bdf8`} 
                                                alt="User" 
                                                className="w-full h-full object-cover" 
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            {msg.sender === 'ai' ? 'ConceptCraft AI' : (user?.name || 'You')}
                                        </span>
                                        {msg.createdAt && (
                                            <span className="text-[9px] text-slate-600 font-medium">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                        {msg.id && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteMessage(msg.id);
                                                }}
                                                className="opacity-0 group-hover/msg:opacity-100 transition-opacity ml-1 p-1 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded"
                                                title="Delete Message"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className={`relative flex items-start ${msg.sender === 'user' ? 'max-w-[95%] justify-end' : 'w-full justify-start'}`}>
                                    <div
                                        onClick={() => handleMessageClick(msg, index)}
                                        className={`p-3.5 rounded-xl text-xs leading-relaxed border transition-all duration-200 ${
                                            msg.sender === 'user'
                                                ? 'user-msg-bg text-slate-200 rounded-tr-none'
                                                : `text-slate-300 rounded-tl-none cursor-pointer msg-ai-glow ${
                                                    activeMessageIndex === index
                                                        ? 'msg-active-glow text-slate-100'
                                                        : 'hover:border-[rgba(14,184,154,0.2)]'
                                                }`
                                        }`}
                                        style={msg.sender === 'ai' ? {background:'#0b0e11', borderColor: activeMessageIndex === index ? 'rgba(224,115,42,0.5)' : 'rgba(255,255,255,0.06)'} : {}}
                                    >
                                        {msg.sender === 'ai' ? (
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                                                    strong: ({node, ...props}) => <strong className="font-bold text-slate-100" {...props} />,
                                                    em: ({node, ...props}) => <em className="italic text-slate-400" {...props} />,
                                                    h1: ({node, ...props}) => <h1 className="text-sm font-bold text-cyan-400 mb-2 mt-4" {...props} />,
                                                    h2: ({node, ...props}) => <h2 className="text-xs font-bold text-emerald-400 mb-2 mt-3" {...props} />,
                                                    h3: ({node, ...props}) => <h3 className="text-[11px] font-bold text-amber-400 mb-1 mt-2" {...props} />,
                                                    code: ({node, inline, ...props}) => 
                                                        inline 
                                                            ? <code className="bg-white/10 px-1 py-0.5 rounded text-[10px] font-mono text-cyan-300" {...props} />
                                                            : <code className="block bg-black/50 p-2 rounded text-[10px] font-mono text-emerald-300 overflow-x-auto my-2" {...props} />,
                                                    ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                                    ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                                                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                                    a: ({node, ...props}) => <a className="text-cyan-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                                    table: ({node, ...props}) => <div className="overflow-x-auto my-3 rounded border border-white/10"><table className="w-full text-left text-[10px]" {...props} /></div>,
                                                    thead: ({node, ...props}) => <thead className="bg-white/5 uppercase text-slate-300 border-b border-white/10" {...props} />,
                                                    tbody: ({node, ...props}) => <tbody className="divide-y divide-white/5" {...props} />,
                                                    tr: ({node, ...props}) => <tr className="hover:bg-white/5 transition-colors" {...props} />,
                                                    th: ({node, ...props}) => <th className="px-3 py-2 font-semibold" {...props} />,
                                                    td: ({node, ...props}) => <td className="px-3 py-2 text-slate-300" {...props} />
                                                }}
                                            >
                                                {msg.text}
                                            </ReactMarkdown>
                                        ) : (
                                            <p>{msg.text}</p>
                                        )}
                                        {msg.sender === 'ai' && (msg.notes || msg.simulation || msg.simulation_suggestions) && (
                                            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                                <span>Lesson Context</span>
                                                <span className={activeMessageIndex === index ? 'text-cyan-400' : 'text-slate-550'}>
                                                    {activeMessageIndex === index ? '● Active' : '○ View'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Menu */}
                                    {msg.sender === 'ai' && (
                                        <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity ml-2 relative shrink-0">
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    navigator.clipboard.writeText(msg.text);
                                                    toast.success('Response copied to clipboard!', {
                                                        style: { background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
                                                    });
                                                }}
                                                title="Copy text"
                                                className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-white/10 active:scale-95 transition-all"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            );
                        })}

                        {/* Thinking bubble */}
                        {thinkingPhase === 'thinking' && (
                            <div className="flex items-start justify-start msg-fade-in">
                                <div className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center mr-3 select-none bg-[#0b0e11] shrink-0 overflow-hidden">
                                    <img src="/kimi-eye.gif" alt="AI Analyzing" className="w-full h-full object-cover" />
                                </div>
                                <div className="p-3.5 rounded-xl rounded-tl-none border border-white/8 bg-white/1 max-w-[80%] liquid-glass">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Analyzing</span>
                                        <span className="flex gap-1">
                                            <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:'0ms'}}/>
                                            <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:'150ms'}}/>
                                            <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{animationDelay:'300ms'}}/>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Typewriter bubble */}
                        {thinkingPhase === 'typing' && typingText && (
                            <div className="flex items-start justify-start">
                                <div className="w-7 h-7 rounded-lg border border-white/10 flex items-center justify-center mr-3 bg-[#0b0e11] select-none shrink-0 overflow-hidden">
                                    <img src="/kimi-eye.gif" alt="AI Typing" className="w-full h-full object-cover" />
                                </div>
                                <div className="p-3.5 rounded-xl rounded-tl-none border border-white/8 bg-[#0b0e11] max-w-[80%]">
                                    <div className="react-markdown-content text-xs leading-relaxed text-slate-200">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: ({node, ...props}) => <p className="mb-2 last:mb-0 inline-block" {...props} />,
                                                strong: ({node, ...props}) => <strong className="font-bold text-white" {...props} />,
                                                em: ({node, ...props}) => <em className="italic text-slate-400" {...props} />,
                                                h1: ({node, ...props}) => <h1 className="text-xs font-bold text-slate-200 mb-2 mt-4 uppercase tracking-wider" {...props} />,
                                                h2: ({node, ...props}) => <h2 className="text-xs font-semibold text-slate-300 mb-2 mt-3" {...props} />,
                                                h3: ({node, ...props}) => <h3 className="text-[10px] font-semibold text-slate-400 mb-1 mt-2" {...props} />,
                                                code: ({node, inline, ...props}) => 
                                                    inline 
                                                        ? <code className="bg-white/5 px-1 py-0.5 rounded text-[10px] font-mono text-slate-350" {...props} />
                                                        : <code className="block bg-black/30 p-2 rounded text-[10px] font-mono text-slate-300 overflow-x-auto my-2 border border-white/5" {...props} />,
                                                ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                                ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                                                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                                a: ({node, ...props}) => <a className="text-slate-300 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                                table: ({node, ...props}) => <div className="overflow-x-auto my-3 rounded border border-white/5"><table className="w-full text-left text-[10px]" {...props} /></div>,
                                                thead: ({node, ...props}) => <thead className="bg-white/2 uppercase text-slate-400 border-b border-white/5" {...props} />,
                                                tbody: ({node, ...props}) => <tbody className="divide-y divide-white/2" {...props} />,
                                                tr: ({node, ...props}) => <tr className="hover:bg-white/2 transition-colors" {...props} />,
                                                th: ({node, ...props}) => <th className="px-3 py-2 font-semibold" {...props} />,
                                                td: ({node, ...props}) => <td className="px-3 py-2 text-slate-350" {...props} />
                                            }}
                                        >
                                            {typingText}
                                        </ReactMarkdown>
                                        <span className="inline-block w-1.5 h-3 bg-white/50 ml-1 animate-pulse align-middle"></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>
                    <div className="pb-4 px-4 shrink-0 relative z-10">
                        <form onSubmit={handleSend} className="bg-white/5 border border-white/10 flex items-center space-x-2 p-1.5 pl-14 rounded-2xl shadow-xl transition-all focus-within:border-white/20 focus-within:bg-white/10 w-full mx-auto max-w-4xl">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                placeholder="Message ConceptCraft AI..."
                                disabled={loadingChat || thinkingPhase !== null}
                                className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed placeholder-slate-500"
                            />
                            <button
                                type="submit"
                                disabled={loadingChat || thinkingPhase !== null}
                                className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 disabled:hover:bg-white/10 transition-colors shrink-0"
                            >
                                {loadingChat || thinkingPhase !== null
                                    ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                    : <Send className="w-4 h-4" />
                                }
                            </button>
                        </form>
                    </div>
                </section>
                <main className={`flex-1 flex-col overflow-hidden min-h-0 liquid-glass ${mobileCanvasOpen ? 'flex' : 'hidden lg:flex'}`}>
                    <div className="h-12 flex px-4 gap-1.5 items-center shrink-0 border-b" style={{borderColor:'rgba(255,255,255,0.06)'}}>
                        <button
                            onClick={() => setMobileCanvasOpen(false)}
                            className="lg:hidden mr-2 p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-slate-400 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        {/* Notes tab */}
                        <button
                            onClick={() => handleTabSwitch('notes')}
                            className={`h-8 px-3.5 flex items-center gap-2 text-[11px] font-bold rounded-lg transition-all duration-200 ${
                                activeTab === 'notes' ? 'tab-active' : 'text-slate-500 hover:text-slate-300 hover:bg-white/4'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            Notes
                        </button>
                        {/* Quiz tab */}
                        <button
                            onClick={() => handleTabSwitch('quiz')}
                            className={`h-8 px-3.5 flex items-center gap-2 text-[11px] font-bold rounded-lg transition-all duration-200 ${
                                activeTab === 'quiz' ? 'tab-active' : 'text-slate-500 hover:text-slate-300 hover:bg-white/4'
                            }`}
                        >
                            <Calculator className="w-3.5 h-3.5" />
                            Quiz
                        </button>
                        {/* Simulator tab */}
                        <button
                            onClick={() => handleTabSwitch('simulator')}
                            className={`h-8 px-3.5 flex items-center gap-2 text-[11px] font-bold rounded-lg transition-all duration-200 ${
                                activeTab === 'simulator' ? 'tab-active' : 'text-slate-500 hover:text-slate-300 hover:bg-white/4'
                            }`}
                        >
                            <FlaskConical className="w-3.5 h-3.5" />
                            Simulator
                        </button>
                        <div className="ml-auto flex items-center gap-2">
                            <button
                                onClick={() => setShowHistory(h => !h)}
                                title="View History"
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                    showHistory
                                        ? 'text-white border-white/20 bg-white/5'
                                        : 'text-slate-550 border-transparent hover:text-slate-300 hover:bg-white/4'
                                }`}
                            >
                                <History className="w-3.5 h-3.5" />
                                History
                            </button>
                            
                            {/* Desktop only profile and logout */}
                            <div className="hidden lg:flex items-center gap-1 border-l border-white/10 pl-2">
                                <button 
                                    onClick={() => router.push('/profile')} 
                                    title="My Profile" 
                                    className="p-1 rounded-lg hover:bg-white/5 transition-all"
                                >
                                    <img 
                                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}&backgroundColor=0f172a&textColor=38bdf8`} 
                                        alt="Profile" 
                                        className="w-6 h-6 rounded-full object-cover shadow-sm border border-white/10" 
                                    />
                                </button>
                                <button 
                                    onClick={logout} 
                                    title="Sign Out" 
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-white/5 hover:text-red-400 transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ── History Panel (Context-Aware) ─────────────────────────── */}
                    {showHistory && (
                        <div className="absolute inset-0 z-50 bg-[#07090c]/98 backdrop-blur-md flex flex-col" style={{top: '48px'}}>
                            <div className="flex items-center justify-between px-5 py-3 border-b border-white/6">
                                <div className="flex items-center gap-2">
                                    <History className="w-4 h-4 text-slate-400" />
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                                        {activeTab === 'quiz' ? 'Quiz History' : activeTab === 'simulator' ? 'Simulation History' : 'Notes History'}
                                    </span>
                                    <span className="text-[9px] text-slate-500 border border-white/5 px-2 py-0.5 rounded-full font-mono bg-white/1">Session Log</span>
                                </div>
                                <button onClick={() => setShowHistory(false)} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5">

                                {/* === QUIZ TAB: Show Quiz History === */}
                                {activeTab === 'quiz' && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Past Quizzes</span>
                                        </div>
                                        {messages.filter(m => m.sender === 'ai' && m.quizQuestions && m.quizQuestions.length > 0).length === 0 ? (
                                            <div className="text-[11px] text-slate-600 italic py-8 text-center border border-white/5 rounded-lg">
                                                No quizzes generated yet in this conversation.<br/>Go to Quiz tab and generate one!
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {messages.map((msg, index) => {
                                                    if (msg.sender !== 'ai' || !msg.quizQuestions || msg.quizQuestions.length === 0) return null;
                                                    const qState = msg.quizState || {};
                                                    const isDone = qState.quizDone;
                                                    const scoreVal = qState.score || 0;
                                                    const total = msg.quizQuestions.length;
                                                    const preview = msg.quizQuestions[0]?.q || 'Quiz';
                                                    const isActive = activeMessageIndex === index;
                                                                return (
                                                        <div key={index} className="flex gap-2 w-full items-stretch">
                                                            <button
                                                                onClick={() => {
                                                                    setQuizQuestions(msg.quizQuestions);
                                                                    setCurrentQ(qState.currentQ || 0);
                                                                    setSelectedAns(qState.selectedAns !== undefined ? qState.selectedAns : null);
                                                                    setSubmitted(qState.submitted || false);
                                                                    setScore(scoreVal);
                                                                    setQuizDone(isDone || false);
                                                                    setActiveMessageIndex(index);
                                                                    setShowHistory(false);
                                                                }}
                                                                className={`flex-1 text-left p-3.5 rounded-lg border transition-all group ${
                                                                    isActive
                                                                        ? 'border-indigo-500/60 bg-indigo-950/40'
                                                                        : 'border-white/10 bg-white/5 hover:bg-indigo-950/30 hover:border-indigo-500/40'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-1.5 mb-1.5">
                                                                            {isActive && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300">Active</span>}
                                                                            {isDone && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-900/50 text-green-400">Completed</span>}
                                                                            {!isDone && (qState.currentQ > 0) && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-400">In Progress</span>}
                                                                            {!isDone && !qState.currentQ && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">Not Started</span>}
                                                                        </div>
                                                                        <p className="text-[11px] text-slate-200 font-semibold leading-tight">{preview.length > 70 ? preview.slice(0, 70) + '…' : preview}</p>
                                                                        <p className="text-[10px] text-slate-500 mt-1.5">{total} questions</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        {isDone && (
                                                                            <span className={`text-sm font-bold ${
                                                                                scoreVal >= total * 0.7 ? 'text-green-400' : 'text-red-400'
                                                                            }`}>
                                                                                {scoreVal}/{total}
                                                                            </span>
                                                                        )}
                                                                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                                                                    </div>
                                                                </div>
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleClearMessageField(msg.id, 'quiz'); }}
                                                                title="Delete from history"
                                                                className="p-3.5 rounded-lg border border-transparent hover:border-red-500/30 bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors shrink-0 flex items-center justify-center"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* === NOTES TAB: Show Notes History === */}
                                {activeTab === 'notes' && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Past Notes / Visualizations</span>
                                        </div>
                                        {messages.filter(m => m.sender === 'ai' && m.notes).length === 0 ? (
                                            <div className="text-[11px] text-slate-600 italic py-8 text-center border border-white/5 rounded-lg">
                                                No notes generated yet.<br/>Ask the AI a topic to generate visual study notes!
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {messages.map((msg, index) => {
                                                    if (msg.sender !== 'ai' || !msg.notes) return null;
                                                    const isActive = activeMessageIndex === index;
                                                    const snippet = msg.text?.slice(0, 100) || 'Study notes';
                                                    return (
                                                        <div key={index} className="flex gap-2 w-full items-stretch">
                                                            <button
                                                                onClick={() => {
                                                                    setActiveMessageIndex(index);
                                                                    setNotes(msg.notes);
                                                                    setShowHistory(false);
                                                                }}
                                                                className={`flex-1 text-left p-3.5 rounded-lg border transition-all group ${
                                                                    isActive
                                                                        ? 'border-amber-500/60 bg-amber-950/20'
                                                                        : 'border-white/10 bg-white/5 hover:bg-amber-950/10 hover:border-amber-500/30'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        {isActive && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-300 mb-1.5 inline-block">Active</span>}
                                                                        <p className="text-[11px] text-slate-300 leading-tight">{snippet.length > 100 ? snippet.slice(0, 100) + '…' : snippet}</p>
                                                                        <p className="text-[10px] text-slate-600 mt-1">Message #{index + 1}</p>
                                                                    </div>
                                                                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400 transition-colors shrink-0 mt-1" />
                                                                </div>
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleClearMessageField(msg.id, 'notes'); }}
                                                                title="Delete from history"
                                                                className="p-3.5 rounded-lg border border-transparent hover:border-red-500/30 bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors shrink-0 flex items-center justify-center"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* === SIMULATOR TAB: Show Simulation History === */}
                                {activeTab === 'simulator' && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Past Simulations</span>
                                        </div>
                                        {messages.filter(m => m.sender === 'ai' && m.simulation).length === 0 ? (
                                            <div className="text-[11px] text-slate-600 italic py-8 text-center border border-white/5 rounded-lg">
                                                No simulations generated yet.<br/>Go to Animation/Simulator tab and generate one!
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {messages.map((msg, index) => {
                                                    if (msg.sender !== 'ai' || !msg.simulation) return null;
                                                    const isActive = activeMessageIndex === index;
                                                    const title = msg.simulation?.title || 'Simulation';
                                                    const snippet = msg.text?.slice(0, 80) || '';
                                                    return (
                                                        <div key={index} className="flex gap-2 w-full items-stretch">
                                                            <button
                                                                onClick={() => {
                                                                    setActiveMessageIndex(index);
                                                                    if (msg.notes !== undefined) setNotes(msg.notes);
                                                                    setShowHistory(false);
                                                                }}
                                                                className={`flex-1 text-left p-3.5 rounded-lg border transition-all group ${
                                                                    isActive
                                                                        ? 'border-emerald-500/60 bg-emerald-950/20'
                                                                        : 'border-white/10 bg-white/5 hover:bg-emerald-950/10 hover:border-emerald-500/30'
                                                                }`}
                                                            >
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        {isActive && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-300 mb-1.5 inline-block">Active</span>}
                                                                        <p className="text-[11px] text-emerald-200 font-semibold">{title}</p>
                                                                        <p className="text-[10px] text-slate-500 mt-1 truncate">{snippet}</p>
                                                                    </div>
                                                                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors shrink-0 mt-1" />
                                                                </div>
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleClearMessageField(msg.id, 'simulator'); }}
                                                                title="Delete from history"
                                                                className="p-3.5 rounded-lg border border-transparent hover:border-red-500/30 bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors shrink-0 flex items-center justify-center"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                        </div>
                    )}


                    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                        {activeTab === 'notes' && (
                            <div className="w-full h-full bg-[#faf6eb] text-slate-800 overflow-hidden relative flex flex-col">
                                <style dangerouslySetInnerHTML={{ __html: `
                                    @import url('https://fonts.googleapis.com/css2?family=Architects+Daughter&family=Caveat:wght@400..700&family=Patrick+Hand&family=Gochi+Hand&family=Permanent+Marker&display=swap');

                                    /* ── Font Utilities ─────────────────────────────── */
                                    .font-notes, .notebook-canvas p, .notebook-canvas li {
                                        font-family: 'Patrick Hand', 'Caveat', cursive;
                                        font-size: 0.84rem;
                                        color: #1e293b;
                                        line-height: 1.65rem;
                                        font-weight: 500;
                                    }
                                    .font-hand {
                                        font-family: 'Patrick Hand', cursive;
                                        font-size: 0.8rem;
                                        color: #1e293b;
                                    }
                                    .font-title {
                                        font-family: 'Architects Daughter', cursive;
                                        font-weight: 800;
                                        color: #1e293b;
                                    }
                                    .font-marker {
                                        font-family: 'Permanent Marker', cursive;
                                        font-weight: bold;
                                    }
                                    .font-doodle {
                                        font-family: 'Gochi Hand', cursive;
                                    }
                                    .font-mono { font-family: 'Courier New', Courier, monospace; }
                                    .font-bold { font-weight: 700; }
                                    .font-black { font-weight: 900; }
                                    .font-semibold { font-weight: 600; }
                                    .italic { font-style: italic; }

                                    /* ── Notebook Canvas ────────────────────────────── */
                                    .notebook-canvas {
                                        background-color: #fcf8f2;
                                        background-image: linear-gradient(#e2dcd0 1px, transparent 1px);
                                        background-size: 100% 1.65rem;
                                        position: relative;
                                        box-shadow: inset 0 0 30px rgba(0,0,0,0.03);
                                        padding-left: 2.75rem !important;
                                    }
                                    .notebook-canvas::before {
                                        content: '';
                                        position: absolute;
                                        top: 0; left: 2rem; bottom: 0;
                                        width: 1.5px;
                                        background-color: rgba(239, 68, 68, 0.4);
                                        z-index: 5;
                                    }

                                    /* ── Highlighter Marks ──────────────────────────── */
                                    .highlight-yellow {
                                        background: linear-gradient(104deg, rgba(254, 240, 138, 0.85) 0%, rgba(254, 240, 138, 0.55) 100%);
                                        border-radius: 4px 10px 4px 12px;
                                        padding: 0.05rem 0.3rem;
                                    }
                                    .highlight-green {
                                        background: linear-gradient(104deg, rgba(187, 247, 208, 0.85) 0%, rgba(187, 247, 208, 0.45) 100%);
                                        border-radius: 4px 8px 4px 10px;
                                        padding: 0.05rem 0.3rem;
                                    }
                                    .highlight-cyan {
                                        background: linear-gradient(104deg, rgba(165, 243, 252, 0.75) 0%, rgba(165, 243, 252, 0.35) 100%);
                                        border-radius: 4px 12px 4px 10px;
                                        padding: 0.05rem 0.3rem;
                                    }
                                    .highlight-pink {
                                        background: linear-gradient(104deg, rgba(253, 164, 175, 0.75) 0%, rgba(253, 164, 175, 0.35) 100%);
                                        border-radius: 4px 10px 4px 10px;
                                        padding: 0.05rem 0.3rem;
                                    }

                                    /* ── Sketchy Borders ────────────────────────────── */
                                    .sketch-border {
                                        border: 2px solid #64748b;
                                        border-radius: 255px 12px 225px 12px/12px 225px 12px 255px;
                                    }
                                    .sketch-border-thin {
                                        border: 1.5px dashed #94a3b8;
                                        border-radius: 120px 12px 110px 12px/10px 115px 8px 105px;
                                    }

                                    /* ── Notes Content Base ─────────────────────────── */
                                    .notes-content { font-family: 'Patrick Hand', cursive; color: #1e293b; font-size: 0.84rem; line-height: 1.65rem; }
                                    .notes-content h1 { font-family: 'Architects Daughter', cursive; font-size: 1.4rem; font-weight: 900; color: #be123c; margin-bottom: 0.25rem; }
                                    .notes-content h2 { font-family: 'Architects Daughter', cursive; font-size: 1.1rem; font-weight: 800; color: #1e3a5f; margin-bottom: 0.35rem; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 3px; display: inline-block; }
                                    .notes-content h3 { font-family: 'Architects Daughter', cursive; font-size: 0.95rem; font-weight: 800; color: #1e293b; margin-bottom: 0.25rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; display: inline-block; }
                                    .notes-content h4 { font-family: 'Patrick Hand', cursive; font-size: 0.85rem; font-weight: 700; color: #0f172a; }
                                    .notes-content p { margin-bottom: 0.5rem; }
                                    .notes-content ul { list-style: disc; padding-left: 1.4rem; margin-bottom: 0.5rem; }
                                    .notes-content ol { list-style: decimal; padding-left: 1.4rem; margin-bottom: 0.5rem; }
                                    .notes-content li { margin-bottom: 0.2rem; font-size: 0.82rem; }
                                    .notes-content strong { font-weight: 700; color: #0f172a; }
                                    .notes-content em { font-style: italic; color: #475569; }
                                    .notes-content code { font-family: 'Courier New', monospace; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 4px; padding: 1px 5px; font-size: 0.78rem; color: #be123c; }
                                    .notes-content a { color: #0284c7; text-decoration: underline; }
                                    .notes-content table { width: 100%; border-collapse: collapse; font-size: 0.78rem; margin: 0.5rem 0; }
                                    .notes-content th { background: #f1f5f9; font-weight: 700; color: #475569; padding: 6px 10px; border: 1px solid #e2e8f0; text-align: left; }
                                    .notes-content td { padding: 5px 10px; border: 1px solid #e2e8f0; color: #334155; }
                                    .notes-content tr:nth-child(even) { background: #f8fafc; }

                                    /* ── Tooltips ─────────────────────────────────── */
                                    .term-tooltip {
                                        position: relative;
                                        cursor: help;
                                        border-bottom: 1.5px dashed #0284c7;
                                        color: #0284c7;
                                        font-weight: 600;
                                    }
                                    .term-tooltip:hover::after {
                                        content: attr(data-tooltip);
                                        position: absolute;
                                        bottom: 100%;
                                        left: 50%;
                                        transform: translateX(-50%);
                                        background: #1e293b;
                                        color: #f8fafc;
                                        padding: 0.4rem 0.6rem;
                                        border-radius: 6px;
                                        font-size: 0.75rem;
                                        font-family: 'Inter', sans-serif;
                                        white-space: normal;
                                        width: max-content;
                                        max-width: 200px;
                                        text-align: center;
                                        z-index: 10;
                                        pointer-events: none;
                                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                                        margin-bottom: 5px;
                                    }
                                    .term-tooltip:hover::before {
                                        content: '';
                                        position: absolute;
                                        bottom: 100%;
                                        left: 50%;
                                        transform: translateX(-50%);
                                        border: 5px solid transparent;
                                        border-top-color: #1e293b;
                                        margin-bottom: -5px;
                                    }

                                    /* ── Animations ───────────────────────────────── */
                                    @keyframes flow-marching-ants {
                                        to { stroke-dashoffset: -20; }
                                    }
                                    .flow-animate {
                                        stroke-dasharray: 5, 5;
                                        animation: flow-marching-ants 1s linear infinite;
                                    }
                                    @keyframes pulse-opacity {
                                        0%, 100% { opacity: 1; }
                                        50% { opacity: 0.5; }
                                    }
                                    .pulse-animate {
                                        animation: pulse-opacity 2s ease-in-out infinite;
                                    }

                                    /* ── Colour Utilities used by AI-generated HTML ── */
                                    /* backgrounds */
                                    .bg-stone-50  { background-color: #fafaf9; }
                                    .bg-stone-100 { background-color: #f5f5f4; }
                                    .bg-amber-50  { background-color: #fffbeb; }
                                    .bg-\\[\\#fdfbf6\\] { background-color: #fdfbf6; }
                                    .bg-rose-500\\/5   { background-color: rgba(244,63,94,0.05); }
                                    .bg-orange-500\\/5 { background-color: rgba(249,115,22,0.05); }
                                    .bg-amber-500\\/5  { background-color: rgba(245,158,11,0.05); }
                                    .bg-green-500\\/5  { background-color: rgba(34,197,94,0.05); }
                                    .bg-cyan-500\\/5   { background-color: rgba(6,182,212,0.05); }
                                    .bg-blue-500\\/5   { background-color: rgba(59,130,246,0.05); }
                                    .bg-purple-500\\/5 { background-color: rgba(168,85,247,0.05); }
                                    .bg-indigo-50\\/10 { background-color: rgba(238,242,255,0.1); }
                                    .bg-emerald-50\\/10{ background-color: rgba(236,253,245,0.1); }
                                    .bg-rose-500   { background-color: #f43f5e; }
                                    .bg-orange-500 { background-color: #f97316; }
                                    .bg-amber-500  { background-color: #f59e0b; }
                                    .bg-green-500  { background-color: #22c55e; }
                                    .bg-cyan-500   { background-color: #06b6d4; }
                                    .bg-blue-500   { background-color: #3b82f6; }
                                    .bg-purple-500 { background-color: #a855f7; }
                                    .bg-indigo-500 { background-color: #6366f1; }
                                    .bg-emerald-500{ background-color: #10b981; }
                                    .bg-emerald-600{ background-color: #059669; }
                                    .bg-emerald-700{ background-color: #047857; }
                                    .bg-stone-50\\/50 { background-color: rgba(250,250,249,0.5); }
                                    /* text colors */
                                    .text-white    { color: #ffffff !important; }
                                    .text-slate-800{ color: #1e293b; }
                                    .text-slate-700{ color: #334155; }
                                    .text-slate-600{ color: #475569; }
                                    .text-slate-500{ color: #64748b; }
                                    .text-stone-800{ color: #292524; }
                                    .text-stone-700{ color: #44403c; }
                                    .text-stone-600{ color: #57534e; }
                                    .text-stone-500{ color: #78716c; }
                                    .text-rose-700 { color: #be123c; }
                                    .text-rose-800 { color: #9f1239; }
                                    .text-orange-800{color: #9a3412; }
                                    .text-amber-600{ color: #d97706; }
                                    .text-amber-800{ color: #92400e; }
                                    .text-green-600{ color: #16a34a; }
                                    .text-green-800{ color: #166534; }
                                    .text-cyan-800 { color: #155e75; }
                                    .text-cyan-600 { color: #0891b2; }
                                    .text-blue-800 { color: #1e40af; }
                                    .text-purple-800{color: #6b21a8; }
                                    .text-indigo-900{color: #312e81; }
                                    .text-emerald-700{color: #047857; }
                                    .text-green-600 {color: #16a34a; }
                                    .text-red-600  { color: #dc2626; }
                                    /* borders */
                                    .border-stone-200{ border-color: #e7e5e4; }
                                    .border-stone-300{ border-color: #d6d3d1; }
                                    .border-rose-500\\/20   { border-color: rgba(244,63,94,0.2); }
                                    .border-orange-500\\/20 { border-color: rgba(249,115,22,0.2); }
                                    .border-amber-500\\/20  { border-color: rgba(245,158,11,0.2); }
                                    .border-green-500\\/20  { border-color: rgba(34,197,94,0.2); }
                                    .border-cyan-500\\/20   { border-color: rgba(6,182,212,0.2); }
                                    .border-blue-500\\/20   { border-color: rgba(59,130,246,0.2); }
                                    .border-purple-500\\/20 { border-color: rgba(168,85,247,0.2); }
                                    .border-indigo-200 { border-color: #c7d2fe; }
                                    .border-emerald-200{ border-color: #a7f3d0; }
                                    /* layout & spacing */
                                    .flex { display: flex; } .flex-col { flex-direction: column; } .flex-col-reverse { flex-direction: column-reverse; }
                                    .grid { display: grid; } .grid-cols-1 { grid-template-columns: repeat(1,minmax(0,1fr)); }
                                    .items-center { align-items: center; } .items-start { align-items: flex-start; }
                                    .justify-center { justify-content: center; }
                                    .gap-1 { gap: 0.25rem; } .gap-2 { gap: 0.5rem; } .gap-4 { gap: 1rem; } .gap-6 { gap: 1.5rem; }
                                    .space-y-1 > * + * { margin-top: 0.25rem; } .space-y-2 > * + * { margin-top: 0.5rem; }
                                    .space-y-4 > * + * { margin-top: 1rem; } .space-y-6 > * + * { margin-top: 1.5rem; }
                                    .p-2 { padding: 0.5rem; } .p-3 { padding: 0.75rem; } .p-4 { padding: 1rem; } .p-6 { padding: 1.5rem; }
                                    .px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
                                    .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
                                    .pt-6 { padding-top: 1.5rem; } .pb-12 { padding-bottom: 3rem; }
                                    .pl-5 { padding-left: 1.25rem; }
                                    .ml-3 { margin-left: 0.75rem; } .mt-1 { margin-top: 0.25rem; } .mt-2 { margin-top: 0.5rem; } .mt-3 { margin-top: 0.75rem; }
                                    .mb-1 { margin-bottom: 0.25rem; } .mb-2 { margin-bottom: 0.5rem; } .mb-4 { margin-bottom: 1rem; }
                                    .my-3 { margin-top: 0.75rem; margin-bottom: 0.75rem; } .my-4 { margin-top: 1rem; margin-bottom: 1rem; } .my-6 { margin-top: 1.5rem; margin-bottom: 1.5rem; }
                                    .mx-auto { margin-left: auto; margin-right: auto; }
                                    .w-full { width: 100%; } .w-8 { width: 2rem; } .w-24 { width: 6rem; } .w-10 { width: 2.5rem; }
                                    .h-8 { height: 2rem; } .h-32 { height: 8rem; } .h-10 { height: 2.5rem; }
                                    .max-w-sm { max-width: 24rem; } .max-w-xl { max-width: 36rem; }
                                    .shrink-0 { flex-shrink: 0; }
                                    .overflow-hidden { overflow: hidden; } .overflow-y-auto { overflow-y-auto; }
                                    .relative { position: relative; } .absolute { position: absolute; }
                                    .select-none { user-select: none; }
                                    .text-center { text-align: center; } .text-left { text-align: left; }
                                    /* typography sizes */
                                    .text-xs    { font-size: 0.75rem; line-height: 1rem; }
                                    .text-sm    { font-size: 0.875rem; line-height: 1.25rem; }
                                    .text-xl    { font-size: 1.25rem; line-height: 1.75rem; }
                                    .text-2xl   { font-size: 1.5rem; line-height: 2rem; }
                                    .text-\\[10px\\] { font-size: 10px; }
                                    .text-\\[11px\\] { font-size: 11px; }
                                    .text-\\[9px\\]  { font-size: 9px; }
                                    /* border, radius, shadow */
                                    .border { border: 1px solid; } .border-b { border-bottom: 1px solid; } .border-b-2 { border-bottom: 2px solid; }
                                    .rounded { border-radius: 0.25rem; } .rounded-md { border-radius: 0.375rem; } .rounded-full { border-radius: 9999px; }
                                    .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }
                                    .pb-0\\.5 { padding-bottom: 2px; }
                                    .inline-block { display: inline-block; }
                                    /* Notes section header strip */
                                    .notes-header-strip {
                                        background: linear-gradient(180deg, #fdf8ee 0%, #faf3e0 100%) !important;
                                        border-bottom: 3px solid #d97706 !important;
                                        border-left: 5px solid #d97706 !important;
                                        padding: 1.25rem 1.5rem !important;
                                        text-align: left !important;
                                        color: #1e293b !important;
                                        border-radius: 0 0.5rem 0.5rem 0 !important;
                                        margin-bottom: 1.5rem !important;
                                        box-shadow: 2px 3px 8px rgba(0,0,0,0.07) !important;
                                    }
                                    .notes-header-strip h1 {
                                        font-family: 'Architects Daughter', cursive !important;
                                        font-size: 1.5rem !important;
                                        font-weight: 800 !important;
                                        color: #be123c !important;
                                        margin: 0 0 0.3rem !important;
                                        text-shadow: none !important;
                                        background: transparent !important;
                                    }
                                    .notes-header-strip p {
                                        font-family: 'Patrick Hand', cursive !important;
                                        font-size: 0.8rem !important;
                                        color: #64748b !important;
                                        margin: 0 !important;
                                        text-shadow: none !important;
                                        background: transparent !important;
                                    }
                                    .notes-header-strip * {
                                        background: transparent !important;
                                        text-shadow: none !important;
                                    }
                                    /* Info callout box */
                                    .callout-box {
                                        background: #fdfbf6;
                                        border: 2px solid #64748b;
                                        border-radius: 255px 12px 225px 12px/12px 225px 12px 255px;
                                        padding: 1rem 1.25rem;
                                        margin: 1rem 0;
                                        box-shadow: 0 1px 3px rgba(0,0,0,0.06);
                                    }
                                    /* Grid layout for cards */
                                    .grid-2 {
                                        display: grid;
                                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                                        gap: 1rem;
                                        margin: 1rem 0;
                                    }
                                    /* Layer / concept card */
                                    .concept-card {
                                        display: flex;
                                        flex-direction: column;
                                        border: 2px solid #e7e5e4;
                                        border-radius: 0.5rem;
                                        padding: 1rem;
                                        background: #fafaf9;
                                        box-shadow: 2px 3px 0px rgba(0,0,0,0.05);
                                    }
                                    .concept-card .badge {
                                        width: 2rem; height: 2rem; border-radius: 0.25rem;
                                        color: white; font-weight: 700; font-size: 0.75rem;
                                        display: flex; align-items: center; justify-content: center;
                                        margin-bottom: 0.5rem;
                                    }
                                    .concept-card h3, .concept-card h4 { font-size: 1.1rem; font-weight: 700; margin: 0 0 0.5rem; color: #1e293b; }
                                    .concept-card p  { font-size: 0.85rem; color: #475569; margin: 0; line-height: 1.5; }
                                `}} />
                                {notes ? (
                                    <>
                                        <div 
                                            className="notebook-canvas pr-6 md:pr-12 pt-6 pb-12 font-notes overflow-y-auto flex-1 text-stone-800 notes-content relative" 
                                            dangerouslySetInnerHTML={{ __html: notes }} 
                                        />
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-6 text-center select-none text-slate-400">
                                        <div className="text-5xl opacity-50">📓</div>
                                        <h3 className="text-lg font-bold text-slate-300">No Notes Yet</h3>
                                        <p className="text-xs max-w-xs leading-relaxed">
                                            Ask me a question or start a new visual learning session to generate beautiful study notes here!
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'quiz' && (
                            <div className="w-full h-full text-slate-200 overflow-y-auto p-6 relative flex flex-col" style={{background: '#07090c'}}>
                                {loadingQuiz ? (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-6 text-center select-none">
                                        <div className="w-14 h-14 rounded-xl flex items-center justify-center border border-white/10 bg-white/2 animate-pulse">
                                            <Zap className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Creating Your Quiz</h3>
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{animationDelay: '0ms'}} />
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{animationDelay: '150ms'}} />
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{animationDelay: '300ms'}} />
                                            </div>
                                            <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed font-mono mt-3">Looking through your chat to build custom questions...</p>
                                        </div>
                                    </div>
                                ) : quizQuestions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-6 text-center select-none">
                                        <div className="w-14 h-14 rounded-xl flex items-center justify-center border border-white/10 bg-white/2">
                                            <Target className="w-6 h-6 text-slate-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">Evaluation Mode</h3>
                                            <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-mono">Generate structural tests based on active session logs.</p>
                                        </div>
                                        <button
                                            onClick={handleGenerateQuiz}
                                            disabled={loadingQuiz}
                                            className="btn-steel px-6 py-2.5 rounded-lg text-xs font-bold font-mono tracking-wider uppercase"
                                        >
                                            {loadingQuiz ? 'Initializing...' : 'Generate Quiz'}
                                        </button>
                                    </div>
                                ) : quizDone ? (
                                    /* Results Screen */
                                    <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                                        <div className="w-14 h-14 rounded-xl flex items-center justify-center border border-white/10 bg-white/2">
                                            <Trophy className="w-6 h-6 text-slate-350" />
                                        </div>
                                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Evaluation Completed</h3>
                                        <div className="w-full max-w-xs rounded-xl p-5 border border-white/8 bg-white/1 liquid-glass">
                                            <p className="text-3xl font-bold text-white">{score} <span className="text-slate-600">/</span> {quizQuestions.length}</p>
                                            <p className="text-[10px] text-slate-500 font-mono mt-1">{score >= 4 ? 'STRUCTURAL INTELLIGENCE CONFIRMED' : 'FURTHER CORE REFINEMENT SUGGESTED'}</p>
                                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden mt-3">
                                                <div className="steel-progress h-1.5 rounded-full transition-all duration-700" style={{width: `${(score/quizQuestions.length)*100}%`}} />
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={resetQuiz} className="btn-steel px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                <RotateCcw className="w-3 h-3" /> Retry
                                            </button>
                                            <button
                                                onClick={handleGenerateQuiz}
                                                disabled={loadingQuiz}
                                                className="btn-steel px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                                            >
                                                <Zap className="w-3 h-3" /> New Quiz
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* Active Quiz */
                                    <div className="space-y-5 max-w-lg w-full mx-auto">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 font-mono">Structural Test</span>
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    onClick={handleGenerateQuiz}
                                                    disabled={loadingQuiz}
                                                    className="btn-steel px-2 py-1 text-[9px] rounded font-bold uppercase tracking-wider"
                                                >
                                                    New
                                                </button>
                                                {quizQuestions.length > 0 && (
                                                    <span className="text-[10px] text-slate-400 font-bold font-mono">{currentQ + 1} <span className="text-slate-600">/</span> {quizQuestions.length}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                                            <div className="steel-progress h-1 rounded-full transition-all duration-500" style={{width: `${((currentQ)/quizQuestions.length)*100}%`}} />
                                        </div>
                                        <div className="rounded-xl p-4 border border-white/6 bg-white/1">
                                            <p className="text-xs text-white leading-relaxed font-semibold">
                                                <span className="text-slate-500 mr-1.5 font-mono">{currentQ+1}.</span>{quizQuestions[currentQ].q}
                                            </p>
                                        </div>
                                        <div className="space-y-1.5">
                                            {quizQuestions[currentQ].opts.map((opt, i) => {
                                                let cls = '';
                                                if (submitted) {
                                                    if (i === quizQuestions[currentQ].ans) {
                                                        cls = 'quiz-option-correct';
                                                    } else if (i === selectedAns) {
                                                        cls = 'quiz-option-wrong';
                                                    } else {
                                                        cls = 'opacity-40';
                                                    }
                                                } else if (i === selectedAns) {
                                                    cls = 'quiz-option-selected';
                                                }
                                                return (
                                                    <button
                                                        key={i}
                                                        disabled={submitted}
                                                        onClick={() => setSelectedAns(i)}
                                                        className={`quiz-option w-full text-left p-3 rounded-lg text-xs transition-all duration-200 flex items-center space-x-3 ${cls}`}
                                                    >
                                                        <span className="w-5 h-5 rounded border border-white/10 flex items-center justify-center text-[9px] font-bold shrink-0 bg-white/2 text-slate-400">
                                                            {String.fromCharCode(65 + i)}
                                                        </span>
                                                        <span className="font-medium text-slate-350">{opt}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {submitted && quizQuestions[currentQ].exp && (
                                            <div className="p-3.5 rounded-lg text-[11px] text-slate-300 leading-relaxed border border-white/5 bg-white/2 liquid-glass">
                                                <strong className="text-white block mb-1 font-mono uppercase tracking-wider text-[9px]">Explanation</strong> {quizQuestions[currentQ].exp}
                                            </div>
                                        )}
                                        <div className="flex space-x-2">
                                            {!submitted ? (
                                                <button
                                                    onClick={handleQuizSubmit}
                                                    disabled={selectedAns === null}
                                                    className="btn-steel flex-1 py-2.5 rounded-lg text-xs font-bold font-mono tracking-wider uppercase disabled:opacity-40"
                                                >
                                                    Submit Answer
                                                </button>
                                            ) : (
                                                <>
                                                    <div className={`flex-1 py-2 rounded-lg text-[10px] font-bold font-mono tracking-wider text-center border uppercase ${
                                                        selectedAns === quizQuestions[currentQ].ans
                                                            ? 'text-[#2dd4bf] border-[#2dd4bf]/20 bg-[#2dd4bf]/5'
                                                            : 'text-[#f87171] border-[#f87171]/20 bg-[#f87171]/5'
                                                    }`}>
                                                        {selectedAns === quizQuestions[currentQ].ans ? 'CORRECT' : 'INCORRECT'}
                                                    </div>
                                                    <button
                                                        onClick={handleNextQ}
                                                        className="btn-steel flex-1 py-2 rounded-lg text-[10px] font-bold font-mono tracking-wider uppercase flex items-center justify-center gap-1"
                                                    >
                                                        {currentQ + 1 >= quizQuestions.length ? 'Results' : 'Next'} <ArrowRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        <p className="text-[9px] text-slate-500 text-center font-mono uppercase tracking-wider">Session Progress: {score} / {currentQ + (submitted ? 1 : 0)}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'simulator' && (
                            <SimulatorTab
                                messages={messages}
                                isAnalyzing={isAnalyzing}
                                simulationSuggestions={simulationSuggestions}
                                isGenerating={isGenerating}
                                handleAnalyzeConversation={handleAnalyzeConversation}
                                handleGenerateSimulation={handleGenerateSimulation}
                                activeMessageIndex={activeMessageIndex}
                                setActiveMessageIndex={setActiveMessageIndex}
                            />
                        )}
                    </div>
                </main>
            </div>

            {selectionPosition && selectedText && (
                <button
                    onMouseDown={(e) => {
                        e.preventDefault(); // Prevents selection from collapsing
                        handleExplainSelection();
                    }}
                    style={{
                        position: 'fixed',
                        top: Math.max(10, selectionPosition.top), // Ensure it doesn't go off-screen
                        left: selectionPosition.left,
                        transform: 'translateX(-50%)',
                        zIndex: 9999, // Ensure it's above EVERYTHING
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-full text-xs font-semibold shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-indigo-400/30 hover:bg-indigo-500 hover:scale-105 transition-all flex items-center gap-2 pointer-events-auto cursor-pointer"
                >
                    ✨ Explain this
                </button>
            )}
        </div>
    );
}
