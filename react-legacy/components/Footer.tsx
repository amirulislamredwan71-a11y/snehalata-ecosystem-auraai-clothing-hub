import React from 'react';
import { Link } from './Navigation';
import { Shield, FileText, BarChart3 } from 'lucide-react';
import { Logo } from './Logo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black border-t border-aura-glassBorder py-12 px-6 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand */}
        <div className="col-span-1 md:col-span-1">
          <div className="mb-4">
            <Logo />
          </div>
          <p className="text-gray-500 text-sm leading-relaxed mt-4">
            The ultimate AI-powered ecosystem empowering local artisans with global standard technology.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-4">Platform</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><Link to="/" className="hover:text-aura-purple transition-colors">Ecosystem Hub</Link></li>
            <li><Link to="/onboarding" className="hover:text-aura-purple transition-colors">Vendor Registration</Link></li>
            <li><Link to="/tracking" className="hover:text-aura-purple transition-colors">Order Tracking</Link></li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-4">Legal & Privacy</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
                <Link to="/legal" className="flex items-center gap-2 hover:text-aura-purple transition-colors">
                    <Shield size={14} /> Privacy Policy
                </Link>
            </li>
            <li>
                <Link to="/legal" className="flex items-center gap-2 hover:text-aura-purple transition-colors">
                    <FileText size={14} /> Terms of Service
                </Link>
            </li>
          </ul>
        </div>

        {/* CEO / Admin */}
        <div>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-4">Governance</h4>
            <Link 
                to="/admin-login" 
                className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg text-sm text-gray-300 hover:bg-aura-purple hover:text-white transition-all hover:scale-105"
            >
                <BarChart3 size={16} /> Admin Gateway
            </Link>
            <p className="text-[10px] text-gray-600 mt-2">Restricted Access • Aura AI Monitored</p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
        <p>© {new Date().getFullYear()} Snehalata Ecosystem. All rights reserved.</p>
        <p>Powered by Aura Neural Engine v3.1</p>
      </div>
    </footer>
  );
};