import React, { useState, useEffect } from 'react';
import { Sparkles, FlaskConical, Play, CheckCircle, Clock, ChevronLeft } from 'lucide-react';

export default function SimulatorTab({ 
    messages, 
    isAnalyzing, 
    simulationSuggestions, 
    isGenerating, 
    handleAnalyzeConversation, 
    handleGenerateSimulation,
    activeMessageIndex,
    setActiveMessageIndex
}) {
    const [activeSimulationView, setActiveSimulationView] = useState(null);

    // Extract past simulations from messages
    const pastSimulations = messages.filter(m => m.sender === 'ai' && m.simulation);

    // Sync activeSimulationView when activeMessageIndex changes
    useEffect(() => {
        if (activeMessageIndex !== null && messages[activeMessageIndex]?.simulation) {
            setActiveSimulationView(messages[activeMessageIndex].simulation);
        } else {
            setActiveSimulationView(null);
        }
    }, [activeMessageIndex, messages]);

    // Sanitize and normalize HTML for iframe
    const sanitizeHtml = (rawHtml) => {
        if (!rawHtml) return '';
        let html = rawHtml.trim();
        // Strip sim_code wrapper tags if backend forgot to strip them
        html = html.replace(/^<sim_code>\s*/i, '').replace(/\s*<\/sim_code>$/i, '').trim();

        const lower = html.toLowerCase();
        const hasBody = lower.includes('<body');
        const hasDoctype = lower.startsWith('<!doctype') || lower.startsWith('<html');

        if (!hasBody) {
            // No body tag - extract content after </head> or </style> and wrap it
            const headEndIdx = lower.lastIndexOf('</style>');
            if (headEndIdx !== -1) {
                const headPart = html.substring(0, headEndIdx + 8); // include </style>
                const bodyContent = html.substring(headEndIdx + 8);
                html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${headPart}</head><body style="margin:0">${bodyContent}</body></html>`;
            } else {
                // No recognizable structure - just wrap everything
                html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;background:#0f172a;color:#e2e8f0;">${html}</body></html>`;
            }
        } else if (!hasDoctype) {
            html = `<!DOCTYPE html>${html}`;
        }

        return html;
    };

    if (activeSimulationView) {
        return (
            <div className="w-full bg-transparent text-slate-200 flex flex-col font-mono relative" style={{ height: '100%' }}>
                <div className="p-4 border-b border-white/10 flex justify-between items-center liquid-glass shrink-0">
                    <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
                        <FlaskConical className="w-5 h-5 text-slate-400" />
                        {activeSimulationView.title || 'Interactive Lab'}
                    </h3>
                    <button
                        onClick={() => {
                            if (setActiveMessageIndex) setActiveMessageIndex(null);
                        }}
                        className="btn-steel px-4 py-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider rounded-lg"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Gallery
                    </button>
                </div>
                <div className="bg-[#0f172a] p-2" style={{ flex: 1, minHeight: 0 }}>
                    <iframe
                        srcDoc={sanitizeHtml(activeSimulationView.html)}
                        title={activeSimulationView.title}
                        style={{ width: '100%', height: '100%', minHeight: '480px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', background: '#0f172a' }}
                        sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-transparent text-slate-200 flex flex-col font-mono overflow-y-auto custom-scrollbar">
            
            {/* Header & Analyze Button */}
            <div className={`p-8 border-white/10 relative overflow-hidden shrink-0 transition-all duration-500 flex flex-col items-center justify-center ${(!simulationSuggestions || simulationSuggestions.length === 0) ? 'flex-1 border-b-0' : 'border-b'}`}>
                <div className="max-w-3xl mx-auto flex flex-col items-center text-center relative z-10 w-full">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 liquid-glass">
                        <FlaskConical className="w-8 h-8 text-slate-300" />
                    </div>
                    <h2 className="text-3xl font-bold mb-3 text-white tracking-wide">Interactive Visual Learning</h2>
                    <p className="text-slate-400 mb-8 max-w-lg text-xs leading-relaxed">
                        Turn your conversation into a fun, interactive experience. Click analyze to scan our chat and get 5 custom visual ideas to explore.
                    </p>
                    
                    <button
                        onClick={handleAnalyzeConversation}
                        disabled={isAnalyzing}
                        className={`group relative px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-lg overflow-hidden transition-all hover:scale-105 active:scale-95 ${
                            isAnalyzing ? 'bg-white/5 cursor-not-allowed border border-white/10 text-slate-500' : 'btn-steel'
                        }`}
                    >
                        {isAnalyzing ? (
                            <span className="flex items-center gap-3">
                                <Sparkles className="w-4 h-4 animate-spin text-slate-400" />
                                Analyzing Conversation...
                            </span>
                        ) : (
                            <span className="flex items-center gap-3 relative z-10">
                                <Sparkles className="w-4 h-4 text-slate-300" />
                                {(simulationSuggestions && simulationSuggestions.length > 0) ? "Generate More Suggestions" : "Analyze Conversation"}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Suggestions Grid */}
            {simulationSuggestions && simulationSuggestions.length > 0 && (
                <div className="p-8 max-w-5xl mx-auto w-full space-y-12 font-sans">
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <Sparkles className="w-6 h-6 text-slate-400" />
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider font-mono">Suggested Labs</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {simulationSuggestions.map((sug, i) => {
                                // Check if this simulation has already been generated
                                const generatedMsgIndex = messages.findIndex(m => m.text && m.text.includes(sug.title) && m.simulation);
                                const isGenerated = generatedMsgIndex !== -1;
                                
                                return (
                                    <div key={i} className="bg-[#121216] border border-white/10 hover:border-white/20 p-6 rounded-2xl transition-all duration-300 flex flex-col group relative overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1">
                                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Play className="w-8 h-8 text-[#2dd4bf]/20" />
                                        </div>
                                        <h4 className="font-bold text-lg text-white mb-3 leading-snug">{sug.title}</h4>
                                        <span className="inline-block px-2.5 py-1 bg-white/5 border border-white/10 text-[#2dd4bf] text-[10px] uppercase tracking-wider font-bold rounded-md w-max max-w-full truncate mb-4">
                                            {sug.type || "Interactive Lab"}
                                        </span>
                                        <p className="text-sm text-slate-400 mb-6 flex-1 line-clamp-4 leading-relaxed">
                                            {sug.description}
                                        </p>
                                        
                                        <button
                                            onClick={() => isGenerated ? setActiveMessageIndex(generatedMsgIndex) : handleGenerateSimulation(sug.title)}
                                            disabled={!!isGenerating && !isGenerated}
                                            className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                                isGenerating === sug.title 
                                                    ? 'bg-white/10 text-white border border-white/20'
                                                    : isGenerated
                                                        ? 'bg-[#2dd4bf]/10 text-[#2dd4bf] border border-[#2dd4bf]/30 hover:bg-[#2dd4bf]/20'
                                                        : isGenerating
                                                            ? 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed opacity-50'
                                                            : 'bg-white/10 hover:bg-[#2dd4bf] text-white hover:text-black border border-white/10 shadow-lg hover:shadow-[#2dd4bf]/20'
                                            }`}
                                        >
                                            {isGenerating === sug.title ? (
                                                <div className="flex items-center text-xs font-mono">
                                                    <Sparkles className="w-3 h-3 animate-spin mr-1.5" />
                                                    Generating... (up to 60s)
                                                </div>
                                            ) : isGenerated ? (
                                                <>
                                                    Open Lab
                                                    <Play className="w-4 h-4" />
                                                </>
                                            ) : (
                                                <>
                                                    Generate Lab
                                                    <Play className="w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
