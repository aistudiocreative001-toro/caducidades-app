'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, ChevronDown, Search } from 'lucide-react';
import type { Product } from '@/types/product';
import { TIENDAS, TIPOS_CATEGORIA } from '@/types/product';
import { useToast } from '@/components/ui/Toast';
import { getEstadoStyle } from '@/lib/estado-colors';

const ESTADOS_PREDEFINIDOS = ['VIGENTE', 'EN RIESGO', 'RECOMENDADO', 'CADUCADO', 'ROTO', 'VENDIDO', 'VENDIDO CADUCADO', 'REGALO CADUCADO', 'MOVIDO', 'MOSTRADOR'];

interface ProductoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Product | null;
  onSuccess: () => void;
}

export default function ProductoDrawer({ isOpen, onClose, producto, onSuccess }: ProductoDrawerProps) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const [ubiOpen, setUbiOpen] = useState(false);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const ubiRef = useRef<HTMLDivElement>(null);
  const estadoRef = useRef<HTMLDivElement>(null);

  // Smart search state (only for new products)
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    ubi: 'LR',
    codigo: '',
    sku: '',
    producto: '',
    marca: '',
    tipo: TIPOS_CATEGORIA[0],
    coste: 0,
    uds: 1,
    fecha: new Date().toISOString().split('T')[0],
    estado: 'VIGENTE',
    observaciones: '',
    tags: '',
  });

  // Reset form when opening/creating
  useEffect(() => {
    if (producto) {
      setForm({
        ubi: producto.ubi,
        codigo: producto.codigo,
        sku: producto.sku,
        producto: producto.producto,
        marca: producto.marca,
        tipo: producto.tipo,
        coste: producto.coste,
        uds: producto.uds,
        fecha: producto.fecha,
        estado: producto.estado,
        observaciones: producto.observaciones,
        tags: producto.tags,
      });
      setSearchQuery('');
      setSearchOpen(false);
    } else {
      setForm({
        ubi: 'LR', codigo: '', sku: '', producto: '', marca: '',
        tipo: TIPOS_CATEGORIA[0], coste: 0, uds: 1,
        fecha: new Date().toISOString().split('T')[0],
        estado: 'VIGENTE', observaciones: '', tags: ''
      });
      setSearchQuery('');
      setSearchOpen(false);
    }
  }, [producto, isOpen]);

  // Fetch all products for smart search when creating new
  useEffect(() => {
    if (isOpen && !producto) {
      fetch('/api/products', { cache: 'no-store' })
        .then(r => r.json())
        .then(data => setAllProducts(Array.isArray(data) ? data : []))
        .catch(() => setAllProducts([]));
    }
  }, [isOpen, producto]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ubiRef.current && !ubiRef.current.contains(e.target as Node)) setUbiOpen(false);
      if (estadoRef.current && !estadoRef.current.contains(e.target as Node)) setEstadoOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, []);

  const performSearch = (query: string) => {
    setSearchQuery(query);
    if (!query || query.length < 3) {
      setSearchOpen(false);
      return;
    }
    const q = query.toLowerCase();
    const matches = allProducts.filter(p =>
      (p.codigo && p.codigo.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.producto && p.producto.toLowerCase().includes(q))
    ).slice(0, 5);
    setSearchResults(matches);
    setSearchOpen(matches.length > 0);
  };

  const selectProduct = (p: Product) => {
    setForm({
      ubi: form.ubi, // keep current store
      codigo: p.codigo,
      sku: p.sku,
      producto: p.producto,
      marca: p.marca,
      tipo: p.tipo,
      coste: p.coste,
      uds: p.uds,
      fecha: p.fecha,
      estado: 'VIGENTE',
      observaciones: p.observaciones,
      tags: p.tags,
    });
    setSearchQuery('');
    setSearchOpen(false);
    addToast('Datos precargados del producto existente');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (producto) {
        const res = await fetch('/api/products/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: producto.id, data: form }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar');
        addToast('Producto actualizado correctamente');
      } else {
        const res = await fetch('/api/products/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al crear');
        addToast('Producto creado correctamente');
      }
      onSuccess();
      onClose();
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!producto) return;
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [producto.id] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al eliminar');
      addToast('Producto eliminado');
      onSuccess();
      onClose();
    } catch (e) {
      addToast('Error al eliminar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/10 bg-white";
  const labelClass = "block text-sm font-medium text-[#64748B] mb-1";

  const tiendaSeleccionada = TIENDAS.find(t => t.key === form.ubi);
  const estadoStyle = getEstadoStyle(form.estado);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/20" onClick={onClose} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#0F172A]">
                    {producto ? '✏️ Editar producto' : '➕ Nuevo producto'}
                  </h2>
                  <button onClick={onClose} className="text-[#64748B] hover:text-[#0F172A]">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Smart search (only when creating new) */}
                  {!producto && (
                    <div ref={searchRef} className="relative">
                      <label className={labelClass}>Buscar existente (EAN / SKU / Nombre)</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                        <input
                          value={searchQuery}
                          onChange={e => performSearch(e.target.value)}
                          placeholder="Escribe al menos 3 caracteres..."
                          className={`${inputClass} pl-10`}
                        />
                      </div>
                      {searchOpen && searchResults.length > 0 && (
                        <div className="absolute z-50 mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg w-full max-h-64 overflow-y-auto">
                          {searchResults.map(p => (
                            <div
                              key={p.id}
                              className="flex flex-col gap-0.5 px-3 py-2 cursor-pointer hover:bg-[#F0F9FF] text-sm border-b border-[#F1F5F9] last:border-b-0"
                              onClick={() => selectProduct(p)}
                            >
                              <p className="font-semibold text-[#0F172A] truncate">{p.producto || p.observaciones || '(Sin nombre)'}</p>
                              <p className="text-xs text-[#64748B]">
                                {p.codigo} · {p.sku} · {p.marca}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ubicación dropdown personalizado */}
                  <div ref={ubiRef}>
                    <label className={labelClass}>Ubicación</label>
                    <button
                      type="button"
                      onClick={() => setUbiOpen(!ubiOpen)}
                      className={`${inputClass} flex items-center gap-2 cursor-pointer`}
                    >
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: tiendaSeleccionada?.color || '#CBD5E1' }}
                      />
                      <span className="flex-1 text-left">{tiendaSeleccionada?.nombre || 'Seleccionar...'}</span>
                      <ChevronDown className={`w-3 h-3 text-[#64748B] shrink-0 transition-transform ${ubiOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {ubiOpen && (
                      <div className="mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg w-full max-h-48 overflow-y-auto">
                        {TIENDAS.map(t => (
                          <div
                            key={t.key}
                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F1F5F9] text-sm ${form.ubi === t.key ? 'font-semibold bg-[#F0F9FF]' : ''}`}
                            onClick={() => { setForm({ ...form, ubi: t.key }); setUbiOpen(false); }}
                          >
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: t.color }}
                            />
                            {t.nombre} ({t.key})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Código</label>
                      <input value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})} className={inputClass} placeholder="Ej: 5060751995418" />
                    </div>
                    <div>
                      <label className={labelClass}>SKU</label>
                      <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} className={inputClass} placeholder="Ej: 2469-3" />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Producto</label>
                    <input value={form.producto} onChange={e => setForm({...form, producto: e.target.value})} className={inputClass} placeholder="Nombre del producto" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Marca</label>
                      <input value={form.marca} onChange={e => setForm({...form, marca: e.target.value})} className={inputClass} placeholder="Ej: Biotech USA" />
                    </div>
                    <div>
                      <label className={labelClass}>Categoría</label>
                      <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className={inputClass}>
                        {TIPOS_CATEGORIA.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Coste unitario (€)</label>
                      <input type="number" step="0.01" value={form.coste} onChange={e => setForm({...form, coste: parseFloat(e.target.value) || 0})} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Unidades</label>
                      <input type="number" min={0} value={form.uds} onChange={e => setForm({...form, uds: parseInt(e.target.value) || 0})} className={inputClass} />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Fecha caducidad</label>
                    <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className={inputClass} />
                  </div>

                  {/* Estado dropdown personalizado */}
                  <div ref={estadoRef}>
                    <label className={labelClass}>Estado</label>
                    <button
                      type="button"
                      onClick={() => setEstadoOpen(!estadoOpen)}
                      className={`${inputClass} flex items-center gap-2 cursor-pointer`}
                    >
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: estadoStyle.color }}
                      />
                      <span className="flex-1 text-left">{form.estado}</span>
                      <ChevronDown className={`w-3 h-3 text-[#64748B] shrink-0 transition-transform ${estadoOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {estadoOpen && (
                      <div className="mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg w-full max-h-64 overflow-y-auto">
                        {ESTADOS_PREDEFINIDOS.map(e => {
                          const style = getEstadoStyle(e);
                          return (
                            <div
                              key={e}
                              className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F1F5F9] text-sm ${form.estado === e ? 'font-semibold bg-[#F0F9FF]' : ''}`}
                              onClick={() => { setForm({ ...form, estado: e }); setEstadoOpen(false); }}
                            >
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: style.color }}
                              />
                              <span style={{ color: style.color }}>{e}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Observaciones</label>
                    <textarea value={form.observaciones} onChange={e => setForm({...form, observaciones: e.target.value})} className={inputClass} rows={3} />
                  </div>

                  <div>
                    <label className={labelClass}>Tags</label>
                    <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className={inputClass} placeholder="Separados por comas" />
                  </div>
                </div>

                <div className="flex gap-3 mt-8 pt-4 border-t border-[#E2E8F0]">
                  {producto && (
                    <button
                      onClick={handleDelete}
                      disabled={loading}
                      className="px-4 py-2 border border-[#FEE2E2] text-[#DC2626] rounded-lg text-sm font-medium hover:bg-[#FEF2F2] disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" /> Eliminar
                    </button>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-[#1565C0] text-white rounded-lg text-sm font-medium hover:bg-[#0D47A1] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
