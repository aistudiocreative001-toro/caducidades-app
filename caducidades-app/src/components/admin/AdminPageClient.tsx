'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/app/actions/products';
import AdminKpis from './AdminKpis';
import AdminFilters from './AdminFilters';
import ProductoDrawer from '@/components/productos/ProductoDrawer';
import RestoreModal from '@/components/backup/RestoreModal';
import HistorialSesion from './HistorialSesion';
import { usePersistentHistory } from '@/hooks/useHistory';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { TIENDAS } from '@/types/product';
import type { Product } from '@/types/product';
import { Edit, Trash2, Download, Upload, Plus, AlertCircle, ArrowLeft, RotateCcw, CloudDownload, Truck, Minus, Printer, History, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import Papa from 'papaparse';
import { getEmojiCategoria } from '@/lib/emojis';
import { getEstadoStyle } from '@/lib/estado-colors';
import { generarPDFVentaRecomendada } from '@/lib/pdf';

const isNA = (val: string) => !val || val === '#N/A' || val.trim() === 'N/A' || val.trim() === '';

export default function AdminPageClient() {
  const { data: productos = [], isLoading, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  });

  const { toasts, addToast, removeToast } = useToast();

  const [busqueda, setBusqueda] = useState('');
  const [tienda, setTienda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [estado, setEstado] = useState('');
  const [rangoDias, setRangoDias] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCaducadosHoy, setShowCaducadosHoy] = useState(false);
  const [caducadosSort, setCaducadosSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [tableSort, setTableSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [moverProduct, setMoverProduct] = useState<Product | null>(null);
  const [moverDestinos, setMoverDestinos] = useState<Record<string, number>>({});
  const [resetPass, setResetPass] = useState('');
  const [showHistorial, setShowHistorial] = useState(false);
  const { history, addToHistory, clearHistory } = usePersistentHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete password modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deletePass, setDeletePass] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Dropdown states
  const [showImportExport, setShowImportExport] = useState(false);
  const [showRestoreReset, setShowRestoreReset] = useState(false);
  const importExportRef = useRef<HTMLDivElement>(null);
  const restoreResetRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (importExportRef.current && !importExportRef.current.contains(e.target as Node)) {
        setShowImportExport(false);
      }
      if (restoreResetRef.current && !restoreResetRef.current.contains(e.target as Node)) {
        setShowRestoreReset(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResetDB = async () => {
    try {
      const res = await fetch('/api/products/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      refetch();
      setShowResetModal(false);
      setResetPass('');
      addToast('Base de datos reseteada correctamente');
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Error al resetear', 'error');
    }
  };

  // --- Historial restore helper (uses persistent history) ---
  const handleRestoreHistory = async (item: { fullBefore?: Product | null }) => {
    if (!item.fullBefore) {
      addToast('No hay snapshot anterior para restaurar', 'error');
      return;
    }
    try {
      const res = await fetch('/api/products/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.fullBefore.id, data: item.fullBefore }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      addToast('Producto restaurado al estado anterior');
      refetch();
    } catch (e: any) {
      addToast(e.message || 'Error al restaurar', 'error');
    }
  };
  // --- End Historial helpers ---

  const filtrados = useMemo(() => {
    let res = [...productos];
    if (busqueda.length >= 2) {
      const q = busqueda.toLowerCase();
      res = res.filter(p =>
        p.producto.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        p.marca.toLowerCase().includes(q)
      );
    }
    if (tienda) res = res.filter(p => p.ubi === tienda);
    if (categoria) res = res.filter(p => p.tipo === categoria);
    if (estado) res = res.filter(p => p.estado === estado);
    if (rangoDias) {
      res = res.filter(p => {
        // Solo productos con dias >= 0 (no caducados aun)
        if (p.dias < 0) return false;
        if (rangoDias === 'critico') return p.dias < 10;
        if (rangoDias === 'urgente') return p.dias >= 10 && p.dias < 30;
        if (rangoDias === 'prioritario') return p.dias >= 30 && p.dias < 60;
        return true;
      });
    }
    return res;
  }, [productos, busqueda, tienda, categoria, estado, rangoDias]);

  const filtradosSorted = useMemo(() => {
    if (!tableSort) return [...filtrados].sort((a, b) => a.dias - b.dias); // default: sort by dias
    const { key, dir } = tableSort;
    const mult = dir === 'asc' ? 1 : -1;
    const getVal = (p: Product) => {
      switch (key) {
        case 'ubi': return p.ubi;
        case 'codigo': return p.codigo;
        case 'sku': return p.sku;
        case 'producto': return isNA(p.producto) ? (p.observaciones || '') : p.producto;
        case 'marca': return p.marca || '';
        case 'tipo': return p.tipo || '';
        case 'coste': return p.coste;
        case 'uds': return p.uds;
        case 'costeTotal': return p.costeTotal;
        case 'fecha': return p.fecha;
        case 'dias': return p.dias ?? -Infinity;
        case 'estado': return p.estado;
        default: return '';
      }
    };
    return [...filtrados].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mult;
      return String(av).localeCompare(String(bv), 'es-ES', { numeric: true }) * mult;
    });
  }, [filtrados, tableSort]);

  // Caducados de hoy: fecha < hoy, no estado final, aún no marcados caducado
  const hoy = new Date().toISOString().split('T')[0];
  const caducadosHoy = useMemo(() => {
    const estadosFijos = ['ROTO', 'VENDIDO', 'VENDIDO CADUCADO', 'REGALO CADUCADO', 'MOVIDO'];
    return productos.filter(p => p.fecha < hoy && !estadosFijos.includes(p.estado.toUpperCase()) && p.estado !== 'CADUCADO' && p.uds > 0);
  }, [productos]);

  // Sort caducados table
  const caducadosHoySorted = useMemo(() => {
    if (!caducadosSort) return caducadosHoy;
    const { key, dir } = caducadosSort;
    const mult = dir === 'asc' ? 1 : -1;
    const getVal = (p: Product) => {
      switch (key) {
        case 'ubi': return p.ubi;
        case 'producto': return isNA(p.producto) ? (p.observaciones || '') : p.producto;
        case 'marca': return p.marca || '';
        case 'tipo': return p.tipo || '';
        case 'uds': return p.uds;
        case 'costeTotal': return p.costeTotal;
        case 'estado': return p.estado;
        case 'fecha': return p.fecha;
        case 'dias': return p.dias ?? -Infinity;
        default: return '';
      }
    };
    return [...caducadosHoy].sort((a, b) => {
      const av = getVal(a);
      const bv = getVal(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mult;
      return String(av).localeCompare(String(bv), 'es-ES', { numeric: true }) * mult;
    });
  }, [caducadosHoy, caducadosSort]);

  const costeCaducadosHoy = caducadosHoy.reduce((s, p) => s + p.costeTotal, 0);

  const handleExport = () => {
    const headers = ['id','ubi','codigo','sku','producto','marca','tipo','coste','uds','costeTotal','fecha','fechaMes','dias','estado','observaciones','tags'];
    const rows = filtrados.map(p => [p.id,p.ubi,p.codigo,p.sku,p.producto,p.marca,p.tipo,p.coste,p.uds,p.costeTotal,p.fecha,p.fechaMes,p.dias,p.estado,p.observaciones,p.tags]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caducidades_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Exportado correctamente');
  };

 function readFileWithEncoding(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const buf = reader.result as ArrayBuffer;
        const bytes = new Uint8Array(buf);

        // Intentar UTF-8 primero
        const utf8 = new TextDecoder('utf-8', { fatal: true });
        try {
          const text = utf8.decode(bytes);
          // Si no hay caracteres de reemplazo, es UTF-8
          if (!text.includes('\uFFFD')) {
            resolve(text);
            return;
          }
        } catch {
          // Falló UTF-8 strict
        }

        // Fallback a Windows-1252 (el de Excel en español)
        const win1252 = new TextDecoder('windows-1252');
        resolve(win1252.decode(bytes));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await readFileWithEncoding(file);
      const res = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al importar');
      addToast(`${data.count} productos importados correctamente`);
      refetch();
    } catch (err: any) {
      addToast(err.message || 'Error al importar CSV', 'error');
    }
    e.target.value = '';
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeletePass('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (deletePass !== 'admin') {
      setDeleteError('Contraseña incorrecta');
      return;
    }
    if (!deleteTargetId) return;
    const before = productos.find(p => p.id === deleteTargetId) || null;
    try {
      const res = await fetch('/api/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [deleteTargetId] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      addToast('Producto eliminado');
      if (before) addToHistory('ELIMINAR', before, { ...before, uds: 0, estado: 'ELIMINADO' } as Product);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      setDeletePass('');
      setDeleteError('');
      refetch();
    } catch {
      addToast('Error al eliminar', 'error');
    }
  };

  const [editingBefore, setEditingBefore] = useState<Product | null>(null);

  const openCreate = () => {
    setEditingProduct(null);
    setEditingBefore(null);
    setDrawerOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingBefore({ ...p });
    setEditingProduct(p);
    setDrawerOpen(true);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtrados.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtrados.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    addToast('Solo se permite eliminar productos de 1 en 1', 'error');
    setSelectedIds(new Set());
  };

  const openMover = (p: Product) => {
    const destinos: Record<string, number> = {};
    TIENDAS.forEach(t => {
      if (t.key !== p.ubi) destinos[t.key] = 0;
    });
    const keys = Object.keys(destinos);
    const base = Math.floor(p.uds / keys.length);
    const resto = p.uds % keys.length;
    keys.forEach((k, i) => { destinos[k] = base + (i < resto ? 1 : 0); });
    setMoverDestinos(destinos);
    setMoverProduct(p);
  };

  const handleMoverConfirm = async () => {
    if (!moverProduct) return;
    const total = Object.values(moverDestinos).reduce((s, v) => s + (v || 0), 0);
    if (total === 0) { addToast('Debes mover al menos 1 unidad', 'error'); return; }
    if (total > moverProduct.uds) { addToast('No hay suficientes unidades', 'error'); return; }
    const before = { ...moverProduct };
    try {
      const res = await fetch('/api/products/mover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: moverProduct.id, destinos: moverDestinos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      addToast('Producto movido correctamente');
      // Registrar en historial - obtener producto actualizado
      const updatedRes = await fetch('/api/products', { cache: 'no-store' });
      const all = await updatedRes.json();
      const after = Array.isArray(all) ? all.find((p: Product) => p.id === moverProduct.id) : null;
      if (after) addToHistory('MOVER', before, after);
      setMoverProduct(null);
      refetch();
    } catch (err: any) {
      addToast(err.message || 'Error al mover', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#64748B]">Cargando productos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-white shadow-sm border-b border-[#E2E8F0] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-[#64748B] hover:text-[#1565C0] flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
            <h1 className="text-xl font-bold text-[#0F172A]">Panel de Administración</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="flex flex-wrap gap-3 mb-6">
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-[#1565C0] text-white rounded-lg text-sm font-medium hover:bg-[#0D47A1]">
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
          <button
            onClick={() => setShowHistorial(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] text-[#475569] rounded-lg text-sm font-medium hover:bg-[#F1F5F9]"
          >
            <History className="w-4 h-4" /> Historial ({history.length})
          </button>
          <button
            onClick={() => setShowCaducadosHoy(!showCaducadosHoy)}
            className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium ${
              caducadosHoy.length > 0
                ? 'border-[#FEF2F2] bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2]'
                : 'border-[#D1FAE5] bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5]'
            }`}
          >
            <AlertCircle className="w-4 h-4" /> Caducados a fecha ({caducadosHoy.length}) · {costeCaducadosHoy.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </button>
          <div ref={importExportRef} className="relative inline-block">
            <button
              onClick={() => setShowImportExport(v => !v)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] text-[#475569] rounded-lg text-sm font-medium hover:bg-[#F1F5F9]"
            >
              <Upload className="w-4 h-4" /> Import/Export
            </button>
            {showImportExport && (
              <div className="absolute left-0 mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg w-48 z-50 overflow-hidden">
                <button
                  onClick={() => { fileInputRef.current?.click(); setShowImportExport(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F1F5F9] flex items-center gap-2"
                >
                  <Upload className="w-4 h-4 text-[#64748B]" /> Importar CSV
                </button>
                <button
                  onClick={() => { handleExport(); setShowImportExport(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F1F5F9] flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-[#64748B]" /> Exportar Excel
                </button>
              </div>
            )}
          </div>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImport} className="hidden" />

          <div ref={restoreResetRef} className="relative inline-block">
            <button
              onClick={() => setShowRestoreReset(v => !v)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] text-[#475569] rounded-lg text-sm font-medium hover:bg-[#F1F5F9]"
            >
              <CloudDownload className="w-4 h-4" /> Datos
            </button>
            {showRestoreReset && (
              <div className="absolute left-0 mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg w-48 z-50 overflow-hidden">
                <button
                  onClick={() => { setShowRestoreModal(true); setShowRestoreReset(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#0F172A] hover:bg-[#F1F5F9] flex items-center gap-2"
                >
                  <CloudDownload className="w-4 h-4 text-[#1565C0]" /> Restablecer cambios
                </button>
                <button
                  onClick={() => { setShowResetModal(true); setShowRestoreReset(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#DC2626] hover:bg-[#FEF2F2] flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Resetear BBDD
                </button>
              </div>
            )}
          </div>
        </div>

        {showCaducadosHoy && caducadosHoy.length > 0 && (
          <div className="mb-4 bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#DC2626]" />
                <h3 className="font-bold text-[#DC2626]">
                  Productos caducados a fecha ({caducadosHoy.length})
                </h3>
              </div>
              <span className="text-sm font-semibold text-[#DC2626]">
                Total: {costeCaducadosHoy.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-[#FEE2E2]">
              <table className="w-full text-sm">
                <thead className="bg-[#FEE2E2] sticky top-0">
                  <tr className="text-left">
                    {['Ubicación','Producto','Marca','Cat.','Uds','Coste','Estado','Fecha','Días','Obs.'].map(h => (
                      <th key={h} className="px-3 py-2 font-semibold text-[#0F172A] text-[10px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#FEE2E2]">
                  {caducadosHoy.map(p => {
                    const tiendaInfo = TIENDAS.find(t => t.key === p.ubi);
                    const est = getEstadoStyle(p.estado);
                    return (
                      <tr key={p.id} className="hover:bg-[#FEF2F2]">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ backgroundColor: tiendaInfo?.color + '1A', color: tiendaInfo?.color }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tiendaInfo?.color }} />
                            {tiendaInfo?.nombre || p.ubi}
                          </span>
                        </td>
                        <td className="px-3 py-2 max-w-[160px] truncate" title={isNA(p.producto) ? (p.observaciones || 'Sin nombre') : p.producto}>
                          {isNA(p.producto) ? (p.observaciones || 'Sin nombre') : p.producto}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[#64748B]">{p.marca || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-[#64748B]">{p.tipo || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap font-semibold">{p.uds}</td>
                        <td className="px-3 py-2 whitespace-nowrap font-semibold text-[#DC2626]">{p.costeTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold" style={{ backgroundColor: est.bg, color: est.color }}>
                            {p.estado}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-[#64748B]">{p.fecha}</td>
                        <td className="px-3 py-2 whitespace-nowrap font-bold text-[#DC2626]">
                          {p.dias != null ? `${p.dias} d` : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {p.observaciones && p.observaciones.trim() !== '' && p.observaciones !== '#N/A' ? (
                            <span className="inline-flex items-center gap-1 text-[#1565C0] cursor-help" title={p.observaciones}>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-[10px] truncate max-w-[80px]">{p.observaciones}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#CBD5E1]" title="Sin observaciones">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-[10px]">-</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <AdminKpis productos={filtrados} />

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm mb-6">
          <AdminFilters
            busqueda={busqueda} onBusquedaChange={setBusqueda}
            tienda={tienda} onTiendaChange={setTienda}
            categoria={categoria} onCategoriaChange={setCategoria}
            estado={estado} onEstadoChange={setEstado}
            rangoDias={rangoDias} onRangoDiasChange={setRangoDias}
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-[#64748B]">
            Total mostrados: {filtrados.length} registros
            {selectedIds.size > 0 && ` · ${selectedIds.size} seleccionados`}
          </div>
          {selectedIds.size > 0 && (
            <>
            <button
              onClick={() => {
                const seleccionados = filtrados.filter(p => selectedIds.has(p.id));
                generarPDFVentaRecomendada(seleccionados, 'Listado de productos seleccionados', `Admin · ${seleccionados.length} productos`);
              }}
              className="px-3 py-1.5 text-sm text-[#1565C0] border border-[#1565C0] rounded-lg hover:bg-[#F0F9FF] flex items-center gap-1"
            >
              <Printer className="w-3 h-3" /> Imprimir {selectedIds.size}
            </button>
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-1.5 text-sm text-[#DC2626] border border-[#FEE2E2] rounded-lg hover:bg-[#FEF2F2]"
            >
              <Trash2 className="w-3 h-3 inline mr-1" /> Eliminar {selectedIds.size}
            </button>
            </>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left w-10">
                    <input
                      type="checkbox"
                      checked={filtrados.length > 0 && selectedIds.size === filtrados.length}
                      onChange={toggleSelectAll}
                      className="rounded border-[#E2E8F0]"
                    />
                  </th>
                  {[
                    { key: 'ubi', label: 'UBI' },
                    { key: 'codigo', label: 'COD' },
                    { key: 'sku', label: 'SKU' },
                    { key: 'producto', label: 'PRODUCTO' },
                    { key: 'marca', label: 'MARCA' },
                    { key: 'tipo', label: 'TIPO' },
                    { key: 'coste', label: 'COSTE' },
                    { key: 'uds', label: 'UDS' },
                    { key: 'costeTotal', label: 'TOTAL' },
                    { key: 'fecha', label: 'FECHA' },
                    { key: 'dias', label: 'DIAS' },
                    { key: 'estado', label: 'ESTADO' },
                  ].map(({ key, label }) => {
                    const active = tableSort?.key === key;
                    return (
                      <th
                        key={key}
                        onClick={() => setTableSort(prev => prev?.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' })}
                        className="px-2 py-2 text-left text-[10px] font-semibold text-[#64748B] uppercase cursor-pointer select-none hover:text-[#1565C0] transition-colors whitespace-nowrap"
                      >
                        <span className="inline-flex items-center gap-1">
                          {label}
                          {active ? (
                            tableSort?.dir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </span>
                      </th>
                    );
                  })}
                  <th className="px-2 py-2 text-center text-[10px] font-semibold text-[#64748B] uppercase">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtradosSorted.map(p => (
                  <tr key={p.id} className={`hover:bg-[#F8FAFC] transition-colors ${selectedIds.has(p.id) ? 'bg-[#F0F9FF]' : ''}`}>
                    <td className="px-1.5 py-1">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-[#E2E8F0]"
                      />
                    </td>
                    <td className="px-1.5 py-1">
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: TIENDAS.find(t => t.key === p.ubi)?.color || '#ccc' }} />
                    </td>
                    <td className="px-1.5 py-1 font-mono text-[#64748B] text-[10px] truncate max-w-[70px]" title={p.codigo}>{p.codigo.slice(0,8)}</td>
                    <td className="px-1.5 py-1 font-mono text-[#64748B] text-[10px] truncate max-w-[50px]" title={p.sku}>{p.sku}</td>
                    <td className="px-1.5 py-1 font-medium text-[#0F172A] text-[11px] truncate max-w-[140px]" title={isNA(p.producto) && p.observaciones ? p.observaciones : p.producto}>{isNA(p.producto) && p.observaciones ? p.observaciones : p.producto}</td>
                    <td className="px-1.5 py-1 text-[#64748B] text-[11px] truncate max-w-[80px]" title={isNA(p.marca) && p.observaciones ? p.observaciones : p.marca}>{isNA(p.marca) && p.observaciones ? p.observaciones : p.marca}</td>
                    <td className="px-1.5 py-1 text-[#64748B] text-[11px] truncate max-w-[80px]" title={isNA(p.tipo) && p.observaciones ? p.observaciones : p.tipo}>
                      {isNA(p.tipo) ? '' : getEmojiCategoria(p.tipo)} {isNA(p.tipo) && p.observaciones ? p.observaciones : p.tipo}
                    </td>
                    <td className="px-1.5 py-1 text-right font-mono text-[11px]">{p.coste.toFixed(2)}</td>
                    <td className="px-1.5 py-1 text-right font-bold text-[11px]">{p.uds}</td>
                    <td className="px-1.5 py-1 text-right font-mono font-medium text-[11px]">{p.costeTotal.toFixed(2)}</td>
                    <td className="px-1.5 py-1 text-[#64748B] text-[11px] truncate max-w-[75px]" title={p.fecha}>{p.fecha}</td>
                    <td className={`px-1.5 py-1 font-bold text-[11px] ${p.dias <= 0 ? 'text-[#DC2626]' : p.dias <= 30 ? 'text-[#EA580C]' : 'text-[#059669]'}`}>{p.dias}</td>
                    <td className="px-1.5 py-1">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        style={{ backgroundColor: getEstadoStyle(p.estado).bg, color: getEstadoStyle(p.estado).color }}
                      >
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {p.observaciones && p.observaciones.trim() !== '' && p.observaciones !== '#N/A' ? (
                          <span className="cursor-help" title={p.observaciones}>
                            <svg className="w-3.5 h-3.5 text-[#1565C0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        ) : (
                          <span title="Sin observaciones">
                            <svg className="w-3.5 h-3.5 text-[#CBD5E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        )}
                        <button onClick={() => openEdit(p)} className="text-[#94A3B8] hover:text-[#1565C0] transition-colors" title="Editar"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => openMover(p)} className="text-[#94A3B8] hover:text-[#FB8C00] transition-colors" title="Mover"><Truck className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(p.id)} className="text-[#94A3B8] hover:text-[#DC2626] transition-colors" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <ProductoDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        producto={editingProduct}
        onSuccess={async () => {
          addToast(editingProduct ? 'Producto actualizado' : 'Producto creado');
          await refetch();
          if (editingProduct && editingBefore) {
            try {
              const res = await fetch('/api/products', { cache: 'no-store' });
              const all = await res.json();
              const after = Array.isArray(all) ? all.find((p: Product) => p.id === editingProduct.id) : null;
              if (after) addToHistory('EDITAR', editingBefore, after);
            } catch {}
            setEditingBefore(null);
          }
        }}
      />

      <RestoreModal
        open={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        onSuccess={() => { refetch(); addToast('Copia de seguridad restaurada correctamente'); }}
      />

      {/* Modal Mover (Admin) */}
      {moverProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoverProduct(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#FB8C00]" />
                Mover producto
              </h2>
              <button
                onClick={() => setMoverProduct(null)}
                className="text-[#64748B] hover:text-[#0F172A]"
              >✕</button>
            </div>

            <div className="mb-4 bg-[#F8FAFC] rounded-lg p-3">
              <p className="font-medium text-[#0F172A]">{moverProduct.producto || moverProduct.observaciones || '(Sin nombre)'}</p>
              <p className="text-sm text-[#64748B]">
                {moverProduct.ubi} · {moverProduct.uds} unidades · {moverProduct.costeTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </p>
            </div>

            <p className="text-sm font-medium text-[#0F172A] mb-3">Destinos:</p>

            <div className="space-y-3 mb-4">
              {TIENDAS.filter(t => t.key !== moverProduct.ubi).map((t) => (
                <div key={t.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-sm text-[#0F172A] w-20">{t.nombre} ({t.key})</span>
                  </div>
                  <div className="flex items-center border border-[#E2E8F0] rounded-lg">
                    <button
                      onClick={() => setMoverDestinos(prev => ({
                        ...prev,
                        [t.key]: Math.max(0, (prev[t.key] || 0) - 1)
                      }))}
                      className="px-3 py-2 hover:bg-[#F1F5F9] rounded-l-lg"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={moverProduct.uds}
                      value={moverDestinos[t.key] || 0}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setMoverDestinos(prev => ({
                          ...prev,
                          [t.key]: Math.min(Math.max(0, v), moverProduct.uds)
                        }));
                      }}
                      className="w-16 text-center text-sm border-x border-[#E2E8F0] py-2 focus:outline-none"
                    />
                    <button
                      onClick={() => setMoverDestinos(prev => ({
                        ...prev,
                        [t.key]: Math.min(moverProduct.uds, (prev[t.key] || 0) + 1)
                      }))}
                      className="px-3 py-2 hover:bg-[#F1F5F9] rounded-r-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className={`text-sm mb-4 ${Object.values(moverDestinos).reduce((s, v) => s + (v || 0), 0) > moverProduct.uds ? 'text-[#DC2626]' : 'text-[#64748B]'}`}>
              Total a mover: {Object.values(moverDestinos).reduce((s, v) => s + (v || 0), 0)} / {moverProduct.uds} unidades
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMoverProduct(null)}
                className="flex-1 px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9]"
              >
                Cancelar
              </button>
              <button
                onClick={handleMoverConfirm}
                disabled={Object.values(moverDestinos).reduce((s, v) => s + (v || 0), 0) === 0 || Object.values(moverDestinos).reduce((s, v) => s + (v || 0), 0) > moverProduct.uds}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: '#FB8C00' }}
              >
                ✅ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <HistorialSesion
        open={showHistorial}
        onClose={() => setShowHistorial(false)}
        history={history}
        onRestore={handleRestoreHistory}
        onClear={clearHistory}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Modal Resetear BBDD */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowResetModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEE2F2] flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div>
                <h3 className="font-bold text-[#0F172A]">Resetear Base de Datos</h3>
                <p className="text-sm text-[#64748B]">Se eliminarán todos los productos</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#64748B] mb-1">Contraseña</label>
              <input
                type="password"
                value={resetPass}
                onChange={(e) => setResetPass(e.target.value)}
                placeholder="Introduce la contraseña..."
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1565C0]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowResetModal(false); setResetPass(''); }}
                className="flex-1 px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9]"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetDB}
                disabled={resetPass !== 'admin'}
                className="flex-1 px-4 py-2 bg-[#DC2626] text-white rounded-lg text-sm font-medium hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Producto */}
      {showDeleteModal && deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowDeleteModal(false); setDeleteTargetId(null); }} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEE2F2] flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div>
                <h3 className="font-bold text-[#0F172A]">Eliminar Producto</h3>
                <p className="text-sm text-[#64748B]">Se eliminará permanentemente</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#64748B] mb-1">Contraseña</label>
              <input
                type="password"
                value={deletePass}
                onChange={(e) => { setDeletePass(e.target.value); setDeleteError(''); }}
                placeholder="Introduce la contraseña..."
                className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1565C0]"
                onKeyDown={(e) => { if (e.key === 'Enter') handleDeleteConfirm(); }}
              />
              {deleteError && <p className="text-xs text-[#DC2626] mt-1">{deleteError}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteTargetId(null); setDeletePass(''); }}
                className="flex-1 px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9]"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={!deletePass}
                className="flex-1 px-4 py-2 bg-[#DC2626] text-white rounded-lg text-sm font-medium hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}