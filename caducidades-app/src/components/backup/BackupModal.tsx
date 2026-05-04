'use client';

import { useState, useEffect } from 'react';
import { CloudUpload, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BackupModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BackupModal({ open, onClose }: BackupModalProps) {
  const [status, setStatus] = useState<'loading' | 'success'>('loading');

  useEffect(() => {
    if (!open) {
      setStatus('loading');
      return;
    }

    const timer = setTimeout(() => {
      setStatus('success');
      const closeTimer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(closeTimer);
    }, 2500);

    return () => clearTimeout(timer);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl px-8 py-10 flex flex-col items-center max-w-sm w-full"
          >
            {status === 'loading' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-[#DBEAFE] flex items-center justify-center mb-4">
                  <CloudUpload className="w-8 h-8 text-[#1565C0] animate-bounce" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-2">Copia de seguridad</h3>
                <p className="text-sm text-[#64748B] text-center mb-4">Creando copia de seguridad automática de tus productos...</p>
                <div className="w-full h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#1565C0] rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.5, ease: 'easeInOut' }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-[#059669]" />
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-1">¡Copia creada!</h3>
                <p className="text-sm text-[#64748B] text-center">Copia de seguridad creada correctamente.</p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
