import React, { useState, useEffect } from 'react';
import { Settings, X, Info, XCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import SuccessModal from './SuccessModal';
import { getDailyLimit, updateDailyLimit } from '../../api/eventServices';
import { getToday } from '../../utils/hoy';

export default function DailyLimitPopover({ isOpen, onClose }) {
  const [limit, setLimit] = useState('6');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLimit();
    }
  }, [isOpen]);

  const fetchLimit = async () => {
    setLoading(true);
    setStatus({ type: 'idle', message: '' });
    try {
      const todayStr = getToday();
      const data = await getDailyLimit(todayStr);
      if (data && data.daily_hours_limit !== undefined) {
        setLimit(String(data.daily_hours_limit));
      }
    } catch (err) {
      setLimit('6');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const numValue = Number(limit);

    if (!limit || isNaN(numValue) || numValue < 1 || numValue > 16) {
      setStatus({
        type: 'error',
        message: 'El valor debe estar entre 1 y 16 horas',
      });
      return;
    }

    setSaving(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const todayStr = getToday();
      await updateDailyLimit(numValue, todayStr);
      window.dispatchEvent(new Event('daily-limit-updated'));
      
      // Cierra la ventanita de configuración y abre el modal de confirmación
      onClose();
      setShowSuccessModal(true);
    } catch (err) {
      setStatus({
        type: 'error',
        message: err?.message || 'Ocurrió un error al guardar el límite',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
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
            title="Horas reducidas"
            message="La fecha y las horas de la subtarea se actualizaron correctamente."
            actionLabel="Aceptar"
            onAccept={() => setShowSuccessModal(false)}
        />
      )}
    </>
  );
}