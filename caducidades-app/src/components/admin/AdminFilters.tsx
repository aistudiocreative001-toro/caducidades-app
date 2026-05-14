'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Package, CalendarDays, Tag } from 'lucide-react';
import { TIENDAS, TIPOS_CATEGORIA } from '@/types/product';
import { getEmojiCategoria } from '@/lib/emojis';
import { getEstadoStyle } from '@/lib/estado-colors';

interface AdminFiltersProps {
  busqueda: string;
  onBusquedaChange: (v: string) => void;
  tienda: string[];
  onTiendaChange: (v: string[]) => void;
  categoria: string[];
  onCategoriaChange: (v: string[]) => void;
  estado: string[];
  onEstadoChange: (v: string[]) => void;
  rangoDias: string;
  onRangoDiasChange: (v: string) => void;
}

const ESTADOS_OPCIONES = [
  'VIGENTE', 'EN RIESGO', 'CADUCADO', 'ROTO', 'VENDIDO', 'VENDIDO CADUCADO', 'REGALO CADUCADO', 'MOVIDO', 'MOSTRADOR'
];

function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  getColor,
  getLabel,
  icon,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  getColor?: (v: string) => string;
  getLabel?: (v: string) => string;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const clear = () => onChange([]);

  const display =
    selected.length === 0
      ? label
      : selected.length === 1
      ? (getLabel ? getLabel(selected[0]) : selected[0])
      : `${selected.length} seleccionados`;

  const dotColor =
    selected.length === 1 && getColor
      ? getColor(selected[0])
      : selected.length > 1
      ? '#1565C0'
      : '#CBD5E1';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white min-w-[180px] hover:bg-[#F8FAFC]"
      >
        {icon}
        <span
          className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
        />
        <span className="flex-1 text-left truncate">{display}</span>
        <svg className="w-3 h-3 text-[#64748B] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border border-[#E2E8F0] rounded-lg shadow-lg min-w-[240px] max-h-72 overflow-y-auto p-2">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-xs font-semibold text-[#64748B] uppercase">{label}</span>
            {selected.length > 0 && (
              <button onClick={clear} className="text-xs text-[#DC2626] hover:underline">
                Limpiar
              </button>
            )}
          </div>
          {options.map((opt) => {
            const isSelected = selected.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm hover:bg-[#F1F5F9] ${isSelected ? 'bg-[#F0F9FF]' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(opt)}
                  className="rounded border-[#E2E8F0] accent-[#1565C0]"
                />
                {getColor && (
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: getColor(opt) }}
                  />
                )}
                <span className={getColor ? '' : 'text-[#0F172A]'} style={getColor ? { color: getColor(opt) } : undefined}>
                  {getLabel ? getLabel(opt) : opt}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

      <div className="flex flex-wrap gap-3 items-center">
        <MultiSelectDropdown
          label="Todas las tiendas"
          options={TIENDAS.map((t) => t.key)}
          selected={tienda}
          onChange={onTiendaChange}
          getColor={(k) => TIENDAS.find((t) => t.key === k)?.color || '#CBD5E1'}
          getLabel={(k) => TIENDAS.find((t) => t.key === k)?.nombre || k}
          icon={<MapPin className="w-4 h-4 text-[#64748B]" />}
        />

        <MultiSelectDropdown
          label="Todas las categorías"
          options={TIPOS_CATEGORIA}
          selected={categoria}
          onChange={onCategoriaChange}
          getLabel={(c) => `${getEmojiCategoria(c)} ${c}`}
          icon={<Package className="w-4 h-4 text-[#64748B]" />}
        />

        <MultiSelectDropdown
          label="Todos los estados"
          options={ESTADOS_OPCIONES}
          selected={estado}
          onChange={onEstadoChange}
          getColor={(e) => getEstadoStyle(e).color}
          icon={<Tag className="w-4 h-4 text-[#64748B]" />}
        />

        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-[#64748B]" />
          <select
            value={rangoDias}
            onChange={(e) => onRangoDiasChange(e.target.value)}
            className="px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1565C0]"
          >
            <option value="">Todos los días</option>
            <option value="critico">{'🔥 CRÍTICO (<10 días)'}</option>
            <option value="urgente">{'⚠️ URGENTE (10-30 días)'}</option>
            <option value="prioritario">{'📅 PRIORITARIO (30-60 días)'}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
