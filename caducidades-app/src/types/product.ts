export interface Product {
  id: string;
  ubi: string;
  codigo: string;
  sku: string;
  producto: string;
  marca: string;
  tipo: string;
  coste: number;
  uds: number;
  costeTotal: number;
  fecha: string;
  fechaMes: string;
  dias: number;
  estado: string;
  observaciones: string;
  tags: string;
}

export const TIPOS_CATEGORIA = [
  'Proteína',
  'Comida Fitness',
  'Creatina',
  'Carbos / Subidores',
  'Aminoácidos',
  'Salud y Bienestar',
  'Avena / Arroz',
  'Articulaciones',
  'Preentreno / Precursores',
  'Control y Pérdida de peso',
  'Prohormonales',
  'Vitaminas & Minerales',
  'Barritas & Snacks',
  'Omega-3',
];

export const ESTADOS_FIJOS = ['ROTO', 'VENDIDO', 'VENDIDO CADUCADO', 'REGALO CADUCADO', 'MOVIDO'];

export const TIENDAS = [
  { key: 'LR', nombre: 'Las Rosas', color: '#7B1FA2' },
  { key: '3C', nombre: 'Tres Cantos', color: '#43A047' },
  { key: 'CL', nombre: 'Ciudad Lineal', color: '#FBC02D' },
  { key: 'AL', nombre: 'Almacén', color: '#FB8C00' },
] as const;

export type TiendaKey = typeof TIENDAS[number]['key'];
