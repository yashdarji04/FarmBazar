import { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  // dialog: { title, message, confirmLabel, cancelLabel, type, resolve }

  const confirm = useCallback(({ title = 'Are you sure?', message = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel', type = 'danger' } = {}) => {
    return new Promise((resolve) => {
      setDialog({ title, message, confirmLabel, cancelLabel, type, resolve });
    });
  }, []);

  const handleConfirm = () => {
    dialog?.resolve(true);
    setDialog(null);
  };

  const handleCancel = () => {
    dialog?.resolve(false);
    setDialog(null);
  };

  const typeStyles = {
    danger:  { icon: 'pi-exclamation-triangle', iconBg: 'bg-red-100',    iconColor: 'text-red-500',    btn: 'bg-red-500 hover:bg-red-600 text-white' },
    warning: { icon: 'pi-info-circle',          iconBg: 'bg-amber-100',  iconColor: 'text-amber-500',  btn: 'bg-amber-500 hover:bg-amber-600 text-white' },
    success: { icon: 'pi-check-circle',         iconBg: 'bg-green-100',  iconColor: 'text-green-600',  btn: 'bg-green-600 hover:bg-green-700 text-white' },
    info:    { icon: 'pi-info-circle',          iconBg: 'bg-blue-100',   iconColor: 'text-blue-500',   btn: 'bg-blue-500 hover:bg-blue-600 text-white' },
  };

  const style = typeStyles[dialog?.type] || typeStyles.danger;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {/* Backdrop */}
      {dialog && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={handleCancel}
        >
          {/* Card */}
          <div
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-[fadeInUp_0.25s_ease]"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }}
          >
            {/* Top accent bar */}
            <div className={`h-1.5 w-full ${
              dialog.type === 'danger'  ? 'bg-gradient-to-r from-red-400 to-rose-500' :
              dialog.type === 'warning' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
              dialog.type === 'success' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                          'bg-gradient-to-r from-blue-400 to-sky-500'
            }`} />

            <div className="p-8">
              {/* Icon circle */}
              <div className={`w-16 h-16 rounded-2xl ${style.iconBg} flex items-center justify-center mx-auto mb-5 shadow-sm`}>
                <i className={`pi ${style.icon} text-3xl ${style.iconColor}`} />
              </div>

              {/* Text */}
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2 leading-snug">
                {dialog.title}
              </h3>
              {dialog.message && (
                <p className="text-sm text-gray-500 text-center leading-relaxed mb-7">
                  {dialog.message}
                </p>
              )}
              {!dialog.message && <div className="mb-7" />}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                >
                  {dialog.cancelLabel}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 ${style.btn}`}
                >
                  {dialog.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}
