'use client';

import { useState } from 'react';
import { Shield, HelpCircle, Info, X } from 'lucide-react';
import Link from 'next/link';

export default function AppBar({ showAdmin = false }: { showAdmin?: boolean }) {
  const [showHelp, setShowHelp] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-[#E2E8F0] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold text-[#0F172A] hover:text-[#1565C0] transition-colors uppercase">
              Caducidades FitnessZone
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className="inline-flex items-center gap-2 px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
              title="Cómo usar la aplicación"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Cómo usar</span>
            </button>

            <button
              onClick={() => setShowInfo(true)}
              className="inline-flex items-center gap-2 px-3 py-2 border border-[#CBD5E1] rounded-lg text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
              title="Información de la aplicación"
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Información</span>
            </button>

            {showAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 border border-[#CBD5E1] rounded-lg text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
              >
                <Shield className="w-4 h-4" />
                Administración
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Modal: Cómo usar */}
      {showHelp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-[#1565C0]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">Cómo usar la aplicación</h2>
                  <p className="text-sm text-[#64748B]">Guía rápida de Caducidades FitnessZone</p>
                </div>
              </div>
              <button onClick={() => setShowHelp(false)} className="text-[#64748B] hover:text-[#0F172A]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <section>
                <h3 className="font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1565C0] text-white text-xs flex items-center justify-center">1</span>
                  Importar productos (primera vez)
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  Ve al panel <strong>Administración</strong> → haz clic en <strong>Importar CSV</strong>. Selecciona el fichero exportado desde Excel. El formato debe usar <strong>punto y coma (;)</strong> como separador y guardar los números con coma decimal (ej: <em>35,44</em>). Se recomienda usar primero el botón <strong>Exportar Excel</strong> como plantilla base.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1565C0] text-white text-xs flex items-center justify-center">2</span>
                  Dashboard principal
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  La pantalla principal muestra 4 tarjetas, una por tienda (Las Rosas, Tres Cantos, Ciudad Lineal, Almacén). Cada tarjeta indica cuántos productos hay en cada rango de días. El color de fondo se vuelve rojo cuando hay productos críticos.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1565C0] text-white text-xs flex items-center justify-center">3</span>
                  Ver productos de una tienda
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  Haz clic en cualquier tarjeta de tienda. Verás dos modos: <strong>Venta Recomendada</strong> (filtra solo los que tienen pocos días o están caducados) y <strong>Ver Todos</strong>. Desde aquí puedes marcar productos como vendidos o moverlos entre tiendas.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1565C0] text-white text-xs flex items-center justify-center">4</span>
                  Estados y colores
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  Cada producto tiene un <strong>estado</strong> que puedes cambiar manualmente: Azul (Vigente), Naranja (En Riesgo), Rojo (Caducado), Verde (Vendido), etc. El estado <strong>nunca cambia automáticamente</strong> por la fecha.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1565C0] text-white text-xs flex items-center justify-center">5</span>
                  Mover productos
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  En la vista de tienda, haz clic en <strong>Mover</strong> sobre un producto. Se abrirá un desplegable donde puedes elegir la tienda destino y las unidades a trasladar. Si mueves todas las unidades desde Almacén, el producto original se elimina.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1565C0] text-white text-xs flex items-center justify-center">6</span>
                  Panel de Administración
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  Desde aquí puedes buscar, filtrar, editar, eliminar, importar y exportar productos. También verás el botón <strong>Caducados a fecha</strong>: en rojo significa que hay productos con fecha pasada sin marcar aún. El popup te permite marcarlos todos como Caducado o cancelarlo y gestionarlos uno a uno.
                </p>
              </section>

              <section>
                <h3 className="font-bold text-[#0F172A] mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#1565C0] text-white text-xs flex items-center justify-center">7</span>
                  Resetear base de datos
                </h3>
                <p className="text-sm text-[#475569] leading-relaxed">
                  En Administración, el botón <strong>Resetear BBDD</strong> borra todos los productos. Requiere la contraseña <code className="bg-[#F1F5F9] px-1 rounded text-xs">admin</code>.
                </p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Información */}
      {showInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center">
                  <Info className="w-5 h-5 text-[#1565C0]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#0F172A]">Información de la aplicación</h2>
                  <p className="text-sm text-[#64748B]">Caducidades FitnessZone</p>
                </div>
              </div>
              <button onClick={() => setShowInfo(false)} className="text-[#64748B] hover:text-[#0F172A]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F8FAFC] rounded-xl p-4">
                  <p className="text-xs text-[#64748B] uppercase font-semibold mb-1">Nombre</p>
                  <p className="text-sm font-bold text-[#0F172A]">Caducidades FitnessZone</p>
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-4">
                  <p className="text-xs text-[#64748B] uppercase font-semibold mb-1">Versión</p>
                  <p className="text-sm font-bold text-[#0F172A]">v1.0.0</p>
                </div>
              </div>

              <div className="border border-[#E2E8F0] rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2">Datos del desarrollo</h3>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748B]">Tiempo estimado manualmente</span>
                  <span className="text-sm font-bold text-[#0F172A]">~140 horas</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748B]">Coste estimado manual</span>
                  <span className="text-sm font-bold text-[#DC2626]">~7.000 €</span>
                </div>
                <div className="w-full h-px bg-[#E2E8F0]" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748B]">Tiempo real con IA</span>
                  <span className="text-sm font-bold text-[#059669]">~35 horas</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748B]">Coste real con IA</span>
                  <span className="text-sm font-bold text-[#059669]">~1.750 €</span>
                </div>
                <div className="w-full h-px bg-[#E2E8F0]" />
                <div className="flex justify-between items-center bg-[#ECFDF5] rounded-lg px-3 py-2">
                  <span className="text-sm font-bold text-[#059669]">Ahorro total con IA</span>
                  <span className="text-sm font-bold text-[#059669]">~5.250 € (75%)</span>
                </div>
              </div>

              <div className="bg-[#F8FAFC] rounded-xl p-4 text-xs text-[#64748B] space-y-1">
                <p><strong>Tecnologías:</strong> Next.js 16, React 19, TypeScript, Tailwind CSS, Vercel Blob, TanStack Query</p>
                <p><strong>Hosting:</strong> Vercel Edge Network</p>
                <p><strong>Licencia:</strong> Uso interno exclusivo de FitnessZone</p>
                <p><strong>Creador:</strong> Iván Herrero</p>
                <p><strong>Agente IA:</strong> OpenCode (modelo kimi-k2.6)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
