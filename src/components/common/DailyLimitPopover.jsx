import { useState, useEffect } from 'react';
import { Settings, X, Info, XCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import SuccessModal from './SuccessModal';
import DailyLimitConflictModal from './DailyLimitConflictModal';
import { getDailyLimit, updateDailyLimit } from '../../api/eventServices';
import { getToday } from '../../utils/hoy';

export default function DailyLimitPopover({ isOpen, onClose }) {
  const [limit, setLimit] = useState('6');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [conflictReport, setConflictReport] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    let active = true;
    getDailyLimit(getToday())
      .then((data) => {
        if (active && data?.daily_hours_limit !== undefined) {
          setLimit(String(data.daily_hours_limit));
        }
      })
      .catch(() => {
        if (active) setLimit('6');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen]);

  const handleSave = async (e) => {
    e.preventDefault();
    const normalizedLimit = limit.trim().replace(',', '.');
    const numValue = Number(normalizedLimit);

    if (!normalizedLimit || !Number.isFinite(numValue) || numValue < 1 || numValue > 16) {
      setStatus({
        type: 'error',
        message: 'El valor debe ser un entero entre 1 y 16 horas.',
      });
      return;
    }

    if (!limit.includes(',') && !Number.isInteger(numValue)) {
      setStatus({
        type: 'error',
        message: 'El valor debe ser un entero entre 1 y 16 horas.',
      });
      return;
    }

    setSaving(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const todayStr = getToday();
      const result = await updateDailyLimit(numValue, todayStr);
      window.dispatchEvent(new Event('daily-limit-updated'));
      onClose();

      if (result?.has_conflicts && result.overloaded_days?.length) {
        setConflictReport(result);
      } else {
        setShowSuccessModal(true);
      }
    } catch (err) {
      const fieldError = err?.fields?.daily_hours_limit;
      const backendMessage = Array.isArray(fieldError)
        ? String(fieldError[0])
        : fieldError;
      setStatus({
        type: 'error',
        message: backendMessage || err?.message || 'Ocurrió un error al guardar el límite',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="daily-limit-popover">
          <div className="popover-header">
            <div className="popover-title">
              <Settings size={18} />
              <span>Límite diario</span>
            </div>
            <button
              type="button"
              className="popover-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSave} className="popover-body" noValidate>
            <div className="input-wrapper">
              <input
                type="text"
                inputMode="numeric"
                value={limit}
                onChange={(e) => {
                  setLimit(e.target.value);
                  if (status.type !== 'idle') setStatus({ type: 'idle', message: '' });
                }}
                disabled={loading || saving}
              />
            </div>

            {loading ? (
              <div className="popover-status loading">
                <LoadingSpinner />
              </div>
            ) : status.type === 'error' ? (
              <div className="popover-status error">
                <XCircle size={16} />
                <span>{status.message}</span>
              </div>
            ) : (
              <div className="popover-status info">
                <Info size={16} />
                <span>Nº de horas por dia</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-save-limit"
              disabled={loading || saving}
            >
              {saving ? <LoadingSpinner /> : 'Guardar'}
            </button>
          </form>
        </div>
      )}

      {/* Modal de éxito: enviamos la función a onClose, onConfirm y onClick por compatibilidad */}
      {showSuccessModal && (
        <SuccessModal
          title="Límite diario actualizado"
          message="El límite diario de horas se guardó correctamente."
          actionLabel="Aceptar"
          onAccept={() => setShowSuccessModal(false)}
        />
      )}
      {conflictReport && (
        <DailyLimitConflictModal
          limit={conflictReport.daily_hours_limit}
          overloadedDays={conflictReport.overloaded_days}
          onAccept={() => setConflictReport(null)}
        />
      )}
    </>
  );
}