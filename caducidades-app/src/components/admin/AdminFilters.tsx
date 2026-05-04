'use client';

import { Search, MapPin, Package, CalendarDays, Tag } from 'lucide-react';
import { TIENDAS, TIPOS_CATEGORIA } from '@/types/product';
import { getEmojiCategoria } from '@/lib/emojis';

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

        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#64748B]" />
          <select
            value={estado}
            onChange={(e) => onEstadoChange(e.target.value)}
            className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1565C0]"
          >
            <option value="">Todos los estados</option>
            {ESTADOS_OPCIONES.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
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
