import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { dataService } from "../../services/dataService";
import { Lead } from "../../types";
import {
    Search,
    Plus,
    Calendar,
    Phone,
    Mail,
    ArrowRight,
    X,
    User
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
    { value: 'new', label: 'New Lead', color: 'bg-blue-100 text-blue-800' },
    { value: 'contacted', label: 'Contacted', color: 'bg-amber-100 text-amber-800' },
    { value: 'site_visit_scheduled', label: 'Site Visit', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'follow_up', label: 'Follow Up', color: 'bg-purple-100 text-purple-800' },
    { value: 'closed_won', label: 'Closed Won', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 text-red-800' }
];

const SOURCE_OPTIONS = ['Web', 'Phone', 'Referral', 'Facebook', 'WhatsApp', 'Walk-in', 'Other'];

const CRMPipeline = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [fieldDefinitions, setFieldDefinitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newLead, setNewLead] = useState<Partial<Lead>>({
        name: '',
        email: '',
        phone: '',
        source: 'Web',
        status: 'new',
        notes: ''
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [leadsData, fieldsData] = await Promise.all([
                dataService.getLeads(),
                dataService.getCustomFieldDefinitions('lead')
            ]);
            setLeads(leadsData);
            setFieldDefinitions(fieldsData);
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load pipeline");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleStatusChange = async (leadId: string, newStatus: string) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead || lead.status === newStatus) return;

        // Optimistic update
        setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l));

        const { error } = await dataService.updateLead(leadId, { status: newStatus as any });
        if (error) {
            toast.error("Failed to update status");
            loadData(); // Revert
        } else {
            toast.success("Status updated");
        }
    };

    const handleCreateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLead.name?.trim()) {
            toast.error("Name is required");
            return;
        }
        setSaving(true);
        const { error } = await dataService.addLead(newLead);
        setSaving(false);
        if (error) {
            toast.error("Failed to create lead");
        } else {
            toast.success("Lead created successfully!");
            setShowCreateModal(false);
            setNewLead({ name: '', email: '', phone: '', source: 'Web', status: 'new', notes: '' });
            loadData();
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (lead.phone && lead.phone.includes(searchTerm));
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
        return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                <div className="w-12 h-12 border-4 border-[#00a4bd]/20 border-t-[#00a4bd] rounded-full animate-spin"></div>
                <span className="mt-4 text-slate-500 font-medium tracking-wide">Syncing Deals...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Sales Pipeline</h1>
                    <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-widest text-[#00a4bd]">Track Active Deals</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00a4bd]" size={16} />
                        <input
                            type="text"
                            placeholder="Search deals..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-48 md:w-64 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00a4bd] outline-none transition-all"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm outline-none cursor-pointer focus:border-[#00a4bd]"
                    >
                        <option value="all">All Statuses</option>
                        {STATUS_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#e66000] shadow-lg shadow-[#FF6B00]/20 transition-all border-b-4 border-[#cc5500] active:border-b-0 active:translate-y-1"
                    >
                        <Plus size={16} />
                        Create Deal
                    </button>
                </div>
            </div>

            {/* Stats bar */}
            <div className="flex gap-4 flex-wrap">
                {STATUS_OPTIONS.map(opt => {
                    const count = leads.filter(l => l.status === opt.value).length;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => setStatusFilter(statusFilter === opt.value ? 'all' : opt.value)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${statusFilter === opt.value ? 'ring-2 ring-offset-1 ring-[#00a4bd]' : 'opacity-70 hover:opacity-100'} ${opt.color}`}
                        >
                            {opt.label}
                            <span className="bg-white/60 rounded-full px-1.5 py-0.5">{count}</span>
                        </button>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-black">
                                <th className="px-6 py-4">Lead Details</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Contact Info</th>
                                {fieldDefinitions.map(field => (
                                    <th key={field.id} className="px-6 py-4">{field.field_label}</th>
                                ))}
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLeads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00a4bd] to-[#2D3E50] border-2 border-white shadow-sm flex items-center justify-center text-white font-black text-lg shrink-0">
                                                {lead.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p
                                                    className="font-bold text-slate-900 leading-tight group-hover:text-[#00a4bd] cursor-pointer transition-colors"
                                                    onClick={() => navigate(`/crm/leads/${lead.id}`)}
                                                >
                                                    {lead.name}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-slate-400">
                                                    <Calendar size={12} />
                                                    {new Date(lead.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <div className="relative inline-block w-full max-w-[160px]">
                                            <select
                                                value={lead.status}
                                                onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                                                className={`w-full appearance-none text-xs font-bold px-3 py-2 pr-8 rounded-lg cursor-pointer outline-none transition-all shadow-sm ${
                                                    STATUS_OPTIONS.find(opt => opt.value === lead.status)?.color || 'bg-slate-100 text-slate-800'
                                                } focus:ring-2 focus:ring-[#00a4bd]`}
                                            >
                                                {STATUS_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value} className="bg-white text-slate-900 font-medium">
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-70">
                                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                                            {lead.email && (
                                                <span className="flex items-center gap-2 hover:text-[#00a4bd] transition-colors"><Mail size={14} className="text-slate-400 shrink-0" /> <span className="truncate max-w-[160px]">{lead.email}</span></span>
                                            )}
                                            {lead.phone && (
                                                <span className="flex items-center gap-2 hover:text-[#00a4bd] transition-colors"><Phone size={14} className="text-slate-400 shrink-0" /> {lead.phone}</span>
                                            )}
                                            {!lead.email && !lead.phone && <span className="text-slate-400 italic">No contact info</span>}
                                        </div>
                                    </td>
                                    {fieldDefinitions.map(field => {
                                        const value = lead.custom_fields?.[field.field_name];
                                        return (
                                            <td key={field.id} className="px-6 py-4 text-sm font-medium text-slate-700">
                                                {value !== undefined && value !== null ? value.toString() : <span className="text-slate-300">—</span>}
                                            </td>
                                        );
                                    })}
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => navigate(`/crm/leads/${lead.id}`)}
                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 text-[#00a4bd] font-bold text-xs rounded-lg hover:bg-[#00a4bd] hover:text-white transition-all shadow-sm"
                                        >
                                            View <ArrowRight size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredLeads.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="px-6 py-16 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                <Search size={28} className="text-[#00a4bd]" />
                                            </div>
                                            <p className="font-black text-slate-700 text-lg mb-1">No deals found</p>
                                            <p className="text-sm font-medium text-slate-400">Try adjusting your filters or create a new deal.</p>
                                            <button
                                                onClick={() => setShowCreateModal(true)}
                                                className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#e66000] transition-all"
                                            >
                                                <Plus size={16} /> Create First Deal
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Deal Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-[#2D3E50] to-[#1a2535] p-6 text-white">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black">Create New Deal</h2>
                                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-0.5">Add to Pipeline</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleCreateLead} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Rajesh Kumar"
                                    value={newLead.name}
                                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00a4bd] focus:ring-2 focus:ring-[#00a4bd]/20 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        placeholder="email@example.com"
                                        value={newLead.email || ''}
                                        onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00a4bd] focus:ring-2 focus:ring-[#00a4bd]/20 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
                                    <input
                                        type="tel"
                                        placeholder="+91 9876543210"
                                        value={newLead.phone || ''}
                                        onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00a4bd] focus:ring-2 focus:ring-[#00a4bd]/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Source</label>
                                    <select
                                        value={newLead.source || 'Web'}
                                        onChange={(e) => setNewLead({ ...newLead, source: e.target.value as any })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00a4bd] outline-none transition-all cursor-pointer"
                                    >
                                        {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Initial Status</label>
                                    <select
                                        value={newLead.status || 'new'}
                                        onChange={(e) => setNewLead({ ...newLead, status: e.target.value as any })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00a4bd] outline-none transition-all cursor-pointer"
                                    >
                                        {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
                                <textarea
                                    rows={3}
                                    placeholder="Any initial notes or requirements..."
                                    value={newLead.notes || ''}
                                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00a4bd] focus:ring-2 focus:ring-[#00a4bd]/20 outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#e66000] transition-all border-b-4 border-[#cc5500] active:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Creating...' : 'Create Deal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRMPipeline;
