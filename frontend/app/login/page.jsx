'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
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

export default function LoginPage() {
    const { login } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [step, setStep] = useState('form');
    const [pendingEmail, setPendingEmail] = useState('');
    const [otp, setOtp] = useState('');

    const switchMode = (mode) => {
        setIsLogin(mode);
        setError('');
        setName(''); setEmail(''); setPassword('');
        setStep('form');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                const res = await fetch(`${API}/api/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Something went wrong');
                setPendingEmail(email);
                setStep('otp');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pendingEmail, otp })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Verification failed');
            toast.success('Email verified! Please log in now.');
            setStep('form');
            switchMode(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: pendingEmail })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to resend');
            toast.success('OTP resent! Check your email.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (step === 'otp') {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4 font-mono">
                <div className="w-full max-w-sm">
                    <div className="mb-8 text-center">
                        <span className="text-xs text-slate-500 uppercase tracking-[0.3em]">ConceptCraft AI</span>
                        <h1 className="text-2xl font-bold text-slate-100 mt-1 tracking-tight">Verify Email</h1>
                        <p className="text-xs text-slate-500 mt-1">
                            OTP sent to <span className="text-slate-300">{pendingEmail}</span>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 px-3 py-2 border border-red-800/60 bg-red-950/20 rounded text-red-400 text-xs">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Enter OTP</label>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/, ''))}
                                placeholder="6-digit code"
                                className="w-full bg-[#161616] border border-white/10 focus:border-white/30 rounded px-3 py-2.5 text-sm text-slate-200 focus:outline-none transition-colors placeholder:text-slate-600 tracking-widest text-center text-lg"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full py-2.5 bg-white text-[#0f0f0f] text-sm font-bold rounded hover:bg-slate-200 active:scale-[0.98] transition-all disabled:opacity-40"
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </form>

                    <p className="text-center text-[11px] text-slate-600 mt-4">
                        Didn&apos;t receive it?{' '}
                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={loading}
                            className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors disabled:opacity-40"
                        >
                            Resend OTP
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4 font-mono">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <span className="text-xs text-slate-500 uppercase tracking-[0.3em]">ConceptCraft AI</span>
                    <h1 className="text-2xl font-bold text-slate-100 mt-1 tracking-tight">
                        {isLogin ? 'Welcome back' : 'Create account'}
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        {isLogin ? 'Sign in to continue learning' : 'Start your visual learning journey'}
                    </p>
                </div>
                <div className="flex border border-white/10 rounded-lg mb-6 overflow-hidden bg-white/5 p-1">
                    <button
                        type="button"
                        onClick={() => switchMode(true)}
                        className={`flex-1 py-2 text-xs font-bold rounded transition-all active:scale-[0.98] ${isLogin
                            ? 'bg-white text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 bg-transparent'
                            }`}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        onClick={() => switchMode(false)}
                        className={`flex-1 py-2 text-xs font-bold rounded transition-all active:scale-[0.98] ${!isLogin
                            ? 'bg-white text-slate-950 shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 bg-transparent'
                            }`}
                    >
                        Sign Up
                    </button>
                </div>
                {error && (
                    <div className="mb-4 px-3 py-2 border border-red-800/60 bg-red-950/20 rounded text-red-400 text-xs">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-3">
                    {!isLogin && (
                        <div>
                            <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Your name"
                                className="w-full bg-[#161616] border border-white/10 focus:border-white/30 rounded px-3 py-2.5 text-sm text-slate-200 focus:outline-none transition-colors placeholder:text-slate-600"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-[#161616] border border-white/10 focus:border-white/30 rounded px-3 py-2.5 text-sm text-slate-200 focus:outline-none transition-colors placeholder:text-slate-600"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-[#161616] border border-white/10 focus:border-white/30 rounded px-3 py-2.5 text-sm text-slate-200 focus:outline-none transition-colors placeholder:text-slate-600"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-2.5 bg-white text-[#0f0f0f] text-sm font-bold rounded hover:bg-slate-200 active:scale-[0.98] transition-all disabled:opacity-40"
                    >
                        {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>
                <p className="text-center text-[11px] text-slate-600 mt-6">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        type="button"
                        onClick={() => switchMode(!isLogin)}
                        className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
                    >
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
}
