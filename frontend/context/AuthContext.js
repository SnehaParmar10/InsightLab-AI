'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetch(`${API}/api/auth/me`, {
            credentials: 'include'
        })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) setUser(data);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
        const res = await fetch(`${API}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        setUser(data.user);
        router.push('/dashboard');
    };

    const logout = async () => {
        try {
            await fetch(`${API}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (err) {
            console.error("Logout request error:", err);
        } finally {
            setUser(null);
            router.push('/login');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
