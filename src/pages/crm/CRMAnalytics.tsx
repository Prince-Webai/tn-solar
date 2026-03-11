import { useState, useEffect } from 'react';
import { dataService } from '../../services/dataService';
import { Lead } from '../../types';
import {
    TrendingUp,
    Users,
    Target,
    Award,
    BarChart2
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';

const COLORS = ['#00a4bd', '#FF6B00', '#2D3E50', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CRMAnalytics = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dataService.getLeads().then(data => {
            setLeads(data);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <div className="w-12 h-12 border-4 border-[#00a4bd]/20 border-t-[#00a4bd] rounded-full animate-spin" />
            </div>
        );
    }

    // ── Derived data ──────────────────────────────────────
    const total = leads.length;
    const won = leads.filter(l => l.status === 'closed_won' || l.is_converted).length;
    const lost = leads.filter(l => l.status === 'closed_lost').length;
    const active = total - won - lost;
    const winRate = total > 0 ? ((won / total) * 100).toFixed(1) : '0';

    // By status (funnel)
    const funnelData = [
        { stage: 'New', count: leads.filter(l => l.status === 'new').length },
        { stage: 'Contacted', count: leads.filter(l => l.status === 'contacted').length },
        { stage: 'Site Visit', count: leads.filter(l => l.status === 'site_visit_scheduled').length },
        { stage: 'Follow Up', count: leads.filter(l => l.status === 'follow_up').length },
        { stage: 'Won', count: won },
        { stage: 'Lost', count: lost },
    ];

    // By source (pie)
    const sourceMap: Record<string, number> = {};
    leads.forEach(l => {
        const src = l.source || 'Unknown';
        sourceMap[src] = (sourceMap[src] || 0) + 1;
    });
    const sourceData = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));

    // Monthly trend (area chart)
    const monthlyMap: Record<string, number> = {};
    leads.forEach(l => {
        const month = MONTHS[new Date(l.created_at).getMonth()];
        monthlyMap[month] = (monthlyMap[month] || 0) + 1;
    });
    const monthlyData = MONTHS.map(m => ({ month: m, leads: monthlyMap[m] || 0 }));

const KPICard = ({ label, value, sub, icon: Icon, color }: { label: string, value: string | number, sub: string, icon: any, color: string }) => (
        <div className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 ${color}`}>
                <Icon size={22} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
            <h2 className="text-4xl font-black text-slate-900">{value}</h2>
            <p className="text-xs font-bold text-slate-400 mt-1">{sub}</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">CRM Analytics</h1>
                <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-widest">Performance insights based on live data</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                <KPICard label="Total Leads" value={total} sub="All time" icon={Users} color="bg-blue-500" />
                <KPICard label="Active Leads" value={active} sub="In pipeline" icon={Target} color="bg-[#00a4bd]" />
                <KPICard label="Deals Won" value={won} sub="Converted / Closed Won" icon={Award} color="bg-emerald-500" />
                <KPICard label="Win Rate" value={`${winRate}%`} sub={`${won} out of ${total}`} icon={TrendingUp} color="bg-[#FF6B00]" />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Funnel Bar */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart2 size={18} className="text-[#00a4bd]" />
                        <div>
                            <h3 className="font-black text-slate-900">Conversion Funnel</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead count by stage</p>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 700 }}
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={36}>
                                    {funnelData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Source Pie */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h3 className="font-black text-slate-900 mb-1">Leads by Source</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Where leads come from</p>
                    {sourceData.length > 0 ? (
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sourceData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        innerRadius={40}
                                        paddingAngle={3}
                                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {sourceData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 700 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-56 flex items-center justify-center text-slate-300">
                            <p className="text-sm font-bold">No source data yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-black text-slate-900 mb-1">Monthly Lead Trend</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">New leads added each month this year</p>
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00a4bd" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00a4bd" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontWeight: 700 }}
                            />
                            <Area type="monotone" dataKey="leads" stroke="#00a4bd" strokeWidth={3} fill="url(#colorLeads)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Deals Lost</p>
                    <p className="text-4xl font-black text-red-500">{lost}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">{total > 0 ? ((lost / total) * 100).toFixed(1) : 0}% of total</p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Most Common Source</p>
                    <p className="text-2xl font-black text-[#00a4bd]">
                        {sourceData.sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}
                    </p>
                    <p className="text-xs font-bold text-slate-400 mt-1">
                        {sourceData.sort((a, b) => b.value - a.value)[0]?.value || 0} leads
                    </p>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">In Follow-Up</p>
                    <p className="text-4xl font-black text-purple-500">
                        {leads.filter(l => l.status === 'follow_up').length}
                    </p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Needs attention</p>
                </div>
            </div>
        </div>
    );
};

export default CRMAnalytics;
