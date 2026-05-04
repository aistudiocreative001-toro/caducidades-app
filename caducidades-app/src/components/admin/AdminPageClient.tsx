'use client';

import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/app/actions/products';
import AdminKpis from './AdminKpis';
import AdminFilters from './AdminFilters';
import ProductoDrawer from '@/components/productos/ProductoDrawer';
import { ToastContainer, useToast } from '@/components/ui/Toast';
import { TIENDAS } from '@/types/product';
import type { Product } from '@/types/product';
import { Edit, Trash2, Download, Upload, Plus, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Papa from 'papaparse';
import { getEmojiCategoria } from '@/lib/emojis';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    return res.sort((a, b) => a.dias - b.dias);
  }, [productos, busqueda, tienda, categoria, estado, rangoDias]);

  // Caducados de hoy: fecha < hoy, no estado final, aún no marcados caducado
  const hoy = new Date().toISOString().split('T')[0];
  const caducadosHoy = useMemo(() => {
    const estadosFijos = ['ROTO', 'VENDIDO', 'VENDIDO CADUCADO', 'REGALO CADUCADO', 'MOVIDO'];
    return productos.filter(p => p.fecha < hoy && !estadosFijos.includes(p.estado.toUpperCase()) && p.estado !== 'CADUCADO' && p.uds > 0);
  }, [productos]);
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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: ',',
      complete: (results) => {
        addToast(`CSV importado: ${results.data.length} filas leídas`);
        // TODO: procesar importación real
        refetch();
      },
      error: () => addToast('Error al importar CSV', 'error'),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      const res = await fetch('/api/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      addToast('Producto eliminado');
      refetch();
    } catch {
      addToast('Error al eliminar', 'error');
    }
  };

  const openCreate = () => {
    setEditingProduct(null);
    setDrawerOpen(true);
  };

  const openEdit = (p: Product) => {
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
    if (!confirm(`¿Eliminar ${selectedIds.size} productos seleccionados?`)) return;
    try {
      const res = await fetch('/api/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      addToast(`${selectedIds.size} productos eliminados`);
      setSelectedIds(new Set());
      refetch();
    } catch {
      addToast('Error al eliminar', 'error');
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
          <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#475569] hover:bg-[#F1F5F9]">
            <Upload className="w-4 h-4" /> Importar CSV
          </button>
          <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImport} className="hidden" />
          <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2 border border-[#E2E8F0] rounded-lg text-sm font-medium text-[#475569] hover:bg-[#F1F5F9]">
            <Download className="w-4 h-4" /> Exportar Excel
          </button>
          <button
            onClick={() => setShowCaducadosHoy(!showCaducadosHoy)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#FEF2F2] bg-[#FEF2F2] rounded-lg text-sm font-medium text-[#DC2626] hover:bg-[#FEE2E2]"
          >
            <AlertCircle className="w-4 h-4" /> Caducados a fecha ({caducadosHoy.length}) · {costeCaducadosHoy.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
          </button>
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
                {costeCaducadosHoy.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {caducadosHoy.map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-sm bg-white rounded-lg p-3 border border-[#FEE2E2]"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#0F172A] truncate">
                      {isNA(p.producto) ? (p.observaciones || '(Sin nombre)') : p.producto}
                    </p>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {p.ubi} · {p.fecha} · {p.uds} uds
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[#DC2626] shrink-0 ml-4">
                    {p.costeTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </span>
                </div>
              ))}
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
            <button 
              onClick={handleBulkDelete}
              className="px-3 py-1.5 text-sm text-[#DC2626] border border-[#FEE2E2] rounded-lg hover:bg-[#FEF2F2]"
            >
              <Trash2 className="w-3 h-3 inline mr-1" /> Eliminar {selectedIds.size}
            </button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={filtrados.length > 0 && selectedIds.size === filtrados.length}
                      onChange={toggleSelectAll}
                      className="rounded border-[#E2E8F0]"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">UBI</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">CÓDIGO</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">SKU</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">PRODUCTO</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">MARCA</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">TIPO</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">COSTE</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">UDS</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">COSTE TOTAL</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">FECHA</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">DIAS</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-[#64748B] uppercase">ESTADO</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-[#64748B] uppercase">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtrados.map(p => (
                  <tr key={p.id} className={`hover:bg-[#F8FAFC] transition-colors ${selectedIds.has(p.id) ? 'bg-[#F0F9FF]' : ''}`}>
                    <td className="px-2 py-1.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-[#E2E8F0]"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <span className="inline-block w-4 h-4 rounded" style={{ backgroundColor: TIENDAS.find(t => t.key === p.ubi)?.color || '#ccc' }} />
                    </td>
                    <td className="px-2 py-1.5 font-mono text-[#64748B] text-[10px] truncate max-w-[80px]" title={p.codigo}>{p.codigo.slice(0,10)}</td>
                    <td className="px-2 py-1.5 font-mono text-[#64748B] text-[10px] truncate max-w-[60px]" title={p.sku}>{p.sku}</td>
                    <td className="px-2 py-1.5 font-medium text-[#0F172A] text-[11px] truncate max-w-[180px]" title={isNA(p.producto) && p.observaciones ? p.observaciones : p.producto}>{isNA(p.producto) && p.observaciones ? p.observaciones : p.producto}</td>
                    <td className="px-2 py-1.5 text-[#64748B] text-[11px] truncate max-w-[120px]" title={isNA(p.marca) && p.observaciones ? p.observaciones : p.marca}>{isNA(p.marca) && p.observaciones ? p.observaciones : p.marca}</td>
                    <td className="px-2 py-1.5 text-[#64748B] text-[11px] truncate max-w-[120px]" title={isNA(p.tipo) && p.observaciones ? p.observaciones : p.tipo}>
                      {isNA(p.tipo) ? '' : getEmojiCategoria(p.tipo)} {isNA(p.tipo) && p.observaciones ? p.observaciones : p.tipo}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-[11px]">{p.coste.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-right font-bold text-[11px]">{p.uds}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-medium text-[11px]">{p.costeTotal.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-[#64748B] text-[11px] truncate max-w-[90px]" title={p.fecha}>{p.fecha}</td>
                    <td className={`px-2 py-1.5 font-bold text-[11px] ${p.dias <= 0 ? 'text-[#DC2626]' : p.dias <= 30 ? 'text-[#EA580C]' : 'text-[#059669]'}`}>{p.dias}</td>
                    <td className="px-2 py-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        p.estado === 'VIGENTE' ? 'bg-[#DBEAFE] text-[#1565C0]' :
                        p.estado === 'EN RIESGO' ? 'bg-[#FFF7ED] text-[#EA580C]' :
                        p.estado === 'CADUCADO' ? 'bg-[#FEF2F2] text-[#DC2626]' :
                        p.estado === 'VENDIDO CADUCADO' ? 'bg-[#D1FAE5] text-[#10B981]' :
                        p.estado === 'ROTO' ? 'bg-[#FEF3C7] text-[#D97706]' :
                        p.estado === 'VENDIDO' ? 'bg-[#F1F5F9] text-[#475569]' :
                        p.estado === 'MOVIDO' ? 'bg-[#E0E7FF] text-[#4F46E5]' :
                        'bg-[#F1F5F9] text-[#475569]'
                      }`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {p.observaciones && p.observaciones.trim() !== '' && p.observaciones !== '#N/A' ? (
                          <span className="relative group cursor-help">
                            <svg className="w-4 h-4 text-[#1565C0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-[#0F172A] text-white text-xs rounded-lg px-3 py-2 z-50">
                              {p.observaciones}
                            </span>
                          </span>
                        ) : (
                          <svg className="w-4 h-4 text-[#CBD5E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        <button onClick={() => openEdit(p)} className="text-[#94A3B8] hover:text-[#1565C0] transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="text-[#94A3B8] hover:text-[#DC2626] transition-colors"><Trash2 className="w-4 h-4" /></button>
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
        onSuccess={() => {
          addToast(editingProduct ? 'Producto actualizado' : 'Producto creado');
          refetch();
        }}
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
