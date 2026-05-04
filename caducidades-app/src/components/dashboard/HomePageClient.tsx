'use client';

import { useState, useEffect } from 'react';
import AppBar from '@/components/layout/AppBar';
import TiendaCard from '@/components/tiendas/TiendaCard';
import CaducadosModal from '@/components/caducados/CaducadosModal';
import BackupModal from '@/components/backup/BackupModal';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { TIENDAS, type TiendaKey } from '@/types/product';
import type { Product } from '@/types/product';

export default function HomePageClient() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toasts, addToast, removeToast } = useToast();

  const [dismissedCaducados, setDismissedCaducados] = useState(false);
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
    // Refrescar datos para que el modal desaparezca
    fetchProducts();
    setDismissedCaducados(true);
    addToast(`${caducadosHoy.length} productos marcados como CADUCADO`);
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2">
            Caducidades
          </h1>
          <p className="text-[#64748B]">
            Selecciona una tienda para ver los productos
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-6">
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
      </main>
      <CaducadosModal
        productos={caducadosHoy}
        onAccept={handleCaducadosAccept}
        onDismiss={() => setDismissedCaducados(true)}
      />
      <BackupModal open={showBackup} onClose={handleBackupClose} />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
