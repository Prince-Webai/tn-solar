
import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Search,
    Bell,
    PanelLeftClose,
    PanelLeftOpen,
    Plus,
    UserCircle,
    Zap,
    PieChart
} from 'lucide-react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo_v2.png';

const CRMLayout = ({ children }: { children?: React.ReactNode }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        if (user) {
            setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'User');
        }
    }, [user]);

    const crmNavItems = [
        { icon: LayoutDashboard, label: 'CRM Dashboard', path: '/crm', active: true },
        { icon: Users, label: 'Leads', path: '/crm/contacts', active: true },
        { icon: PieChart, label: 'Analytics', path: '/crm/analytics', active: true },
        { icon: Zap, label: 'Automations', path: null, active: false },
    ];

    const bottomNavItems = [
        { icon: Settings, label: 'CRM Settings', path: '/settings/custom-fields' },
        { icon: UserCircle, label: 'Back to Main App', path: '/' },
    ];

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-[#F3F5F7] text-[#33475b] font-sans selection:bg-[#00a4bd]/20 overflow-hidden">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isSidebarCollapsed ? '80px' : '280px' }}
                className="bg-[#2D3E50] text-white flex flex-col z-50 shadow-2xl relative"
            >
                {/* Logo Section */}
                <div className="p-6 flex items-center gap-3 overflow-hidden h-20 border-b border-white/5">
                    <div className="min-w-[40px] h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                        <img src={logoImg} alt="TN" className="h-8 w-auto mix-blend-multiply" />
                    </div>
                    {!isSidebarCollapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-bold text-lg tracking-tight whitespace-nowrap text-white"
                        >
                            TN<span className="text-[#00a4bd]">CRM</span>
                        </motion.span>
                    )}
                </div>

                {/* Nav Items */}
                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar-hide">
                    {crmNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        if (!item.active) {
                            // Coming soon - shown but not clickable
                            return (
                                <div
                                    key={item.label}
                                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-600 opacity-40 cursor-not-allowed relative"
                                    title="Coming Soon"
                                >
                                    <Icon size={22} />
                                    {!isSidebarCollapsed && (
                                        <div className="flex items-center justify-between flex-1">
                                            <span className="font-medium whitespace-nowrap text-sm">{item.label}</span>
                                            <span className="text-[8px] bg-slate-600 text-white rounded px-1 py-0.5 font-black uppercase">Soon</span>
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        return (
                            <Link
                                key={item.path}
                                to={item.path!}
                                className={`
                                    flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative
                                    ${isActive
                                        ? 'bg-[#00a4bd] text-white shadow-lg shadow-[#00a4bd]/20'
                                        : 'hover:bg-white/10 text-slate-300 hover:text-white'}
                                `}
                            >
                                <Icon size={22} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                                {!isSidebarCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="font-medium whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                                {isSidebarCollapsed && (
                                    <div className="absolute left-full ml-4 px-2 py-1 bg-[#2D3E50] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/10 z-[100]">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Nav */}
                <div className="p-3 border-t border-white/5 space-y-2">
                    {bottomNavItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="flex items-center gap-3 px-3 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all group relative"
                            >
                                <Icon size={22} />
                                {!isSidebarCollapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
                            </Link>
                        );
                    })}
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all group relative"
                    >
                        <LogOut size={22} />
                        {!isSidebarCollapsed && <span className="text-sm font-medium whitespace-nowrap">Logout</span>}
                    </button>

                    {/* Collapse Toggle */}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="w-full flex items-center justify-center p-2 text-slate-500 hover:text-white mt-2"
                    >
                        {isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Topbar */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-8 flex-1 max-w-2xl">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00a4bd] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search contacts, deals, or activities..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-[#F3F5F7] border-transparent focus:bg-white focus:border-[#00a4bd] focus:ring-4 focus:ring-[#00a4bd]/10 rounded-xl transition-all outline-none text-sm placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="h-8 w-px bg-slate-200" />

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900 leading-tight">{userName}</p>
                                <p className="text-[10px] uppercase tracking-wider text-[#00a4bd] font-bold">CRM Workspace</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00a4bd] to-[#2D3E50] flex items-center justify-center text-white shadow-lg border-2 border-white">
                                <UserCircle size={24} />
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/crm/pipeline')}
                            className="bg-[#FF6B00] hover:bg-[#e66000] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#FF6B00]/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus size={18} />
                            Create New
                        </button>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-[1400px] mx-auto animate-fadeIn">
                        {children || <Outlet />}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CRMLayout;
