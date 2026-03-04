import React, { useState } from 'react';
import { FormReportProps, ReportState } from '../../types/report';

export const MilkingMachineTestReport: React.FC<FormReportProps> = ({ job, customer, onSubmit, onCancel, initialData, readOnly }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'installation' | 'maintenance' | 'tests' | 'pulsation' | 'faults'>('info');

    const [form, setForm] = useState<ReportState>(initialData ?? {
        tester: '',
        date: new Date().toISOString().split('T')[0],
        machineMake: '',
        plantType: '',
        noUnits: '',
        // Installation
        installation: {
            mainAirline: { bore: '', materials: '', slope: '', size: '', location: '' },
            pulsatorAirlines: { bore: '', materials: '', slope: '', size: '', location: '' },
            milkline: { bore: '', materials: '', height: '', slope: '', size: '', location: '' },
            washline: { bore: '', materials: '', slope: '', size: '', location: '' },
            milkLift: { bore: '', materials: '', height: '' },
            milkPump: { make: '', highSpeed: false, rate: '' },
            vacuumPump: { make: '', type: '', location: '', capacity: '' },
            regulator: { make: '', type: '', location: '', gauge: '' },
            claws: { make: '', type: '', volume: '', weight: '' },
            liners: { make: '', type: '', shell: '' }
        },
        // Maintenance
        maintenance: {
            vPumpOil: '',
            vPumpBelts: '',
            mPumpBelts: '',
            milkPumpDiaphragm: '',
            liners: '',
            milkTubes: '',
            pulseTubes: '',
            relayDiaphragms: '',
            pulsatorsClean: ''
        },
        // Air Flow tests
        airFlow: {
            t1_operatingVacuum: '',
            t1_recommended: '',
            t2_pumpCapacity: '',
            t2_rpm: '',
            t2_requiredCapacity: '',
            t3_afmAtTestPoint: '',
            t3_airPipelineLeakage: '',
            t4_addMilkingSystem: '',
            t4_systemLeakage: '',
            t5_openAirAdmission: '',
            t5_clawAdmission: '',
            t6_addPulsators: '',
            t6_pulsationUse: '',
            t6a_addAncillary: '',
            t6a_ancillaryUse: '',
            t7_dropVacuum2kPa: '',
            t7_regulatorLeakage: '',
            t8_addRegulator: '',
            t8_requiredReserve: ''
        },
        // Pulsation
        pulsation: {
            individual: { no: '', make: '', type: '', units: '', ratio: '', rate: '', a: '', d: '', max: '', min: '', diff: '' },
            master: { no: '', make: '', type: '', units: '', ratio: '', rate: '', a: '', d: '', max: '', min: '', diff: '' },
            relays: { no: '', make: '', type: '', units: '', ratio: '', rate: '', a: '', d: '', max: '', min: '', diff: '' },
            graphsAttached: false,
            beltGuardsFitted: false
        },
        // Faults & Recs
        faults: {
            installation: { faults: '', recommendations: '' },
            maintenance: { faults: '', recommendations: '' },
            vacuumTests: { faults: '', recommendations: '' },
            pulsationTests: { faults: '', recommendations: '' },
            safety: { faults: '', recommendations: '' },
            other: { faults: '', recommendations: '' }
        }
    });

    const updateForm = (section: keyof ReportState, field: string, value: any, subfield?: string) => {
        setForm(prev => {
            if (typeof prev[section] === 'object' && prev[section] !== null && !Array.isArray(prev[section])) {
                if (subfield) {
                    return {
                        ...prev,
                        [section]: {
                            ...(prev[section] as any),
                            [field]: {
                                ...(prev[section] as any)[field],
                                [subfield]: value
                            }
                        }
                    };
                }
                return {
                    ...prev,
                    [section]: {
                        ...(prev[section] as any),
                        [field]: value
                    }
                };
            }
            return {
                ...prev,
                [section]: value
            };
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-6xl mx-auto flex flex-col h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0 rounded-t-xl">
                <div>
                    <h2 className="text-2xl font-black font-display text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-delaval-blue text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-blue-900/20">TC</div>
                        Test Report on Milking Machine
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">
                        Licensed IMQCS Tester Report - {customer?.name || 'Unknown Farm'} - Job #{job.id.slice(0, 8)}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onCancel} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">{readOnly ? 'Close' : 'Cancel'}</button>
                    {!readOnly && (
                        <button onClick={() => onSubmit(form)} className="px-6 py-2.5 rounded-xl font-bold text-white bg-delaval-blue hover:bg-blue-700 shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0">
                            Save Report
                        </button>
                    )}
                </div>
            </div>

            <div className="flex border-b border-slate-200 shrink-0 px-6 bg-slate-50/50">
                {(['info', 'installation', 'maintenance', 'tests', 'pulsation', 'faults'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-4 font-bold text-sm uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab ? 'border-delaval-blue text-delaval-blue' : 'border-transparent text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {tab.replace('info', 'Header Info')}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50 relative">
                <fieldset disabled={readOnly} className="block border-0 p-0 m-0 max-w-4xl mx-auto space-y-8 pb-12">
                    {/* Render matching tab content... */}
                    {activeTab === 'info' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-200 pb-2">1. Header Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Customer Name</label>
                                        <input type="text" value={customer?.name || ''} disabled className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-700 font-medium cursor-not-allowed" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Address</label>
                                        <textarea disabled className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-700 font-medium cursor-not-allowed resize-none">{customer?.address || ''}</textarea>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tester Name</label>
                                        <input type="text" value={form.tester} onChange={(e) => setForm({ ...form, tester: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:border-delaval-blue focus:ring-1 focus:ring-delaval-blue transition-colors" placeholder="e.g. Tony Condon" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Test Date</label>
                                        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:border-delaval-blue focus:ring-1 focus:ring-delaval-blue transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Machine Make</label>
                                        <input type="text" value={form.machineMake} onChange={(e) => setForm({ ...form, machineMake: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:border-delaval-blue focus:ring-1 focus:ring-delaval-blue transition-colors" placeholder="e.g. DeLaval" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Plant Type</label>
                                            <input type="text" value={form.plantType} onChange={(e) => setForm({ ...form, plantType: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:border-delaval-blue focus:ring-1 focus:ring-delaval-blue focus:outline-none transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">No. Units</label>
                                            <input type="number" value={form.noUnits} onChange={(e) => setForm({ ...form, noUnits: e.target.value })} className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:border-delaval-blue focus:ring-1 focus:ring-delaval-blue focus:outline-none transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Installation Tab */}
                    {activeTab === 'installation' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">1. Installation Details</h3>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                                <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Pipelines & Lifting</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="py-2 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">Component</th>
                                                <th className="py-2 px-2 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">Bore</th>
                                                <th className="py-2 px-2 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">Materials</th>
                                                <th className="py-2 px-2 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">Height/Slope</th>
                                                <th className="py-2 px-2 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">Size</th>
                                                <th className="py-2 pl-2 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">Location</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {[
                                                { key: 'mainAirline', label: 'Main Airline', hasLocation: true },
                                                { key: 'pulsatorAirlines', label: 'Pulsator Airlines', hasLocation: true },
                                                { key: 'milkline', label: 'Milkline', hasLocation: true },
                                                { key: 'washline', label: 'Washline / Vacuum Washline', hasLocation: true },
                                                { key: 'milkLift', label: 'Milk Lift', hasLocation: false },
                                            ].map(({ key, label, hasLocation }) => (
                                                <tr key={key}>
                                                    <td className="py-3 text-sm font-medium text-slate-700 w-48">{label}</td>
                                                    <td className="py-3 px-2">
                                                        <input type="text" value={(form.installation as any)[key].bore} onChange={(e) => updateForm('installation', key, e.target.value, 'bore')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" />
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <input type="text" value={(form.installation as any)[key].materials} onChange={(e) => updateForm('installation', key, e.target.value, 'materials')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" />
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        <input type="text" value={(form.installation as any)[key].slope || (form.installation as any)[key].height || ''} onChange={(e) => updateForm('installation', key, e.target.value, key === 'milkLift' || key === 'milkline' ? 'height' : 'slope')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" />
                                                    </td>
                                                    <td className="py-3 px-2">
                                                        {key !== 'milkLift' && <input type="text" value={(form.installation as any)[key].size} onChange={(e) => updateForm('installation', key, e.target.value, 'size')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" />}
                                                    </td>
                                                    <td className="py-3 pl-2">
                                                        {hasLocation && <input type="text" value={(form.installation as any)[key].location} onChange={(e) => updateForm('installation', key, e.target.value, 'location')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" />}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                    <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Pumps & Regulation</h4>

                                    <div className="grid grid-cols-4 gap-3 items-end">
                                        <div className="col-span-1 text-sm font-medium text-slate-600">Milk Pump:</div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Make</label><input type="text" value={form.installation.milkPump.make} onChange={(e) => updateForm('installation', 'milkPump', e.target.value, 'make')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                        <div className="col-span-1 flex items-center h-full pb-2"><label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 font-bold"><input type="checkbox" checked={form.installation.milkPump.highSpeed} onChange={(e) => updateForm('installation', 'milkPump', e.target.checked, 'highSpeed')} className="w-4 h-4 text-delaval-blue border-slate-300 rounded focus:ring-delaval-blue" /> High Speed</label></div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Rate</label><input type="text" value={form.installation.milkPump.rate} onChange={(e) => updateForm('installation', 'milkPump', e.target.value, 'rate')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-3 items-end">
                                        <div className="col-span-1 text-sm font-medium text-slate-600">Vacuum Pump:</div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Make</label><input type="text" value={form.installation.vacuumPump.make} onChange={(e) => updateForm('installation', 'vacuumPump', e.target.value, 'make')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Type</label><input type="text" value={form.installation.vacuumPump.type} onChange={(e) => updateForm('installation', 'vacuumPump', e.target.value, 'type')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Capacity</label><input type="text" value={form.installation.vacuumPump.capacity} onChange={(e) => updateForm('installation', 'vacuumPump', e.target.value, 'capacity')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Location</label><input type="text" value={form.installation.vacuumPump.location} onChange={(e) => updateForm('installation', 'vacuumPump', e.target.value, 'location')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-3 items-end">
                                        <div className="col-span-1 text-sm font-medium text-slate-600">Regulator:</div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Make</label><input type="text" value={form.installation.regulator.make} onChange={(e) => updateForm('installation', 'regulator', e.target.value, 'make')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Type</label><input type="text" value={form.installation.regulator.type} onChange={(e) => updateForm('installation', 'regulator', e.target.value, 'type')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Location</label><input type="text" value={form.installation.regulator.location} onChange={(e) => updateForm('installation', 'regulator', e.target.value, 'location')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Farm Gauge</label><input type="text" value={form.installation.regulator.gauge} onChange={(e) => updateForm('installation', 'regulator', e.target.value, 'gauge')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                    <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Milking Units</h4>

                                    <div className="grid grid-cols-5 gap-3 items-end">
                                        <div className="col-span-1 text-sm font-medium text-slate-600">Claws:</div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Make</label><input type="text" value={form.installation.claws.make} onChange={(e) => updateForm('installation', 'claws', e.target.value, 'make')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Type</label><input type="text" value={form.installation.claws.type} onChange={(e) => updateForm('installation', 'claws', e.target.value, 'type')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Volume</label><input type="text" value={form.installation.claws.volume} onChange={(e) => updateForm('installation', 'claws', e.target.value, 'volume')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Weight</label><input type="text" value={form.installation.claws.weight} onChange={(e) => updateForm('installation', 'claws', e.target.value, 'weight')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3 items-end">
                                        <div className="col-span-1 text-sm font-medium text-slate-600">Liners:</div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Make</label><input type="text" value={form.installation.liners.make} onChange={(e) => updateForm('installation', 'liners', e.target.value, 'make')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Type</label><input type="text" value={form.installation.liners.type} onChange={(e) => updateForm('installation', 'liners', e.target.value, 'type')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                        <div className="col-span-1"><label className="text-[10px] uppercase text-slate-400 font-bold">Shell</label><input type="text" value={form.installation.liners.shell} onChange={(e) => updateForm('installation', 'liners', e.target.value, 'shell')} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 mt-1" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Maintenance Tab */}
                    {activeTab === 'maintenance' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">2. Maintenance</h3>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        { key: 'vPumpOil', label: 'V. Pump Oil' },
                                        { key: 'vPumpBelts', label: 'V. Pump Belts' },
                                        { key: 'mPumpBelts', label: 'M. Pump Belts' },
                                        { key: 'milkPumpDiaphragm', label: 'Milk Pump Diaphragm/Seals' },
                                        { key: 'liners', label: 'Liners' },
                                        { key: 'milkTubes', label: 'Milk Tubes' },
                                        { key: 'pulseTubes', label: 'Pulse Tubes' },
                                        { key: 'relayDiaphragms', label: 'Relay Diaphragms' },
                                        { key: 'pulsatorsClean', label: 'Pulsators / Relays Clean' },
                                    ].map(({ key, label }) => (
                                        <div key={key}>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</label>
                                            <input type="text" value={(form.maintenance as any)[key]} onChange={(e) => updateForm('maintenance', key, e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-sm focus:border-delaval-blue focus:ring-1 focus:ring-delaval-blue transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tests Tab (Air Flow) */}
                    {activeTab === 'tests' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">3. Air Flow and Vacuum Regulator Tests</h3>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                                <div className="space-y-4">
                                    {/* Test 1 */}
                                    <div className="grid grid-cols-12 gap-4 items-center border-b border-slate-100 pb-4">
                                        <div className="col-span-1 text-sm font-bold text-slate-400">1.</div>
                                        <div className="col-span-5 text-sm font-medium text-slate-700">Operating Vacuum - AFM at test point near regulator</div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t1_operatingVacuum} onChange={(e) => updateForm('airFlow', 't1_operatingVacuum', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /> <span className="text-xs text-slate-400 font-bold">(kPa)</span></div>
                                        <div className="col-span-2 text-sm text-slate-500 text-right">Recommended Vacuum:</div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t1_recommended} onChange={(e) => updateForm('airFlow', 't1_recommended', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /> <span className="text-xs text-slate-400 font-bold">(kPa)</span></div>
                                    </div>

                                    {/* Test 2 */}
                                    <div className="grid grid-cols-12 gap-4 items-center border-b border-slate-100 pb-4">
                                        <div className="col-span-1 text-sm font-bold text-slate-400">2.</div>
                                        <div className="col-span-3 text-sm font-medium text-slate-700">Pump Capacity - AFM direct to pump</div>
                                        <div className="col-span-2 flex items-center gap-2"><label className="text-xs text-slate-400">Speed</label><input type="text" value={form.airFlow.t2_rpm} onChange={(e) => updateForm('airFlow', 't2_rpm', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /> <span className="text-xs text-slate-400">rpm</span></div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t2_pumpCapacity} onChange={(e) => updateForm('airFlow', 't2_pumpCapacity', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /> <span className="text-xs text-slate-400 font-bold">(l/min)</span></div>
                                        <div className="col-span-2 text-sm text-slate-500 text-right">Required Pump Capacity:</div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t2_requiredCapacity} onChange={(e) => updateForm('airFlow', 't2_requiredCapacity', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /> <span className="text-xs text-slate-400 font-bold">(l/min)</span></div>
                                    </div>

                                    {/* Test 3 */}
                                    <div className="grid grid-cols-12 gap-4 items-center border-b border-slate-100 pb-4">
                                        <div className="col-span-1 text-sm font-bold text-slate-400">3.</div>
                                        <div className="col-span-5 text-sm font-medium text-slate-700">AFM at test point near regulator - teat plugs inserted<br /><span className="text-xs text-slate-400 font-normal">Air pipeline added only, regulator plugged</span></div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t3_afmAtTestPoint} onChange={(e) => updateForm('airFlow', 't3_afmAtTestPoint', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /> <span className="text-xs text-slate-400 font-bold">(l/min)</span></div>
                                        <div className="col-span-2 text-sm text-slate-500 text-right">Air Pipeline Leakage (2-3):</div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t3_airPipelineLeakage} onChange={(e) => updateForm('airFlow', 't3_airPipelineLeakage', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /></div>
                                    </div>

                                    {/* Test 4 */}
                                    <div className="grid grid-cols-12 gap-4 items-center border-b border-slate-100 pb-4">
                                        <div className="col-span-1 text-sm font-bold text-slate-400">4.</div>
                                        <div className="col-span-5 text-sm font-medium text-slate-700">Add Milking System close claw air admission</div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t4_addMilkingSystem} onChange={(e) => updateForm('airFlow', 't4_addMilkingSystem', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /> <span className="text-xs text-slate-400 font-bold">(l/min)</span></div>
                                        <div className="col-span-2 text-sm text-slate-500 text-right">Milking System Leakage (3-4):</div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t4_systemLeakage} onChange={(e) => updateForm('airFlow', 't4_systemLeakage', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /></div>
                                    </div>

                                    {/* Test 5 */}
                                    <div className="grid grid-cols-12 gap-4 items-center border-b border-slate-100 pb-4">
                                        <div className="col-span-1 text-sm font-bold text-slate-400">5.</div>
                                        <div className="col-span-5 text-sm font-medium text-slate-700">Open air admission at claws</div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t5_openAirAdmission} onChange={(e) => updateForm('airFlow', 't5_openAirAdmission', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /> <span className="text-xs text-slate-400 font-bold">(l/min)</span></div>
                                        <div className="col-span-2 text-sm text-slate-500 text-right">Claw Admission / Unit (4-5):</div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t5_clawAdmission} onChange={(e) => updateForm('airFlow', 't5_clawAdmission', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /></div>
                                    </div>

                                    {/* Test 6 & 6a */}
                                    <div className="grid grid-cols-12 gap-4 items-center border-b border-slate-100 pb-4">
                                        <div className="col-span-1 text-sm font-bold text-slate-400">6.</div>
                                        <div className="col-span-5 text-sm font-medium text-slate-700">Add pulsators - all units milking</div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t6_addPulsators} onChange={(e) => updateForm('airFlow', 't6_addPulsators', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /> <span className="text-xs text-slate-400 font-bold">(l/min)</span></div>
                                        <div className="col-span-2 text-sm text-slate-500 text-right">Pulsation Use (5-6):</div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t6_pulsationUse} onChange={(e) => updateForm('airFlow', 't6_pulsationUse', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /></div>
                                    </div>

                                    <div className="grid grid-cols-12 gap-4 items-center border-b border-slate-100 pb-4">
                                        <div className="col-span-1 text-sm font-bold text-slate-400">6a.</div>
                                        <div className="col-span-5 text-sm font-medium text-slate-700 flex items-center gap-2">Add ancillary equipment
                                            <input type="text" className="w-32 bg-slate-50 border-b border-slate-300 focus:outline-none focus:border-delaval-blue text-xs p-1" placeholder="(specify)" />
                                        </div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t6a_addAncillary} onChange={(e) => updateForm('airFlow', 't6a_addAncillary', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /> <span className="text-xs text-slate-400 font-bold">(l/min)</span></div>
                                        <div className="col-span-2 text-sm text-slate-500 text-right">Ancillary Equip. Use (6-6a):</div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t6a_ancillaryUse} onChange={(e) => updateForm('airFlow', 't6a_ancillaryUse', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /></div>
                                    </div>

                                    {/* Test 7 */}
                                    <div className="grid grid-cols-12 gap-4 items-center border-b border-slate-100 pb-4">
                                        <div className="col-span-1 text-sm font-bold text-slate-400">7.</div>
                                        <div className="col-span-5 text-sm font-medium text-slate-700">Drop Vacuum 2 kPa - all units milking, regulator plugged</div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t7_dropVacuum2kPa} onChange={(e) => updateForm('airFlow', 't7_dropVacuum2kPa', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /> <span className="text-xs text-slate-400 font-bold">(l/min)</span></div>
                                        <div className="col-span-2 text-sm text-slate-500 text-right">Regulator Leakage (7-8):</div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t7_regulatorLeakage} onChange={(e) => updateForm('airFlow', 't7_regulatorLeakage', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /></div>
                                    </div>

                                    {/* Test 8 */}
                                    <div className="grid grid-cols-12 gap-4 items-center pb-2">
                                        <div className="col-span-1 text-sm font-bold text-slate-400">8.</div>
                                        <div className="col-span-5 text-sm font-medium text-slate-700">Add regulator, drop vacuum 2 kPa - all units milking</div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t8_addRegulator} onChange={(e) => updateForm('airFlow', 't8_addRegulator', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /> <span className="text-xs text-slate-400 font-bold">(l/min)</span></div>
                                        <div className="col-span-2 text-sm text-slate-500 text-right">Required Reserve:</div>
                                        <div className="col-span-2 flex items-center gap-2"><input type="text" value={form.airFlow.t8_requiredReserve} onChange={(e) => updateForm('airFlow', 't8_requiredReserve', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-sm" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'pulsation' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                            <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">4. Pulsation</h3>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr>
                                            <th className="py-2 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">Type</th>
                                            <th className="py-2 px-1 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">No.</th>
                                            <th className="py-2 px-1 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">Make</th>
                                            <th className="py-2 px-1 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">Type</th>
                                            <th className="py-2 px-1 text-xs text-slate-500 font-bold uppercase tracking-wider border-b" title="Units/Relay or 4x0/2x2">Units/Relay</th>
                                            <th className="py-2 px-1 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">Rate(c/min)</th>
                                            <th className="py-2 px-1 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">Ratio "a+b"</th>
                                            <th className="py-2 px-1 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">"a" value</th>
                                            <th className="py-2 px-1 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">"d" value</th>
                                            <th className="py-2 px-1 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">Max</th>
                                            <th className="py-2 px-1 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">Min</th>
                                            <th className="py-2 px-1 text-xs text-slate-500 font-bold uppercase tracking-wider border-b">DIFF</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(['individual', 'master', 'relays'] as const).map((key) => (
                                            <tr key={key}>
                                                <td className="py-3 text-sm font-bold text-slate-700 capitalize">{key}</td>
                                                {['no', 'make', 'type', 'units', 'rate', 'ratio', 'a', 'd', 'max', 'min', 'diff'].map(field => (
                                                    <td key={`${key}-${field}`} className="py-3 px-1">
                                                        <input type="text" value={(form.pulsation as any)[key][field]} onChange={(e) => updateForm('pulsation', key, e.target.value, field)} className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-center focus:border-delaval-blue focus:ring-1 focus:ring-delaval-blue transition-colors" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center gap-6 mt-4 ml-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.pulsation.graphsAttached} onChange={(e) => updateForm('pulsation', 'graphsAttached', e.target.checked)} className="w-5 h-5 text-delaval-blue border-slate-300 rounded focus:ring-delaval-blue" />
                                    <span className="text-sm font-bold text-slate-700">Pulsation Graphs Attached</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.pulsation.beltGuardsFitted} onChange={(e) => updateForm('pulsation', 'beltGuardsFitted', e.target.checked)} className="w-5 h-5 text-delaval-blue border-slate-300 rounded focus:ring-delaval-blue" />
                                    <span className="text-sm font-bold text-slate-700">Belt Guards Fitted</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'faults' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                <h3 className="text-lg font-bold text-slate-800">Faults & Recommendations</h3>
                                <div className="flex gap-12 mr-12 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                    <span>Faults Log</span>
                                    <span>Recommendations</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                {(['installation', 'maintenance', 'vacuumTests', 'pulsationTests', 'safety', 'other'] as const).map((section, idx) => (
                                    <div key={section} className={`flex flex-col md:flex-row p-4 gap-4 ${idx !== 5 ? 'border-b border-slate-100' : ''}`}>
                                        <div className="w-full md:w-1/4 pt-2">
                                            <label className="text-sm font-bold text-slate-700 capitalize">{section.replace(/([A-Z])/g, ' $1').trim()}</label>
                                        </div>
                                        <div className="w-full md:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <textarea
                                                value={(form.faults as any)[section].faults}
                                                onChange={(e) => updateForm('faults', section, e.target.value, 'faults')}
                                                className="w-full h-24 bg-red-50/50 border border-red-100 rounded-lg p-3 text-sm resize-none focus:border-red-300 focus:ring-1 focus:ring-red-300 transition-colors"
                                                placeholder="List discovered faults..."
                                            />
                                            <textarea
                                                value={(form.faults as any)[section].recommendations}
                                                onChange={(e) => updateForm('faults', section, e.target.value, 'recommendations')}
                                                className="w-full h-24 bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-sm resize-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300 transition-colors"
                                                placeholder="Recommended actions..."
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </fieldset>
            </div>
        </div>
    );
};
