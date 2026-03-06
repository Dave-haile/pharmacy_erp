
import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNameMap: Record<string, string> = {
    'dashboard': 'Dashboard',
    'inventory': 'Inventory',
    'control': 'Stock Control',
    'items': 'Items',
    'batch': 'Batch Details',
    'new': 'New Item',
    'item-grouping': 'Item Grouping',
    'audit-logs': 'Audit Logs',
    'profile': 'Profile Settings',
    'ai-insights': 'AI Risk Analysis',
    'manufacturing': 'Manufacturing',
    'quality': 'Quality Control',
    'sales': 'Sales & Distribution',
};

const Breadcrumbs: React.FC = () => {
    const location = useLocation();
    const params = useParams();
    const pathnames = location.pathname.split('/').filter((x) => x);

    if (pathnames.length === 0 || pathnames[0] === 'login') return null;

    return (
        <div className="sticky top-[53px] z-105 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all">
            <nav className="max-w-6xl mx-auto px-4 md:px-6 py-2.5 flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap">
                <Link
                    to="/dashboard"
                    className="flex items-center hover:text-emerald-500 transition-colors shrink-0"
                >
                    <Home className="w-3 h-3 mr-1.5" />

                </Link>

                {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;

                    // Check if the value is an ID (from params)
                    const isParam = Object.values(params).includes(value);
                    let name = routeNameMap[value] || value.charAt(0).toUpperCase() + value.slice(1);

                    if (isParam) {
                        // Try to give a more descriptive name for IDs based on the previous segment
                        const prevSegment = pathnames[index - 1];
                        if (prevSegment === 'items') name = `Item: ${value}`;
                        else if (prevSegment === 'batch') name = `Batch: ${value}`;
                        else name = value;
                    }

                    return (
                        <React.Fragment key={to}>
                            <ChevronRight className="w-2.5 h-2.5 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                            {last ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-black truncate max-w-[200px]">
                                    {name}
                                </span>
                            ) : (
                                <Link
                                    to={to}
                                    className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors shrink-0"
                                >
                                    {name}
                                </Link>
                            )}
                        </React.Fragment>
                    );
                })}
            </nav>
        </div>
    );
};

export default Breadcrumbs;
