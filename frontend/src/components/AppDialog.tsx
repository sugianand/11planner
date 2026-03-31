"use client";

type AppDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

export default function AppDialog({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
}: AppDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-2xl dark:border-slate-700/70 dark:bg-slate-900/95">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          {onConfirm ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
                  destructive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-[#306844] hover:bg-[#255236]"
                }`}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#306844] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#255236]"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
