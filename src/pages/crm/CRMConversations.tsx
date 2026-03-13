import { useState, useEffect, useRef } from 'react';
import { dataService } from '../../services/dataService';
import { Lead } from '../../types';
import {
    Search,
    MessageSquare,
    Phone,
    Mail,
    Clock,
    Send,
    ChevronRight,
    User,
    StickyNote,
    CheckCircle,
    X,
    Upload,
    MessageCircle,
    MapPin,
    RotateCcw,
    XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-amber-100 text-amber-700',
    site_visit_scheduled: 'bg-indigo-100 text-indigo-700',
    follow_up: 'bg-purple-100 text-purple-700',
    closed_won: 'bg-emerald-100 text-emerald-700',
    closed_lost: 'bg-red-100 text-red-700',
    site_visit_completed: 'bg-green-100 text-green-700',
    site_visit_cancelled: 'bg-rose-100 text-rose-700',
    dropped: 'bg-slate-100 text-slate-700',
};


interface NoteEntry {
    type: string;
    text: string;
    time: string;
    action?: string;
    changes?: any;
}

const CRMConversations = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<NoteEntry[]>([]);
    const [loadingThread, setLoadingThread] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [noteText, setNoteText] = useState('');
    const [sending, setSending] = useState(false);
    
    // New Form States
    const [showForm, setShowForm] = useState<string | null>(null);
    const [siteVisitData, setSiteVisitData] = useState<any>({});
    const [salesData, setSalesData] = useState<any>({});
    
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        dataService.getLeads().then(data => {
            setLeads(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (selectedLead) {
            setLoadingThread(true);
            dataService.getAuditLogs('lead', selectedLead.id).then(logs => {
                const entries: NoteEntry[] = logs.map((log: any) => ({
                    type: log.action?.includes('NOTE') ? 'note' : log.action?.includes('CALL') ? 'call' : 'note',
                    text: log.changes?.notes || log.action?.replace(/_/g, ' ') || '',
                    time: log.created_at,
                    action: log.action,
                    changes: log.changes
                }));
                setActivities(entries.reverse());
                setLoadingThread(false);
                setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            });
        }
    }, [selectedLead]);

    const handleSendNote = async () => {
        if (!noteText.trim() || !selectedLead) return;
        setSending(true);
        const { error } = await dataService.updateLead(selectedLead.id, { notes: noteText });
        if (error) {
            toast.error('Failed to save note');
        } else {
            const newEntry: NoteEntry = {
                type: 'note',
                text: noteText,
                time: new Date().toISOString(),
                action: 'LOG_NOTE'
            };
            setActivities(prev => [...prev, newEntry]);
            setNoteText('');
            toast.success('Note logged!');
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
        setSending(false);
    };

    const handleLogActivity = async (activityType: string) => {
        if (!selectedLead) return;
        setSending(true);
        const action = `LOG_${activityType.toUpperCase().replace(/\s+/g, '_')}`;
        const { error } = await dataService.updateLead(selectedLead.id, { notes: `Activity: ${activityType}` });
        
        if (!error) {
            const newEntry: NoteEntry = {
                type: 'note',
                text: `${activityType}`,
                time: new Date().toISOString(),
                action: action
            };
            setActivities(prev => [...prev, newEntry]);
            toast.success(`${activityType} logged!`);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
            toast.error('Failed to log activity');
        }
        setSending(false);
    };

    const handleSendSiteVisit = async () => {
        if (!selectedLead) return;
        setSending(true);
        
        const visitDateTime = siteVisitData.date && siteVisitData.time 
            ? `${siteVisitData.date}T${siteVisitData.time}` 
            : undefined;

        const updates: any = {
            proposed_kw: parseFloat(siteVisitData.proposed_kw) || 0,
            site_location: siteVisitData.site_location,
            map_coordinates: siteVisitData.map_coordinates,
            site_visit_datetime: visitDateTime,
            status: 'site_visit_scheduled'
        };

        const { error } = await dataService.updateLead(selectedLead.id, updates);
        
        if (!error) {
            const newEntry: NoteEntry = {
                type: 'note',
                text: 'Site visit booked',
                time: new Date().toISOString(),
                action: 'FORM_SITE_VISIT',
                changes: updates
            };
            setActivities(prev => [...prev, newEntry]);
            setShowForm(null);
            setSiteVisitData({});
            toast.success('Site visit scheduled!');
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
            toast.error('Failed to save site visit');
        }
        setSending(false);
    };

    const handleSendSalesForm = async () => {
        if (!selectedLead) return;
        setSending(true);

        const updates: any = {
            lead_type: salesData.lead_type,
            dob: salesData.dob,
            downpayment_amount: parseFloat(salesData.downpayment_amount) || 0,
            remaining_payment_type: salesData.remaining_payment_type,
            // In a real app, we'd upload files and get URLs here
            aadhar_front_url: salesData.aadhar_front_name,
            aadhar_back_url: salesData.aadhar_back_name,
            eb_bill_url: salesData.eb_bill_name,
            bank_docs_url: salesData.bank_docs_name,
            downpayment_proof_url: salesData.payment_proof_name,
            quotation_url: salesData.quotation_name
        };

        const { error } = await dataService.updateLead(selectedLead.id, updates);
        
        if (!error) {
            const newEntry: NoteEntry = {
                type: 'note',
                text: 'Sales form submitted',
                time: new Date().toISOString(),
                action: 'FORM_SALES',
                changes: updates
            };
            setActivities(prev => [...prev, newEntry]);
            setShowForm(null);
            setSalesData({});
            toast.success('Sales form saved!');
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
            toast.error('Failed to save sales form');
        }
        setSending(false);
    };

    const filteredLeads = leads.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.phone?.includes(searchTerm) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const noteIcon = (type: string) => {
        const t = (type || '').toUpperCase();
        if (t.includes('CALL')) return <Phone size={14} />;
        if (t.includes('EMAIL')) return <Mail size={14} />;
        if (t.includes('WHATSAPP')) return <MessageCircle size={14} />;
        if (t.includes('SITE_VISIT')) return <MapPin size={14} />;
        if (t.includes('CALLBACK')) return <RotateCcw size={14} />;
        if (t.includes('DROP')) return <XCircle size={14} />;
        if (t.includes('STATUS')) return <CheckCircle size={14} />;
        return <StickyNote size={14} />;
    };

    const noteColor = (type: string) => {
        const t = (type || '').toUpperCase();
        if (t.includes('CALL')) return 'bg-emerald-500';
        if (t.includes('EMAIL')) return 'bg-blue-500';
        if (t.includes('WHATSAPP')) return 'bg-green-500';
        if (t.includes('SITE_VISIT')) return 'bg-indigo-500';
        if (t.includes('CALLBACK')) return 'bg-purple-500';
        if (t.includes('DROP')) return 'bg-red-500';
        if (t.includes('STATUS')) return 'bg-amber-500';
        return 'bg-slate-500';
    };

    return (
        <div className="flex h-[calc(100vh-160px)] gap-0 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">

            {/* Left Panel — Lead List */}
            <div className="w-80 flex-shrink-0 flex flex-col border-r border-slate-100">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="font-black text-slate-900 text-lg mb-3">Conversations</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#00a4bd]/20 focus:bg-white transition-all"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="w-8 h-8 border-4 border-[#00a4bd]/20 border-t-[#00a4bd] rounded-full animate-spin" />
                        </div>
                    ) : filteredLeads.map(lead => (
                        <button
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className={`w-full text-left px-4 py-4 border-b border-slate-50 transition-all hover:bg-slate-50 group ${selectedLead?.id === lead.id ? 'bg-[#00a4bd]/5 border-l-2 border-l-[#00a4bd]' : ''}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00a4bd] to-[#2D3E50] flex items-center justify-center text-white font-black shrink-0 text-sm">
                                    {lead.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm font-bold truncate ${selectedLead?.id === lead.id ? 'text-[#00a4bd]' : 'text-slate-900'}`}>{lead.name}</p>
                                        <ChevronRight size={14} className="text-slate-300 shrink-0 grup-hover:text-[#00a4bd]" />
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${STATUS_COLORS[lead.status] || 'bg-slate-100 text-slate-600'}`}>
                                            {lead.status?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    {lead.phone && (
                                        <p className="text-xs text-slate-400 font-medium mt-1 truncate">{lead.phone}</p>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                    {!loading && filteredLeads.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                            <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-bold">No leads found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel — Thread */}
            {selectedLead ? (
                <div className="flex-1 flex flex-col">
                    {/* Thread Header */}
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00a4bd] to-[#2D3E50] flex items-center justify-center text-white font-black">
                                {selectedLead.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900">{selectedLead.name}</h3>
                                <div className="flex items-center gap-3 mt-0.5">
                                    {selectedLead.phone && (
                                        <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                            <Phone size={11} /> {selectedLead.phone}
                                        </span>
                                    )}
                                    {selectedLead.email && (
                                        <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                            <Mail size={11} /> {selectedLead.email}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${STATUS_COLORS[selectedLead.status] || 'bg-slate-100'}`}>
                            {selectedLead.status?.replace(/_/g, ' ')}
                        </span>
                    </div>

                    {/* Thread Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {loadingThread ? (
                            <div className="flex items-center justify-center h-32">
                                <div className="w-8 h-8 border-4 border-[#00a4bd]/20 border-t-[#00a4bd] rounded-full animate-spin" />
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-16 text-slate-300">
                                <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                                <p className="font-bold text-slate-400">No conversation yet</p>
                                <p className="text-sm mt-1 text-slate-400">Log an activity or form below to start.</p>
                            </div>
                        ) : activities.map((entry, idx) => (
                            <div key={idx} className="flex gap-3">
                                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white ${noteColor(entry.action || entry.type)}`}>
                                    {noteIcon(entry.action || entry.type)}
                                </div>
                                <div className="flex-1 bg-slate-50 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {(entry.action || entry.type)?.replace(/LOG_|FORM_/, '').replace(/_/g, ' ')}
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                            <Clock size={10} />
                                            {new Date(entry.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-700 font-medium leading-relaxed">
                                        {entry.text && <p>{entry.text}</p>}
                                        {entry.changes && typeof entry.changes === 'object' && !entry.text && (
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                                                {Object.entries(entry.changes).map(([k, v]) => (
                                                    <div key={k} className="flex gap-2 min-w-0">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">{k.replace(/_/g, ' ')}:</span>
                                                        <span className="truncate">{String(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    {/* Compose Bar */}
                    <div className="p-4 border-t border-slate-100 bg-white">
                        {/* Selector Tabs */}
                        <div className="flex gap-4 mb-4">
                            <div className="relative group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block px-1">Log Activity</label>
                                <select 
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-[#00a4bd] cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.value) handleLogActivity(e.target.value);
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">Select Activity...</option>
                                    <option value="Phone call">📞 Phone call</option>
                                    <option value="Email">📧 Email</option>
                                    <option value="Whatsapp call">💬 Whatsapp call</option>
                                    <option value="Whatsapp message">✉️ Whatsapp message</option>
                                    <option value="Site visit booked">📅 Site visit booked</option>
                                    <option value="Site visit completed">✅ Site visit completed</option>
                                    <option value="Site visit cancelled">❌ Site visit cancelled</option>
                                    <option value="Callback">🔄 Callback</option>
                                    <option value="Drop">⚠️ Drop</option>
                                </select>
                            </div>

                            <div className="relative group">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block px-1">Fill Form</label>
                                <select 
                                    className="bg-[#00a4bd]/5 border border-[#00a4bd]/20 rounded-xl px-3 py-2 text-xs font-bold text-[#00a4bd] outline-none focus:border-[#00a4bd] cursor-pointer"
                                    onChange={(e) => setShowForm(e.target.value)}
                                    value={showForm || ''}
                                >
                                    <option value="">Select Form...</option>
                                    <option value="site_visit">Site Visit Booking Form</option>
                                    <option value="sales">Sales Form</option>
                                </select>
                            </div>
                        </div>

                        {/* Note Input */}
                        {!showForm && (
                            <div className="flex gap-3">
                                <textarea
                                    value={noteText}
                                    onChange={e => setNoteText(e.target.value)}
                                    placeholder="Type a note here..."
                                    rows={2}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendNote(); } }}
                                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#00a4bd] focus:ring-2 focus:ring-[#00a4bd]/10 resize-none transition-all"
                                />
                                <button
                                    onClick={handleSendNote}
                                    disabled={sending || !noteText.trim()}
                                    className="px-4 bg-[#00a4bd] text-white rounded-xl hover:bg-[#008ba1] transition-all disabled:opacity-40 flex items-center justify-center shadow-lg shadow-[#00a4bd]/20"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        )}

                        {/* Site Visit Form */}
                        {showForm === 'site_visit' && (
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 animate-fadeIn">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-[#00a4bd]">Site Visit Booking Form</h4>
                                    <button onClick={() => setShowForm(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Proposed KW</label>
                                        <input type="number" step="0.5" className="form-input-sm" placeholder="e.g. 5" 
                                            value={siteVisitData.proposed_kw || ''} onChange={e => setSiteVisitData({...siteVisitData, proposed_kw: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Site Location</label>
                                        <input type="text" className="form-input-sm" placeholder="Village/City" 
                                            value={siteVisitData.site_location || ''} onChange={e => setSiteVisitData({...siteVisitData, site_location: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Date</label>
                                        <input type="date" className="form-input-sm" 
                                            value={siteVisitData.date || ''} onChange={e => setSiteVisitData({...siteVisitData, date: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Time</label>
                                        <input type="time" className="form-input-sm" 
                                            value={siteVisitData.time || ''} onChange={e => setSiteVisitData({...siteVisitData, time: e.target.value})} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Map Location / Coordinates</label>
                                        <input type="text" className="form-input-sm" placeholder="Paste map link or GPS coordinates" 
                                            value={siteVisitData.map_coordinates || ''} onChange={e => setSiteVisitData({...siteVisitData, map_coordinates: e.target.value})} />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSendSiteVisit} disabled={sending}
                                    className="w-full mt-4 py-2 bg-[#00a4bd] text-white rounded-xl text-xs font-black uppercase hover:bg-[#008ba1] transition-all"
                                >
                                    {sending ? 'Saving...' : 'Book Site Visit'}
                                </button>
                            </div>
                        )}

                        {/* Sales Form */}
                        {showForm === 'sales' && (
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 animate-fadeIn">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-[#FF6B00]">Sales Form</h4>
                                    <button onClick={() => setShowForm(null)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Sale Type</label>
                                        <select className="form-input-sm" value={salesData.lead_type || ''} onChange={e => setSalesData({...salesData, lead_type: e.target.value})}>
                                            <option value="">Select...</option>
                                            <option value="Residential">Residential</option>
                                            <option value="Commercial">Commercial</option>
                                            <option value="Agriculture">Agriculture</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Client DOB</label>
                                        <input type="date" className="form-input-sm" value={salesData.dob || ''} onChange={e => setSalesData({...salesData, dob: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Downpayment Amt</label>
                                        <input type="number" className="form-input-sm" placeholder="₹ Amount" value={salesData.downpayment_amount || ''} onChange={e => setSalesData({...salesData, downpayment_amount: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Remaining Payment</label>
                                        <select className="form-input-sm" value={salesData.remaining_payment_type || ''} onChange={e => setSalesData({...salesData, remaining_payment_type: e.target.value})}>
                                            <option value="">Select...</option>
                                            <option value="Loan">Loan</option>
                                            <option value="Full Payment">Full Payment</option>
                                        </select>
                                    </div>
                                    
                                    {/* Uploads */}
                                    <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {[
                                            { label: 'Quotation', id: 'quotation' },
                                            { label: 'Aadhar Front', id: 'aadhar_front' },
                                            { label: 'Aadhar Back', id: 'aadhar_back' },
                                            { label: 'EB Bill', id: 'eb_bill' },
                                            { label: 'Bank Docs', id: 'bank_docs' },
                                            { label: 'Payment Proof', id: 'payment_proof' }
                                        ].map(u => (
                                            <div key={u.id}>
                                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">{u.label}</label>
                                                <div className="relative group overflow-hidden bg-white border border-slate-200 rounded-lg p-1.5 flex items-center justify-between">
                                                    <span className="text-[10px] text-slate-400 truncate pr-2">{salesData[`${u.id}_name`] || 'No file selected'}</span>
                                                    <button className="shrink-0 p-1 bg-slate-100 text-[#FF6B00] rounded hover:bg-[#FF6B00] hover:text-white transition-all"><Upload size={10} /></button>
                                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) setSalesData({...salesData, [u.id]: file, [`${u.id}_name`]: file.name});
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSendSalesForm} disabled={sending}
                                    className="w-full mt-4 py-2 bg-[#FF6B00] text-white rounded-xl text-xs font-black uppercase hover:bg-[#e66000] transition-all shadow-lg shadow-[#FF6B00]/20"
                                >
                                    {sending ? 'Saving...' : 'Submit Sales Form'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4 bg-slate-50/50">
                    <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center">
                        <User size={36} className="text-slate-300" />
                    </div>
                    <div className="text-center">
                        <p className="font-black text-slate-400 text-lg">Select a lead</p>
                        <p className="text-sm text-slate-400 font-medium mt-1">Pick a lead from the left to view their conversation history</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRMConversations;
