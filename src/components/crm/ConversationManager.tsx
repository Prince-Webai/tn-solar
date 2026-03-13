import { useState, useEffect, useRef } from 'react';
import { dataService } from '../../services/dataService';
import { Lead } from '../../types';
import {
    MessageSquare,
    Phone,
    Mail,
    Clock,
    Send,
    StickyNote,
    CheckCircle,
    X,
    MessageCircle,
    MapPin,
    RotateCcw,
    XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface NoteEntry {
    type: string;
    text: string;
    time: string;
    action?: string;
    changes?: any;
}

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

interface ConversationManagerProps {
    lead: Lead;
    onUpdate?: () => void;
}

const ConversationManager = ({ lead, onUpdate }: ConversationManagerProps) => {
    const [activities, setActivities] = useState<NoteEntry[]>([]);
    const [loadingThread, setLoadingThread] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [sending, setSending] = useState(false);
    
    // Form States
    const [showForm, setShowForm] = useState<string | null>(null);
    const [siteVisitData, setSiteVisitData] = useState<any>({});
    const [salesData, setSalesData] = useState<any>({});
    
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (lead) {
            loadThread();
        }
    }, [lead.id]);

    const loadThread = async () => {
        setLoadingThread(true);
        try {
            const logs = await dataService.getAuditLogs('lead', lead.id);
            const entries: NoteEntry[] = logs.map((log: any) => ({
                type: log.action?.includes('NOTE') ? 'note' : log.action?.includes('CALL') ? 'call' : 'note',
                text: log.changes?.notes || log.action?.replace(/_/g, ' ') || '',
                time: log.created_at,
                action: log.action,
                changes: log.changes
            }));
            setActivities(entries.reverse());
        } catch (error) {
            console.error("Error loading conversation thread:", error);
        } finally {
            setLoadingThread(false);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    };

    const handleSendNote = async () => {
        if (!noteText.trim() || !lead) return;
        setSending(true);
        const { error } = await dataService.updateLead(lead.id, { notes: noteText });
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
            if (onUpdate) onUpdate();
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
        setSending(false);
    };

    const handleLogActivity = async (activityType: string) => {
        if (!lead) return;
        setSending(true);
        const action = `LOG_${activityType.toUpperCase().replace(/\s+/g, '_')}`;
        
        let statusUpdate: string | undefined;
        if (activityType === 'Site visit booked') statusUpdate = 'site_visit_scheduled';
        if (activityType === 'Site visit completed') statusUpdate = 'site_visit_completed';
        if (activityType === 'Site visit cancelled') statusUpdate = 'site_visit_cancelled';
        if (activityType === 'Drop') statusUpdate = 'dropped';

        const { error } = await dataService.updateLead(lead.id, { 
            notes: `Activity: ${activityType}`,
            ...(statusUpdate ? { status: statusUpdate } : {})
        } as any);
        
        if (!error) {
            const newEntry: NoteEntry = {
                type: 'note',
                text: `${activityType}`,
                time: new Date().toISOString(),
                action: action
            };
            setActivities(prev => [...prev, newEntry]);
            toast.success(`${activityType} logged!`);
            if (onUpdate) onUpdate();
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
            toast.error('Failed to log activity');
        }
        setSending(false);
    };

    const handleSendSiteVisit = async () => {
        if (!lead) return;
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

        const { error } = await dataService.updateLead(lead.id, updates);
        
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
            if (onUpdate) onUpdate();
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
            toast.error('Failed to save site visit');
        }
        setSending(false);
    };

    const handleSendSalesForm = async () => {
        if (!lead) return;
        setSending(true);

        const updates: any = {
            lead_type: salesData.lead_type,
            dob: salesData.dob,
            downpayment_amount: parseFloat(salesData.downpayment_amount) || 0,
            remaining_payment_type: salesData.remaining_payment_type,
            aadhar_front_url: salesData.aadhar_front_name,
            aadhar_back_url: salesData.aadhar_back_name,
            eb_bill_url: salesData.eb_bill_name,
            bank_docs_url: salesData.bank_docs_name,
            downpayment_proof_url: salesData.payment_proof_name,
            quotation_url: salesData.quotation_name
        };

        const { error } = await dataService.updateLead(lead.id, updates);
        
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
            if (onUpdate) onUpdate();
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
            toast.error('Failed to save sales form');
        }
        setSending(false);
    };

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
        <div className="flex flex-col h-[600px] border border-slate-200 rounded-3xl bg-white overflow-hidden shadow-sm">
            {/* Thread Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00a4bd] to-[#2D3E50] flex items-center justify-center text-white font-black shrink-0 text-sm">
                        {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 text-sm">{lead.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Conversation History</p>
                    </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${STATUS_COLORS[lead.status] || 'bg-slate-100'}`}>
                    {lead.status?.replace(/_/g, ' ')}
                </span>
            </div>

            {/* Thread Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingThread ? (
                    <div className="flex items-center justify-center h-32">
                        <div className="w-6 h-6 border-2 border-[#00a4bd]/20 border-t-[#00a4bd] rounded-full animate-spin" />
                    </div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-12 text-slate-300">
                        <MessageSquare size={40} className="mx-auto mb-2 opacity-30" />
                        <p className="font-bold text-slate-400 text-sm">No conversation yet</p>
                        <p className="text-[10px] mt-1 text-slate-400">Log an activity or form below to start.</p>
                    </div>
                ) : activities.map((entry, idx) => (
                    <div key={idx} className="flex gap-3">
                        <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white ${noteColor(entry.action || entry.type)}`}>
                            {noteIcon(entry.action || entry.type)}
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-xl rounded-tl-none px-3 py-2 border border-slate-100 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate">
                                    {(entry.action || entry.type)?.replace(/LOG_|FORM_/, '').replace(/_/g, ' ')}
                                </span>
                                <span className="flex items-center gap-1 text-[9px] text-slate-400 font-medium shrink-0">
                                    <Clock size={8} />
                                    {new Date(entry.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="text-xs text-slate-700 font-medium leading-relaxed break-words">
                                {entry.text && <p>{entry.text}</p>}
                                {entry.changes && typeof entry.changes === 'object' && !entry.text && (
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1">
                                        {Object.entries(entry.changes).map(([k, v]) => (
                                            <div key={k} className="flex gap-1.5 min-w-0">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase shrink-0">{k.replace(/_/g, ' ')}:</span>
                                                <span className="truncate text-[10px]">{String(v)}</span>
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
                <div className="flex gap-3 mb-4">
                    <div className="flex-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block px-1">Log Activity</label>
                        <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-600 outline-none focus:border-[#00a4bd] cursor-pointer"
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

                    <div className="flex-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block px-1">Fill Form</label>
                        <select 
                            className="w-full bg-[#00a4bd]/5 border border-[#00a4bd]/20 rounded-lg px-2 py-1.5 text-[10px] font-bold text-[#00a4bd] outline-none focus:border-[#00a4bd] cursor-pointer"
                            onChange={(e) => setShowForm(e.target.value)}
                            value={showForm || ''}
                        >
                            <option value="">Select Form...</option>
                            <option value="site_visit">Site Visit Form</option>
                            <option value="sales">Sales Form</option>
                        </select>
                    </div>
                </div>

                {/* Note Input */}
                {!showForm && (
                    <div className="flex gap-2">
                        <textarea
                            value={noteText}
                            onChange={e => setNoteText(e.target.value)}
                            placeholder="Type a note here..."
                            rows={1}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendNote(); } }}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#00a4bd] focus:ring-2 focus:ring-[#00a4bd]/10 resize-none transition-all"
                        />
                        <button
                            onClick={handleSendNote}
                            disabled={sending || !noteText.trim()}
                            className="px-3 bg-[#00a4bd] text-white rounded-xl hover:bg-[#008ba1] transition-all disabled:opacity-40 flex items-center justify-center shadow-lg shadow-[#00a4bd]/20"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                )}

                {/* Site Visit Form */}
                {showForm === 'site_visit' && (
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 animate-fadeIn space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-[#00a4bd]">Site Visit Booking</h4>
                            <button onClick={() => setShowForm(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Proposed KW</label>
                                <input type="number" step="0.5" className="form-input-sm text-[10px] py-1" placeholder="e.g. 5" 
                                    value={siteVisitData.proposed_kw || ''} onChange={e => setSiteVisitData({...siteVisitData, proposed_kw: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Site Location</label>
                                <input type="text" className="form-input-sm text-[10px] py-1" placeholder="Village/City" 
                                    value={siteVisitData.site_location || ''} onChange={e => setSiteVisitData({...siteVisitData, site_location: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Date</label>
                                <input type="date" className="form-input-sm text-[10px] py-1" 
                                    value={siteVisitData.date || ''} onChange={e => setSiteVisitData({...siteVisitData, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Time</label>
                                <input type="time" className="form-input-sm text-[10px] py-1" 
                                    value={siteVisitData.time || ''} onChange={e => setSiteVisitData({...siteVisitData, time: e.target.value})} />
                            </div>
                        </div>
                        <button 
                            onClick={handleSendSiteVisit} disabled={sending}
                            className="w-full py-1.5 bg-[#00a4bd] text-white rounded-lg text-[10px] font-black uppercase hover:bg-[#008ba1] transition-all"
                        >
                            {sending ? 'Saving...' : 'Book Site Visit'}
                        </button>
                    </div>
                )}

                {/* Sales Form */}
                {showForm === 'sales' && (
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 animate-fadeIn space-y-3">
                        <div className="flex justify-between items-center">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-[#FF6B00]">Sales Form</h4>
                            <button onClick={() => setShowForm(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Sale Type</label>
                                <select className="form-input-sm text-[10px] py-1" value={salesData.lead_type || ''} onChange={e => setSalesData({...salesData, lead_type: e.target.value})}>
                                    <option value="">Select...</option>
                                    <option value="Residential">Residential</option>
                                    <option value="Commercial">Commercial</option>
                                    <option value="Agriculture">Agriculture</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Client DOB</label>
                                <input type="date" className="form-input-sm text-[10px] py-1" value={salesData.dob || ''} onChange={e => setSalesData({...salesData, dob: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Downpayment</label>
                                <input type="number" className="form-input-sm text-[10px] py-1" placeholder="₹ Amount" value={salesData.downpayment_amount || ''} onChange={e => setSalesData({...salesData, downpayment_amount: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 block">Payment</label>
                                <select className="form-input-sm text-[10px] py-1" value={salesData.remaining_payment_type || ''} onChange={e => setSalesData({...salesData, remaining_payment_type: e.target.value})}>
                                    <option value="">Select...</option>
                                    <option value="Loan">Loan</option>
                                    <option value="Full Payment">Full Payment</option>
                                </select>
                            </div>
                        </div>
                        <button 
                            onClick={handleSendSalesForm} disabled={sending}
                            className="w-full py-1.5 bg-[#FF6B00] text-white rounded-lg text-[10px] font-black uppercase hover:bg-[#e66000] transition-all"
                        >
                            {sending ? 'Saving...' : 'Submit Sales Form'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversationManager;
