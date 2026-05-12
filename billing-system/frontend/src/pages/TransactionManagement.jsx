import React from 'react';

export default function TransactionManagement() {
    return (
        <React.Fragment>
            
{/* SideNavBar (Shared Component) */}
<aside className="fixed left-0 top-0 h-screen w-64 bg-slate-100 flex flex-col p-6 space-y-4 border-none z-50">
<div className="mb-8">
<h1 className="text-xl font-black text-slate-900 tracking-tight">Financial Architect</h1>
<p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-1">Billing Management</p>
</div>
<nav className="flex-1 space-y-2">
{/* Active state logic: Transactions screen active */}
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-200 transition-colors rounded-lg scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined">dashboard</span>
<span className="font-['Manrope'] font-semibold tracking-tight">Dashboard</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-200 transition-colors rounded-lg scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined">cloud_upload</span>
<span className="font-['Manrope'] font-semibold tracking-tight">Upload Data</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 bg-slate-200 text-indigo-600 rounded-lg scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined">receipt_long</span>
<span className="font-['Manrope'] font-semibold tracking-tight">Transactions</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-200 transition-colors rounded-lg scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined">group</span>
<span className="font-['Manrope'] font-semibold tracking-tight">Customers</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-200 transition-colors rounded-lg scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined">assessment</span>
<span className="font-['Manrope'] font-semibold tracking-tight">Reports</span>
</a>
<a className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-200 transition-colors rounded-lg scale-95 active:scale-100 transition-transform" href="#">
<span className="material-symbols-outlined">settings</span>
<span className="font-['Manrope'] font-semibold tracking-tight">Settings</span>
</a>
</nav>
<div className="pt-6">
<button className="w-full bg-primary text-on-primary py-3 px-4 rounded-lg font-headline font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm">
<span className="material-symbols-outlined">add</span>
                Create Invoice
            </button>
</div>
</aside>
{/* TopAppBar (Shared Component) */}
<header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-xl flex justify-between items-center px-8 py-3 ml-64 shadow-sm">
<div className="flex items-center flex-1 max-w-xl">
<div className="relative w-full">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary/20 text-sm font-body" placeholder="Search transactions, invoices, or clients..." type="text"/>
</div>
</div>
<div className="flex items-center gap-4">
<button className="p-2 text-slate-500 hover:text-indigo-500 transition-all duration-200">
<span className="material-symbols-outlined">notifications</span>
</button>
<button className="p-2 text-slate-500 hover:text-indigo-500 transition-all duration-200">
<span className="material-symbols-outlined">help_outline</span>
</button>
<div className="h-8 w-8 rounded-full overflow-hidden ml-2 ring-2 ring-primary/10">
<img alt="User Profile" className="w-full h-full object-cover" data-alt="professional portrait of a financial analyst in a clean modern office with soft daylight and bokeh background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCj3y8sWdby6W_5DRQ5Wixt9sfX7bwnOzC5oIs_KoOanh_LD13-KwEr_3pF1aJ7cCS1RTcN6FFQuWlyQ57foMuQwPdJaNDckxCjyLJM29whNs8qdF7ybdGtZ4ys2sgltw7ChXIfxCjjr3Bq1KckHJb2nTvAxvWg2oHjJNNvIq678ektVpY55S5uesM5svJ-ZutlxUhzRce0Un7ds_QDo8raihZHL52rdfaEy1S9baPX6OwSrTgsKvSznY1WW2H1zQvH86Az-pwBrmQ"/>
</div>
</div>
</header>
{/* Main Content */}
<main className="ml-64 p-8 min-h-screen">
{/* Header Section */}
<section className="mb-10">
<div className="flex justify-between items-end mb-6">
<div>
<h2 className="text-4xl font-extrabold text-on-surface tracking-tight font-headline">Transactions</h2>
<p className="text-on-surface-variant mt-1 font-body">Monitor and manage your organization's cash flow in real-time.</p>
</div>
<div className="flex gap-3">
<button className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded-lg text-sm font-medium hover:bg-surface-container-high transition-colors">
<span className="material-symbols-outlined text-sm">download</span>
                        Export CSV
                    </button>
</div>
</div>
{/* Bento Filter Bar */}
<div className="grid grid-cols-12 gap-4">
<div className="col-span-8 flex gap-2">
<button className="px-6 py-2 bg-primary text-on-primary rounded-full text-sm font-semibold shadow-sm">All</button>
<button className="px-6 py-2 bg-surface-container-lowest text-on-surface-variant rounded-full text-sm font-medium hover:bg-surface-container-low transition-colors">Verified</button>
<button className="px-6 py-2 bg-surface-container-lowest text-on-surface-variant rounded-full text-sm font-medium hover:bg-surface-container-low transition-colors">Pending</button>
<button className="px-6 py-2 bg-surface-container-lowest text-on-surface-variant rounded-full text-sm font-medium hover:bg-surface-container-low transition-colors">Rejected</button>
</div>
<div className="col-span-4 flex justify-end items-center gap-4">
<span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Sort by:</span>
<select className="bg-transparent border-none text-sm font-semibold text-primary focus:ring-0 cursor-pointer">
<option>Newest First</option>
<option>Oldest First</option>
<option>Highest Amount</option>
</select>
</div>
</div>
</section>
{/* Transaction List Shell */}
<section className="bg-surface-container-low rounded-xl p-4">
<div className="bg-surface-container-lowest rounded-xl overflow-hidden">
<table className="w-full border-collapse">
<thead>
<tr className="bg-surface-container-low/30">
<th className="px-6 py-5 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest font-body">Transaction Detail</th>
<th className="px-6 py-5 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest font-body">Date</th>
<th className="px-6 py-5 text-left text-xs font-bold text-on-surface-variant uppercase tracking-widest font-body text-right">Amount</th>
<th className="px-6 py-5 text-center text-xs font-bold text-on-surface-variant uppercase tracking-widest font-body">Status</th>
<th className="px-6 py-5 text-center text-xs font-bold text-on-surface-variant uppercase tracking-widest font-body">Verification</th>
<th className="px-6 py-5 text-right text-xs font-bold text-on-surface-variant uppercase tracking-widest font-body">Actions</th>
</tr>
</thead>
<tbody className="divide-y divide-transparent">
{/* Row 1: Verified */}
<tr className="hover:bg-surface-container transition-colors group">
<td className="px-6 py-6">
<div className="flex items-center gap-4">
<div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
<span className="material-symbols-outlined">payments</span>
</div>
<div>
<div className="font-bold text-on-surface font-headline">Cloud Infrastructure (AWS)</div>
<div className="text-xs text-on-surface-variant font-body">INV-2023-0891 • Amazon Web Services</div>
</div>
</div>
</td>
<td className="px-6 py-6 text-sm text-on-surface-variant font-medium">Oct 24, 2023</td>
<td className="px-6 py-6 text-right">
<div className="font-bold text-on-surface font-headline">$4,290.00</div>
</td>
<td className="px-6 py-6 text-center">
<span className="px-3 py-1 bg-tertiary-container/10 text-tertiary font-bold text-[10px] uppercase tracking-tighter rounded-full border border-tertiary/20">Verified</span>
</td>
<td className="px-6 py-6 text-center">
<button className="text-tertiary hover:underline text-xs font-bold flex items-center justify-center gap-1 mx-auto">
<span className="material-symbols-outlined text-base">check_circle</span>
                                    View Proof
                                </button>
</td>
<td className="px-6 py-6 text-right">
<div className="flex items-center justify-end gap-2">
<button className="p-2 text-on-surface-variant hover:text-primary transition-colors" title="View Invoice">
<span className="material-symbols-outlined">visibility</span>
</button>
<button className="p-2 text-on-surface-variant hover:text-green-600 transition-colors" title="Send to WhatsApp">
<span className="material-symbols-outlined">chat</span>
</button>
</div>
</td>
</tr>
{/* Row 2: Pending */}
<tr className="hover:bg-surface-container transition-colors group">
<td className="px-6 py-6">
<div className="flex items-center gap-4">
<div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
<span className="material-symbols-outlined">travel_explore</span>
</div>
<div>
<div className="font-bold text-on-surface font-headline">Corporate Retreat Deposit</div>
<div className="text-xs text-on-surface-variant font-body">INV-2023-0902 • Hyatt Regency</div>
</div>
</div>
</td>
<td className="px-6 py-6 text-sm text-on-surface-variant font-medium">Oct 26, 2023</td>
<td className="px-6 py-6 text-right">
<div className="font-bold text-on-surface font-headline">$12,500.00</div>
</td>
<td className="px-6 py-6 text-center">
<span className="px-3 py-1 bg-secondary-container/30 text-secondary font-bold text-[10px] uppercase tracking-tighter rounded-full border border-secondary/20">Pending</span>
</td>
<td className="px-6 py-6 text-center">
<button className="bg-primary/5 hover:bg-primary/10 text-primary px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 mx-auto">
<span className="material-symbols-outlined text-base">upload_file</span>
                                    Upload Proof
                                </button>
</td>
<td className="px-6 py-6 text-right">
<div className="flex items-center justify-end gap-2">
<button className="p-2 text-on-surface-variant hover:text-primary transition-colors" title="View Invoice">
<span className="material-symbols-outlined">visibility</span>
</button>
<button className="p-2 text-on-surface-variant hover:text-green-600 transition-colors" title="Send to WhatsApp">
<span className="material-symbols-outlined">chat</span>
</button>
</div>
</td>
</tr>
{/* Row 3: Rejected */}
<tr className="hover:bg-surface-container transition-colors group">
<td className="px-6 py-6">
<div className="flex items-center gap-4">
<div className="h-10 w-10 bg-error-container/20 text-error rounded-lg flex items-center justify-center">
<span className="material-symbols-outlined">shopping_cart_off</span>
</div>
<div>
<div className="font-bold text-on-surface font-headline">Office Furniture Purchase</div>
<div className="text-xs text-on-surface-variant font-body">INV-2023-0855 • Herman Miller</div>
</div>
</div>
</td>
<td className="px-6 py-6 text-sm text-on-surface-variant font-medium">Oct 20, 2023</td>
<td className="px-6 py-6 text-right">
<div className="font-bold text-on-surface font-headline">$3,150.00</div>
</td>
<td className="px-6 py-6 text-center">
<span className="px-3 py-1 bg-error-container text-error font-bold text-[10px] uppercase tracking-tighter rounded-full">Rejected</span>
</td>
<td className="px-6 py-6 text-center">
<button className="text-error hover:underline text-xs font-bold flex items-center justify-center gap-1 mx-auto">
<span className="material-symbols-outlined text-base">error</span>
                                    Review Reason
                                </button>
</td>
<td className="px-6 py-6 text-right">
<div className="flex items-center justify-end gap-2">
<button className="p-2 text-on-surface-variant hover:text-primary transition-colors" title="View Invoice">
<span className="material-symbols-outlined">visibility</span>
</button>
<button className="p-2 text-on-surface-variant hover:text-green-600 transition-colors" title="Send to WhatsApp">
<span className="material-symbols-outlined">chat</span>
</button>
</div>
</td>
</tr>
{/* Row 4: Verified */}
<tr className="hover:bg-surface-container transition-colors group">
<td className="px-6 py-6">
<div className="flex items-center gap-4">
<div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
<span className="material-symbols-outlined">subscriptions</span>
</div>
<div>
<div className="font-bold text-on-surface font-headline">Annual Software License</div>
<div className="text-xs text-on-surface-variant font-body">INV-2023-0821 • Adobe Creative Cloud</div>
</div>
</div>
</td>
<td className="px-6 py-6 text-sm text-on-surface-variant font-medium">Oct 18, 2023</td>
<td className="px-6 py-6 text-right">
<div className="font-bold text-on-surface font-headline">$599.88</div>
</td>
<td className="px-6 py-6 text-center">
<span className="px-3 py-1 bg-tertiary-container/10 text-tertiary font-bold text-[10px] uppercase tracking-tighter rounded-full border border-tertiary/20">Verified</span>
</td>
<td className="px-6 py-6 text-center">
<button className="text-tertiary hover:underline text-xs font-bold flex items-center justify-center gap-1 mx-auto">
<span className="material-symbols-outlined text-base">check_circle</span>
                                    View Proof
                                </button>
</td>
<td className="px-6 py-6 text-right">
<div className="flex items-center justify-end gap-2">
<button className="p-2 text-on-surface-variant hover:text-primary transition-colors" title="View Invoice">
<span className="material-symbols-outlined">visibility</span>
</button>
<button className="p-2 text-on-surface-variant hover:text-green-600 transition-colors" title="Send to WhatsApp">
<span className="material-symbols-outlined">chat</span>
</button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
{/* Pagination/Footer */}
<div className="flex items-center justify-between mt-6 px-4">
<span className="text-sm font-medium text-on-surface-variant font-body">Showing 4 of 128 transactions</span>
<div className="flex gap-1">
<button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest transition-colors">
<span className="material-symbols-outlined text-lg">chevron_left</span>
</button>
<button className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-on-primary text-xs font-bold">1</button>
<button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest transition-colors text-xs font-bold text-on-surface-variant">2</button>
<button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest transition-colors text-xs font-bold text-on-surface-variant">3</button>
<button className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-container-highest transition-colors">
<span className="material-symbols-outlined text-lg">chevron_right</span>
</button>
</div>
</div>
</section>
{/* Dynamic Insights Panel (Asymmetric Design) */}
<section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
<div className="col-span-2 bg-primary rounded-2xl p-8 relative overflow-hidden group">
<div className="relative z-10 flex justify-between items-start">
<div>
<h3 className="text-white text-2xl font-black font-headline mb-2">Verification Queue</h3>
<p className="text-indigo-100/80 font-body max-w-sm">You have 14 pending proof uploads that require verification. Ensure all documents are clear and legible.</p>
<button className="mt-6 bg-white text-primary px-6 py-2 rounded-lg font-bold hover:bg-indigo-50 transition-colors shadow-lg">Start Review</button>
</div>
<div className="text-right">
<div className="text-5xl font-black text-white/40 font-headline">14</div>
<div className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1">Pending Items</div>
</div>
</div>
{/* Abstract Design Elements */}
<div className="absolute -right-12 -bottom-12 h-64 w-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
</div>
<div className="bg-surface-container-low rounded-2xl p-8 flex flex-col justify-between border-none">
<div>
<h3 className="text-on-surface text-lg font-black font-headline mb-4">Total Disbursement</h3>
<div className="flex items-baseline gap-2">
<span className="text-3xl font-black text-on-surface font-headline">$284.5k</span>
<span className="text-tertiary text-xs font-bold">+12% vs last mo</span>
</div>
</div>
<div className="mt-8">
<div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
<div className="h-full bg-primary" style={{"width":"75%"}}></div>
</div>
<div className="flex justify-between mt-2">
<span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Monthly Limit</span>
<span className="text-[10px] font-bold text-on-surface uppercase tracking-widest">75% Used</span>
</div>
</div>
</div>
</section>
</main>
{/* Floating Action Button (Suppressing for focused transaction list but kept contextually if primary goal was creation, here we follow shell rules - hidden on sub-pages if transactional) */}

        </React.Fragment>
    );
}
