import React from "react";

import ActionMenu from "../../components/ActionMenu";

interface StockEntryActionsMenuProps {
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

const StockEntryActionsMenu: React.FC<StockEntryActionsMenuProps> = ({
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
  return (
    <ActionMenu
      isOpen={isOpen}
      onToggle={onToggle}
      onClose={onClose}
      defaultActions={{
        onDuplicate,
        onCopyToClipboard,
        onPrint,
        onShareRecord: onShare,
        onExport,
        onDelete,
        deleteLabel,
      }}
    />
  );
};

export default StockEntryActionsMenu;
