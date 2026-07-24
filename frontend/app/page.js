'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Brain, 
  ArrowRight, 
  Zap, 
  Target, 
  Layers, 
  Play, 
  CheckCircle,
  HelpCircle,
  Database,
  Map,
  Compass,
  Code,
  Network,
  RotateCcw,
  Check,
  ChevronRight,
  BookOpen,
  Trophy,
  Gamepad2,
  UtensilsCrossed,
  Music,
  Atom,
  CheckSquare,
  Cpu,
  Flame
} from 'lucide-react';

export default function Home() {
  // Global Sandbox States
  const [selectedConcept, setSelectedConcept] = useState('Covalent Bonds');
  const [activeStep, setActiveStep] = useState(0);

  // 3D Rotation Sliders & Drag State
  const [rotY, setRotY] = useState(30);
  const [rotX, setRotX] = useState(15);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Interactive Sandbox parameters
  const [sunlightLevel, setSunlightLevel] = useState(50);
  const [waterLevel, setWaterLevel] = useState(50);
  const [blackHoleMass, setBlackHoleMass] = useState(60);
  const [recursionFrames, setRecursionFrames] = useState(3);

  // 1. Interactive Prototype Lesson Walkthrough State
  const [protoTab, setProtoTab] = useState('breakdown'); // 'breakdown', 'analogy', 'lab', 'quiz', 'notes'
  const [selectedBreakdownNode, setSelectedBreakdownNode] = useState('Sunlight');
  
  // Interactive Lab State inside Walkthrough
  const [labSunlight, setLabSunlight] = useState(40);
  const [labWater, setLabWater] = useState(60);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizedMessage, setSynthesizedMessage] = useState('');

  // Interactive Quiz State inside Walkthrough
  const [quizAnswers, setQuizAnswers] = useState({ 0: null, 1: null, 2: null });
  const [quizSubmitted, setQuizSubmitted] = useState({ 0: false, 1: false, 2: false });
  const [quizScore, setQuizScore] = useState(null);
  const [showQuizResult, setShowQuizResult] = useState(false);

  const quizQuestions = [
    {
      q: "In the 'Leaf Kitchen' analogy, what acts as the oven's heat?",
      opts: ["Soil nutrients", "Water from the roots", "Sunlight", "Carbon dioxide"],
      ans: 2,
      exp: "Sunlight preheats the chloroplast, enabling chemical synthesis."
    },
    {
      q: "What raw ingredients does the leaf kitchen use to start cooking?",
      opts: ["Glucose and starch", "Water and Carbon dioxide", "Soil and Fertilizer", "Oxygen and steam"],
      ans: 1,
      exp: "The chemical inputs for photosynthesis are water (H2O) and Carbon dioxide (CO2)."
    },
    {
      q: "What happens on the real platform if you score below 60% on a quiz?",
      opts: ["Your profile gets blocked", "The AI automatically simplifies the analogy and animation to retrain you", "You start the entire syllabus from scratch", "You must wait 24 hours to retry"],
      ans: 1,
      exp: "VisuLogic features an adaptive loop. If you struggle, the agents recreate a simpler metaphor."
    }
  ];

  // Tick for auto rotation of 3D SVGs
  useEffect(() => {
    let animId;
    const tick = () => {
      if (autoRotate && !isDragging) {
        setRotY((prev) => (prev + 0.6) % 360);
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [autoRotate, isDragging]);

  const concepts = ['Covalent Bonds', 'Black Holes', 'Photosynthesis', 'Recursion'];

  // Flattened Concept Mappings
  const sandboxData = {
    'Covalent Bonds': {
      analogy: "A covalent bond is like co-op players sharing shields. Player A and Player B only have 7 shields each, but they need 8 to survive. They share 2 shields in the middle. Both players' shields register as full (stable octet) as long as they stay close in co-op mode.",
      visualTitle: "Co-op Shield Share",
      visualData: ["Atoms: Player A and Player B", "Electrons: Inventory shields", "Sharing: Crease overlap sharing", "Result: Active co-op survival state"]
    },
    'Black Holes': {
      analogy: "A black hole is like a massive gravity glitch in a game map where gravity is infinity. Once any player or item crosses the event horizon (the glitch border), their speed variable is forced to zero, and they fall into the center with no way to respawn.",
      visualTitle: "Map Glitch Void",
      visualData: ["Event Horizon: Border Glitch threshold", "Orbiting: Players circling the zone", "Singularity: Out-of-bounds void", "Result: Speed zero, assets deleted"]
    },
    Photosynthesis: {
      analogy: "Photosynthesis is like baking bread in a green leaf kitchen. Sunlight is the oven temperature. Chlorophyll is the chef. Carbon dioxide and water are the raw ingredients. The baked loaf represents glucose, and the steam represents oxygen released.",
      visualTitle: "Leaf Kitchen Oven",
      visualData: ["Sunlight: Preheat oven to 400°F", "CO2 & Water: Mix flour and liquid", "Baking action: Chloroplast oven cooks", "Outputs: Glucose loaf + Oxygen steam"]
    },
    Recursion: {
      analogy: "Recursion is like nesting portals in Portal, or entering a dream-within-a-dream. Each nested level runs the exact same rules. You dive deeper level by level until you hit the base case, which triggers a chain reaction of waking up back to the real world.",
      visualTitle: "Portal Stack Depth",
      visualData: ["Level 0: Real World", "Level 1: Dream Level 1", "Level 2: Dream Level 2", "Base Case: Kick Triggered!", "Unwind: Level 2 -> 1 -> 0"]
    }
  };

  const stepsList = [
    {
      title: "1. The Syllabus Builder",
      desc: "Breaks complex topics into structured roadmaps of simple sub-concepts.",
      icon: <Brain className="w-5 h-5 text-slate-400" />
    },
    {
      title: "2. The Metaphor Architect",
      desc: "Converts dry equations into interactive stories and analogies.",
      icon: <Sparkles className="w-5 h-5 text-slate-400" />
    },
    {
      title: "3. The Animation Engine",
      desc: "Generates custom step-by-step vector drawings and simulations.",
      icon: <Layers className="w-5 h-5 text-slate-400" />
    },
    {
      title: "4. The Personal Coach",
      desc: "Assembles adaptive quizzes. Simplifies analogy on wrong answers.",
      icon: <Target className="w-5 h-5 text-slate-400" />
    },
    {
      title: "5. The Progress Sync",
      desc: "Logs completed concepts and exports sketched worksheets.",
      icon: <Map className="w-5 h-5 text-slate-400" />
    }
  ];

  // 3D Projection Mathematics Helper
  const project3D = (x, y, z) => {
    const radX = (rotX * Math.PI) / 180;
    const radY = (rotY * Math.PI) / 180;
    const x1 = x * Math.cos(radY) - z * Math.sin(radY);
    const z1 = x * Math.sin(radY) + z * Math.cos(radY);
    const y2 = y * Math.cos(radX) - z1 * Math.sin(radX);
    const z2 = y * Math.sin(radX) + z1 * Math.cos(radX);
    const distance = 250;
    const scale = 175;
    const projX = 130 + (x1 * scale) / (z2 + distance);
    const projY = 100 + (y2 * scale) / (z2 + distance);
    const depthScale = scale / (z2 + distance);
    return { x: projX, y: projY, scale: depthScale, z: z2 };
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setAutoRotate(false);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setRotY((prev) => (prev + dx * 0.5) % 360);
    setRotX((prev) => Math.max(0, Math.min(85, prev - dy * 0.5)));
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setIsDragging(false);

  const triggerSynthesis = () => {
    setIsSynthesizing(true);
    setSynthesizedMessage('Cooking...');
    setTimeout(() => {
      const glucoseOutput = Math.round(labSunlight * labWater / 12);
      setSynthesizedMessage(`Starch generated: ${glucoseOutput} units. Oxygen vented.`);
      setIsSynthesizing(false);
    }, 1000);
  };

  const handleSelectQuizOpt = (qIdx, optIdx) => {
    if (quizSubmitted[qIdx]) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const verifyQuizQuestion = (qIdx) => {
    if (quizAnswers[qIdx] === null) return;
    setQuizSubmitted(prev => ({ ...prev, [qIdx]: true }));
  };

  const checkQuizScores = () => {
    let scoreCount = 0;
    quizQuestions.forEach((q, idx) => { if (quizAnswers[idx] === q.ans) scoreCount++; });
    setQuizScore(Math.round((scoreCount / quizQuestions.length) * 100));
    setShowQuizResult(true);
  };

  const resetQuizWalkthrough = () => {
    setQuizAnswers({ 0: null, 1: null, 2: null });
    setQuizSubmitted({ 0: false, 1: false, 2: false });
    setQuizScore(null);
    setShowQuizResult(false);
  };

  return (
    <div className="min-h-screen bg-[#06080a] text-slate-300 relative overflow-hidden font-mono">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }
        @keyframes gridPulse { 0%, 100% { opacity: 0.15; } 50% { opacity: 0.35; } }
        @keyframes glowPulse { 0%, 100% { text-shadow: 0 0 10px rgba(255,255,255,0.08); } 50% { text-shadow: 0 0 25px rgba(255,255,255,0.25); } }
        @keyframes liquidMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.015);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .btn-steel {
          background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.04) 100%);
          background-size: 200% 200%;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #f1f5f9;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 12px rgba(0, 0, 0, 0.2);
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
          overflow: hidden;
        }
        .btn-steel::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          transition: all 0.6s ease;
        }
        .btn-steel:hover:not(:disabled) {
          background-position: right center;
          border-color: rgba(255, 255, 255, 0.25);
          color: #ffffff;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 20px rgba(255,255,255,0.08);
          transform: translateY(-2px) scale(1.02);
        }
        .btn-steel:hover::before {
          left: 100%;
        }
        .btn-steel:active {
          transform: translateY(0) scale(1);
        }
        .grid-bg {
          background-image: linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 24px 24px;
          animation: gridPulse 6s ease-in-out infinite;
        }
        .animated-float {
          animation: float 4s ease-in-out infinite;
        }
        .animated-glow {
          animation: glowPulse 3s ease-in-out infinite;
        }
        @keyframes logoMorphCircle {
          0%, 100% { d: path("M 16,16 A 8,8 0 1,1 15.99,16 Z"); opacity: 1; }
          20% { d: path("M 16,16 A 8,8 0 1,1 15.99,16 Z"); opacity: 0; }
        }
        @keyframes logoMorphParens {
          0%, 100% { opacity: 0; }
          20% { opacity: 1; }
          40% { opacity: 0; }
        }
        @keyframes logoMorphBrackets {
          0%, 20%, 100% { opacity: 0; }
          40% { opacity: 1; }
          60% { opacity: 0; }
        }
        @keyframes logoMorphPencil {
          0%, 40%, 100% { opacity: 0; }
          60% { opacity: 1; }
          80% { opacity: 0; }
        }
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
        .video-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          z-index: 0;
          opacity: 0.12;
          pointer-events: none;
        }
      ` }} />

      {/* Background Video Loop & Grid Overlay */}
      <video 
        src="/viuslaiogic_la_logo_and_nextjs.mp4" 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="video-background"
      />
      <div className="absolute inset-0 grid-bg pointer-events-none z-1" />

      <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 bg-[#06080a]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg border border-white/10 flex items-center justify-center bg-white/2 relative overflow-hidden">
              <svg width="22" height="22" viewBox="0 0 32 32" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="w-5.5 h-5.5">
                
                {/* 1. CAPSULE LAYER (0% - 25%) */}
                <g style={{ transformOrigin: "16px 16px" }}>
                  {/* Left Capsule half */}
                  <path d="M 7,16 A 4,4 0 0,1 11,12 L 15,12 L 15,20 L 11,20 A 4,4 0 0,1 7,16 Z" 
                        style={{ animation: "morphCapsuleLeft 8s cubic-bezier(0.4, 0, 0.2, 1) infinite" }} />
                  {/* Right Capsule half */}
                  <path d="M 17,12 L 21,12 A 4,4 0 0,1 25,16 A 4,4 0 0,1 21,20 L 17,20 L 17,12 Z" 
                        style={{ animation: "morphCapsuleRight 8s cubic-bezier(0.4, 0, 0.2, 1) infinite" }} />
                </g>

                {/* 2. PENCIL LAYER (28% - 58%) */}
                <g style={{ animation: "morphPencil 8s cubic-bezier(0.4, 0, 0.2, 1) infinite", transformOrigin: "16px 16px" }}>
                  {/* Eraser */}
                  <path d="M 6,13 A 3,3 0 0,1 9,10 L 9,22 A 3,3 0 0,1 6,19 Z" fill="rgba(255,255,255,0.1)" />
                  {/* Shaft with detail lines */}
                  <path d="M 9,10 L 21,10 L 21,22 L 9,22 Z" />
                  <line x1="9" y1="14" x2="21" y2="14" />
                  <line x1="9" y1="18" x2="21" y2="18" />
                  {/* Collar and Nib */}
                  <path d="M 21,10 L 27,16 L 21,22 Z" />
                  <path d="M 25,14 L 27,16 L 25,18 Z" fill="white" />
                </g>

                {/* 3. CONCEPTCRAFT AI LETTERMARKS LAYER (60% - 95%) */}
                {/* CC - Left Curved Paths */}
                <g style={{ animation: "morphSplitEraserToCC 8s cubic-bezier(0.4, 0, 0.2, 1) infinite", transformOrigin: "8px 16px" }}>
                  <path d="M 8,12 A 4,4 0 0,0 4,16 A 4,4 0 0,0 8,20" strokeWidth="2.2" />
                  <path d="M 14,12 A 4,4 0 0,0 10,16 A 4,4 0 0,0 14,20" strokeWidth="2.2" />
                </g>

                {/* I - Center Shaft */}
                <g style={{ animation: "morphSplitMiddleToI 8s cubic-bezier(0.4, 0, 0.2, 1) infinite", transformOrigin: "17px 16px" }}>
                  <line x1="17" y1="12" x2="17" y2="20" strokeWidth="2.2" />
                  <line x1="15" y1="12" x2="19" y2="12" strokeWidth="1.5" />
                  <line x1="15" y1="20" x2="19" y2="20" strokeWidth="1.5" />
                </g>

                {/* AI - Right Nib/Tip splits to A & I */}
                <g style={{ animation: "morphSplitNibToAI 8s cubic-bezier(0.4, 0, 0.2, 1) infinite", transformOrigin: "25px 16px" }}>
                  {/* Letter A */}
                  <path d="M 21,20 L 23.5,12 L 26,20" strokeWidth="2" />
                  <line x1="22.2" y1="17.5" x2="24.8" y2="17.5" strokeWidth="1.5" />
                  {/* Letter I */}
                  <line x1="28" y1="12" x2="28" y2="20" strokeWidth="2" />
                </g>

              </svg>
            </div>
            <span className="text-sm font-bold tracking-widest text-white uppercase">ConceptCraft AI</span>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            <a href="#prototype" className="hover:text-white transition-colors">Playable Lesson</a>
            <a href="#workflow" className="hover:text-white transition-colors">Agent Flow</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link href="/login" className="text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg border border-white/5 hover:bg-white/5 transition-all text-slate-350">Sign In</Link>
            <Link href="/login" className="btn-steel text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all">Start Lab</Link>
          </div>
        </div>
      </header>

      <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 md:pt-32 md:pb-24 flex flex-col items-center text-center z-10">
        <h1 className="animated-glow text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white max-w-4xl leading-tight mb-6">
          Warp Abstract Concepts.<br />
          <span className="text-slate-400">Interactive Learning.</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-450 max-w-2xl leading-relaxed mb-10 font-mono">
          We translate Chemistry, Physics, Biology, and Computer Science into playable, interactive lessons. Experience deep analogies, live virtual labs, and automated structured notes.
        </p>

        <div className="flex gap-3 justify-center items-center">
          <Link href="/login" className="btn-steel flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg transition-all">Create Lab Room <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </section>

      <section id="prototype" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-10"><h2 className="text-2xl md:text-4xl font-bold text-white uppercase tracking-wider">Playable Lesson</h2></div>
        <div className="w-full max-w-4xl mx-auto glass-panel border border-white/5 rounded-2xl p-2.5 shadow-lg bg-white/2 flex flex-col">
          <div className="flex border-b border-white/5 overflow-x-auto text-[10px] font-bold font-mono">
            {['breakdown', 'analogy', 'lab', 'quiz', 'notes'].map(tab => (
              <button key={tab} onClick={() => setProtoTab(tab)} className={`py-3 px-4 flex items-center gap-1.5 border-b-2 uppercase tracking-wider ${protoTab === tab ? 'border-white text-white' : 'border-transparent text-slate-500'}`}>{tab}</button>
            ))}
          </div>
          <div className="p-4 sm:p-8 min-h-[300px] flex flex-col justify-center">
            {protoTab === 'breakdown' && (
              <div className="space-y-4 max-w-2xl mx-auto font-mono text-[11px]">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Lesson Breakdown: The Physics of Light</h3>
                <div className="grid grid-cols-1 gap-2.5">
                  <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="block font-bold text-white">1. Refraction</span>
                      <span className="text-[9px] text-slate-500">Light bending as it moves through media boundaries</span>
                    </div>
                    <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-350 font-bold">READY</span>
                  </div>
                  <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="block font-bold text-white">2. Dispersion</span>
                      <span className="text-[9px] text-slate-500">Separation of white light into constituent wavelength bands</span>
                    </div>
                    <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-350 font-bold">READY</span>
                  </div>
                  <div className="p-3 bg-white/2 border border-white/5 rounded-xl flex justify-between items-center">
                    <div>
                      <span className="block font-bold text-white">3. Internal Reflection</span>
                      <span className="text-[9px] text-slate-500">Bouncing light off the back boundary of water droplets</span>
                    </div>
                    <span className="text-[9px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-350 font-bold">READY</span>
                  </div>
                </div>
              </div>
            )}
            
            {protoTab === 'analogy' && (
              <div className="max-w-xl mx-auto font-mono text-center p-6 bg-white/1 border border-white/5 rounded-2xl">
                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Analogy Architect</span>
                <p className="text-xs text-slate-300 leading-relaxed mt-3 text-justify font-mono">
                  "Think of a single raindrop as a tiny, floating glass disco ball. When white sunlight hits it, the light bends (refracts) as it enters the drop, bounces off the back wall (total internal reflection), and splits into a spectrum of colors (dispersion) as it exits back into the air."
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-[9px] text-slate-450 border border-white/5 bg-white/2 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] animate-pulse"></span> Metaphor Verified by AI Architect
                </div>
              </div>
            )}

            {protoTab === 'lab' && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center font-mono text-[11px] max-w-2xl mx-auto">
                <button onClick={triggerSynthesis} className="btn-steel w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider">RUN REACTION</button>
                <div className="md:col-span-7 bg-white/1 border border-white/5 rounded-xl p-4">{synthesizedMessage || "Set inputs..."}</div>
              </div>
            )}
            
            {protoTab === 'quiz' && (
              <div className="space-y-6 max-w-xl mx-auto font-mono text-[11px]">
                {quizQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 border border-white/5 rounded-xl bg-white/1 space-y-3">
                    <div className="font-bold text-white uppercase">{q.q}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {q.opts.map((opt, oIdx) => <button key={oIdx} onClick={() => handleSelectQuizOpt(idx, oIdx)} className="p-2 border rounded-lg text-left text-slate-400">{opt}</button>)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {protoTab === 'notes' && (
              <div className="max-w-xl mx-auto font-mono text-[11px] border border-white/5 rounded-2xl overflow-hidden shadow-lg bg-white/1 p-6 relative">
                <div className="absolute top-0 left-8 bottom-0 w-[1px] bg-red-800/20" />
                <div className="space-y-3 pl-8 text-left text-slate-350">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-1">Refraction Notes Sheet</h4>
                  <p className="leading-relaxed">- Light waves travel slower in denser mediums (like water) than in air.</p>
                  <p className="leading-relaxed">- Refractive index determines bending parameters: n_water ≈ 1.33.</p>
                  <p className="leading-relaxed">- Dispersion occurs because different wavelengths (colors) have slightly different refractive indices.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Platform Interface</span>
          <h2 className="text-2xl md:text-4xl font-bold text-white mt-1 uppercase tracking-wider">Visual Workspace</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Live Mockup 1: Physics Refraction */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/8 bg-white/1 p-4 flex flex-col space-y-4">
            <div className="rounded-xl overflow-hidden border border-white/5 bg-[#0b0f12] h-[220px] relative p-4 flex flex-col justify-between font-mono">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Active Canvas: Light Refraction</span>
                <span className="text-[8px] text-[#2dd4bf] border border-[#2dd4bf]/20 bg-[#2dd4bf]/5 px-1.5 py-0.2 rounded font-bold uppercase">PRISM MODEL</span>
              </div>
              
              <div className="flex-1 flex items-center justify-center relative">
                <svg width="100%" height="120" viewBox="0 0 240 120">
                  {/* Glass Prism */}
                  <polygon points="120,20 80,100 160,100" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                  
                  {/* Incoming Light */}
                  <line x1="20" y1="85" x2="100" y2="75" stroke="#ffffff" strokeWidth="2" />
                  <text x="35" y="70" fill="#94a3b8" fontSize="7" fontWeight="bold">White Light</text>
                  
                  {/* Refracted Rainbow Bands inside & exit */}
                  <path d="M 100 75 L 120 76 M 120 76 L 180 60" stroke="#f87171" strokeWidth="1.5" />
                  <path d="M 100 75 L 120 78 M 120 78 L 185 68" stroke="#fbbf24" strokeWidth="1.5" />
                  <path d="M 100 75 L 120 81 M 120 81 L 190 78" stroke="#34d399" strokeWidth="1.5" />
                  <path d="M 100 75 L 120 84 M 120 84 L 195 90" stroke="#38bdf8" strokeWidth="1.5" />
                  <path d="M 100 75 L 120 87 M 120 87 L 200 102" stroke="#a78bfa" strokeWidth="1.5" />
                </svg>
              </div>

              <div className="flex justify-between text-[8px] text-slate-500 pt-2 border-t border-white/5">
                <span>Snell's Law: n₁ sin(θ₁) = n₂ sin(θ₂)</span>
                <span>Angle: 42° Refraction</span>
              </div>
            </div>
            <div className="px-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Physics: Light Refraction & Notes</h4>
              <p className="text-[9px] text-slate-500 font-mono mt-1 leading-relaxed">Interactive refraction angles, Snell's Law formulas, and real-time generated sketched paper notes.</p>
            </div>
          </div>

          {/* Live Mockup 2: Recursion BST */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/8 bg-white/1 p-4 flex flex-col space-y-4">
            <div className="rounded-xl overflow-hidden border border-white/5 bg-[#0b0f12] h-[220px] relative p-4 flex flex-col justify-between font-mono">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Call Stack: Inorder Traversal</span>
                <span className="text-[8px] text-slate-400 border border-white/10 bg-white/5 px-1.5 py-0.2 rounded font-bold uppercase">f(n) depth</span>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <svg width="100%" height="120" viewBox="0 0 240 120" fill="none">
                  {/* BST Tree Nodes */}
                  <g stroke="rgba(255,255,255,0.15)" strokeWidth="1">
                    <line x1="120" y1="25" x2="80" y2="55" />
                    <line x1="120" y1="25" x2="160" y2="55" />
                    <line x1="80" y1="55" x2="55" y2="85" />
                    <line x1="80" y1="55" x2="105" y2="85" />
                  </g>

                  {/* Active Nodes with Glow */}
                  <circle cx="120" cy="25" r="10" fill="#0c0e12" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <text x="120" y="28" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">12</text>

                  <circle cx="80" cy="55" r="10" fill="#0c0e12" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <text x="80" y="58" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">7</text>

                  <circle cx="160" cy="55" r="10" fill="#0c0e12" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <text x="160" y="58" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8">18</text>

                  <circle cx="55" cy="85" r="10" fill="#0c0e12" stroke="#2dd4bf" strokeWidth="2" className="animate-pulse" />
                  <text x="55" y="88" textAnchor="middle" fill="#2dd4bf" fontSize="8" fontWeight="bold">5</text>

                  <circle cx="105" cy="85" r="10" fill="#0c0e12" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <text x="105" y="88" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8">9</text>
                </svg>
              </div>

              <div className="flex justify-between text-[8px] text-slate-500 pt-2 border-t border-white/5">
                <span>Stack: [5 ➔ 7 ➔ 12]</span>
                <span>Base Case: Node === Null</span>
              </div>
            </div>
            <div className="px-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">CS: Binary Tree Recursion & Quiz</h4>
              <p className="text-[9px] text-slate-500 font-mono mt-1 leading-relaxed">Structural call stack visualizer mapping algorithms, paired with dynamic network evaluation tests.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live System Metrics Bar */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center font-mono">
          <div className="p-4 glass-panel rounded-xl">
            <span className="block text-xl font-bold text-white tracking-widest">142,500+</span>
            <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-1 block">Lessons Synthesized</span>
          </div>
          <div className="p-4 glass-panel rounded-xl">
            <span className="block text-xl font-bold text-white tracking-widest">2.8M+</span>
            <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-1 block">Visual Nodes Rendered</span>
          </div>
          <div className="p-4 glass-panel rounded-xl">
            <span className="block text-xl font-bold text-[#2dd4bf] tracking-widest">99.4%</span>
            <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-1 block">Quiz Accuracy Rate</span>
          </div>
          <div className="p-4 glass-panel rounded-xl">
            <span className="block text-xl font-bold text-white tracking-widest">&lt; 280ms</span>
            <span className="text-[8px] text-slate-500 uppercase tracking-widest mt-1 block">Avg Inference Delay</span>
          </div>
        </div>
      </section>

      {/* Agentic Pipeline Architecture Flow */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Behind the Scenes</span>
          <h2 className="text-2xl md:text-4xl font-bold text-white mt-1 uppercase tracking-wider">Agentic Pipeline</h2>
          <p className="text-xs text-slate-400 mt-2 font-mono">How ConceptCraft AI parses user prompts into production-grade interactive sandboxes.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto font-mono">
          <div className="p-6 glass-panel rounded-2xl flex flex-col justify-between border-t-2 border-t-white/10">
            <div>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white text-xs font-bold mb-4">01</div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Curriculum Parser</h4>
              <p className="text-[10px] text-slate-450 leading-relaxed">The orchestration engine splits complex subjects into modular sub-concept roadmaps, calculating prerequisites and target complexity parameters.</p>
            </div>
            <div className="text-[8px] text-slate-600 mt-4 uppercase">Sub-agents: LLM Roadmap Compiler</div>
          </div>

          <div className="p-6 glass-panel rounded-2xl flex flex-col justify-between border-t-2 border-t-white/10">
            <div>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white text-xs font-bold mb-4">02</div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Metaphor Mapping</h4>
              <p className="text-[10px] text-slate-450 leading-relaxed">Translates dense scientific equations and raw data parameters into interactive real-world analogies (e.g. comparing chemical bonds to magnetic hooks).</p>
            </div>
            <div className="text-[8px] text-[#2dd4bf] mt-4 uppercase">Sub-agents: Analogy Generation Engine</div>
          </div>

          <div className="p-6 glass-panel rounded-2xl flex flex-col justify-between border-t-2 border-t-white/10">
            <div>
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white text-xs font-bold mb-4">03</div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Vector / 3D Compilation</h4>
              <p className="text-[10px] text-slate-450 leading-relaxed">Converts structural logic variables directly into animated SVG vector graphics, 3D project coordinates, and corresponding React interactive controls.</p>
            </div>
            <div className="text-[8px] text-slate-600 mt-4 uppercase">Sub-agents: SVG Canvas Builder</div>
          </div>
        </div>
      </section>

      {/* Developer FAQ Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">Frequently Asked Questions</span>
          <h2 className="text-2xl md:text-4xl font-bold text-white mt-1 uppercase tracking-wider">FAQS & Architecture</h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4 font-mono text-[11px]">
          <div className="glass-panel p-5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
            <h4 className="text-xs font-bold text-white uppercase mb-2">How does ConceptCraft AI generate its 3D simulations?</h4>
            <p className="text-slate-450 leading-relaxed">The platform uses mathematical parameters computed by our AI backend. It converts structural parameters (atoms coordinates, vector velocities) into native vector graphs and SVG nodes, allowing users to drag and spin the simulations directly in the browser.</p>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
            <h4 className="text-xs font-bold text-white uppercase mb-2">Can I create my own syllabus custom topics?</h4>
            <p className="text-slate-450 leading-relaxed">Yes! By logging in and creating a private Lab Room, you can write any subject prompt. The LLM orchestration engine will analyze the topic and compile a complete multi-step interactive study course on the fly.</p>
          </div>

          <div className="glass-panel p-5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
            <h4 className="text-xs font-bold text-white uppercase mb-2">Is student progress saved across interactive quiz states?</h4>
            <p className="text-slate-450 leading-relaxed">Absolutely. Completed notes, generated analogies, history traces, and quiz assessment parameters sync directly with the backend database schemas to store your performance profiles.</p>
          </div>
        </div>
      </section>

      <footer className="w-full border-t border-white/5 py-10 relative z-10 bg-[#06080a]">
        <div className="max-w-7xl mx-auto px-6 flex justify-between font-mono text-[10px] text-slate-600">
          <span>ConceptCraft AI &copy; 2026.</span>
          <div className="flex gap-6 uppercase"><span>Privacy</span><span>Terms</span></div>
        </div>
      </footer>
    </div>
  );
}
