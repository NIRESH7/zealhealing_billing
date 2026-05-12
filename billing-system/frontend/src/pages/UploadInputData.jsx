import React from 'react';

export default function UploadInputData() {
    return (
        <React.Fragment>
            
{/* SideNavBar Anchor */}
<aside className="fixed left-0 top-0 h-screen w-64 bg-slate-100 dark:bg-slate-900 flex flex-col p-6 space-y-4 font-['Manrope'] font-semibold tracking-tight">
<div className="mb-8">
<h1 className="text-xl font-black text-slate-900 dark:text-white">Financial Architect</h1>
<p className="text-xs text-slate-500 font-medium tracking-normal mt-1 uppercase">Billing Management</p>
</div>
<nav className="flex-1 space-y-2">
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors rounded-lg group scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span>Dashboard</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg group scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="cloud_upload">cloud_upload</span>
<span>Upload Data</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors rounded-lg group scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="receipt_long">receipt_long</span>
<span>Transactions</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors rounded-lg group scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="group">group</span>
<span>Customers</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors rounded-lg group scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="assessment">assessment</span>
<span>Reports</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors rounded-lg group scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
<span>Settings</span>
</a>
</nav>
<button className="mt-auto bg-indigo-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95">
<span className="material-symbols-outlined" data-icon="add">add</span>
            Create Invoice
        </button>
</aside>
{/* Main Content Area */}
<main className="ml-64 min-h-screen bg-surface">
{/* TopAppBar Anchor */}
<header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl flex justify-between items-center px-8 py-3 shadow-sm dark:shadow-none">
<div className="flex items-center flex-1">
<div className="relative w-full max-w-md">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" data-icon="search">search</span>
<input className="w-full bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Search data points..." type="text"/>
</div>
</div>
<div className="flex items-center gap-6">
<button className="text-slate-500 hover:text-indigo-500 transition-all duration-200">
<span className="material-symbols-outlined" data-icon="notifications">notifications</span>
</button>
<button className="text-slate-500 hover:text-indigo-500 transition-all duration-200">
<span className="material-symbols-outlined" data-icon="help_outline">help_outline</span>
</button>
<div className="h-8 w-8 rounded-full bg-primary-container overflow-hidden">
<img alt="User Profile" className="h-full w-full object-cover" data-alt="Professional headshot of a financial manager for user profile avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVW2zfeifrmaIR4lVW_kvocWmcq_czCSg45rQ6J33ho8D61NfROdmkBfdgnLum9k2iqgwqLxrNNsTOZrHR5KS-mGIzkVzaj_abrcmfivMezGiY2AOMut08DoWvfyuso-rOuiIZodGWemCcWwHmics8J743zdOpF7z6pPooVgg__DiPOvSER1zGkzomtGS-_8NvmYCQFIMKLp-iuMLOedkaZGmIfcacaXGV0eeiYtk6PvcGjF_uPRXmH-aWwiIG7Z7rWugXA8I4SjA"/>
</div>
</div>
</header>
<div className="p-10 space-y-10">
{/* Header Section */}
<section className="flex justify-between items-end">
<div>
<h2 className="text-4xl font-extrabold text-on-surface tracking-tight">Upload Data</h2>
<p className="text-on-surface-variant mt-2 text-lg">Ingest your financial records via bulk upload or manual entry.</p>
</div>
{/* Bulk Processing Status Indicator (Bento-style element) */}
<div className="bg-surface-container-low p-4 rounded-xl flex items-center gap-4 min-w-[280px]">
<div className="relative flex items-center justify-center">
<svg className="w-12 h-12 transform -rotate-90">
<circle className="text-surface-container-highest" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" strokeWidth="4"></circle>
<circle className="text-primary" cx="24" cy="24" fill="transparent" r="20" stroke="currentColor" stroke-dasharray="125.6" stroke-dashoffset="30" strokeWidth="4"></circle>
</svg>
<span className="absolute text-[10px] font-bold text-primary">75%</span>
</div>
<div>
<p className="text-sm font-bold text-on-surface">Bulk Processing</p>
<p className="text-xs text-on-surface-variant">4,281 records synced today</p>
</div>
</div>
</section>
{/* Main Interactive Zone: Asymmetric Bento Layout */}
<div className="grid grid-cols-12 gap-8 items-start">
{/* Left Column: Drag and Drop Zone */}
<div className="col-span-12 lg:col-span-7 space-y-8">
<div className="bg-surface-container-lowest p-1 rounded-xl shadow-sm border border-outline-variant/10">
<div className="border-2 border-dashed border-outline-variant/30 rounded-lg p-16 flex flex-col items-center justify-center text-center space-y-4 hover:bg-surface-container-low transition-all duration-300 group cursor-pointer">
<div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined text-4xl text-primary" data-icon="cloud_upload">cloud_upload</span>
</div>
<div>
<h3 className="text-xl font-bold text-on-surface">Drop your files here</h3>
<p className="text-on-surface-variant text-sm mt-1">Supports .csv, .xls, .xlsx (Max 50MB)</p>
</div>
<button className="mt-4 px-6 py-2.5 bg-surface-container-highest text-on-surface font-semibold rounded-lg hover:bg-surface-container-high transition-colors">
                                Select Files
                            </button>
</div>
</div>
{/* Guidance Cards */}
<div className="grid grid-cols-2 gap-4">
<div className="bg-surface-container-low p-6 rounded-xl">
<span className="material-symbols-outlined text-tertiary mb-3" data-icon="schema">schema</span>
<h4 className="font-bold text-on-surface">Template Mapping</h4>
<p className="text-xs text-on-surface-variant mt-2 leading-relaxed">Auto-detect columns and map them to Financial Architect schema effortlessly.</p>
</div>
<div className="bg-surface-container-low p-6 rounded-xl">
<span className="material-symbols-outlined text-primary mb-3" data-icon="verified_user">verified_user</span>
<h4 className="font-bold text-on-surface">Validation Engine</h4>
<p className="text-xs text-on-surface-variant mt-2 leading-relaxed">Our AI cleanses and validates currency formats and transaction IDs in real-time.</p>
</div>
</div>
</div>
{/* Right Column: Manual Entry Form (Glassmorphism inspired card) */}
<div className="col-span-12 lg:col-span-5">
<div className="bg-surface-container-lowest/80 backdrop-blur-xl p-8 rounded-xl shadow-sm border border-outline-variant/20">
<h3 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
<span className="material-symbols-outlined text-primary" data-icon="edit_note">edit_note</span>
                            Manual Transaction
                        </h3>
<form className="space-y-5">
<div>
<label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Customer Name</label>
<input className="w-full bg-surface border border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="e.g. John Doe" type="text"/>
</div>
<div className="grid grid-cols-2 gap-4">
<div>
<label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Phone</label>
<input className="w-full bg-surface border border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="+1 (555) 000-0000" type="tel"/>
</div>
<div>
<label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Product</label>
<select className="w-full bg-surface border border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none">
<option>Select Tier</option>
<option>SaaS Pro</option>
<option>Enterprise</option>
<option>Custom Plan</option>
</select>
</div>
</div>
<div>
<label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Transaction ID</label>
<div className="relative">
<input className="w-full bg-surface border border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="TXN-99281-001" type="text"/>
<button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:text-primary-container transition-colors" type="button">
<span className="material-symbols-outlined text-lg" data-icon="refresh">refresh</span>
</button>
</div>
</div>
<div>
<label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Amount</label>
<div className="relative">
<span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold">$</span>
<input className="w-full bg-surface border border-outline-variant/20 rounded-lg pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="0.00" type="number"/>
</div>
</div>
<button className="w-full py-4 bg-primary text-on-primary font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-95 flex items-center justify-center gap-2 mt-4" type="submit">
<span className="material-symbols-outlined" data-icon="send">send</span>
                                Process Transaction
                            </button>
</form>
</div>
</div>
</div>
{/* Recent Activity Table (No-Line UI) */}
<section className="bg-surface-container-low rounded-xl p-8">
<div className="flex justify-between items-center mb-6">
<h3 className="text-xl font-bold text-on-surface">Recent Processed Batch</h3>
<button className="text-sm font-bold text-primary hover:underline">View History</button>
</div>
<div className="overflow-x-auto">
<table className="w-full text-left">
<thead>
<tr className="text-on-surface-variant uppercase text-[10px] tracking-widest font-bold">
<th className="pb-4">Source File</th>
<th className="pb-4">Records</th>
<th className="pb-4">Status</th>
<th className="pb-4">Validation Score</th>
<th className="pb-4 text-right">Actions</th>
</tr>
</thead>
<tbody className="text-sm">
<tr className="group hover:bg-surface-container-high transition-all rounded-lg">
<td className="py-4 font-medium text-on-surface rounded-l-lg">Q4_Billing_Final.csv</td>
<td className="py-4 text-on-surface-variant">12,840</td>
<td className="py-4">
<span className="bg-tertiary-container text-white px-3 py-1 rounded-full text-[11px] font-bold">Completed</span>
</td>
<td className="py-4">
<div className="flex items-center gap-2">
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="bg-tertiary h-full w-[98%]"></div>
</div>
<span className="text-xs font-bold text-tertiary">98.2%</span>
</div>
</td>
<td className="py-4 text-right rounded-r-lg">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" data-icon="more_horiz">more_horiz</button>
</td>
</tr>
<tr className="group hover:bg-surface-container-high transition-all rounded-lg">
<td className="py-4 font-medium text-on-surface rounded-l-lg">Weekly_Sync_Mar_21.xlsx</td>
<td className="py-4 text-on-surface-variant">3,122</td>
<td className="py-4">
<span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[11px] font-bold">In Progress</span>
</td>
<td className="py-4">
<div className="flex items-center gap-2">
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="bg-primary h-full w-[60%]"></div>
</div>
<span className="text-xs font-bold text-on-surface-variant">Analysing...</span>
</div>
</td>
<td className="py-4 text-right rounded-r-lg">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" data-icon="more_horiz">more_horiz</button>
</td>
</tr>
<tr className="group hover:bg-surface-container-high transition-all rounded-lg">
<td className="py-4 font-medium text-on-surface rounded-l-lg">Sales_Direct_Manual.csv</td>
<td className="py-4 text-on-surface-variant">450</td>
<td className="py-4">
<span className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-[11px] font-bold">Errors Found</span>
</td>
<td className="py-4">
<div className="flex items-center gap-2">
<div className="w-24 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
<div className="bg-error h-full w-[45%]"></div>
</div>
<span className="text-xs font-bold text-error">Critical Errors</span>
</div>
</td>
<td className="py-4 text-right rounded-r-lg">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" data-icon="more_horiz">more_horiz</button>
</td>
</tr>
</tbody>
</table>
</div>
</section>
</div>
</main>

        </React.Fragment>
    );
}
