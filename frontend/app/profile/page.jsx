'use client';

import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { ChevronLeft, User, Mail, Star, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [customInstructions, setCustomInstructions] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        } else if (user) {
            setCustomInstructions(user.customInstructions || '');
        }
    }, [user, loading, router]);

    const handleSaveInstructions = async () => {
        setSaving(true);
        try {
            const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API}/api/auth/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ customInstructions })
            });

            if (res.ok) {
                toast.success('Custom instructions saved successfully!');
            } else {
                toast.error('Failed to save instructions.');
            }
        } catch (error) {
            console.error(error);
            toast.error('An error occurred while saving.');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#07090c] text-slate-300">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#07090c] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none" />
            
            <main className="flex-1 overflow-y-auto p-6 lg:p-12 z-10 relative">
                <div className="max-w-2xl mx-auto space-y-8">
                    
                    {/* Header */}
                    <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                        <button 
                            onClick={() => router.push('/dashboard')}
                            className="p-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white transition-colors backdrop-blur-md"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400">
                            My Profile
                        </h1>
                    </div>

                    {/* Profile Card */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-50" />
                        
                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                            
                            {/* Avatar Section */}
                            <div className="flex flex-col items-center gap-4 shrink-0">
                                <div className="w-32 h-32 rounded-2xl overflow-hidden border border-white/20 shadow-xl bg-slate-900 relative group">
                                    <img 
                                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'User'}&backgroundColor=0f172a&textColor=38bdf8`}
                                        alt="User Avatar"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                        <span className="text-xs font-bold text-white tracking-widest uppercase">Change</span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h2 className="text-xl font-bold text-white">{user.name}</h2>
                                    <span className="text-xs font-mono text-cyan-400 bg-cyan-950/50 px-2 py-1 rounded-md mt-2 inline-block border border-cyan-500/20">
                                        {user.role || 'STUDENT'}
                                    </span>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="flex-1 w-full space-y-6">
                                <div className="space-y-4">
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                            <User className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Full Name</p>
                                            <p className="text-sm font-semibold text-slate-200">{user.name}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                            <Mail className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Email Address</p>
                                            <p className="text-sm font-semibold text-slate-200">{user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {user.interests && user.interests.length > 0 && (
                                    <div className="pt-4 border-t border-white/10">
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Star className="w-3.5 h-3.5 text-amber-400" />
                                            Learning Interests
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {user.interests.map((interest, idx) => (
                                                <span key={idx} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/5 text-xs font-semibold text-slate-300">
                                                    {interest}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Custom Instructions Section */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                                <Settings className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Custom AI Instructions</h3>
                                <p className="text-xs text-slate-400 mt-1">Personalize how the AI generates your notes, quizzes, and simulations.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <textarea
                                value={customInstructions}
                                onChange={(e) => setCustomInstructions(e.target.value)}
                                placeholder="e.g. 'Always explain concepts using football analogies', 'Make quizzes very difficult', 'Respond in Hindi'"
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 resize-none"
                            />
                            
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSaveInstructions}
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all flex items-center gap-2"
                                >
                                    {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
                                    {saving ? 'Saving...' : 'Save Instructions'}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
