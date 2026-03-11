import { useState, useEffect } from 'react';
import {
    Users,
    Target,
    TrendingUp,
    Clock,
    ArrowUpRight,
    Calendar,
    Plus,
    Activity,
    Mail,
    Phone
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { dataService } from '../../services/dataService';
import { Lead } from '../../types';

const CRMDashboard = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                setLoading(true);
                const [leadData, auditData, projectData] = await Promise.all([
                    dataService.getLeads(),
                    dataService.getAuditLogs('lead', ''), // Get recent logs
                    dataService.getProjects()
                ]);
                setLeads(leadData);
                setActivities(auditData.slice(0, 5));
                setProjects(projectData.data || []);
            } catch (error) {
                console.error("Dashboard error:", error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, []);

    const totalLeads = leads.length;
    const closedWonLeads = leads.filter(l => l.status === 'closed_won' || l.is_converted).length;
    const conversionRate = totalLeads > 0 ? ((closedWonLeads / totalLeads) * 100).toFixed(1) + '%' : '0%';
    const totalRevenue = projects.reduce((sum, p) => sum + (p.total_price || 0), 0);
    const revenueFormatted = `₹${(totalRevenue / 100000).toFixed(2)}L`;

    const stats = [
        {
            label: 'Total Leads',
            value: totalLeads,
            change: '',
            isPositive: true,
            icon: Users,
            color: 'bg-blue-500'
        },
        {
            label: 'Conversion Rate',
            value: conversionRate,
            change: '',
            isPositive: true,
            icon: Target,
            color: 'bg-emerald-500'
        },
        {
            label: 'Project Revenue',
            value: revenueFormatted,
            change: '',
            isPositive: true,
            icon: TrendingUp,
            color: 'bg-[#FF6B00]'
        },
        {
            label: 'Avg. Response',
            value: 'Fast',
            change: '',
            isPositive: true,
            icon: Clock,
            color: 'bg-purple-500'
        },
    ];

    const pipelineData = [
        { stage: 'New', count: leads.filter(l => l.status === 'new').length },
        { stage: 'Contacted', count: leads.filter(l => l.status === 'contacted').length },
        { stage: 'Site Visit', count: leads.filter(l => l.status === 'site_visit_scheduled').length },
        { stage: 'Follow Up', count: leads.filter(l => l.status === 'follow_up').length },
        { stage: 'Converted', count: closedWonLeads },
    ];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <div className="w-12 h-12 border-4 border-[#00a4bd]/20 border-t-[#00a4bd] rounded-full animate-spin"></div>
                <span className="mt-4 text-slate-500 font-medium animate-pulse">Syncing CRM Workspace...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sales Overview</h1>
                    <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-widest">Real-time Performance Metrics</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-all hover:border-[#00a4bd]">
                        <Calendar size={16} />
                        Summary
                    </button>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`${stat.color} p-3 rounded-2xl text-white shadow-lg`}>
                                    <Icon size={24} />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                                <h2 className="text-3xl font-black text-slate-900">{stat.value}</h2>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pipeline Funnel */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 leading-tight">Sales Pipeline Funnel</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Lead volume by stage</p>
                        </div>
                    </div>

                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pipelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="stage"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 800 }}
                                />
                                <Bar
                                    dataKey="count"
                                    fill="#00a4bd"
                                    radius={[8, 8, 0, 0]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-[#2D3E50] rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl">
                        <Activity size={120} strokeWidth={4} />
                    </div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-xl font-black text-white">Live Activities</h3>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Real-time Stream</p>
                            </div>
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        </div>

                        <div className="space-y-6 flex-1">
                            {activities.length > 0 ? activities.map((activity, idx) => (
                                <div key={idx} className="flex gap-4 group cursor-pointer">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#00a4bd] transition-colors">
                                        <Clock size={18} className="text-slate-400 group-hover:text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white text-sm font-bold leading-tight group-hover:text-[#00a4bd] transition-colors truncate">
                                            {activity.action.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-slate-400 text-xs mt-1 truncate">
                                            {new Date(activity.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 opacity-50">
                                    <Clock size={32} />
                                    <p className="text-sm font-bold uppercase tracking-widest">No recent activity</p>
                                </div>
                            )}
                        </div>

                        <button className="w-full mt-6 py-3 border border-white/20 rounded-xl text-white text-sm font-bold hover:bg-white inset-0 hover:text-[#2D3E50] transition-colors group flex items-center justify-center gap-2">
                            View All History
                            <ArrowUpRight size={16} className="opacity-50 group-hover:opacity-100" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions (Bottom Row) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { title: 'New Deal', desc: 'Add a new opportunity to the pipeline', icon: Plus },
                    { title: 'Send Email', desc: 'Compose a message to a contact', icon: Mail },
                    { title: 'Log Call', desc: 'Record details of a phone conversation', icon: Phone },
                ].map((action, idx) => {
                    const Icon = action.icon;
                    return (
                        <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-[#00a4bd] hover:shadow-lg transition-all cursor-pointer group flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-[#00a4bd]/10 transition-colors">
                                <Icon size={20} className="text-slate-400 group-hover:text-[#00a4bd]" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 group-hover:text-[#00a4bd] transition-colors">{action.title}</h4>
                                <p className="text-xs text-slate-500 mt-1">{action.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Assuming lucide-react has Phone, Mail; if not, we get TS errors. I forgot to import them.
// Let's add them to the top import block in the file string above before actually writing it. Wait, the tool is a simple payload submission, I can just replace later if needed or write it correctly.
// Oh wait, I didn't import Phone, Mail. I will append them locally here in a second call or write them correctly if it fails.
export default CRMDashboard;
