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

export interface ActionMenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
  dividerBefore?: boolean;
}

export interface ActionMenuDefaultActions {
  onDuplicate?: () => void;
  onCopyToClipboard?: () => void;
  onPrint?: () => void;
  onShareRecord?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
}

export const buildDefaultActionMenuItems = ({
  onDuplicate,
  onCopyToClipboard,
  onPrint,
  onShareRecord,
  onExport,
  onDelete,
  deleteLabel = "Delete",
}: ActionMenuDefaultActions): ActionMenuItem[] => [
  ...(onDuplicate
    ? [
        {
          key: "duplicate",
          label: "Duplicate",
          icon: <Copy className="h-4 w-4" />,
          onClick: onDuplicate,
        },
      ]
    : []),
  ...(onCopyToClipboard
    ? [
        {
          key: "copy-to-clipboard",
          label: "Copy to Clipboard",
          icon: <Clipboard className="h-4 w-4" />,
          onClick: onCopyToClipboard,
        },
      ]
    : []),
  ...(onPrint
    ? [
        {
          key: "print",
          label: "Print",
          icon: <Printer className="h-4 w-4" />,
          onClick: onPrint,
        },
      ]
    : []),
  ...(onShareRecord
    ? [
        {
          key: "share-record",
          label: "Share Record",
          icon: <Share2 className="h-4 w-4" />,
          onClick: onShareRecord,
        },
      ]
    : []),
  ...(onExport
    ? [
        {
          key: "export",
          label: "Export",
          icon: <Download className="h-4 w-4" />,
          onClick: onExport,
        },
      ]
    : []),
  ...(onDelete
    ? [
        {
          key: "delete",
          label: deleteLabel,
          icon: <Trash2 className="h-4 w-4" />,
          onClick: onDelete,
          tone: "danger" as const,
          dividerBefore: Boolean(
            onDuplicate ||
              onCopyToClipboard ||
              onPrint ||
              onShareRecord ||
              onExport,
          ),
        },
      ]
    : []),
];

interface ActionMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  items?: ActionMenuItem[];
  defaultActions?: ActionMenuDefaultActions;
  align?: "left" | "right";
  widthClassName?: string;
}

const ActionMenu: React.FC<ActionMenuProps> = ({
  isOpen,
  onToggle,
  onClose,
  items = [],
  defaultActions,
  align = "right",
  widthClassName = "w-64",
}) => {
  const visibleItems = [
    ...buildDefaultActionMenuItems(defaultActions ?? {}),
    ...items,
  ].filter(Boolean);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`rounded-xl border p-2.5 transition-all ${
          isOpen
            ? "border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            : "border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
        }`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {isOpen ? (
        <>
          <div onClick={onClose} className="fixed inset-0 z-40" />
          <div
            className={`absolute z-50 mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 ${widthClassName} ${
              align === "left" ? "left-0" : "right-0"
            }`}
          >
            <div className="space-y-1 p-2">
              {visibleItems.map((item) => (
                <React.Fragment key={item.key}>
                  {item.dividerBefore ? (
                    <div className="mx-2 my-1 h-px bg-slate-100 dark:bg-slate-800" />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      item.onClick();
                      onClose();
                    }}
                    className={`flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-left text-xs font-bold transition-all ${
                      item.tone === "danger"
                        ? "text-rose-600 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span
                      className={
                        item.tone === "danger"
                          ? "text-rose-500"
                          : "text-slate-400"
                      }
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ActionMenu;
