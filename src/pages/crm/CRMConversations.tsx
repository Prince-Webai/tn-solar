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
    Mic,
    StickyNote,
    CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-amber-100 text-amber-700',
    site_visit_scheduled: 'bg-indigo-100 text-indigo-700',
    follow_up: 'bg-purple-100 text-purple-700',
    closed_won: 'bg-emerald-100 text-emerald-700',
    closed_lost: 'bg-red-100 text-red-700',
};

type NoteType = 'note' | 'call' | 'email';

interface NoteEntry {
    type: NoteType;
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
    const [noteType, setNoteType] = useState<NoteType>('note');
    const [sending, setSending] = useState(false);
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
                type: noteType,
                text: noteText,
                time: new Date().toISOString(),
                action: `LOG_${noteType.toUpperCase()}`
            };
            setActivities(prev => [...prev, newEntry]);
            setNoteText('');
            toast.success('Note logged!');
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
        setSending(false);
    };

    const filteredLeads = leads.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.phone?.includes(searchTerm) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const noteIcon = (type: string) => {
        if (type === 'call' || type?.includes('CALL')) return <Phone size={14} />;
        if (type === 'email' || type?.includes('EMAIL')) return <Mail size={14} />;
        if (type?.includes('STATUS')) return <CheckCircle size={14} />;
        return <StickyNote size={14} />;
    };

    const noteColor = (type: string) => {
        if (type === 'call' || type?.includes('CALL')) return 'bg-emerald-500';
        if (type === 'email' || type?.includes('EMAIL')) return 'bg-blue-500';
        if (type?.includes('STATUS')) return 'bg-amber-500';
        if (type?.includes('CREATE')) return 'bg-[#00a4bd]';
        return 'bg-purple-500';
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
                                <p className="text-sm mt-1 text-slate-400">Log a note, call, or email below to start.</p>
                            </div>
                        ) : activities.map((entry, idx) => (
                            <div key={idx} className="flex gap-3">
                                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white ${noteColor(entry.action || entry.type)}`}>
                                    {noteIcon(entry.action || entry.type)}
                                </div>
                                <div className="flex-1 bg-slate-50 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {(entry.action || entry.type)?.replace(/_/g, ' ')}
                                        </span>
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                            <Clock size={10} />
                                            {new Date(entry.time).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                        {entry.text || (entry.changes && typeof entry.changes === 'object'
                                            ? Object.entries(entry.changes).map(([k, v]) => `${k}: ${v}`).join(' • ')
                                            : 'No details')}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    {/* Compose Bar */}
                    <div className="p-4 border-t border-slate-100 bg-white">
                        {/* Type selector */}
                        <div className="flex gap-2 mb-3">
                            {(['note', 'call', 'email'] as NoteType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setNoteType(type)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${noteType === type ? 'bg-[#2D3E50] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    {type === 'note' && <StickyNote size={12} />}
                                    {type === 'call' && <Mic size={12} />}
                                    {type === 'email' && <Mail size={12} />}
                                    {type}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <textarea
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                placeholder={`Log a ${noteType}...`}
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
                        <p className="text-[10px] text-slate-400 font-medium mt-2">Press Enter to send · Shift+Enter for new line</p>
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
