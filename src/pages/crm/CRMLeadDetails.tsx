
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User,
    Phone,
    Mail,
    MapPin,
    History,
    Save,
    ArrowLeft,
    MessageSquare,
    Paperclip,
    Zap,
    Edit3,
    X,
    Check
} from "lucide-react";
import toast from "react-hot-toast";
import { dataService } from "../../services/dataService";
import { Lead } from "../../types";

const STATUS_OPTIONS = [
    { value: 'new', label: 'New Lead', color: 'bg-blue-100 text-blue-800' },
    { value: 'contacted', label: 'Contacted', color: 'bg-amber-100 text-amber-800' },
    { value: 'site_visit_scheduled', label: 'Site Visit Scheduled', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'site_visit_completed', label: 'Site Visit Completed', color: 'bg-emerald-100 text-emerald-800'},
    { value: 'site_visit_cancelled', label: 'Site Visit Cancelled', color: 'bg-rose-100 text-rose-800'},
    { value: 'follow_up', label: 'Follow Up', color: 'bg-purple-100 text-purple-800' },
    { value: 'closed_won', label: 'Closed Won', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 text-red-800' },
    { value: 'dropped', label: 'Dropped', color: 'bg-slate-100 text-slate-800' }
];

const SOURCE_OPTIONS = ['Web', 'Phone', 'Referral', 'Facebook', 'WhatsApp', 'Walk-in', 'Other'];

// Editable field component
const EditableField = ({
    label,
    value,
    onSave,
    type = 'text',
    icon: Icon,
    options
}: {
    label: string;
    value: string;
    onSave: (val: string) => Promise<void>;
    type?: string;
    icon?: any;
    options?: { value: string; label: string }[];
}) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (draft === value) { setEditing(false); return; }
        setSaving(true);
        await onSave(draft);
        setSaving(false);
        setEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') { setDraft(value); setEditing(false); }
    };

    return (
        <div className="group">
            <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{label}</label>
                {!editing && (
                    <button
                        onClick={() => { setDraft(value); setEditing(true); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-[#00a4bd] rounded transition-all"
                    >
                        <Edit3 size={12} />
                    </button>
                )}
            </div>
            {editing ? (
                <div className="flex items-center gap-1">
                    {options ? (
                        <select
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            autoFocus
                            className="flex-1 px-3 py-2 border border-[#00a4bd] rounded-xl text-sm font-bold outline-none bg-white focus:ring-2 focus:ring-[#00a4bd]/20"
                        >
                            {options.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    ) : type === 'textarea' ? (
                        <textarea
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            autoFocus
                            rows={3}
                            className="flex-1 px-3 py-2 border border-[#00a4bd] rounded-xl text-sm font-medium outline-none bg-white focus:ring-2 focus:ring-[#00a4bd]/20 resize-none"
                        />
                    ) : (
                        <input
                            type={type}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="flex-1 px-3 py-2 border border-[#00a4bd] rounded-xl text-sm font-bold outline-none bg-white focus:ring-2 focus:ring-[#00a4bd]/20"
                        />
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                        <Check size={14} />
                    </button>
                    <button onClick={() => { setDraft(value); setEditing(false); }} className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors">
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <div
                    className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer hover:text-[#00a4bd] transition-colors py-1"
                    onClick={() => { setDraft(value); setEditing(true); }}
                    title={`Click to edit ${label}`}
                >
                    {Icon && <Icon size={14} className="text-[#00a4bd] shrink-0" />}
                    <span>{value || <span className="text-slate-300 italic font-normal">Click to add...</span>}</span>
                </div>
            )}
        </div>
    );
};

const CRMLeadDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);
    const [fieldDefinitions, setFieldDefinitions] = useState<any[]>([]);
    const [customFieldValues, setCustomFieldValues] = useState<any>({});
    const [activities, setActivities] = useState<any[]>([]);
    const [noteText, setNoteText] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    useEffect(() => {
        const loadLeadData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [leadData, definitions, logs] = await Promise.all([
                    dataService.getLeads().then(list => list.find(l => l.id === id) || null),
                    dataService.getCustomFieldDefinitions('lead'),
                    dataService.getAuditLogs('lead', id)
                ]);

                if (!leadData) {
                    toast.error("Lead not found");
                    navigate('/crm');
                    return;
                }

                setLead(leadData);
                setFieldDefinitions(definitions);
                setCustomFieldValues(leadData.custom_fields || {});
                setActivities(logs);
            } catch (error) {
                console.error("Error loading lead details:", error);
                toast.error("Failed to load details");
            } finally {
                setLoading(false);
            }
        };
        loadLeadData();
    }, [id, navigate]);

    const updateField = async (field: string, value: any) => {
        if (!id || !lead) return;
        const { error } = await dataService.updateLead(id, { [field]: value } as any);
        if (error) {
            toast.error(`Failed to update ${field}`);
            throw error;
        }
        setLead(prev => prev ? { ...prev, [field]: value } : prev);
        toast.success("Updated!");
    };

    const handleSaveCustomFields = async () => {
        if (!id || !lead) return;
        const { error } = await dataService.updateLead(id, { custom_fields: customFieldValues });
        if (error) {
            toast.error("Failed to save custom fields");
        } else {
            setLead({ ...lead, custom_fields: customFieldValues });
            toast.success("Custom fields saved");
        }
    };

    const handleSaveNote = async () => {
        if (!noteText.trim() || !id) return;
        setSavingNote(true);
        // Log note as audit entry
        try {
            await dataService.updateLead(id, { notes: noteText });
            setLead(prev => prev ? { ...prev, notes: noteText } : prev);
            toast.success("Note saved");
            setNoteText('');
            // Refresh logs
            const logs = await dataService.getAuditLogs('lead', id);
            setActivities(logs);
        } catch {
            toast.error("Failed to save note");
        }
        setSavingNote(false);
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00a4bd]/20 border-t-[#00a4bd]"></div>
            </div>
        );
    }

    if (!lead) return null;

    const statusOption = STATUS_OPTIONS.find(s => s.value === lead.status);

    return (
        <div className="flex flex-col gap-6 animate-fadeIn pb-20">
            {/* Header / Breadcrumb */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/crm/contacts')}
                        className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#00a4bd]">Lead Details</p>
                        <h1 className="text-2xl font-black text-slate-900 leading-tight">{lead.name}</h1>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${statusOption?.color || 'bg-slate-100 text-slate-600'}`}>
                        {statusOption?.label || lead.status}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/crm/pipeline')}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        ← Back to Pipeline
                    </button>
                    <button
                        onClick={() => {
                            toast.success(`Converting ${lead.name} to project — redirecting...`, { duration: 2000 });
                            setTimeout(() => navigate('/projects'), 1500);
                        }}
                        className="px-6 py-2 bg-[#00a4bd] text-white rounded-xl text-sm font-bold hover:bg-[#008ba1] transition-all shadow-md shadow-[#00a4bd]/20"
                    >
                        Convert to Project
                    </button>
                </div>
            </div>

            {/* 2-Column Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* Left Column: Info & Attributes */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#00a4bd]">
                                <User size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900">Contact Info</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Click any field to edit</p>
                            </div>
                        </div>

                        <div className="space-y-5 divide-y divide-slate-50">
                            <EditableField
                                label="Full Name"
                                value={lead.name || ''}
                                icon={User}
                                onSave={(val) => updateField('name', val)}
                            />
                            <div className="pt-3">
                                <EditableField
                                    label="Phone Number"
                                    value={lead.phone || ''}
                                    type="tel"
                                    icon={Phone}
                                    onSave={(val) => updateField('phone', val)}
                                />
                            </div>
                            <div className="pt-3">
                                <EditableField
                                    label="Email Address"
                                    value={lead.email || ''}
                                    type="email"
                                    icon={Mail}
                                    onSave={(val) => updateField('email', val)}
                                />
                            </div>
                            <div className="pt-3">
                                <EditableField
                                    label="Lead Status"
                                    value={lead.status || 'new'}
                                    options={STATUS_OPTIONS}
                                    onSave={(val) => updateField('status', val)}
                                />
                            </div>
                            <div className="pt-3">
                                <EditableField
                                    label="Lead Source"
                                    value={lead.source || ''}
                                    options={SOURCE_OPTIONS.map(s => ({ value: s, label: s }))}
                                    onSave={(val) => updateField('source', val)}
                                />
                            </div>
                            <div className="pt-3">
                                <EditableField
                                    label="Lead Owner"
                                    value={lead.lead_owner || ''}
                                    onSave={(val) => updateField('lead_owner', val)}
                                />
                            </div>
                            <div className="pt-3">
                                <EditableField
                                    label="Lead Type"
                                    value={lead.lead_type || ''}
                                    options={[
                                        { value: 'Residential', label: 'Residential' },
                                        { value: 'Commercial', label: 'Commercial' },
                                        { value: 'Agriculture', label: 'Agriculture' }
                                    ]}
                                    onSave={(val) => updateField('lead_type', val)}
                                />
                            </div>
                            <div className="pt-3">
                                <EditableField
                                    label="District"
                                    value={lead.district || ''}
                                    onSave={(val) => updateField('district', val)}
                                />
                            </div>
                            <div className="pt-3">
                                <EditableField
                                    label="Pincode"
                                    value={lead.pincode || ''}
                                    onSave={(val) => updateField('pincode', val)}
                                />
                            </div>
                            <div className="pt-3">
                                <EditableField
                                    label="Last Month Bill (₹)"
                                    value={lead.last_month_bill?.toString() || ''}
                                    type="number"
                                    onSave={(val) => updateField('last_month_bill', Number(val) || 0)}
                                />
                            </div>
                            <div className="pt-3">
                                <EditableField
                                    label="Proposed KW"
                                    value={lead.proposed_kw?.toString() || ''}
                                    type="number"
                                    onSave={(val) => updateField('proposed_kw', Number(val) || 0)}
                                />
                            </div>
                            <div className="pt-3">
                                <EditableField
                                    label="Site Visit Date & Time"
                                    type="datetime-local"
                                    value={lead.site_visit_datetime || ''}
                                    onSave={(val) => updateField('site_visit_datetime', val)}
                                />
                            </div>
                            <div className="pt-3">
                                <EditableField
                                    label="Notes / Address"
                                    value={lead.notes || ''}
                                    type="textarea"
                                    icon={MapPin}
                                    onSave={(val) => updateField('notes', val)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Custom Fields Section */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Zap size={64} fill="currentColor" />
                        </div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="font-black text-slate-900">Custom Fields</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Lead attributes</p>
                            </div>
                            <button onClick={handleSaveCustomFields} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00a4bd] text-white rounded-lg text-xs font-bold hover:bg-[#008ba1] transition-all">
                                <Save size={14} />
                                Save
                            </button>
                        </div>

                        <div className="space-y-4">
                            {fieldDefinitions.length > 0 ? fieldDefinitions.map(field => (
                                <div key={field.id}>
                                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 block">
                                        {field.field_label || field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    {field.field_type === 'boolean' || field.type === 'boolean' ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={!!customFieldValues[field.field_name || field.name]}
                                                onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.field_name || field.name]: e.target.checked })}
                                                className="w-4 h-4 rounded border-slate-300 text-[#00a4bd] focus:ring-[#00a4bd]"
                                            />
                                            <span className="text-sm font-bold text-slate-600">{field.field_label || field.label}</span>
                                        </div>
                                    ) : (
                                        <input
                                            type={field.field_type === 'number' || field.type === 'number' ? 'number' : field.field_type === 'date' || field.type === 'date' ? 'date' : 'text'}
                                            value={customFieldValues[field.field_name || field.name] || ''}
                                            onChange={(e) => setCustomFieldValues({ ...customFieldValues, [field.field_name || field.name]: e.target.value })}
                                            className="w-full px-3 py-2 bg-slate-50 border border-transparent focus:bg-white focus:border-[#00a4bd] rounded-xl text-sm font-medium transition-all outline-none"
                                            placeholder={`Enter ${(field.field_label || field.label || '').toLowerCase()}`}
                                        />
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <p className="text-[10px] font-black uppercase text-slate-400">No custom fields configured</p>
                                    <button onClick={() => navigate('/settings/custom-fields')} className="mt-2 text-xs text-[#00a4bd] font-bold hover:underline">
                                        Add custom fields →
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Engagement Timeline */}
                <div className="space-y-6">
                    {/* Note Composer */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="flex items-center bg-slate-50 border-b border-slate-100">
                            <span className="px-6 py-4 text-xs font-black uppercase tracking-widest text-[#00a4bd] border-b-2 border-[#00a4bd]">Add Note</span>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Log a note, observation, or update about this lead..."
                                className="w-full h-28 p-4 bg-slate-50 border border-slate-100 rounded-2xl resize-none outline-none focus:ring-4 focus:ring-[#00a4bd]/5 focus:border-[#00a4bd]/50 transition-all font-medium text-slate-600 mb-4"
                            />
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><Paperclip size={18} /></button>
                                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg"><MessageSquare size={18} /></button>
                                </div>
                                <button
                                    onClick={handleSaveNote}
                                    disabled={savingNote || !noteText.trim()}
                                    className="bg-[#2D3E50] text-white px-6 py-2.5 rounded-xl text-sm font-black tracking-widest uppercase hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {savingNote ? 'Saving...' : 'Save Note'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-lg font-black text-slate-900">Activity Timeline</h3>
                            <span className="text-xs font-bold text-slate-400">{activities.length} events</span>
                        </div>

                        <div className="space-y-3 relative before:absolute before:left-10 before:top-4 before:bottom-4 before:w-px before:bg-slate-100">
                            {activities.length > 0 ? activities.map((activity, idx) => (
                                <div key={idx} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative z-10 hover:shadow-md transition-shadow">
                                    <div className="flex gap-4">
                                        <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-white ${
                                            activity.action?.includes('STATUS') ? 'bg-amber-500' :
                                            activity.action?.includes('UPDATE') ? 'bg-blue-500' :
                                            activity.action?.includes('CREATE') ? 'bg-emerald-500' : 'bg-slate-400'
                                        }`}>
                                            <History size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-sm font-black text-slate-900">{activity.action?.replace(/_/g, ' ')}</p>
                                                <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2">
                                                    {new Date(activity.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            {activity.changes && typeof activity.changes === 'object' && (
                                                <p className="text-xs text-slate-500 font-medium truncate">
                                                    {Object.entries(activity.changes).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-slate-400">
                                    <History size={32} className="mx-auto mb-3 opacity-30" />
                                    <p className="text-sm font-bold">No activity yet</p>
                                    <p className="text-xs mt-1">Changes to this lead will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CRMLeadDetails;
