import { useState } from "react";
import { useI18n } from "../../i18n";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  danger = true,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-ink-600">{description}</p>
      <p className="mt-1 text-sm text-ink-400">{t.common.cannotUndo}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {t.common.cancel}
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={handleConfirm} loading={loading}>
          {t.common.confirm}
        </Button>
      </div>
    </Modal>
  );
}
