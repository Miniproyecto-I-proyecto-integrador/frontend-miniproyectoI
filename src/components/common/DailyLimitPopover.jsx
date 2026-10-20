import { useState, useEffect, useCallback } from 'react';
import { Settings, X, Info, XCircle } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import SuccessModal from './SuccessModal';
import DailyLimitConflictModal from './DailyLimitConflictModal';
import {
  applyDailyLimitChange,
  getDailyLimit,
  previewDailyLimitChange,
} from '../../api/eventServices';
import { getToday } from '../../utils/hoy';

export default function DailyLimitPopover({ isOpen, onClose }) {
  const [limit, setLimit] = useState('6');
  const [savedLimit, setSavedLimit] = useState('6');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [conflictReport, setConflictReport] = useState(null);
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [workflowError, setWorkflowError] = useState('');

  const loadLimit = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDailyLimit(getToday());
      if (data?.daily_hours_limit === undefined) {
        throw new Error('La respuesta no contiene un límite diario válido.');
      }
      const current = String(data.daily_hours_limit);
      setLimit(current);
      setSavedLimit(current);
      setStatus({ type: 'idle', message: '' });
    } catch {
      setStatus({
        type: 'error',
        message: 'No pudimos cargar el límite diario. Verifica tu conexión e inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    Promise.resolve()
      .then(() => {
        if (active) setLoading(true);
        return getDailyLimit(getToday());
      })
      .then((data) => {
        if (!active) return;
        if (data?.daily_hours_limit === undefined) {
          throw new Error('La respuesta no contiene un límite diario válido.');
        }
        const current = String(data.daily_hours_limit);
        setLimit(current);
        setSavedLimit(current);
        setStatus({ type: 'idle', message: '' });
      })
      .catch(() => {
        if (active) {
          setStatus({
            type: 'error',
            message: 'No pudimos cargar el límite diario. Verifica tu conexión e inténtalo de nuevo.',
          });
        }
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

    const todayStr = getToday();

    try {
      const result = await previewDailyLimitChange(numValue, todayStr);

      if (result?.has_conflicts && result.overloaded_days?.length) {
        setConflictReport({
          ...result,
          previous_limit: Number(savedLimit),
          today: todayStr,
        });
        setWorkflowError('');
        onClose();
        return;
      }

      await applyDailyLimitChange(numValue, todayStr, []);
      setSavedLimit(String(numValue));
      window.dispatchEvent(new Event('daily-limit-updated'));
      window.dispatchEvent(new Event('tasks-updated'));
      onClose();
      setShowSuccessModal(true);
    } catch (error) {
      if (error?.fields?.overloaded_days?.length) {
        try {
          const refreshed = await previewDailyLimitChange(numValue, todayStr);
          if (refreshed?.has_conflicts && refreshed.overloaded_days?.length) {
            setConflictReport({
              ...refreshed,
              previous_limit: Number(savedLimit),
              today: todayStr,
            });
            onClose();
            return;
          }
        } catch {
          // The original save error below remains visible with a retry action.
        }
      }
      setStatus({
        type: 'error',
        message: 'No pudimos guardar el límite diario. Verifica tu conexión e inténtalo de nuevo.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyChanges = async (changes) => {
    if (!conflictReport) return;
    setWorkflowSaving(true);
    setWorkflowError('');
    try {
      await applyDailyLimitChange(
        conflictReport.daily_hours_limit,
        conflictReport.today,
        changes,
      );
      setLimit(String(conflictReport.daily_hours_limit));
      setSavedLimit(String(conflictReport.daily_hours_limit));
      setConflictReport(null);
      window.dispatchEvent(new Event('daily-limit-updated'));
      window.dispatchEvent(new Event('tasks-updated'));
      setShowSuccessModal(true);
    } catch (error) {
      if (error?.fields?.overloaded_days) {
        try {
          const refreshed = await previewDailyLimitChange(
            conflictReport.daily_hours_limit,
            conflictReport.today,
          );
          setConflictReport({
            ...refreshed,
            previous_limit: conflictReport.previous_limit,
            today: conflictReport.today,
          });
        } catch {
          setWorkflowError(
            'Los datos cambiaron y no se pudieron actualizar los conflictos. Reintenta para volver a verificarlos.',
          );
          return false;
        }
        setWorkflowError(
          'El plan cambió desde la última revisión. Revisa el conflicto actualizado y vuelve a aplicar los cambios.',
        );
        return false;
      }
      const validationMessage = Object.values(error?.fields || {})
        .flat()
        .find((value) => typeof value === 'string');
      setWorkflowError(
        validationMessage ||
          (error?.status
            ? error.message
            : 'No pudimos conectar con el servidor. No se guardó el límite ni se modificaron las gestiones.'),
      );
      return false;
    } finally {
      setWorkflowSaving(false);
    }
    return true;
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
                <span>
                  {status.message}{' '}
                  <button type="button" onClick={() => void loadLimit()}>
                    Reintentar
                  </button>
                </span>
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
              disabled={loading || saving || status.type === 'error'}
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
          previousLimit={conflictReport.previous_limit}
          limit={conflictReport.daily_hours_limit}
          overloadedDays={conflictReport.overloaded_days}
          dailyLoads={conflictReport.daily_loads}
          today={conflictReport.today}
          saving={workflowSaving}
          error={workflowError}
          onCancel={() => {
            if (!workflowSaving) setConflictReport(null);
          }}
          onSave={handleApplyChanges}
        />
      )}
    </>
  );
}