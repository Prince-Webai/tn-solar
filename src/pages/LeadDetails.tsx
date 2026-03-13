import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Phone, Users, MapPin, Zap, Battery, Calendar, History as HistoryIcon,
    FileText, LayoutDashboard, MessageSquare, Plus, Clock, ArrowLeft
} from 'lucide-react';
import { dataService } from '../services/dataService';
import { auditLogger } from '../services/AuditLogService';
import { Lead } from '../types';
import toast from 'react-hot-toast';

const LeadDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<any[]>([]);
    const [salesExecutives, setSalesExecutives] = useState<any[]>([]);
    const [noteText, setNoteText] = useState('');
    const [activityType, setActivityType] = useState('Note');
    const [selectedForm, setSelectedForm] = useState('');
    const [formData, setFormData] = useState<any>({});

    const calculateAge = (dobString: string) => {
        if (!dobString) return 0;
        const today = new Date();
        const birthDate = new Date(dobString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    useEffect(() => {
        if (id) {
            loadLeadData();
        }
    }, [id]);

    const loadLeadData = async () => {
        setLoading(true);
        try {
            const [leads, logs, salesExecs] = await Promise.all([
                dataService.getLeads(),
                dataService.getAuditLogs('Lead', id!),
                dataService.getProfilesByRole('Sales Executive')
            ]);
            const foundLead = leads.find(l => l.id === id);
            if (foundLead) {
                setLead(foundLead);
            } else {
                toast.error("Lead not found");
                navigate('/leads');
            }
            setActivities(logs);
            setSalesExecutives(salesExecs);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load details");
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800';
            case 'contacted': return 'bg-amber-100 text-amber-800';
            case 'site_visit_scheduled': return 'bg-purple-100 text-purple-800';
            case 'follow_up': return 'bg-indigo-100 text-indigo-800';
            case 'closed_won': return 'bg-green-100 text-green-800';
            case 'closed_lost': return 'bg-red-100 text-red-800';
            case 'converted': return 'bg-emerald-100 text-emerald-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!lead) return;
        const { error } = await dataService.updateLead(lead.id, { status: newStatus as any });
        if (error) {
            toast.error('Failed to update status');
        } else {
            toast.success('Status updated');
            loadLeadData();
        }
    };

    const handleAssignLead = async (userId: string) => {
        if (!lead) return;
        if (userId && lead.status === 'new') {
            await dataService.updateLead(lead.id, { status: 'contacted', assigned_to: userId });
        } else {
            await dataService.assignLead(lead.id, userId);
        }
        toast.success('Lead updated');
        loadLeadData();
    };

    const handleSaveNote = async () => {
        if (!lead || !noteText.trim()) return;
        
        if (activityType === 'Note') {
            await dataService.updateLead(lead.id, { notes: noteText });
        } else {
            await auditLogger.log({
                entity_type: 'Lead',
                entity_id: lead.id,
                action: activityType.toUpperCase().replace(/\s+/g, '_'),
                changes: { Notes: noteText },
                performed_by: ''
            });
        }
        
        toast.success('Activity logged');
        setNoteText('');
        setActivityType('Note');
        loadLeadData();
    };

    const handleFormSubmit = async () => {
        if (!lead || !selectedForm) return;

        if (selectedForm === 'Site visit booking form') {
            // Update basic lead details if applicable
            await dataService.updateLead(lead.id, { 
                status: 'site_visit_scheduled',
                proposed_kw: formData.proposed_kw ? Number(formData.proposed_kw) : lead.proposed_kw,
                site_visit_datetime: formData.date && formData.time ? `${formData.date}T${formData.time}` : lead.site_visit_datetime,
                district: formData.site_location || lead.district
            });
            
            await auditLogger.log({
                entity_type: 'Lead',
                entity_id: lead.id,
                action: 'SITE_VISIT_BOOKED',
                changes: formData,
                performed_by: ''
            });
            toast.success('Site visit booked');
        } else if (selectedForm === 'Sales form') {
            await auditLogger.log({
                entity_type: 'Lead',
                entity_id: lead.id,
                action: 'SALES_FORM_SUBMITTED',
                changes: formData,
                performed_by: ''
            });
            toast.success('Sales form submitted');
        }

        setSelectedForm('');
        setFormData({});
        loadLeadData();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#00a4bd]/20 border-t-[#00a4bd]" />
            </div>
        );
    }

    if (!lead) return null;

    return (
        <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto auto-rows-min pb-20 fade-in animate-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <button
                    onClick={() => navigate('/leads')}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all text-sm shrink-0"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>
                <div className="h-8 w-px bg-slate-200 hidden md:block" />
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">{lead.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase font-black tracking-widest text-[#00a4bd]">View Lead Data</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center shrink-0">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${getStatusStyle(lead.status)} border border-current/10 shadow-sm`}>
                        {lead.status.replace(/_/g, ' ')}
                    </span>
                </div>
            </div>

            {/* Split Content layout similar to Leads.tsx split screen */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Left Column: Details */}
                <div className="xl:col-span-7 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-8 self-start">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#00a4bd] mb-6 flex items-center gap-2">
                            <LayoutDashboard size={14} />
                            Lead Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-8">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact Name</label>
                                <p className="text-[15px] font-bold text-slate-800 flex items-center gap-2.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                    <Users size={16} className="text-[#00a4bd]" />
                                    {lead.contact_name || lead.name}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phone / Mobile</label>
                                <p className="text-[15px] font-bold text-slate-800 flex items-center gap-2.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                    <Phone size={16} className="text-[#00a4bd]" />
                                    {lead.phone || 'N/A'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">District / Pincode</label>
                                <p className="text-[15px] font-bold text-slate-800 flex items-center gap-2.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                    <MapPin size={16} className="text-[#00a4bd]" />
                                    {lead.district || '—'}, {lead.pincode || '—'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lead Type</label>
                                <p className="text-[15px] font-bold text-slate-800 flex items-center gap-2.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                    <Zap size={16} className="text-[#00a4bd]" />
                                    {lead.lead_type || 'Residential'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Proposed KW</label>
                                <p className="text-[15px] font-bold text-slate-800 flex items-center gap-2.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                    <Battery size={16} className="text-[#00a4bd]" />
                                    {lead.proposed_kw ? `${lead.proposed_kw} KW` : 'Not Proposed'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Last Month Bill</label>
                                <p className="text-[15px] font-bold text-slate-800 flex items-center gap-2.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                    <FileText size={16} className="text-[#00a4bd]" />
                                    {lead.last_month_bill ? `₹${lead.last_month_bill}` : '—'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Site Visit</label>
                                <p className="text-[15px] font-bold text-slate-800 flex items-center gap-2.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                    <Calendar size={16} className="text-[#00a4bd]" />
                                    {lead.site_visit_datetime ? new Date(lead.site_visit_datetime).toLocaleString() : 'Not Scheduled'}
                                </p>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</label>
                                <select
                                    className={`w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none border border-slate-200 cursor-pointer focus:ring-2 focus:ring-[#00a4bd]/20 transition-all ${getStatusStyle(lead.status)} bg-opacity-20`}
                                    value={lead.status}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                >
                                    <option value="new">New</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="site_visit_scheduled">Site Visit Scheduled</option>
                                    <option value="site_visit_completed">Site Visit Completed</option>
                                    <option value="follow_up">Follow Up</option>
                                    <option value="closed_won">Closed Won</option>
                                    <option value="closed_lost">Closed Lost</option>
                                </select>
                            </div>
                            
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Lead Owner</label>
                                <select
                                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#00a4bd]/20 font-bold text-slate-700 transition-all cursor-pointer"
                                    value={lead.assigned_to || ''}
                                    onChange={(e) => handleAssignLead(e.target.value)}
                                >
                                    <option value="">Unassigned</option>
                                    {salesExecutives.map(exec => (
                                        <option key={exec.id} value={exec.id}>{exec.full_name || exec.email}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-8 mt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 -mx-8 px-8 pb-4">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Lead Source</label>
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                    <span className="bg-white px-3 py-1.5 rounded-lg border border-slate-200">{lead.source || 'Direct'}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Dates</label>
                                <div className="space-y-2 text-xs font-bold text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] uppercase">Created Date</span>
                                        <span className="text-slate-800">{new Date(lead.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="h-px bg-slate-100 w-full" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] uppercase">Last Modified</span>
                                        <span className="text-slate-800">{lead.last_modified_at ? new Date(lead.last_modified_at).toLocaleDateString() : '—'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Timeline / Conversation */}
                <div className="xl:col-span-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[750px]">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#00a4bd] flex items-center gap-2">
                            <HistoryIcon size={14} /> Timeline & Conversation
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">{activities.length} Events</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50/30">
                        {activities.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                                <MessageSquare size={48} strokeWidth={1} />
                                <p className="text-sm font-medium">No interaction history yet</p>
                            </div>
                        ) : activities.map((activity, idx) => (
                            <div key={idx} className="flex gap-4 group">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center text-[#00a4bd] shadow-sm relative z-10 group-hover:border-[#00a4bd]/30 transition-colors">
                                        {activity.action?.includes('CREATE') ? <Plus size={14} /> :
                                         activity.action?.includes('STATUS') ? <Clock size={14} /> :
                                         <MessageSquare size={13} />}
                                    </div>
                                    {idx !== activities.length - 1 && <div className="w-px h-full bg-slate-200"></div>}
                                </div>
                                <div className="flex-1 pb-6 w-full max-w-full">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">{activity.action?.replace(/_/g, ' ')}</h4>
                                        <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">
                                            {new Date(activity.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-sm text-slate-600 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm overflow-hidden break-words">
                                        {typeof activity.changes === 'object' ? (
                                            <div className="space-y-1.5">
                                                {Object.entries(activity.changes).map(([k, v]) => (
                                                    <div key={k} className="flex flex-col gap-0.5">
                                                        <span className="font-black text-[9px] text-slate-400 uppercase tracking-widest">{k}</span>
                                                        <span className="font-medium text-slate-700 text-sm whitespace-pre-wrap">{String(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : activity.changes}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Compose / Forms Section */}
                    <div className="p-6 bg-white border-t border-slate-100 shrink-0">
                        <div className="flex gap-4 mb-4">
                            <div className="flex-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Log Activity</label>
                                <select 
                                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#00a4bd] text-sm font-bold text-slate-700 bg-slate-50 cursor-pointer"
                                    value={activityType}
                                    onChange={(e) => { setActivityType(e.target.value); setSelectedForm(''); }}
                                >
                                    <option value="Note">General Note</option>
                                    <option value="Phone call">Phone call</option>
                                    <option value="Email">Email</option>
                                    <option value="Whatsapp call">Whatsapp call</option>
                                    <option value="Whatsapp message">Whatsapp message</option>
                                    <option value="Site visit booked">Site visit booked</option>
                                    <option value="Site visit completed">Site visit completed</option>
                                    <option value="Site visit cancelled">Site visit cancelled</option>
                                    <option value="Callback">Callback</option>
                                    <option value="Drop">Drop</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Fill Form</label>
                                <select 
                                    className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#00a4bd] text-sm font-bold text-slate-700 bg-slate-50 cursor-pointer"
                                    value={selectedForm}
                                    onChange={(e) => { setSelectedForm(e.target.value); setFormData({}); }}
                                >
                                    <option value="">Select Form...</option>
                                    <option value="Site visit booking form">Site visit booking form</option>
                                    <option value="Sales form">Sales form</option>
                                </select>
                            </div>
                        </div>

                        {!selectedForm ? (
                            <>
                                <textarea
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder={`Type details for ${activityType}...`}
                                    className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-2xl resize-none outline-none focus:ring-2 focus:ring-[#00a4bd]/20 focus:bg-white focus:border-[#00a4bd] transition-all text-sm font-medium mb-3"
                                />
                                <button
                                    onClick={handleSaveNote}
                                    disabled={!noteText.trim()}
                                    className="w-full bg-[#FF6B00] text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#e66000] transition-all disabled:opacity-50 shadow-lg shadow-[#FF6B00]/20 active:translate-y-px"
                                >
                                    {activityType === 'Note' ? 'Post to Timeline' : `Log ${activityType}`}
                                </button>
                            </>
                        ) : selectedForm === 'Site visit booking form' ? (
                            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-3">
                                <h4 className="font-bold text-slate-800 text-sm">Site Visit Booking Details</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Proposed KW</label>
                                        <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm" 
                                            value={formData.proposed_kw || ''} onChange={e => setFormData({...formData, proposed_kw: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Site Location</label>
                                        <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm" 
                                            value={formData.site_location || ''} onChange={e => setFormData({...formData, site_location: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Date</label>
                                        <input type="date" className="w-full p-2 border border-slate-200 rounded-lg text-sm" 
                                            value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Time</label>
                                        <input type="time" className="w-full p-2 border border-slate-200 rounded-lg text-sm" 
                                            value={formData.time || ''} onChange={e => setFormData({...formData, time: e.target.value})} />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Map Location (Coordinates / Link)</label>
                                        <input type="text" placeholder="Paste Google Maps link" className="w-full p-2 border border-slate-200 rounded-lg text-sm" 
                                            value={formData.map_location || ''} onChange={e => setFormData({...formData, map_location: e.target.value})} />
                                    </div>
                                </div>
                                <button onClick={handleFormSubmit} className="w-full bg-[#00a4bd] text-white py-2.5 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-[#008ba1] mt-2">
                                    Book Site Visit
                                </button>
                            </div>
                        ) : selectedForm === 'Sales form' ? (
                            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-3 h-64 overflow-y-auto">
                                <h4 className="font-bold text-slate-800 text-sm">Customer Sales Details</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Sale Type</label>
                                        <select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                            value={formData.sale_type || ''} onChange={e => setFormData({...formData, sale_type: e.target.value})}>
                                            <option value="">Select Type...</option>
                                            <option value="Residential">Residential</option>
                                            <option value="Commercial">Commercial</option>
                                            <option value="Agriculture">Agriculture</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Client DOB</label>
                                        <input type="date" className="w-full p-2 border border-slate-200 rounded-lg text-sm" 
                                            value={formData.dob || ''} onChange={e => setFormData({...formData, dob: e.target.value})} />
                                    </div>
                                    <div className="border border-slate-200 p-3 rounded-lg bg-white space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 block border-b pb-1 mb-2">Required Documents</label>
                                        <div className="text-sm flex flex-col gap-2">
                                            <div className="flex justify-between items-center"><span className="text-slate-600 font-semibold text-xs">Quotation Upload</span> <input type="file" className="text-xs w-48" onChange={e => setFormData({...formData, quotation_file: e.target.value})}/></div>
                                            <div className="flex justify-between items-center"><span className="text-slate-600 font-semibold text-xs">Primary Aadhar Card (Front & Back)</span> <input type="file" className="text-xs w-48" onChange={e => setFormData({...formData, aadhar_file: e.target.value})} multiple/></div>
                                            <div className="flex justify-between items-center"><span className="text-slate-600 font-semibold text-xs">Primary Pan Card</span> <input type="file" className="text-xs w-48" onChange={e => setFormData({...formData, pan_file: e.target.value})} /></div>
                                            <div className="flex justify-between items-center"><span className="text-slate-600 font-semibold text-xs">Primary EB Bill Upload</span> <input type="file" className="text-xs w-48" onChange={e => setFormData({...formData, eb_bill_file: e.target.value})}/></div>
                                            <div className="flex justify-between items-center"><span className="text-slate-600 font-semibold text-xs">Primary Bank Document (Passbook/Cheque)</span> <input type="file" className="text-xs w-48" onChange={e => setFormData({...formData, bank_doc_file: e.target.value})}/></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Downpayment Amount</label>
                                            <input type="number" className="w-full p-2 border border-slate-200 rounded-lg text-sm" 
                                                value={formData.downpayment || ''} onChange={e => setFormData({...formData, downpayment: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Downpayment Proof</label>
                                            <input type="file" className="w-full p-1.5 border border-slate-200 rounded-lg text-xs" 
                                                onChange={e => setFormData({...formData, dp_proof_file: e.target.value})} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Remaining Amount Payment Mode</label>
                                            <select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white"
                                                value={formData.payment_mode || ''} onChange={e => setFormData({...formData, payment_mode: e.target.value})}>
                                                <option value="">Select Mode...</option>
                                                <option value="Loan">Loan</option>
                                                <option value="Full Payment">Full Payment</option>
                                            </select>
                                        </div>
                                    </div>

                                    {formData.payment_mode === 'Loan' && calculateAge(formData.dob) > 62 && (
                                        <div className="border border-orange-200 p-4 rounded-xl bg-orange-50/50 space-y-4 animate-in fade-in slide-in-from-top-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">!</div>
                                                <div>
                                                    <h5 className="font-bold text-orange-800 text-xs">Co-Applicant Required</h5>
                                                    <p className="text-[10px] text-orange-600">Client is older than 62 ({calculateAge(formData.dob)} years). Co-applicant is mandatory for Loan.</p>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Co-Applicant Name</label>
                                                <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white" 
                                                    value={formData.co_applicant_name || ''} onChange={e => setFormData({...formData, co_applicant_name: e.target.value})} />
                                            </div>
                                            <div className="text-sm flex flex-col gap-2">
                                                <div className="flex justify-between items-center"><span className="text-slate-600 font-semibold text-xs">Co-Applicant Aadhar Card</span> <input type="file" className="text-xs w-48" onChange={e => setFormData({...formData, co_aadhar_file: e.target.value})} multiple/></div>
                                                <div className="flex justify-between items-center"><span className="text-slate-600 font-semibold text-xs">Co-Applicant Pan Card</span> <input type="file" className="text-xs w-48" onChange={e => setFormData({...formData, co_pan_file: e.target.value})}/></div>
                                                <div className="flex justify-between items-center"><span className="text-slate-600 font-semibold text-xs">Co-Applicant EB Bill</span> <input type="file" className="text-xs w-48" onChange={e => setFormData({...formData, co_eb_bill_file: e.target.value})}/></div>
                                                <div className="flex justify-between items-center"><span className="text-slate-600 font-semibold text-xs">Co-Applicant Bank Passbook</span> <input type="file" className="text-xs w-48" onChange={e => setFormData({...formData, co_bank_doc_file: e.target.value})}/></div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                                <button onClick={handleFormSubmit} className="w-full mt-4 bg-green-600 text-white py-2.5 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg hover:bg-green-700">
                                    Submit Sales Data
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadDetails;
