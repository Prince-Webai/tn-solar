
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    Download,
    Plus,
    MoreHorizontal,
    Mail,
    Phone,
    Building2,
    Calendar,
    ChevronDown,
    User
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { Lead, Customer } from '../../types';

const CRMContacts = () => {
    const navigate = useNavigate();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'leads' | 'customers'>('all');

    const handleExportCSV = () => {
        const rows = filteredContacts.map(c => ({
            Name: c.name || '',
            Type: c.type,
            Email: c.email || '',
            Phone: c.phone || '',
            Status: (c.status || '').replace(/_/g, ' '),
            'Created At': new Date(c.createdAt).toLocaleDateString('en-GB')
        }));
        const headers = Object.keys(rows[0] || {});
        const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r as any)[h]}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crm-contacts-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [leadsData, customersData] = await Promise.all([
                    dataService.getLeads(),
                    dataService.getCustomers() // Assuming dataService has getCustomers
                ]);
                setLeads(leadsData || []);
                setCustomers(customersData || []);
            } catch (error) {
                console.error("Failed to load contacts:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Combine leads and customers into a unified contact format
    const unifiedContacts = [
        ...leads.map(lead => ({
            id: lead.id,
            type: 'lead',
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            company: 'N/A', // Assuming lead might have company name in future
            status: lead.status,
            createdAt: lead.created_at,
            path: `/crm/leads/${lead.id}`
        })),
        ...customers.map(customer => ({
            id: customer.id,
            type: 'customer',
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            company: 'N/A',
            status: 'active_customer',
            createdAt: customer.created_at,
            path: `/customers` // No CRM customer detail page yet, link to main customers
        }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const filteredContacts = unifiedContacts.filter(contact => {
        const matchesSearch = contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || contact.type === activeTab;
        return matchesSearch && matchesTab;
    });

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00a4bd]/20 border-t-[#00a4bd]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Contacts</h1>
                    <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-widest">{filteredContacts.length} Total Records</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all border-b-4 active:border-b-0 active:translate-y-1"
                    >
                        <Download size={16} />
                        Export CSV
                    </button>
                    <button
                        onClick={() => navigate('/crm/pipeline')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B00] text-white rounded-xl text-sm font-bold hover:bg-[#e66000] border-b-4 border-[#cc5500] active:border-b-0 active:translate-y-1 transition-all shadow-lg shadow-[#FF6B00]/20"
                    >
                        <Plus size={16} />
                        Add Lead
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Tabs */}
                <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        All Contacts
                    </button>
                    <button
                        onClick={() => setActiveTab('leads')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'leads' ? 'bg-white text-[#00a4bd] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Leads
                    </button>
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'customers' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Customers
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00a4bd]" size={16} />
                        <input
                            type="text"
                            placeholder="Search name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00a4bd]/20 transition-all outline-none"
                        />
                    </div>
                    <button className="p-2.5 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Contacts Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#f4f5f6] border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">
                                    <div className="flex items-center gap-2">Name <ChevronDown size={12} /></div>
                                </th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Contact Info</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Company</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Created Date</th>
                                <th className="px-6 py-4 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredContacts.length > 0 ? filteredContacts.map((contact, idx) => (
                                <tr
                                    key={`${contact.type}-${contact.id}-${idx}`}
                                    className="group hover:bg-[#f9fafc] transition-colors cursor-pointer"
                                    onClick={() => navigate(contact.path)}
                                >
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black shadow-sm ${contact.type === 'lead' ? 'bg-[#00a4bd]/10 text-[#00a4bd]' : 'bg-emerald-100 text-emerald-600'
                                                }`}>
                                                {contact.type === 'lead' ? <User size={18} /> : <Building2 size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 group-hover:text-[#00a4bd] transition-colors">{contact.name}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${contact.type === 'lead' ? 'bg-[#00a4bd]/10 text-[#00a4bd]' : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                        {contact.type}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                <Mail size={14} className="text-slate-400" />
                                                <span className="truncate max-w-[200px]">{contact.email || '--'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                <Phone size={14} className="text-slate-400" />
                                                <span>{contact.phone || '--'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <p className="text-sm font-bold text-slate-700">{contact.company}</p>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${contact.type === 'customer' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                            contact.status === 'new' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                contact.status?.includes('close') || contact.status === 'converted' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                    'bg-amber-50 text-amber-600 border-amber-200'
                                            }`}>
                                            {contact.status ? contact.status.replace(/_/g, ' ') : 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                            <Calendar size={14} className="text-slate-400" />
                                            {new Date(contact.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top text-right">
                                        <button className="p-2 text-slate-400 hover:text-[#00a4bd] hover:bg-[#00a4bd]/10 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                                                <Search size={24} />
                                            </div>
                                            <p>No contacts found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Placeholder */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Showing 1 to {filteredContacts.length} of {filteredContacts.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 text-xs font-bold text-slate-400 bg-white border border-slate-200 rounded disabled:opacity-50" disabled>Prev</button>
                        <button className="px-3 py-1.5 text-xs font-bold text-slate-400 bg-white border border-slate-200 rounded disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CRMContacts;
