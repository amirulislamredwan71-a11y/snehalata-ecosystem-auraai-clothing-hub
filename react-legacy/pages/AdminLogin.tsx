import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from '../components/Navigation';

export const AdminLogin: React.FC = () => {
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Simulated admin authentication
        setTimeout(() => {
            if (credentials.email === 'snehalatabestonline@gmail.com' && credentials.password === 'Snehalata26@&') {
                localStorage.setItem('aura_admin_token', 'aura_root_access_' + Date.now());
                window.location.hash = '/ceo-dashboard';
            } else {
                setError('Invalid administrative credentials. Access denied by Aura Governance.');
            }
            setIsLoading(false);
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6 py-20 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-aura-purple/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-900/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-aura-purple/10 border border-aura-purple/20 rounded-3xl mb-6 shadow-[0_0_50px_rgba(124,58,237,0.1)]">
                        <ShieldCheck size={40} className="text-aura-purple" />
                    </div>
                    <h1 className="text-4xl font-serif font-black text-white mb-2 uppercase tracking-tight">Admin Gateway</h1>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 font-bold">Aura Ecosystem Command Line</p>
                </div>

                <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative group">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-aura-purple/20 via-transparent to-aura-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none rounded-[2.5rem]" />
                    
                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-400 font-medium leading-relaxed">{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <AdminInput 
                                label="Admin Email" 
                                icon={<Mail size={18} />} 
                                type="email"
                                placeholder="snehalata@bestonline.com"
                                value={credentials.email}
                                onChange={(val: string) => setCredentials({...credentials, email: val})}
                                required
                            />
                            <AdminInput 
                                label="Protocol Key (Password)" 
                                icon={<Lock size={18} />} 
                                type="password"
                                placeholder="••••••••"
                                value={credentials.password}
                                onChange={(val: string) => setCredentials({...credentials, password: val})}
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-aura-purple hover:text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin text-aura-purple" />
                            ) : (
                                <>Verify Identity <ChevronRight size={18} /></>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-10 text-center">
                    <Link to="/" className="text-gray-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.3em]">
                        Return to Public Hub
                    </Link>
                </div>
            </div>
        </div>
    );
};

const AdminInput = ({ label, icon, value, onChange, placeholder, type = "text", required = false }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">{label}</label>
        <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-purple transition-colors">{icon}</div>
            <input 
                required={required}
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-14 pr-6 py-5 text-sm text-white focus:outline-none focus:border-aura-purple transition-all placeholder:text-gray-800"
                placeholder={placeholder}
            />
        </div>
    </div>
);
