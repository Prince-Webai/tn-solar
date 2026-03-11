import { useState, useEffect } from 'react';
import {
    Search, Plus, Trash2, ChevronDown, ChevronUp, Phone, Mail,
    MapPin, Save, X, Calendar, Edit3, Check,
    Settings, Type, Hash, CheckSquare
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { Lead } from '../../types';
import toast from 'react-hot-toast';

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
    { value: 'new',                   label: 'New Lead',            color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'contacted',             label: 'Contacted',           color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'site_visit_scheduled',  label: 'Site Visit',          color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    { value: 'follow_up',             label: 'Follow Up',           color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'closed_won',            label: 'Closed Won',          color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'closed_lost',           label: 'Closed Lost',         color: 'bg-red-100 text-red-700 border-red-200' },
];
const SOURCE_OPTIONS = ['Web', 'Phone', 'Referral', 'Facebook', 'WhatsApp', 'Walk-in', 'Other'];

interface CustomFieldDef {
    id: string; name: string; label: string;
    type: 'text' | 'number' | 'date' | 'boolean'; required: boolean; entity_type: 'lead' | 'customer';
}

// ── Reusable inline editable field ────────────────────────────────────────────
const InlineField = ({
    label, value, onSave, type = 'text', options, icon: Icon
}: {
    label: string; value: string; onSave: (v: string) => Promise<void>;
    type?: string; options?: { value: string; label: string }[]; icon?: any;
}) => {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (draft === value) { setEditing(false); return; }
        setSaving(true);
        await onSave(draft);
        setSaving(false);
        setEditing(false);
    };

    return (
        <div className="group">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">{label}</label>
            {editing ? (
                <div className="flex items-center gap-1">
                    {options ? (
                        <select autoFocus value={draft} onChange={e => setDraft(e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-[#00a4bd] rounded-lg text-sm font-medium outline-none bg-white">
                            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    ) : type === 'textarea' ? (
                        <textarea autoFocus rows={2} value={draft} onChange={e => setDraft(e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-[#00a4bd] rounded-lg text-sm font-medium outline-none bg-white resize-none" />
                    ) : (
                        <input autoFocus type={type} value={draft} onChange={e => setDraft(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
                            className="flex-1 px-3 py-1.5 border border-[#00a4bd] rounded-lg text-sm font-medium outline-none bg-white" />
                    )}
                    <button onClick={save} disabled={saving}
                        className="p-1 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50"><Check size={13} /></button>
                    <button onClick={() => { setDraft(value); setEditing(false); }}
                        className="p-1 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200"><X size={13} /></button>
                </div>
            ) : (
                <div className="flex items-center gap-2 cursor-pointer hover:text-[#00a4bd] transition-colors py-1 group"
                    onClick={() => { setDraft(value); setEditing(true); }} title="Click to edit">
                    {Icon && <Icon size={13} className="text-[#00a4bd] shrink-0" />}
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-[#00a4bd]">
                        {value || <span className="text-slate-300 italic font-normal">Click to add...</span>}
                    </span>
                    <Edit3 size={11} className="opacity-0 group-hover:opacity-60 text-slate-400 ml-auto shrink-0" />
                </div>
            )}
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const CRMContacts = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [fieldDefs, setFieldDefs] = useState<CustomFieldDef[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

    // Create lead modal
    const [showCreate, setShowCreate] = useState(false);
    const [newLead, setNewLead] = useState<Partial<Lead>>({ name: '', email: '', phone: '', source: 'Web', status: 'new', notes: '' });
    const [creating, setCreating] = useState(false);

    // Custom field creator modal
    const [showFieldCreator, setShowFieldCreator] = useState(false);
    const [newField, setNewField] = useState<Partial<CustomFieldDef>>({ label: '', type: 'text', required: false, entity_type: 'lead' });
    const [savingField, setSavingField] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const [leadsData, defsData] = await Promise.all([
                dataService.getLeads(),
                dataService.getCustomFieldDefinitions('lead')
            ]);
            setLeads(leadsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            setFieldDefs(defsData);
        } catch { toast.error('Failed to load leads'); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    // When a row expands, preload its custom field values
    const handleExpand = (lead: Lead) => {
        if (expandedId === lead.id) { setExpandedId(null); return; }
        setExpandedId(lead.id);
        setCustomFieldValues(lead.custom_fields || {});
    };

    // Update a core lead field inline
    const updateLeadField = async (leadId: string, field: string, value: any) => {
        const { error } = await dataService.updateLead(leadId, { [field]: value } as any);
        if (error) { toast.error('Failed to update'); throw error; }
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, [field]: value } : l));
        toast.success('Saved!');
    };

    // Save custom field values for expanded lead
    const saveCustomFields = async (leadId: string) => {
        const { error } = await dataService.updateLead(leadId, { custom_fields: customFieldValues });
        if (error) { toast.error('Failed to save custom fields'); return; }
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, custom_fields: customFieldValues } : l));
        toast.success('Custom fields saved!');
    };

    // Delete a lead
    const handleDelete = async (lead: Lead) => {
        if (!confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) return;
        const { error } = await dataService.deleteLead(lead.id);
        if (error) { toast.error('Failed to delete'); return; }
        setLeads(prev => prev.filter(l => l.id !== lead.id));
        if (expandedId === lead.id) setExpandedId(null);
        toast.success('Lead deleted');
    };

    // Create a new lead
    const handleCreateLead = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLead.name?.trim()) { toast.error('Name is required'); return; }
        setCreating(true);
        const { error } = await dataService.addLead(newLead);
        setCreating(false);
        if (error) { toast.error('Failed to create lead'); return; }
        toast.success('Lead created!');
        setShowCreate(false);
        setNewLead({ name: '', email: '', phone: '', source: 'Web', status: 'new', notes: '' });
        loadData();
    };

    // Create a new custom field definition
    const handleCreateField = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newField.label?.trim()) { toast.error('Field label is required'); return; }
        setSavingField(true);
        const fieldName = newField.label!.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const def = [{ id: `temp-${Date.now()}`, name: fieldName, label: newField.label!, type: newField.type!, required: !!newField.required, entity_type: 'lead' as const }];
        const { error } = await dataService.saveCustomFieldDefinitions(def);
        setSavingField(false);
        if (error) { toast.error('Failed to create field'); return; }
        toast.success(`Field "${newField.label}" created!`);
        setShowFieldCreator(false);
        setNewField({ label: '', type: 'text', required: false, entity_type: 'lead' });
        const defs = await dataService.getCustomFieldDefinitions('lead');
        setFieldDefs(defs);
    };

    // Export CSV
    const exportCSV = () => {
        const rows = filteredLeads.map(l => ({
            Name: l.name, Phone: l.phone || '', Email: l.email || '',
            Status: l.status, Source: l.source || '',
            'Created At': new Date(l.created_at).toLocaleDateString('en-GB')
        }));
        if (rows.length === 0) { toast('No leads to export'); return; }
        const headers = Object.keys(rows[0]);
        const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r as any)[h]}"`).join(','))].join('\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    };

    const filteredLeads = leads.filter(l => {
        const matchSearch = l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.phone || '').includes(searchTerm) ||
            (l.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'all' || l.status === statusFilter;
        return matchSearch && matchStatus;
    });

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-[#00a4bd]/20 border-t-[#00a4bd] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 pb-16">
            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Leads</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                        {filteredLeads.length} record{filteredLeads.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={exportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        Export CSV
                    </button>
                    <button onClick={() => setShowFieldCreator(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-[#00a4bd] rounded-xl text-sm font-bold text-[#00a4bd] hover:bg-[#00a4bd]/5 transition-all shadow-sm">
                        <Settings size={15} /> Custom Fields
                    </button>
                    <button onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#e66000] transition-all shadow-lg shadow-[#FF6B00]/20 border-b-4 border-[#cc5500] active:border-b-0">
                        <Plus size={15} /> Add Lead
                    </button>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative group flex-1 min-w-[180px] max-w-xs">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search name, phone, email..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#00a4bd] transition-all" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none cursor-pointer hover:border-[#00a4bd] transition-all">
                    <option value="all">All Statuses</option>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {/* Status count pills */}
                {STATUS_OPTIONS.map(s => {
                    const cnt = leads.filter(l => l.status === s.value).length;
                    if (cnt === 0) return null;
                    return (
                        <button key={s.value} onClick={() => setStatusFilter(statusFilter === s.value ? 'all' : s.value)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition-all ${s.color} ${statusFilter === s.value ? 'ring-2 ring-offset-1 ring-[#00a4bd]' : 'opacity-70 hover:opacity-100'}`}>
                            {s.label} {cnt}
                        </button>
                    );
                })}
            </div>

            {/* ── Leads Table ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.2fr_60px] bg-slate-50 border-b border-slate-200 px-5 py-3">
                    {['Lead Name', 'Contact', 'Status', 'Created', ''].map(h => (
                        <div key={h} className="text-[10px] font-black uppercase tracking-widest text-slate-500">{h}</div>
                    ))}
                </div>

                {filteredLeads.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">
                        <Search size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="font-bold text-slate-500">No leads found</p>
                        <button onClick={() => setShowCreate(true)}
                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6B00] text-white text-sm font-bold rounded-xl hover:bg-[#e66000]">
                            <Plus size={14} /> Add First Lead
                        </button>
                    </div>
                ) : filteredLeads.map(lead => {
                    const status = STATUS_OPTIONS.find(s => s.value === lead.status);
                    const isExpanded = expandedId === lead.id;
                    return (
                        <div key={lead.id} className={`border-b border-slate-100 transition-all ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                            {/* ── Row ── */}
                            <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1.2fr_60px] px-5 py-4 items-center gap-2">
                                {/* Name */}
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00a4bd] to-[#2D3E50] flex items-center justify-center text-white font-black text-sm shrink-0">
                                        {lead.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-900 truncate">{lead.name}</p>
                                        {lead.source && <p className="text-[10px] text-slate-400 font-bold uppercase">{lead.source}</p>}
                                    </div>
                                </div>
                                {/* Contact */}
                                <div className="text-xs font-medium text-slate-600 space-y-1 min-w-0">
                                    {lead.phone && <div className="flex items-center gap-1.5 truncate"><Phone size={11} className="text-slate-400 shrink-0" />{lead.phone}</div>}
                                    {lead.email && <div className="flex items-center gap-1.5 truncate"><Mail size={11} className="text-slate-400 shrink-0" /><span className="truncate">{lead.email}</span></div>}
                                    {!lead.phone && !lead.email && <span className="text-slate-300 italic">No contact</span>}
                                </div>
                                {/* Status dropdown */}
                                <div onClick={e => e.stopPropagation()}>
                                    <div className="relative inline-block w-full max-w-[160px]">
                                        <select value={lead.status}
                                            onChange={async e => { await updateLeadField(lead.id, 'status', e.target.value); }}
                                            className={`w-full appearance-none text-xs font-bold px-3 py-2 pr-8 rounded-lg cursor-pointer outline-none border ${status?.color || 'bg-slate-100 text-slate-700 border-slate-200'} focus:ring-2 focus:ring-[#00a4bd]`}>
                                            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 opacity-60">
                                            <ChevronDown size={12} />
                                        </div>
                                    </div>
                                </div>
                                {/* Date */}
                                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                    <Calendar size={11} />
                                    {new Date(lead.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                                </div>
                                {/* Actions */}
                                <div className="flex items-center gap-1 justify-end">
                                    <button onClick={() => handleExpand(lead)} title="View / Edit details"
                                        className={`p-1.5 rounded-lg transition-all ${isExpanded ? 'bg-[#00a4bd] text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-[#00a4bd]'}`}>
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                    <button onClick={() => handleDelete(lead)} title="Delete lead"
                                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* ── Expanded Detail Panel ── */}
                            {isExpanded && (
                                <div className="px-5 pb-6 bg-white border-t border-blue-100 animate-fadeIn">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
                                        {/* Core fields */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00a4bd] mb-3">Contact Information</h4>
                                            <InlineField label="Full Name" value={lead.name} icon={undefined}
                                                onSave={v => updateLeadField(lead.id, 'name', v)} />
                                            <InlineField label="Phone" value={lead.phone || ''} type="tel" icon={Phone}
                                                onSave={v => updateLeadField(lead.id, 'phone', v)} />
                                            <InlineField label="Email" value={lead.email || ''} type="email" icon={Mail}
                                                onSave={v => updateLeadField(lead.id, 'email', v)} />
                                            <InlineField label="Lead Source" value={lead.source || ''}
                                                options={SOURCE_OPTIONS.map(s => ({ value: s, label: s }))}
                                                onSave={v => updateLeadField(lead.id, 'source', v)} />
                                        </div>

                                        {/* Notes */}
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00a4bd] mb-3">Notes & Address</h4>
                                            <InlineField label="Notes / Address" value={lead.notes || ''} type="textarea" icon={MapPin}
                                                onSave={v => updateLeadField(lead.id, 'notes', v)} />
                                            <InlineField label="Lead Status" value={lead.status}
                                                options={STATUS_OPTIONS}
                                                onSave={v => updateLeadField(lead.id, 'status', v)} />
                                        </div>

                                        {/* Custom Fields */}
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00a4bd]">Custom Fields</h4>
                                                <button onClick={() => saveCustomFields(lead.id)}
                                                    className="flex items-center gap-1 px-2.5 py-1 bg-[#00a4bd] text-white text-[10px] font-black uppercase rounded-lg hover:bg-[#008ba1] transition-all">
                                                    <Save size={11} /> Save
                                                </button>
                                            </div>
                                            {fieldDefs.length === 0 ? (
                                                <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl">
                                                    <p className="text-xs text-slate-400 font-medium">No custom fields yet</p>
                                                    <button onClick={() => setShowFieldCreator(true)}
                                                        className="mt-2 text-xs text-[#00a4bd] font-bold hover:underline flex items-center gap-1 mx-auto">
                                                        <Plus size={11} /> Add one
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {fieldDefs.map(fd => (
                                                        <div key={fd.id}>
                                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1 block">
                                                                {fd.label} {fd.required && <span className="text-red-500">*</span>}
                                                            </label>
                                                            {fd.type === 'boolean' ? (
                                                                <input type="checkbox" checked={!!customFieldValues[fd.name]}
                                                                    onChange={e => setCustomFieldValues(prev => ({ ...prev, [fd.name]: e.target.checked }))}
                                                                    className="w-4 h-4 text-[#00a4bd] rounded" />
                                                            ) : (
                                                                <input type={fd.type === 'number' ? 'number' : fd.type === 'date' ? 'date' : 'text'}
                                                                    value={customFieldValues[fd.name] || ''}
                                                                    onChange={e => setCustomFieldValues(prev => ({ ...prev, [fd.name]: e.target.value }))}
                                                                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-[#00a4bd] focus:bg-white rounded-lg text-sm font-medium outline-none transition-all"
                                                                    placeholder={`Enter ${fd.label.toLowerCase()}`} />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ── Create Lead Modal ── */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-[#2D3E50] to-[#1a2535] p-6 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-black">Add New Lead</h2>
                                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-0.5">Create lead record</p>
                            </div>
                            <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateLead} className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Full Name *</label>
                                <input required type="text" placeholder="e.g. Rajesh Kumar"
                                    value={newLead.name || ''} onChange={e => setNewLead({ ...newLead, name: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00a4bd] outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Phone</label>
                                    <input type="tel" placeholder="+91 9876543210"
                                        value={newLead.phone || ''} onChange={e => setNewLead({ ...newLead, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00a4bd] outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Email</label>
                                    <input type="email" placeholder="email@example.com"
                                        value={newLead.email || ''} onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00a4bd] outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Source</label>
                                    <select value={newLead.source || 'Web'} onChange={e => setNewLead({ ...newLead, source: e.target.value as any })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00a4bd] outline-none cursor-pointer">
                                        {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Status</label>
                                    <select value={newLead.status || 'new'} onChange={e => setNewLead({ ...newLead, status: e.target.value as any })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00a4bd] outline-none cursor-pointer">
                                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Notes</label>
                                <textarea rows={2} placeholder="Initial notes or address..."
                                    value={newLead.notes || ''} onChange={e => setNewLead({ ...newLead, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00a4bd] outline-none resize-none" />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowCreate(false)}
                                    className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                                <button type="submit" disabled={creating}
                                    className="flex-1 py-3 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#e66000] transition-all border-b-4 border-[#cc5500] active:border-b-0 disabled:opacity-50">
                                    {creating ? 'Creating...' : 'Create Lead'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Custom Field Creator Modal ── */}
            {showFieldCreator && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFieldCreator(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="bg-gradient-to-r from-[#2D3E50] to-[#1a2535] p-6 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-black">Create Custom Field</h2>
                                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-0.5">Add a new field to all leads</p>
                            </div>
                            <button onClick={() => setShowFieldCreator(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Existing fields list */}
                        {fieldDefs.length > 0 && (
                            <div className="px-6 pt-5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Existing Fields</p>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {fieldDefs.map(fd => (
                                        <div key={fd.id} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                {fd.type === 'text' && <Type size={14} className="text-slate-400" />}
                                                {fd.type === 'number' && <Hash size={14} className="text-slate-400" />}
                                                {fd.type === 'date' && <Calendar size={14} className="text-slate-400" />}
                                                {fd.type === 'boolean' && <CheckSquare size={14} className="text-slate-400" />}
                                                <span className="text-sm font-bold text-slate-700">{fd.label}</span>
                                                <span className="text-[9px] bg-slate-200 text-slate-500 font-black uppercase px-1.5 py-0.5 rounded">{fd.type}</span>
                                            </div>
                                            <button onClick={async () => {
                                                if (!confirm(`Delete field "${fd.label}"?`)) return;
                                                await dataService.deleteCustomFieldDefinition(fd.id);
                                                setFieldDefs(prev => prev.filter(f => f.id !== fd.id));
                                                toast.success('Field deleted');
                                            }} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="border-t border-slate-100 my-4" />
                            </div>
                        )}

                        <form onSubmit={handleCreateField} className={`p-6 space-y-4 ${fieldDefs.length > 0 ? 'pt-0' : ''}`}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Field</p>
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Field Label *</label>
                                <input required type="text" placeholder="e.g. GST Number, kW Requirement"
                                    value={newField.label || ''} onChange={e => setNewField({ ...newField, label: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00a4bd] outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Field Type</label>
                                    <select value={newField.type} onChange={e => setNewField({ ...newField, type: e.target.value as any })}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:border-[#00a4bd] outline-none cursor-pointer">
                                        <option value="text">Text</option>
                                        <option value="number">Number</option>
                                        <option value="date">Date</option>
                                        <option value="boolean">Checkbox</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input type="checkbox" id="req-new" checked={!!newField.required}
                                        onChange={e => setNewField({ ...newField, required: e.target.checked })}
                                        className="w-4 h-4 text-[#00a4bd] rounded" />
                                    <label htmlFor="req-new" className="text-sm font-bold text-slate-600 cursor-pointer">Required</label>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowFieldCreator(false)}
                                    className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={savingField}
                                    className="flex-1 py-3 bg-[#00a4bd] text-white rounded-xl text-sm font-bold hover:bg-[#008ba1] transition-all disabled:opacity-50">
                                    {savingField ? 'Creating...' : 'Create Field'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CRMContacts;
