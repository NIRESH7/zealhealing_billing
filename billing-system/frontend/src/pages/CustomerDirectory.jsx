import React from 'react';

export default function CustomerDirectory() {
    return (
        <React.Fragment>
            
{/* SideNavBar Shell */}
<aside className="fixed left-0 top-0 h-screen w-64 bg-slate-100 dark:bg-slate-900 flex flex-col p-6 space-y-4">
<div className="mb-8 flex items-center space-x-3">
<div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary">
<span className="material-symbols-outlined" data-icon="account_balance">account_balance</span>
</div>
<div className="flex flex-col">
<span className="text-xl font-black text-slate-900 dark:text-white font-headline leading-tight">Financial Architect</span>
<span className="text-xs font-semibold tracking-tight text-slate-500 uppercase">Billing Management</span>
</div>
</div>
<nav className="flex-1 space-y-2">
<a className="flex items-center space-x-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors rounded-lg font-['Manrope'] font-semibold tracking-tight" href="#">
<span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
<span>Dashboard</span>
</a>
<a className="flex items-center space-x-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors rounded-lg font-['Manrope'] font-semibold tracking-tight" href="#">
<span className="material-symbols-outlined" data-icon="cloud_upload">cloud_upload</span>
<span>Upload Data</span>
</a>
<a className="flex items-center space-x-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors rounded-lg font-['Manrope'] font-semibold tracking-tight" href="#">
<span className="material-symbols-outlined" data-icon="receipt_long">receipt_long</span>
<span>Transactions</span>
</a>
{/* Active State: Customers */}
<a className="flex items-center space-x-3 p-3 bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg font-['Manrope'] font-semibold tracking-tight" href="#">
<span className="material-symbols-outlined" data-icon="group">group</span>
<span>Customers</span>
</a>
<a className="flex items-center space-x-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors rounded-lg font-['Manrope'] font-semibold tracking-tight" href="#">
<span className="material-symbols-outlined" data-icon="assessment">assessment</span>
<span>Reports</span>
</a>
<a className="flex items-center space-x-3 p-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors rounded-lg font-['Manrope'] font-semibold tracking-tight" href="#">
<span className="material-symbols-outlined" data-icon="settings">settings</span>
<span>Settings</span>
</a>
</nav>
<button className="w-full py-4 bg-primary text-on-primary font-bold rounded-lg shadow-lg shadow-indigo-500/20 active:scale-95 transition-transform">
            Create Invoice
        </button>
</aside>
{/* TopAppBar Shell */}
<header className="sticky top-0 z-40 w-full flex justify-between items-center px-8 py-3 ml-64 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm dark:shadow-none border-b border-transparent">
<div className="flex items-center w-1/2">
<div className="relative w-full max-w-md">
<span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline" data-icon="search">search</span>
<input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-body" placeholder="Search customers, invoices, or emails..." type="text"/>
</div>
</div>
<div className="flex items-center space-x-6">
<button className="relative text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-all">
<span className="material-symbols-outlined" data-icon="notifications">notifications</span>
<span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
</button>
<button className="text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-all">
<span className="material-symbols-outlined" data-icon="help_outline">help_outline</span>
</button>
<div className="h-8 w-[1px] bg-outline-variant/30"></div>
<div className="flex items-center space-x-3">
<img alt="User Profile" className="w-8 h-8 rounded-full border-2 border-white shadow-sm" data-alt="professional headshot of a financial manager with a confident smile in a bright modern office setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC57gYdL6W-7uXYPbuQxUuWe7xlTsnpsvw0d84_TOdM7_TVaJ-wA-DYRQFK0paKmNBOw20mHNyYQ2Va_onojc5lGYuWOfVv5G5Tsaa381X76qPBinD5X-6ATt3X-_mI6u2NthA6lLBIeoLHysW9K08jttFDcx0gDVyDf3vS4f7bVUA0SYBjvyi484kAxks0G53SP3Ii6aRHDgFfuOjPoM31BNWgAejoPCBth5MeQJt4wpJeHpaucIZfbZxt7Oobx-tjl91jm0KX_wM"/>
<div className="hidden lg:block text-right">
<p className="text-xs font-bold text-slate-900 leading-none">Alex Sterling</p>
<p className="text-[10px] text-slate-500">Administrator</p>
</div>
</div>
</div>
</header>
{/* Main Canvas */}
<main className="ml-64 p-8 min-h-screen">
<div className="max-w-7xl mx-auto">
{/* Page Header */}
<div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
<div>
<h1 className="text-4xl font-extrabold font-headline text-on-surface tracking-tight">Customer Database</h1>
<p className="text-on-surface-variant font-body mt-2">Manage your relationships and track total lifecycle value.</p>
</div>
<div className="flex items-center space-x-3">
<button className="px-5 py-2.5 bg-surface-container-highest text-on-surface font-semibold rounded-lg text-sm hover:bg-surface-container-high transition-colors">
                        Export CSV
                    </button>
<button className="px-5 py-2.5 bg-primary text-on-primary font-bold rounded-lg text-sm shadow-md hover:shadow-lg transition-all flex items-center space-x-2">
<span className="material-symbols-outlined text-sm" data-icon="person_add">person_add</span>
<span>Add New Customer</span>
</button>
</div>
</div>
{/* Dashboard Stats Triptych (Bento Style) */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
<div className="bg-surface-container-lowest p-6 rounded-xl border border-transparent hover:border-outline-variant/20 transition-all group">
<div className="flex items-center justify-between mb-4">
<div className="p-2 bg-primary-fixed text-primary rounded-lg">
<span className="material-symbols-outlined" data-icon="groups">groups</span>
</div>
<span className="text-xs font-bold text-tertiary">+12% vs last mo</span>
</div>
<p className="text-on-surface-variant text-sm font-medium mb-1">Total Active Customers</p>
<h3 className="text-3xl font-black font-headline">1,284</h3>
</div>
<div className="bg-surface-container-lowest p-6 rounded-xl border border-transparent hover:border-outline-variant/20 transition-all group">
<div className="flex items-center justify-between mb-4">
<div className="p-2 bg-secondary-fixed text-secondary rounded-lg">
<span className="material-symbols-outlined" data-icon="payments">payments</span>
</div>
<span className="text-xs font-bold text-tertiary">+8.4%</span>
</div>
<p className="text-on-surface-variant text-sm font-medium mb-1">Total Revenue Collected</p>
<h3 className="text-3xl font-black font-headline">$428,900</h3>
</div>
<div className="bg-surface-container-lowest p-6 rounded-xl border border-transparent hover:border-outline-variant/20 transition-all group">
<div className="flex items-center justify-between mb-4">
<div className="p-2 bg-tertiary-fixed text-tertiary rounded-lg">
<span className="material-symbols-outlined" data-icon="monitoring">monitoring</span>
</div>
<span className="text-xs font-bold text-on-surface-variant">Stable</span>
</div>
<p className="text-on-surface-variant text-sm font-medium mb-1">Average Lifetime Value</p>
<h3 className="text-3xl font-black font-headline">$3,420</h3>
</div>
</div>
{/* Customer List Table */}
<div className="bg-surface-container-low rounded-xl overflow-hidden p-1">
<div className="bg-surface-container-lowest rounded-lg">
{/* Table Search & Filter Bar */}
<div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-container">
<div className="flex items-center space-x-2">
<h2 className="text-lg font-bold font-headline">Recent Customers</h2>
<span className="px-2 py-0.5 bg-surface-container-highest rounded text-[10px] font-black uppercase text-on-surface-variant">Live View</span>
</div>
<div className="flex items-center space-x-4">
<button className="flex items-center space-x-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
<span className="material-symbols-outlined text-sm" data-icon="filter_list">filter_list</span>
<span>Filters</span>
</button>
<div className="h-4 w-[1px] bg-outline-variant/50"></div>
<div className="flex items-center space-x-1 text-xs text-on-surface-variant">
<span>Sorted by</span>
<span className="font-bold text-on-surface">Spends (High to Low)</span>
<span className="material-symbols-outlined text-sm" data-icon="keyboard_arrow_down">keyboard_arrow_down</span>
</div>
</div>
</div>
{/* Precision Data Table */}
<div className="overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="text-on-surface-variant text-xs uppercase tracking-widest font-bold border-b border-surface-container-low">
<th className="px-8 py-5">Customer</th>
<th className="px-6 py-5">Contact Details</th>
<th className="px-6 py-5 text-center">Transactions</th>
<th className="px-6 py-5 text-right">Total Spent</th>
<th className="px-6 py-5">Status</th>
<th className="px-8 py-5"></th>
</tr>
</thead>
<tbody className="font-body text-sm">
{/* Row 1 */}
<tr className="group hover:bg-surface-container-low transition-colors cursor-pointer">
<td className="px-8 py-5">
<div className="flex items-center space-x-4">
<div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-primary font-bold text-lg">JS</div>
<div>
<div className="font-bold text-on-surface">Julianne Smith</div>
<div className="text-xs text-on-surface-variant">ID: CUST-84920</div>
</div>
</div>
</td>
<td className="px-6 py-5">
<div className="text-on-surface">julianne.s@designcorp.com</div>
<div className="text-xs text-on-surface-variant">+1 (555) 012-3456</div>
</td>
<td className="px-6 py-5 text-center">
<span className="font-bold">24</span>
</td>
<td className="px-6 py-5 text-right">
<span className="font-black font-headline text-on-surface">$12,450.00</span>
</td>
<td className="px-6 py-5">
<span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase bg-tertiary-container/10 text-on-tertiary-fixed-variant border border-tertiary-container/20">
                                            Premium
                                        </span>
</td>
<td className="px-8 py-5 text-right">
<button className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100">
<span className="material-symbols-outlined" data-icon="more_vert">more_vert</span>
</button>
</td>
</tr>
{/* Row 2 */}
<tr className="group hover:bg-surface-container-low transition-colors cursor-pointer">
<td className="px-8 py-5">
<div className="flex items-center space-x-4">
<img alt="Customer Profile" className="w-10 h-10 rounded-lg object-cover" data-alt="portrait of a middle-aged male executive in a grey suit against a blurred architectural background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtBe3mGQaoA9ei7hu5tOSZen6jopNcGcWkaNZZAC15iX3Nv0DkvbGDJvDHoOsj46IDys8e5p-TA6104gaB9DtR1tMBruLHWKv4CPdvpS4x_xv0KxDZvPAcz49mhTNbk28p5o9KauQwKnJw4fpyhFytddwhd-_VqUTYG3LevFUYWmeYp-LjP52daVMLKE2hPjU7SfmzF07sODFAaI8AnOMbU97rpW9GJCYSvkKc18Oe7WBKTGDG-B2PoOuuDq26QZtRqa95Ul_rVco"/>
<div>
<div className="font-bold text-on-surface">Marcus Holloway</div>
<div className="text-xs text-on-surface-variant">ID: CUST-77211</div>
</div>
</div>
</td>
<td className="px-6 py-5">
<div className="text-on-surface">m.holloway@techvault.io</div>
<div className="text-xs text-on-surface-variant">+44 20 7946 0123</div>
</td>
<td className="px-6 py-5 text-center">
<span className="font-bold">8</span>
</td>
<td className="px-6 py-5 text-right">
<span className="font-black font-headline text-on-surface">$3,820.50</span>
</td>
<td className="px-6 py-5">
<span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase bg-secondary-container/20 text-on-secondary-container border border-secondary-container/40">
                                            Active
                                        </span>
</td>
<td className="px-8 py-5 text-right">
<button className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100">
<span className="material-symbols-outlined" data-icon="more_vert">more_vert</span>
</button>
</td>
</tr>
{/* Row 3 */}
<tr className="group hover:bg-surface-container-low transition-colors cursor-pointer">
<td className="px-8 py-5">
<div className="flex items-center space-x-4">
<div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-lg">EB</div>
<div>
<div className="font-bold text-on-surface">Eleanor Bennett</div>
<div className="text-xs text-on-surface-variant">ID: CUST-90123</div>
</div>
</div>
</td>
<td className="px-6 py-5">
<div className="text-on-surface">bennett.e@freelance.net</div>
<div className="text-xs text-on-surface-variant">+1 (555) 444-9988</div>
</td>
<td className="px-6 py-5 text-center">
<span className="font-bold">42</span>
</td>
<td className="px-6 py-5 text-right">
<span className="font-black font-headline text-on-surface">$28,115.00</span>
</td>
<td className="px-6 py-5">
<span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase bg-tertiary-container/10 text-on-tertiary-fixed-variant border border-tertiary-container/20">
                                            Premium
                                        </span>
</td>
<td className="px-8 py-5 text-right">
<button className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100">
<span className="material-symbols-outlined" data-icon="more_vert">more_vert</span>
</button>
</td>
</tr>
{/* Row 4 */}
<tr className="group hover:bg-surface-container-low transition-colors cursor-pointer">
<td className="px-8 py-5">
<div className="flex items-center space-x-4">
<img alt="Customer Profile" className="w-10 h-10 rounded-lg object-cover" data-alt="close-up portrait of a young woman with a calm expression in professional attire with soft natural lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtFagNbiIdQUVsa-h7hGInYKhzCBcnAdWZS99sXXODBLgBXBD3edztqWYnyawFIXzHk2APXHr-GClwkZNnZELQpDAy4NlHIYr8kZwaIcq089lgSehlRw-9c8LpRUcHsr0s-oXxZz2RnJ2E6SPKYBZPADwFMrxxD-ZMx5kpGWDJjJ91G-V_jsT-7q5EBx4j7es6DaJX4yjbDykGim4igkYMM-2O2GTHdWd6bFDOfEOHMf9M6nHvXJDW-KLBr5HMo3P80vLgS4xiw1k"/>
<div>
<div className="font-bold text-on-surface">Sarah Zhang</div>
<div className="text-xs text-on-surface-variant">ID: CUST-65432</div>
</div>
</div>
</td>
<td className="px-6 py-5">
<div className="text-on-surface">sarah.zhang@globalfoundry.com</div>
<div className="text-xs text-on-surface-variant">+86 21 6123 4567</div>
</td>
<td className="px-6 py-5 text-center">
<span className="font-bold">3</span>
</td>
<td className="px-6 py-5 text-right">
<span className="font-black font-headline text-on-surface">$940.00</span>
</td>
<td className="px-6 py-5">
<span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase bg-error-container/20 text-on-error-container border border-error-container/40">
                                            At Risk
                                        </span>
</td>
<td className="px-8 py-5 text-right">
<button className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100">
<span className="material-symbols-outlined" data-icon="more_vert">more_vert</span>
</button>
</td>
</tr>
{/* Row 5 */}
<tr className="group hover:bg-surface-container-low transition-colors cursor-pointer">
<td className="px-8 py-5">
<div className="flex items-center space-x-4">
<div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg">DM</div>
<div>
<div className="font-bold text-on-surface">David Miller</div>
<div className="text-xs text-on-surface-variant">ID: CUST-11200</div>
</div>
</div>
</td>
<td className="px-6 py-5">
<div className="text-on-surface">dmiller@quickpay.com</div>
<div className="text-xs text-on-surface-variant">+1 (555) 909-8811</div>
</td>
<td className="px-6 py-5 text-center">
<span className="font-bold">12</span>
</td>
<td className="px-6 py-5 text-right">
<span className="font-black font-headline text-on-surface">$6,700.25</span>
</td>
<td className="px-6 py-5">
<span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase bg-secondary-container/20 text-on-secondary-container border border-secondary-container/40">
                                            Active
                                        </span>
</td>
<td className="px-8 py-5 text-right">
<button className="p-2 text-on-surface-variant hover:text-primary rounded-lg hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100">
<span className="material-symbols-outlined" data-icon="more_vert">more_vert</span>
</button>
</td>
</tr>
</tbody>
</table>
</div>
{/* Pagination */}
<div className="p-6 border-t border-surface-container flex items-center justify-between">
<span className="text-xs text-on-surface-variant font-medium">Showing <span className="text-on-surface font-bold">1-10</span> of 1,284 customers</span>
<div className="flex items-center space-x-2">
<button className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors">
<span className="material-symbols-outlined text-sm" data-icon="chevron_left">chevron_left</span>
</button>
<div className="flex items-center px-3 space-x-4">
<span className="text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-lg">1</span>
<span className="text-xs font-medium text-on-surface-variant hover:text-primary cursor-pointer">2</span>
<span className="text-xs font-medium text-on-surface-variant hover:text-primary cursor-pointer">3</span>
<span className="text-xs font-medium text-on-surface-variant">...</span>
<span className="text-xs font-medium text-on-surface-variant hover:text-primary cursor-pointer">128</span>
</div>
<button className="p-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors">
<span className="material-symbols-outlined text-sm" data-icon="chevron_right">chevron_right</span>
</button>
</div>
</div>
</div>
</div>
</div>
</main>
{/* Contextual FAB (Hidden as per hierarchy on details/list pages, but user requested modern clean view, so we omit unless necessary for specific action) */}

        </React.Fragment>
    );
}
