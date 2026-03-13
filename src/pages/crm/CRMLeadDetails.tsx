import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Zap,
    ArrowLeft,
    Clock,
    Tag,
    Briefcase,
    Globe,
    FileText,
    TrendingUp
} from "lucide-react";
import toast from "react-hot-toast";
import { dataService } from "../../services/dataService";
import { Lead } from "../../types";
import ConversationManager from "../../components/crm/ConversationManager";

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

const CRMLeadDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);

    const loadLeadData = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const leadData = await dataService.getLeads().then(list => list.find(l => l.id === id) || null);

            if (!leadData) {
                toast.error("Lead not found");
                navigate('/crm/contacts');
                return;
            }
            setLead(leadData);
        } catch (error) {
            console.error("Error loading lead details:", error);
            toast.error("Failed to load details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLeadData();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00a4bd]/20 border-t-[#00a4bd]"></div>
            </div>
        );
    }

    if (!lead) return null;

    const statusOption = STATUS_OPTIONS.find(s => s.value === lead.status);

    const InfoRow = ({ label, value, icon: Icon }: { label: string, value: any, icon?: any }) => (
        <div className="flex items-start gap-3 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
            {Icon && <Icon size={16} className="text-[#00a4bd] mt-0.5 shrink-0" />}
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
                <p className="text-sm font-bold text-slate-700 truncate">{value || <span className="text-slate-300 font-normal italic">N/A</span>}</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 animate-fadeIn pb-20">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/crm/contacts')}
                        className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors shadow-sm bg-slate-50"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#00a4bd]">Lead Overview</p>
                        <h1 className="text-2xl font-black text-slate-900 leading-tight">{lead.name}</h1>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${statusOption?.color || 'bg-slate-100 text-slate-600'}`}>
                        {statusOption?.label || lead.status}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/crm/pipeline')}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        ← Pipeline
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Column 1: Lead Information (Left) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-[#00a4bd]/5 flex items-center justify-center text-[#00a4bd]">
                                <FileText size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900">Lead Attributes</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Detailed record data</p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <InfoRow label="Lead Name" value={lead.name} icon={User} />
                            <InfoRow label="Contact Name" value={lead.contact_name} icon={User} />
                            <InfoRow label="Phone / Mobile Number" value={lead.phone} icon={Phone} />
                            <InfoRow label="Email Address" value={lead.email} icon={Mail} />
                            <InfoRow label="Status" value={lead.status?.replace(/_/g, ' ')} icon={Tag} />
                            <InfoRow label="Lead Owner" value={lead.lead_owner} icon={Briefcase} />
                            <InfoRow label="Created Date" value={lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} icon={Calendar} />
                            <InfoRow label="District" value={lead.district} icon={MapPin} />
                            <InfoRow label="Pincode" value={lead.pincode} icon={MapPin} />
                            <InfoRow label="Last Month Bill" value={lead.last_month_bill ? `₹${lead.last_month_bill}` : ''} icon={TrendingUp} />
                            <InfoRow label="Proposed KW" value={lead.proposed_kw ? `${lead.proposed_kw} kW` : ''} icon={Zap} />
                            <InfoRow label="Lead Type" value={lead.lead_type} icon={Briefcase} />
                            <InfoRow label="Site Visit Date & Time" value={lead.site_visit_datetime ? new Date(lead.site_visit_datetime).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''} icon={Clock} />
                            <InfoRow label="Last Modified Date" value={lead.last_modified_at ? new Date(lead.last_modified_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} icon={Clock} />
                            <InfoRow label="Lead Source" value={lead.source} icon={Globe} />
                        </div>
                    </div>
                </div>

                {/* Column 2: Conversation Manager (Right) */}
                <div className="lg:col-span-7">
                    <ConversationManager lead={lead} onUpdate={loadLeadData} />
                </div>

            </div>
        </div>
    );
};

export default CRMLeadDetails;
