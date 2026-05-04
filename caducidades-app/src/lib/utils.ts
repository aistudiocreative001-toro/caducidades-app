import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseCoste(valor: string): number {
  if (!valor) return 0;
  const limpio = valor.toString().trim().replace(/\./g, '').replace(',', '.');
  return parseFloat(limpio) || 0;
}

export function formatCoste(valor: number): string {
  return valor.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseFecha(fechaStr: string): Date | null {
  if (!fechaStr) return null;
  // DD/MM/YYYY o DD-MM-YYYY
  const match = fechaStr.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (match) {
    const [_, dia, mes, anio] = match;
    return new Date(`${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T00:00:00`);
  }
  const d = new Date(fechaStr);
  return isNaN(d.getTime()) ? null : d;
}

export function formatFechaISO(fecha: Date): string {
  return fecha.toISOString().split('T')[0];
}

export function calcularDias(fechaStr: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  // Soporte para DD/MM/YYYY o DD-MM-YYYY
  let fecha: Date;
  const match = fechaStr.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (match) {
    const [_, dia, mes, anio] = match;
    fecha = new Date(`${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T00:00:00`);
  } else {
    fecha = new Date(fechaStr + 'T00:00:00');
  }
  
  if (isNaN(fecha.getTime())) return -9999;
  const diff = fecha.getTime() - hoy.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function calcularFechaMes(fechaStr: string): string {
  let fecha: Date;
  const match = fechaStr.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (match) {
    const [_, dia, mes, anio] = match;
    fecha = new Date(`${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}T00:00:00`);
  } else {
    fecha = new Date(fechaStr + 'T00:00:00');
  }
  
  if (isNaN(fecha.getTime())) return '';
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${meses[fecha.getMonth()]}-${fecha.getFullYear()}`;
}

export function calcularEstado(dias: number, estadoActual: string): string {
  // Solo devolvemos el estado tal cual viene del CSV
  // No se fuerza CADUCADO automaticamente por fecha pasada
  return estadoActual || 'VIGENTE';
}
