# IAF Aesthetic - Enfermeria Dermoestetica

Aplicacion de gestion y reserva online para la clinica de Isabel Arriaga (Rivas-Vaciamadrid).

## Requisitos

- Node.js 20+
- npm

## Instalacion

```bash
cd C:\dev\IAF
copy .env.example .env.local
# Rellena las variables NEXT_PUBLIC_FIREBASE_* en .env.local (Firebase Console)
npm install
```

Coloca en `public/images/` los archivos de marca (`logo-iaf.png`, `iaf-flyer.png`, `resultados-tratamiento.png`, `tratamiento-cabina.jpg`) copiados del proyecto anterior si no estan incluidos.

## Desarrollo

Usa **un solo** servidor:

```bash
npm run clean
npm run dev
```

Abre **http://localhost:3000** y recarga con Ctrl+Shift+R si ves la pagina sin estilos.

## Rutas

| Ruta | Descripcion |
|------|-------------|
| `/` | Landing publica |
| `/reserva` | Reserva y gestion de citas |
| `/acceso` | Login del panel |
| `/panel` | Dashboard |
| `/agenda` | Calendario |
| `/pacientes` | Clientes |
| `/facturacion` | Facturas |
| `/gastos` | Gastos |
| `/estadisticas` | Estadisticas |

## Datos

La aplicacion usa **Firebase Firestore** como base de datos (colecciones: `clients`, `appointments`, `therapies`, `invoices`, etc.).

Para desplegar indices compuestos:

```bash
npx firebase-tools deploy --only firestore:indexes --project aif-aesthetic
```

## Arquitectura (rebuild)

- **Layout raiz solo servidor**: la home no carga JS del menu.
- **Grupo `(gestion)`**: panel, agenda, pacientes, etc. con `TopNav`.
- **API publica**: `/api/booking/*` para reservas.
- **API protegida**: `/api/panel/*` (excepto login/status) y `/api/agenda/*` exigen sesion si la proteccion esta activa.
- **Enlaces tipo boton**: componente `LinkButton`, sin `<Link><Button>` anidados.

## Produccion

```bash
npm run build
npm run start
```

Configura las variables de Firebase en `.env.local`, `PANEL_SESSION_SECRET` en `.env` y la contrasena del panel desde `/panel`.
