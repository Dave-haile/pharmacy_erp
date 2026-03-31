import React from "react";
import {
    Clipboard,
    Copy,
    Download,
    MoreVertical,
    Printer,
    Share2,
    Trash2,
} from "lucide-react";

interface ActionsMenuProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    onDuplicate?: () => void;
    onCopyToClipboard?: () => void;
    onPrint?: () => void;
    onShare?: () => void;
    onExport?: () => void;
    onDelete?: () => void;
    deleteLabel?: string;
}

const ActionsMenu: React.FC<ActionsMenuProps> = ({
    isOpen,
    onToggle,
    onClose,
    onDuplicate,
    onCopyToClipboard,
    onPrint,
    onShare,
    onExport,
    onDelete,
    deleteLabel = "Delete",
}) => {
    const hasPrimaryActions = Boolean(
        onDuplicate || onCopyToClipboard || onPrint || onShare || onExport,
    );

    return (
        <div className="relative">
            <button
                type="button"
                onClick={onToggle}
                className={`rounded-xl border p-2.5 transition-all ${isOpen
                        ? "border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        : "border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
            >
                <MoreVertical className="h-4 w-4" />
            </button>

            {isOpen && (
                <>
                    <div onClick={onClose} className="fixed inset-0 z-40" />
                    <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <div className="space-y-1 p-2">
                            {onDuplicate && (
                                <button
                                    type="button"
                                    onClick={onDuplicate}
                                    className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Copy className="h-4 w-4 text-slate-400" />
                                    <span>Duplicate</span>
                                </button>
                            )}
                            {onCopyToClipboard && (
                                <button
                                    type="button"
                                    onClick={onCopyToClipboard}
                                    className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Clipboard className="h-4 w-4 text-slate-400" />
                                    <span>Copy to Clipboard</span>
                                </button>
                            )}
                            {onPrint && (
                                <button
                                    type="button"
                                    onClick={onPrint}
                                    className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Printer className="h-4 w-4 text-slate-400" />
                                    <span>Print</span>
                                </button>
                            )}
                            {hasPrimaryActions && onDelete && (
                                <div className="mx-2 my-1 h-px bg-slate-100 dark:bg-slate-800" />
                            )}
                            {onShare && (
                                <button
                                    type="button"
                                    onClick={onShare}
                                    className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Share2 className="h-4 w-4 text-slate-400" />
                                    <span>Share Record</span>
                                </button>
                            )}
                            {onExport && (
                                <button
                                    type="button"
                                    onClick={onExport}
                                    className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Download className="h-4 w-4 text-slate-400" />
                                    <span>Export</span>
                                </button>
                            )}
                            {onDelete && (
                                <>
                                    <button
                                        type="button"
                                        onClick={onDelete}
                                        className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left text-xs font-bold text-rose-600 transition-all hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                                    >
                                        <Trash2 className="h-4 w-4 text-rose-500" />
                                        <span>{deleteLabel}</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ActionsMenu;
