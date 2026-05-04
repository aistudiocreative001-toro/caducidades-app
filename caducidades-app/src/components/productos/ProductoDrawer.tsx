'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2 } from 'lucide-react';
import type { Product } from '@/types/product';
import { TIENDAS, TIPOS_CATEGORIA } from '@/types/product';
import { useToast } from '@/components/ui/Toast';
import { getEstadoStyle } from '@/lib/estado-colors';

const ESTADOS_PREDEFINIDOS = ['VIGENTE', 'EN RIESGO', 'CADUCADO', 'ROTO', 'VENDIDO', 'VENDIDO CADUCADO', 'REGALO CADUCADO', 'MOVIDO', 'MOSTRADOR'];

interface ProductoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  producto: Product | null;
  onSuccess: () => void;
}

export default function ProductoDrawer({ isOpen, onClose, producto, onSuccess }: ProductoDrawerProps) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  
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
    } else {
      setForm({
        ubi: 'LR', codigo: '', sku: '', producto: '', marca: '',
        tipo: TIPOS_CATEGORIA[0], coste: 0, uds: 1,
        fecha: new Date().toISOString().split('T')[0],
        estado: 'VIGENTE', observaciones: '', tags: ''
      });
    }
  }, [producto, isOpen]);

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

  const inputClass = "w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/10";
  const labelClass = "block text-sm font-medium text-[#64748B] mb-1";

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
                  <div>
                    <label className={labelClass}>Ubicación</label>
                    <select value={form.ubi} onChange={e => setForm({...form, ubi: e.target.value})} className={inputClass}>
                      {TIENDAS.map(t => <option key={t.key} value={t.key}>{t.nombre} ({t.key})</option>)}
                    </select>
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

                  <div>
                    <label className={labelClass}>Estado</label>
                    <div className="relative">
                      <select
                        value={form.estado}
                        onChange={e => setForm({...form, estado: e.target.value})}
                        className={`${inputClass} pl-10`}
                      >
                        {ESTADOS_PREDEFINIDOS.map(e => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                      <span 
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                        style={{ backgroundColor: getEstadoStyle(form.estado).color }}
                      />
                    </div>
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
