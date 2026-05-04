# Architecture Notes: CadFZ

## Vercel Blob Persistence
- Server Actions READ only (client fetches via `/api/products` for writes)
- Immutable blob pattern: write NEW blobs with unique names, read latest by `uploadedAt`
- Cleanup: keeps last 10 blobs

## Date Handling
- Supports ISO `YYYY-MM-DD` and Spanish `DD/MM/YYYY`
- `dias` recalculated on every read from current date
- Products without date: `dias = null` (shows as blank, not -9999)

## Estado (Manual + CaducadosModal)
- Estado is normally NEVER auto-changed by date.
- **Exception**: The `CaducadosModal` popup shows products whose fecha < hoy and estado is not final. The user can click "Aceptar" to send `POST /api/products/caducar-batch` to mark them as `CADUCADO` explicitly. This is a deliberate opt-in (Option A).
- Roto/Vendido/Movido are final states via API.

## Layout
- Dashboard: 2-column cards with active product counts + collapsible "Resto de estados"
- Tienda view: dual-mode toggle (Venta Recomendada / Ver Todos) and modal Mover
- Admin: Table with filters, CRUD via API routes, "Caducados a fecha" panel with totals

## Key UI Rules
- Card background `#FEF2F2` when `dias != null && dias < 60`
- Fallback to `observaciones` when `producto`, `marca`, or `tipo` is `#N/A` or empty
- Spanish date format `DD/MM/YYYY` supported alongside ISO
