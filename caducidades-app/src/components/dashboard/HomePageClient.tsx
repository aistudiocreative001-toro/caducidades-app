'use client';

import { useState, useEffect } from 'react';
import AppBar from '@/components/layout/AppBar';
import TiendaCard from '@/components/tiendas/TiendaCard';
import CaducadosModal from '@/components/caducados/CaducadosModal';
import BackupModal from '@/components/backup/BackupModal';
import RankingPodio from './RankingPodio';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { usePersistentHistory } from '@/hooks/useHistory';
import { TIENDAS, type TiendaKey } from '@/types/product';
import type { Product } from '@/types/product';

export default function HomePageClient() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();
  const { addToHistory } = usePersistentHistory();

  const [dismissedCaducados, setDismissedCaducados] = useState(false);
  const [caducadosResueltos, setCaducadosResueltos] = useState(0);
  const [showBackup, setShowBackup] = useState(false);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const data = await res.json();
      setProductos(Array.isArray(data) ? data : []);
    } catch {
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Trigger backup when products are loaded
  useEffect(() => {
    if (!loading && productos.length > 0) {
      const hasSeenBackup = sessionStorage.getItem('cadfz_backup_seen');
      if (!hasSeenBackup) {
        setShowBackup(true);
        fetch('/api/products/backup', { method: 'POST', cache: 'no-store' })
          .then(r => r.json())
          .then(d => console.log('[BACKUP]', d))
          .catch(e => console.error('[BACKUP]', e));
      }
    }
  }, [loading, productos.length]);

  const handleBackupClose = () => {
    setShowBackup(false);
    sessionStorage.setItem('cadfz_backup_seen', 'true');
  };

  const hoy = new Date().toISOString().split('T')[0];
  const estadosFijos = ['ROTO', 'VENDIDO', 'VENDIDO CADUCADO', 'REGALO CADUCADO', 'MOVIDO'];
  
  // Productos cuya fecha ya pasó pero NO están marcados como CADUCADO y tienen stock
  const caducadosHoy = productos.filter(p => {
    const fechaValida = p.fecha && p.fecha !== '' && p.fecha !== '#N/A';
    const yaCaducado = p.estado?.toUpperCase() === 'CADUCADO';
    const estadoFinal = estadosFijos.includes(p.estado?.toUpperCase() || '');
    return fechaValida && p.fecha < hoy && !yaCaducado && !estadoFinal && p.uds > 0;
  });

  const handleCaducadosAccept = () => {
    fetchProducts();
    setDismissedCaducados(true);
    if (caducadosResueltos > 0) {
      addToast(`${caducadosResueltos} producto${caducadosResueltos > 1 ? 's' : ''} resuelto${caducadosResueltos > 1 ? 's' : ''}`);
    } else {
      addToast('Sin acciones realizadas');
    }
    setCaducadosResueltos(0);
  };

  if (loading) {
    return (
      <div className="min-h-full flex flex-col">
        <AppBar showAdmin={true} />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full text-center text-[#64748B]">
          Cargando productos...
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      <AppBar showAdmin={true} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">
            Caducidades
          </h1>
          <p className="text-[#64748B]">
            Selecciona una tienda para ver los productos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-start gap-4 mb-6">
          {TIENDAS.map((tienda) => (
            <TiendaCard
              key={tienda.key}
              tiendaKey={tienda.key as TiendaKey}
              nombre={tienda.nombre}
              color={tienda.color}
              productos={productos.filter(p => p.ubi === tienda.key)}
            />
          ))}
        </div>

        <RankingPodio productos={productos} />

        <div className="mt-6 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-[#1565C0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-base font-bold text-[#0F172A]">¿Cómo se calcula el ranking?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <h3 className="font-semibold text-[#0F172A]">Métricas del ranking</h3>
              <ul className="space-y-2 text-[#64748B]">
                <li className="flex items-start gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#059669] mt-1.5 shrink-0" />
                  <span><strong className="text-[#0F172A]">Uds activas:</strong> Productos con fecha vigente y estado abierto. Cuanto más stock activo, mejor puntuación.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#DC2626] mt-1.5 shrink-0" />
                  <span><strong className="text-[#0F172A]">Crítico (&lt;10 días):</strong> Productos a punto de caducar. Restan puntos porque representan pérdida inminente.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#EA580C] mt-1.5 shrink-0" />
                  <span><strong className="text-[#0F172A]">Urgente (10-30 días):</strong> Productos con poco margen. También restan, aunque menos que los críticos.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#D97706] mt-1.5 shrink-0" />
                  <span><strong className="text-[#0F172A]">Prioritario (30-60 días):</strong> Deben planificarse promociones o movimientos antes de que entren en urgencia.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-[#0F172A]">¿Cómo mejorar la puntuación?</h3>
              <ul className="space-y-2 text-[#64748B]">
                <li className="flex items-start gap-2">
                  <span className="text-[#1565C0] font-bold mt-0.5">1.</span>
                  <span><strong className="text-[#0F172A]">Mover críticos:</strong> Desde la vista de tienda, mueve productos &lt;10 días al almacén o a otra tienda con más rotación.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1565C0] font-bold mt-0.5">2.</span>
                  <span><strong className="text-[#0F172A]">Promocionar urgentes:</strong> Marca productos 10-30 días como "VENDIDO" o aplícalos como REGALO CADUCADO para evitar pérdida total.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1565C0] font-bold mt-0.5">3.</span>
                  <span><strong className="text-[#0F172A]">Rotar prioritarios:</strong> Productos 30-60 días deben ir a mostrador o promociones para acelerar salida.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1565C0] font-bold mt-0.5">4.</span>
                  <span><strong className="text-[#0F172A]">Revisar semanalmente:</strong> Entra cada lunes a "Caducados a fecha" en Administración y resuelve antes de que pasen a crítico.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <CaducadosModal
        productos={caducadosHoy}
        onAccept={handleCaducadosAccept}
        onDismiss={() => setDismissedCaducados(true)}
        onResolve={(p, estado) => {
          setCaducadosResueltos(c => c + 1);
          const after = { ...p, estado };
          addToHistory(`CADUCADOS: ${estado}`, p, after);
        }}
      />
      <BackupModal open={showBackup} onClose={handleBackupClose} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
