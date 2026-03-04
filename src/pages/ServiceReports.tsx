import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ServiceReport } from '../types';
import { ClipboardList, Eye, Loader2, FileText, CalendarDays, User, Wrench, Plus } from 'lucide-react';
import { ReportDocument } from '../components/forms/ReportDocument';
import { ReportStartModal } from '../components/forms/ReportStartModal';
import { MilkingMachineTestReport } from '../components/forms/MilkingMachineTestReport';
import { Customer, Job } from '../types';

const ServiceReports: React.FC = () => {
    const [reports, setReports] = useState<ServiceReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingReport, setViewingReport] = useState<ServiceReport | null>(null);

    // Global Creation states
    const [isStartModalOpen, setIsStartModalOpen] = useState(false);
    const [creatingReport, setCreatingReport] = useState<{ customer: Customer, job: Job } | null>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('service_reports')
            .select('*, jobs(job_number, customers(name)), customers(name)')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setReports(data as any);
        }
        setLoading(false);
    };

    const handleSaveReport = async (reportData: any) => {
        if (!creatingReport) return;

        try {
            const { error } = await supabase
                .from('service_reports')
                .insert([{
                    job_id: creatingReport.job.id,
                    customer_id: creatingReport.customer.id,
                    report_data: reportData,
                    tester: reportData.tester,
                    test_date: reportData.date,
                    machine_make: reportData.machineMake
                }]);

            if (error) throw error;
            setCreatingReport(null);
            fetchReports(); // Refresh the list
        } catch (err: any) {
            console.error('Failed to save report', err);
            alert('Failed to save report: ' + err.message);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 bg-delaval-blue text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-900/20">
                            <ClipboardList size={20} />
                        </div>
                        Service Reports
                    </h1>
                    <p className="text-slate-500 mt-1">All IMQCS milking machine test reports</p>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-500 bg-slate-100 px-4 py-2 rounded-full font-medium">
                    {reports.length} report{reports.length !== 1 ? 's' : ''}
                    <button
                        onClick={() => setIsStartModalOpen(true)}
                        className="flex items-center gap-2 bg-delaval-blue hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm transition-colors ml-2 -my-2 -mr-4"
                    >
                        <Plus size={16} /> New Report
                    </button>
                </div>
            </div>

            {/* Reports List */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-delaval-blue animate-spin" />
                </div>
            ) : reports.length === 0 ? (
                <div className="section-card p-16 text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 mb-2">No reports yet</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">
                        Reports are created from within the <strong>Service Reports</strong> tab of any job.
                        Open a job and click <strong>New Report</strong> to get started.
                    </p>
                </div>
            ) : (
                <div className="section-card overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Report Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Job #</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tester</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Machine Make</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reports.map(report => (
                                    <tr key={report.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                                <CalendarDays size={14} className="text-slate-400" />
                                                {report.test_date
                                                    ? new Date(report.test_date).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
                                                    : new Date(report.created_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-slate-900">
                                                {(report as any).jobs?.customers?.name || (report as any).customers?.name || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-slate-600">
                                                #{(report as any).jobs?.job_number || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                                <User size={14} className="text-slate-400" />
                                                {report.tester || '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-700">
                                                <Wrench size={14} className="text-slate-400" />
                                                {report.machine_make || '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => setViewingReport(report)}
                                                className="flex items-center gap-2 text-delaval-blue hover:bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                                            >
                                                <Eye size={14} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile List */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {reports.map(report => (
                            <div key={report.id} className="p-4 flex justify-between items-center gap-3">
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-sm truncate">
                                        {(report as any).jobs?.customers?.name || (report as any).customers?.name || 'Unknown Customer'}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Job #{(report as any).jobs?.job_number || '—'} &bull; {report.tester || 'No tester'} &bull;{' '}
                                        {report.test_date
                                            ? new Date(report.test_date).toLocaleDateString('en-IE')
                                            : new Date(report.created_at).toLocaleDateString('en-IE')
                                        }
                                    </p>
                                    {report.machine_make && (
                                        <p className="text-xs text-delaval-blue font-medium mt-0.5">{report.machine_make}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setViewingReport(report)}
                                    className="shrink-0 text-delaval-blue hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                >
                                    <Eye size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* View Report Document */}
            {viewingReport && (
                <ReportDocument
                    report={viewingReport.report_data}
                    job={(viewingReport as any).jobs || null}
                    customer={(viewingReport as any).jobs?.customers || (viewingReport as any).customers || null}
                    onClose={() => setViewingReport(null)}
                />
            )}

            {/* Global Creation Flow Steps */}
            <ReportStartModal
                isOpen={isStartModalOpen}
                onClose={() => setIsStartModalOpen(false)}
                onStart={(customer, job) => {
                    setIsStartModalOpen(false);
                    setCreatingReport({ customer, job });
                }}
            />

            {creatingReport && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-12 overflow-y-auto">
                    <MilkingMachineTestReport
                        job={creatingReport.job}
                        customer={creatingReport.customer}
                        onSubmit={handleSaveReport}
                        onCancel={() => setCreatingReport(null)}
                    />
                </div>
            )}
        </div>
    );
};

export default ServiceReports;
