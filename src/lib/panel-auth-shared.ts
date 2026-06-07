/** Constantes y rutas — compatible con Edge (middleware) */

export const PANEL_SESSION_COOKIE = "panel_session";
export const PANEL_LOCK_COOKIE = "panel_lock";
export const PANEL_CONFIG_ID = "default";
export const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 30;

const PROTECTED_PREFIXES = [
  "/panel",
  "/agenda",
  "/pacientes",
  "/facturacion",
  "/gastos",
  "/estadisticas",
];

export function isProtectedPanelPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function getPanelSessionSecret(): string {
  return (
    process.env.PANEL_SESSION_SECRET ||
    "iaf-dev-panel-secret-cambiar-en-produccion"
  );
}
