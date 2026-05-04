'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, CloudDownload, Database, Calendar, Lock } from 'lucide-react';

interface BackupItem {
  url: string;
  pathname: string;
  uploadedAt: string;
  size: number;
}

interface RestoreModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RestoreModal({ open, onClose, onSuccess }: RestoreModalProps) {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const loadBackups = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products/backups', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setBackups(data.backups || []);
      else setBackups([]);
    } catch {
      setBackups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadBackups();
      setSelectedBackup(null);
      setPassword('');
      setError('');
    }
  }, [open]);

  const handleRestore = async () => {
    if (!selectedBackup) return;
    if (password !== 'admin') {
      setError('Contraseña incorrecta');
      return;
    }
    setRestoring(true);
    try {
      const res = await fetch('/api/products/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: selectedBackup.url, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al restaurar');
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Error al restaurar');
    } finally {
      setRestoring(false);
    }
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const fmtSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center">
                  <Database className="w-5 h-5 text-[#1565C0]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">Restablecer cambios</h2>
                  <p className="text-sm text-[#64748B]">Elige una copia de seguridad para restaurar</p>
                </div>
              </div>
              <button onClick={onClose} className="text-[#64748B] hover:text-[#0F172A]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="text-center text-[#64748B] py-8">Cargando copias...</div>
              ) : backups.length === 0 ? (
                <div className="text-center text-[#64748B] py-8">No hay copias de seguridad disponibles</div>
              ) : (
                <div className="space-y-2">
                  {backups.map((b, idx) => (
                    <div
                      key={b.pathname}
                      onClick={() => {
                        setSelectedBackup(b);
                        setError('');
                        setPassword('');
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedBackup?.pathname === b.pathname
                          ? 'border-[#1565C0] bg-[#F0F9FF]'
                          : 'border-[#E2E8F0] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center shrink-0 text-xs font-bold text-[#64748B]">
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] truncate">{b.pathname}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-[#64748B]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {fmtDate(b.uploadedAt)}
                          </span>
                          <span>{fmtSize(b.size)}</span>
                        </div>
                      </div>
                      {selectedBackup?.pathname === b.pathname && (
                        <CloudDownload className="w-5 h-5 text-[#1565C0] shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Password section */}
              <AnimatePresence>
                {selectedBackup && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-4 bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl space-y-3">
                      <p className="text-sm font-bold text-[#DC2626] flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Confirmar restauración
                      </p>
                      <p className="text-xs text-[#991B1B]">
                        Se sobrescribirán todos los datos actuales con la copia seleccionada ({selectedBackup.pathname}). Introduce la contraseña para continuar.
                      </p>
                      <input
                        type="password"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(''); }}
                        placeholder="Contraseña..."
                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#DC2626]"
                      />
                      {error && <p className="text-xs text-[#DC2626]">{error}</p>}
                      <button
                        onClick={handleRestore}
                        disabled={restoring}
                        className="w-full px-4 py-2 bg-[#DC2626] text-white rounded-lg text-sm font-medium hover:bg-[#B91C1C] disabled:opacity-50"
                      >
                        {restoring ? 'Restaurando...' : '🔄 Restaurar esta copia'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
