import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Phone,
    UserPlus,
    Trash2,
    MessageSquare,
    Facebook,
    Globe,
    Clock,
    Users,
    Upload,
    ArrowLeft,
    MapPin,
    Zap,
    Battery,
    Calendar,
    History as HistoryIcon,
    FileText,
    LayoutDashboard,
    ArrowRight
} from 'lucide-react';


import { dataService } from '../services/dataService';
import { Lead } from '../types';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';


const Leads = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const navigate = useNavigate();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [salesExecutives, setSalesExecutives] = useState<any[]>([]);
    const [surveyors, setSurveyors] = useState<any[]>([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [schedulingLead, setSchedulingLead] = useState<Lead | null>(null);
    const [visitData, setVisitData] = useState({ date: '', surveyorId: '' });
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [noteText, setNoteText] = useState('');

    const [newLead, setNewLead] = useState<Partial<Lead>>({
        name: '',
        contact_name: '',
        email: '',
        phone: '',
        district: '',
        pincode: '',
        last_month_bill: undefined,
        proposed_kw: undefined,
        lead_type: 'Residential',
        source: 'Web',
        status: 'new',
        notes: ''
    });

    useEffect(() => {
        fetchLeads();
        fetchSalesExecutives();
        fetchSurveyors();
    }, []);

    const fetchSalesExecutives = async () => {
        const data = await dataService.getProfilesByRole('Sales Executive');
        setSalesExecutives(data);
    };

    const fetchSurveyors = async () => {
        const data = await dataService.getProfilesByRole('Surveyor');
        setSurveyors(data);
    };

    const fetchLeads = async () => {
        setLoading(true);
        const data = await dataService.getLeads();
        setLeads(data);
        setLoading(false);
    };

    const handleAddLead = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await dataService.addLead(newLead);
        if (error) {
            toast.error('Failed to add lead');
        } else {
            toast.success('Lead added successfully');
            setIsAddModalOpen(false);
            setNewLead({
                name: '',
                contact_name: '',
                email: '',
                phone: '',
                district: '',
                pincode: '',
                last_month_bill: undefined,
                proposed_kw: undefined,
                lead_type: 'Residential',
                source: 'Web', 
                status: 'new', 
                notes: '' 
            });
            fetchLeads();
        }
    };

    const fetchLeadActivities = async (leadId: string) => {
        const logs = await dataService.getAuditLogs('Lead', leadId);
        setActivities(logs);
    };

    const handleSelectLead = async (lead: Lead) => {
        navigate(`/leads/${lead.id}`);
    };

    const handleBackToList = () => {
        setSelectedLead(null);
        setActivities([]);
    };

    const handleConvertToCustomer = async (lead: Lead) => {
        if (!confirm(`Convert ${lead.name} to a permanent customer?`)) return;

        const { error } = await dataService.convertLeadToCustomer(lead);
        if (error) {
            toast.error('Failed to convert lead');
        } else {
            toast.success('Lead converted to customer!');
            fetchLeads();
        }
    };

    const handleAssignLead = async (leadId: string, userId: string) => {
        const lead = leads.find(l => l.id === leadId);
        if (userId && lead && lead.status === 'new') {
            await dataService.updateLead(leadId, { status: 'contacted', assigned_to: userId });
        } else {
            await dataService.assignLead(leadId, userId);
        }
        toast.success('Lead updated');
        fetchLeads();
        if (selectedLead?.id === leadId) {
            setSelectedLead(prev => prev ? { ...prev, assigned_to: userId } : null);
            fetchLeadActivities(leadId);
        }
    };

    const handleStatusChange = async (lead: Lead, newStatus: string) => {
        if (newStatus === 'site_visit_scheduled') {
            setSchedulingLead(lead);
            setIsScheduleModalOpen(true);
            return;
        }

        const { error } = await dataService.updateLead(lead.id, { status: newStatus as any });
        if (error) {
            toast.error('Failed to update status');
        } else {
            toast.success('Status updated');
            fetchLeads();
            if (selectedLead?.id === lead.id) {
                setSelectedLead(prev => prev ? { ...prev, status: newStatus as any } : null);
                fetchLeadActivities(lead.id);
            }
        }
    };

    const handleSaveNote = async () => {
        if (!selectedLead || !noteText.trim()) return;
        
        const { error } = await dataService.updateLead(selectedLead.id, { notes: noteText });
        if (error) {
            toast.error('Failed to save note');
        } else {
            toast.success('Note added');
            setNoteText('');
            fetchLeadActivities(selectedLead.id);
        }
    };

    const handleConfirmSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schedulingLead) return;

        const { error } = await dataService.scheduleSiteVisit(schedulingLead.id, visitData.date, visitData.surveyorId);
        if (error) {
            toast.error('Failed to schedule visit');
        } else {
            toast.success('Site visit scheduled and added to calendar');
            setIsScheduleModalOpen(false);
            setSchedulingLead(null);
            setVisitData({ date: '', surveyorId: '' });
            fetchLeads();
        }
    };

    const handleDeleteLead = async (id: string) => {
        if (!confirm('Are you sure you want to delete this lead?')) return;
        const { error } = await dataService.deleteLead(id);
        if (error) {
            toast.error('Failed to delete lead');
        } else {
            toast.success('Lead deleted');
            fetchLeads();
        }
    };

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim());

            const leadsToImport = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim());
                const lead: any = { source: 'CSV Import', status: 'new' };
                headers.forEach((header, index) => {
                    if (header.toLowerCase() === 'name') lead.name = values[index];
                    if (header.toLowerCase() === 'email') lead.email = values[index];
                    if (header.toLowerCase() === 'phone') lead.phone = values[index];
                    if (header.toLowerCase() === 'notes') lead.notes = values[index];
                });
                return lead;
            }).filter(l => l.name);

            let successCount = 0;
            for (const lead of leadsToImport) {
                const { error } = await dataService.addLead(lead);
                if (!error) successCount++;
            }

            toast.success(`Imported ${successCount} leads`);
            setIsImportModalOpen(false);
            fetchLeads();
        };
        reader.readAsText(file);
    };

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.phone?.includes(searchTerm);
        const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800';
            case 'contacted': return 'bg-amber-100 text-amber-800';
            case 'site_visit_scheduled': return 'bg-purple-100 text-purple-800';
            case 'site_visit_completed': return 'bg-emerald-100 text-emerald-800';
            case 'follow_up': return 'bg-indigo-100 text-indigo-800';
            case 'closed_won': return 'bg-green-100 text-green-800';
            case 'closed_lost': return 'bg-red-100 text-red-800';
            case 'converted': return 'bg-emerald-100 text-emerald-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const getSourceIcon = (source: string) => {
        if (source?.toLowerCase().includes('facebook') || source?.toLowerCase().includes('fb')) {
            return <Facebook size={14} className="text-[#1877F2]" />;
        }
        return <Globe size={14} className="text-slate-400" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Lead Management</h1>
                    <p className="text-slate-500 text-sm">Track and convert potential solar customers</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-[#FF8A00] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-[#e67c00] transition-all shadow-lg shadow-orange-900/20"

                >
                    <Plus size={20} />
                    Add New Lead
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search leads by name, email or phone..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0051A5]/20 focus:border-[#0051A5] outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0051A5]/20 focus:border-[#0051A5] outline-none bg-white"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="site_visit_scheduled">Site Visit Scheduled</option>
                        <option value="site_visit_completed">Site Visit Completed</option>
                        <option value="follow_up">Follow Up</option>
                        <option value="closed_won">Closed Won</option>
                        <option value="closed_lost">Closed Lost</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                        <Upload size={18} />
                        Import CSV
                    </button>
                </div>
            </div>

            {/* Leads Table/Grid View */}
            {!selectedLead ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Lead Name</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Contact</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">District</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Created</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">Loading leads...</td>
                                </tr>
                            ) : filteredLeads.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <Users size={18} className="mx-auto text-slate-200 mb-4" />
                                        <p className="text-slate-500 font-medium">No leads found matching your criteria</p>
                                    </td>
                                </tr>
                            ) : filteredLeads.map(lead => (
                                <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleSelectLead(lead)}
                                            className="text-sm font-bold text-slate-900 hover:text-[#00a4bd] transition-colors flex items-center gap-2"
                                        >
                                            {lead.name}
                                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-[#00a4bd]" />

                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-medium text-slate-600">{lead.phone || 'No phone'}</div>
                                        <div className="text-[10px] text-slate-400">{lead.email || 'No email'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                        {lead.district || '—'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(lead.status)}`}>
                                            {lead.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                            {lead.lead_type || 'Residential'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleSelectLead(lead)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                                                title="View Lead Details"
                                            >
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] font-bold uppercase shrink-0">View Lead</span>
                                                    <ArrowRight size={14} />
                                                </div>
                                            </button>
                                            {!lead.is_converted && (
                                                <button
                                                    onClick={() => handleConvertToCustomer(lead)}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Convert to Customer"
                                                >
                                                    <UserPlus size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteLead(lead.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Lead"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* Split-Screen Detail View */
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleBackToList}
                            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm"
                        >
                            <ArrowLeft size={18} />
                            Back to Leads
                        </button>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <h2 className="text-xl font-bold text-slate-900">{selectedLead.name}</h2>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(selectedLead.status)}`}>
                            {selectedLead.status.replace(/_/g, ' ')}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column: Lead Details Card */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#00a4bd] mb-6 flex items-center gap-2">

                                    <LayoutDashboard size={14} />
                                    Lead Information
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact Name</label>
                                        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Users size={14} className="text-slate-300" />
                                            {selectedLead.contact_name || selectedLead.name}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone / Mobile</label>
                                        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Phone size={14} className="text-slate-300" />
                                            {selectedLead.phone || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">District / Location</label>
                                        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <MapPin size={14} className="text-slate-300" />
                                            {selectedLead.district || '—'}, {selectedLead.pincode || '—'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lead Type</label>
                                        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Zap size={14} className="text-slate-300" />
                                            {selectedLead.lead_type || 'Residential'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Proposed KW</label>
                                        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Battery size={14} className="text-slate-300" />
                                            {selectedLead.proposed_kw ? `${selectedLead.proposed_kw} KW` : 'Not Proposed'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Monthly Bill</label>
                                        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <FileText size={14} className="text-slate-300" />
                                            {selectedLead.last_month_bill ? `₹${selectedLead.last_month_bill}` : '—'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Site Visit</label>
                                        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-300" />
                                            {selectedLead.site_visit_datetime ? new Date(selectedLead.site_visit_datetime).toLocaleString() : 'Not Scheduled'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</label>

                                        <select
                                            className={`w-full px-2 py-1 rounded-lg text-xs font-bold outline-none border border-slate-200 cursor-pointer ${getStatusStyle(selectedLead.status)}`}
                                            value={selectedLead.status}
                                            onChange={(e) => handleStatusChange(selectedLead, e.target.value)}
                                        >
                                            <option value="new">New</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="site_visit_scheduled">Site Visit Scheduled</option>
                                            <option value="follow_up">Follow Up</option>
                                            <option value="closed_won">Closed Won</option>
                                            <option value="closed_lost">Closed Lost</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lead Owner</label>
                                        <select
                                            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 font-bold text-slate-700"
                                            value={selectedLead.assigned_to || ''}
                                            onChange={(e) => handleAssignLead(selectedLead.id, e.target.value)}
                                        >
                                            <option value="">Unassigned</option>
                                            {salesExecutives.map(exec => (
                                                <option key={exec.id} value={exec.id}>{exec.full_name || exec.email}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>


                            <div className="pt-8 border-t border-slate-50 grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Lead Source</label>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                        {getSourceIcon(selectedLead.source || '')}
                                        {selectedLead.source || 'Direct'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Dates</label>
                                    <div className="space-y-1 text-[10px] font-bold text-slate-400">
                                        <div className="flex justify-between">
                                            <span>CREATED</span>
                                            <span className="text-slate-600">{new Date(selectedLead.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>MODIFIED</span>
                                            <span className="text-slate-600">{selectedLead.last_modified_at ? new Date(selectedLead.last_modified_at).toLocaleDateString() : '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Conversation Activity Feed */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[600px]">
                            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#00a4bd]">Conversation</h3>

                                <span className="text-[10px] font-bold text-slate-400">{activities.length} total events</span>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                                {activities.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                                        <MessageSquare size={48} strokeWidth={1} />
                                        <p className="text-sm font-medium">No interaction history yet</p>
                                    </div>
                                ) : activities.map((activity, idx) => (
                                    <div key={idx} className="flex gap-4 group">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[#0051A5] shadow-sm">
                                                {activity.action?.includes('CREATE') ? <Plus size={14} /> :
                                                 activity.action?.includes('STATUS') ? <Clock size={14} /> :
                                                 <HistoryIcon size={14} />}

                                            </div>
                                            {idx !== activities.length - 1 && <div className="w-px h-full bg-slate-100"></div>}
                                        </div>
                                        <div className="flex-1 pb-6">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">{activity.action?.replace(/_/g, ' ')}</h4>
                                                <span className="text-[10px] font-bold text-slate-400">{new Date(activity.created_at).toLocaleString()}</span>
                                            </div>
                                            <div className="text-sm text-slate-500 bg-slate-50/50 p-3 rounded-2xl border border-slate-50">
                                                {typeof activity.changes === 'object' ? (
                                                    Object.entries(activity.changes).map(([k, v]) => (
                                                        <div key={k} className="flex justify-between gap-4">
                                                            <span className="font-bold text-[10px] text-slate-400 uppercase">{k}:</span>
                                                            <span className="truncate">{String(v)}</span>
                                                        </div>
                                                    ))
                                                ) : activity.changes}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-slate-50/50 border-t border-slate-50 space-y-4">
                                <textarea
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Type a note about this lead..."
                                    className="w-full h-24 p-4 bg-white border border-slate-200 rounded-2xl resize-none outline-none focus:ring-2 focus:ring-[#0051A5]/20 focus:border-[#0051A5] transition-all text-sm font-medium"
                                />
                                <button 
                                    onClick={() => navigate(`/leads/${selectedLead.id}/survey`)}
                                    className="w-full bg-[#0051A5] text-white py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#003d7a] transition-all shadow-lg mb-4 flex items-center justify-center gap-2"
                                >
                                    Start Site Survey
                                </button>
                                <button
                                    onClick={handleSaveNote}
                                    disabled={!noteText.trim()}
                                    className="w-full bg-[#FF8A00] text-white py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#e67c00] transition-all shadow-lg shadow-orange-500/10 disabled:opacity-50 disabled:shadow-none"
                                >
                                    Log Interaction
                                </button>
                            </div>


                        </div>
                    </div>
                </div>
            )}


            {/* Add Lead Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                    <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-6">Add New Solar Lead</h2>
                            <form onSubmit={handleAddLead} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0051A5]/20 focus:border-[#0051A5] outline-none"
                                        value={newLead.name}
                                        onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Email</label>
                                        <input
                                            type="email"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0051A5]/20 focus:border-[#0051A5] outline-none"
                                            value={newLead.email}
                                            onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Phone</label>
                                        <input
                                            type="tel"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0051A5]/20 focus:border-[#0051A5] outline-none"
                                            value={newLead.phone}
                                            onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Source</label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0051A5]/20 focus:border-[#0051A5] outline-none bg-white"
                                        value={newLead.source}
                                        onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                                    >
                                        <option value="Web">Website</option>
                                        <option value="Facebook">Facebook Ads</option>
                                        <option value="Referral">Referral</option>
                                        <option value="Direct">Direct Call</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Lead Type</label>
                                    <select
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0051A5]/20 focus:border-[#0051A5] outline-none bg-white"
                                        value={newLead.lead_type}
                                        onChange={(e) => setNewLead({ ...newLead, lead_type: e.target.value as any })}
                                    >
                                        <option value="Residential">Residential</option>
                                        <option value="Commercial">Commercial</option>
                                        <option value="Agriculture">Agriculture</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">District</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0051A5]/20 focus:border-[#0051A5] outline-none"
                                            value={newLead.district}
                                            onChange={(e) => setNewLead({ ...newLead, district: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Pincode</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0051A5]/20 focus:border-[#0051A5] outline-none"
                                            value={newLead.pincode}
                                            onChange={(e) => setNewLead({ ...newLead, pincode: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Prop. KW</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0051A5]/20 focus:border-[#0051A5] outline-none"
                                            value={newLead.proposed_kw}
                                            onChange={(e) => setNewLead({ ...newLead, proposed_kw: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Monthly Bill (₹)</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0051A5]/20 focus:border-[#0051A5] outline-none"
                                            value={newLead.last_month_bill}
                                            onChange={(e) => setNewLead({ ...newLead, last_month_bill: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Site Visit</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#00a4bd]/20 focus:border-[#00a4bd] outline-none"
                                        value={newLead.site_visit_datetime}
                                        onChange={(e) => setNewLead({ ...newLead, site_visit_datetime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Notes</label>

                                    <textarea
                                        rows={2}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0051A5]/20 focus:border-[#0051A5] outline-none resize-none"
                                        value={newLead.notes}
                                        onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                                    ></textarea>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-[#FF8A00] text-white rounded-xl font-bold hover:bg-[#e67c00] transition-all shadow-lg shadow-orange-900/20"
                                    >
                                        Save Lead
                                    </button>

                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Import CSV Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsImportModalOpen(false)}></div>
                    <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Import Leads</h2>
                            <p className="text-slate-500 text-sm mb-6">Upload a CSV file with headers: Name, Email, Phone, Notes</p>

                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors relative">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleCSVUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <div className="space-y-2">
                                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                                        <Upload size={24} />
                                    </div>
                                    <div className="text-sm font-medium text-slate-700">Click or drag CSV file to upload</div>
                                    <div className="text-xs text-slate-400">Max size 2MB</div>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="w-full mt-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Visit Modal */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsScheduleModalOpen(false)}></div>
                    <div className="relative bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Schedule Site Visit</h2>
                            <p className="text-slate-500 text-sm mb-6">Assign a surveyor and pick a date for {schedulingLead?.name}</p>

                            <form onSubmit={handleConfirmSchedule} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Surveyor</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0051A5]/20 focus:border-[#0051A5] outline-none bg-white"
                                        value={visitData.surveyorId}
                                        onChange={(e) => setVisitData({ ...visitData, surveyorId: e.target.value })}
                                    >
                                        <option value="">Select Surveyor...</option>
                                        {surveyors.map(s => (
                                            <option key={s.id} value={s.id}>{s.full_name || s.email}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Scheduled Date</label>
                                    <input
                                        required
                                        type="date"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#0051A5]/20 focus:border-[#0051A5] outline-none"
                                        value={visitData.date}
                                        onChange={(e) => setVisitData({ ...visitData, date: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsScheduleModalOpen(false)}
                                        className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-[#0051A5] text-white rounded-xl font-bold hover:bg-[#003d7a] transition-all shadow-lg shadow-blue-900/20"
                                    >
                                        Schedule
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leads;
