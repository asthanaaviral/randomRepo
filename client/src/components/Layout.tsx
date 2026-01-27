import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { LogOut, Send, Clock, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
    children: React.ReactNode;
    activeTab?: 'scheduled' | 'sent';
    onTabChange?: (tab: 'scheduled' | 'sent') => void;
    stats?: {
        scheduled: number;
        sent: number;
    };
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, stats }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white flex font-sans text-slate-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0">
                <div className="p-6 pb-4">
                    <h1 className="text-2xl font-black tracking-tight uppercase cursor-pointer" onClick={() => navigate('/dashboard')}>OUTBOX</h1>
                </div>

                {/* User Card */}
                <div className="px-4 mb-6">
                    <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors group relative border border-slate-100">
                        {user?.picture ? (
                            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-300" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-slate-900">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email || 'user@example.com'}</p>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </div>
                </div>

                <div className="px-4 mb-8">
                    <Button
                        onClick={() => navigate('/compose')}
                        className="w-full bg-white text-[#00AA44] border border-[#00AA44] hover:bg-green-50 font-medium py-2 rounded-full h-auto"
                    >
                        Compose
                    </Button>
                </div>

                <div className="px-6 mb-2">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-tight">CORE</p>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    <button
                        onClick={() => onTabChange?.('scheduled')}
                        className={cn(
                            "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            activeTab === 'scheduled' ? "bg-green-50 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Clock className={cn("w-4 h-4", activeTab === 'scheduled' ? "text-slate-900" : "text-slate-500")} />
                            <span>Scheduled</span>
                        </div>
                        {stats?.scheduled !== undefined && (
                            <span className={cn("text-xs font-medium", activeTab === 'scheduled' ? "text-slate-900" : "text-slate-400")}>
                                {stats.scheduled}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => onTabChange?.('sent')}
                        className={cn(
                            "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            activeTab === 'sent' ? "bg-green-50 text-slate-900" : "text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <Send className={cn("w-4 h-4", activeTab === 'sent' ? "text-slate-900" : "text-slate-500")} />
                            <span>Sent</span>
                        </div>
                        {stats?.sent !== undefined && (
                            <span className={cn("text-xs font-medium", activeTab === 'sent' ? "text-slate-900" : "text-slate-400")}>
                                {stats.sent}
                            </span>
                        )}
                    </button>
                </nav>

                <div className="p-4 mt-auto">
                    <button onClick={logout} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 px-4 py-2 transition-colors w-full">
                        <LogOut className="w-4 h-4" />
                        <span>Log out</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header & Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                <header className="bg-white border-b border-slate-200 md:hidden p-4 flex items-center justify-between sticky top-0 z-10">
                    <h1 className="text-lg font-black tracking-tighter">OUTBOX</h1>
                    <Button size="sm" variant="ghost" onClick={logout}>
                        <LogOut className="w-4 h-4" />
                    </Button>
                </header>
                {children}
            </div>
        </div>
    );
};

export default Layout;
