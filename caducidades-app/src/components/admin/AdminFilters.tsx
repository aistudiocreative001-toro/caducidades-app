'use client';

import { useState } from 'react';
import { Search, MapPin, Package, CalendarDays, Tag } from 'lucide-react';
import { TIENDAS, TIPOS_CATEGORIA } from '@/types/product';
import { getEmojiCategoria } from '@/lib/emojis';
import { getEstadoStyle } from '@/lib/estado-colors';

interface AdminFiltersProps {
  busqueda: string;
  onBusquedaChange: (v: string) => void;
  tienda: string;
  onTiendaChange: (v: string) => void;
  categoria: string;
  onCategoriaChange: (v: string) => void;
  estado: string;
  onEstadoChange: (v: string) => void;
  rangoDias: string;
  onRangoDiasChange: (v: string) => void;
}

const ESTADOS_OPCIONES = [
  'VIGENTE', 'EN RIESGO', 'CADUCADO', 'ROTO', 'VENDIDO', 'VENDIDO CADUCADO', 'REGALO CADUCADO', 'MOVIDO', 'MOSTRADOR'
];

export default function AdminFilters({
  busqueda, onBusquedaChange,
  tienda, onTiendaChange,
  categoria, onCategoriaChange,
  estado, onEstadoChange,
  rangoDias, onRangoDiasChange,
}: AdminFiltersProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = estado || 'Todos los estados';
  const selectedColor = estado ? getEstadoStyle(estado).color : '#64748B';

  return (
    <div className="space-y-3 mb-4">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-[#64748B] shrink-0" />
        <input
          type="text"
          placeholder="Buscar producto, SKU, código o marca..."
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/10"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#64748B]" />
          <select
            value={tienda}
            onChange={(e) => onTiendaChange(e.target.value)}
            className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1565C0]"
          >
            <option value="">Todas las tiendas</option>
            {TIENDAS.map(t => (
              <option key={t.key} value={t.key}>{t.nombre} ({t.key})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#64748B]" />
          <select
            value={categoria}
            onChange={(e) => onCategoriaChange(e.target.value)}
            className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1565C0]"
          >
            <option value="">Todas las categorías</option>
            {TIPOS_CATEGORIA.map(c => (
              <option key={c} value={c}>{getEmojiCategoria(c)} {c}</option>
            ))}
          </select>
        </div>

        {/* Custom Estado dropdown with colors */}
        <div className="flex items-center gap-2 relative">
          <Tag className="w-4 h-4 text-[#64748B]" />
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-2 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1565C0] bg-white min-w-[180px]"
            >
              <span
                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="flex-1 text-left truncate">{selectedLabel}</span>
              <svg className="w-3 h-3 text-[#64748B] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <div className="absolute z-50 mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg w-full min-w-[220px] max-h-64 overflow-y-auto">
                <div
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F1F5F9] text-sm text-[#64748B] border-b border-[#E2E8F0]"
                  onClick={() => { onEstadoChange(''); setOpen(false); }}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#CBD5E1]" />
                  Todos los estados
                </div>
                {ESTADOS_OPCIONES.map(e => (
                  <div
                    key={e}
                    className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#F1F5F9] text-sm ${estado === e ? 'font-semibold bg-[#F0F9FF]' : ''}`}
                    onClick={() => { onEstadoChange(e); setOpen(false); }}
                  >
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getEstadoStyle(e).color }}
                    />
                    <span style={{ color: getEstadoStyle(e).color }}>{e}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#64748B]" />
          <select
            value={rangoDias}
            onChange={(e) => onRangoDiasChange(e.target.value)}
            className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1565C0]"
          >
            <option value="">Todos los días</option>
            <option value="critico">{'🔥 CRÍTICO (<10 días)'}</option>
            <option value="urgente">⚠️ URGENTE (10-30 días)</option>
            <option value="prioritario">📅 PRIORITARIO (30-60 días)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
