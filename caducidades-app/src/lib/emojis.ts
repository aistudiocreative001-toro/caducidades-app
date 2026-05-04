export const EMOJIS_CATEGORIA: Record<string, string> = {
  'Proteína': '🥩',
  'Comida Fitness': '🥗',
  'Creatina': '💪',
  'Carbos / Subidores': '🍞',
  'Aminoácidos': '🧬',
  'Salud y Bienestar': '❤️',
  'Avena / Arroz': '🌾',
  'Articulaciones': '🦴',
  'Preentreno / Precursores': '🚀',
  'Control y Pérdida de peso': '⚖️',
  'Prohormonales': '🧪',
  'Vitaminas & Minerales': '💊',
  'Barritas & Snacks': '🍫',
  'Omega-3': '🐟',
};

export function getEmojiCategoria(tipo: string): string {
  return EMOJIS_CATEGORIA[tipo] || '📦';
}
