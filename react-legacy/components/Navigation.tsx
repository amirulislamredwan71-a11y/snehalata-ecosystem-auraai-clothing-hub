import React, { useState, useEffect, useContext } from 'react';
import { ShoppingBag, Search, Menu, X, Sparkles, PackageSearch, History, LayoutGrid, UserPlus, Globe, LayoutDashboard } from 'lucide-react';
import { Logo } from './Logo';
import { RouterContext, ParamsContext, useLocation } from '../lib/router';

// Hooks are exported directly from lib/router

export const HashRouter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [path, setPath] = useState('/');
  useEffect(() => {
    const handleHashChange = () => {
      let hash = window.location.hash.slice(1);
      if (!hash) hash = '/';
      hash = hash.split('?')[0];
      setPath(hash);
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  return <RouterContext.Provider value={{ path }}>{children}</RouterContext.Provider>;
};

// Router hooks moved to lib/router.ts

export const Link: React.FC<{ to: string; className?: string; title?: string; children: React.ReactNode }> = ({ to, className, title, children }) => (
  <a href={`#${to}`} className={className} title={title}>{children}</a>
);

export const Routes: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export const Route: React.FC<{ path: string; element: React.ReactNode }> = ({ path, element }) => {
  const { path: currentPath } = useContext(RouterContext);
  const paramNames: string[] = [];
  const regexPath = path.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  const regex = new RegExp(`^${regexPath}$`);
  const match = currentPath.match(regex);
  if (match) {
    const params: Record<string, string> = {};
    paramNames.forEach((name, index) => { params[name] = match[index + 1]; });
    return <ParamsContext.Provider value={params}>{element}</ParamsContext.Provider>;
  }
  return null;
};

export const Navigation: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(() => {
    try {
      const cart = JSON.parse(localStorage.getItem('aura_cart') || '[]');
      return cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
    } catch { return 0; }
  });

  useEffect(() => {
    const update = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('aura_cart') || '[]');
        setCartCount(cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0));
      } catch { setCartCount(0); }
    };
    window.addEventListener('cartUpdated', update);
    return () => window.removeEventListener('cartUpdated', update);
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-3xl border-b border-white/5 shadow-2xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          <Logo />
        </Link>

        {/* Main Navigation - Desktop */}
        <div className="hidden lg:flex items-center gap-8">
          <NavLink to="/" icon={<LayoutGrid size={14} />} label="Hub" active={location.path === '/'} />
          <NavLink to="/studio" icon={<Sparkles size={14} />} label="Studio" active={location.path === '/studio'} />
          <NavLink to="/orders" icon={<History size={14} />} label="History" active={location.path === '/orders'} />
        </div>

        <div className="flex items-center gap-8">
          {/* COMPACT LINKS */}
          <div className="hidden xl:flex items-center gap-6 pr-6 border-r border-white/10">
            <CompactLink to="/" icon={<Globe size={12} />} label="Ecosystem Hub" />
            <CompactLink to="/onboarding" icon={<UserPlus size={12} />} label="Registration" />
            <CompactLink to="/dashboard" icon={<LayoutDashboard size={12} />} label="Vendor Portal" />
            <CompactLink to="/tracking" icon={<PackageSearch size={12} />} label="Track Order" />
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => alert('Neural search feature coming soon in Aura v2.0')}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <Search size={20} />
            </button>
            <Link to="/cart" className="text-gray-500 hover:text-white relative group">
              <ShoppingBag size={20} className="group-hover:scale-110 transition-transform" />
              {cartCount > 0 && <span className="absolute -top-2 -right-2 bg-aura-purple text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-black shadow-lg">{cartCount}</span>}
            </Link>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-black/95 border-b border-white/10 py-6 px-6 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-6">
            <NavLink to="/" icon={<LayoutGrid size={16} />} label="Hub" active={location.path === '/'} />
            <NavLink to="/studio" icon={<Sparkles size={16} />} label="Studio" active={location.path === '/studio'} />
            <NavLink to="/orders" icon={<History size={16} />} label="History" active={location.path === '/orders'} />
            <div className="h-px bg-white/10 my-2" />
            <CompactLink to="/onboarding" icon={<UserPlus size={14} />} label="Vendor Registration" />
            <CompactLink to="/dashboard" icon={<LayoutDashboard size={14} />} label="Vendor Portal" />
            <CompactLink to="/tracking" icon={<PackageSearch size={14} />} label="Track Order" />
          </div>
        </div>
      )}
    </nav>
  );
};

const NavLink = ({ to, icon, label, active }: any) => (
  <Link to={to} className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] py-1 border-b-2 transition-all duration-300 ${active ? 'text-aura-purple border-aura-purple' : 'text-gray-500 border-transparent hover:text-white hover:translate-y-[-1px]'}`}>
    {icon} {label}
  </Link>
);

const CompactLink = ({ to, icon, label }: any) => (
  <Link to={to} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-aura-purple transition-all group">
    <span className="text-gray-700 group-hover:text-aura-purple transition-colors">{icon}</span>
    <span>{label}</span>
  </Link>
);