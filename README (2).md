# Sistema de Tasas para Casa de Cambio

Aplicación web para una compañía de cambio de divisas. Permite administrar las monedas y sus tasas de compra/venta desde un panel protegido y mostrar las tasas vigentes en una **pantalla pública optimizada para TV o monitor vertical (1080×1920)**.

> **Estado del proyecto:** Etapas 1 a 10 completadas. Sistema funcional y listo para producción.
> Este documento se reescribe al terminar cada etapa (ver [Historial de etapas](#historial-de-etapas)).

---

## Tabla de contenido

1. [Qué es el proyecto](#1-qué-es-el-proyecto)
2. [Tecnologías](#2-tecnologías)
3. [Arquitectura](#3-arquitectura)
4. [Estructura de carpetas](#4-estructura-de-carpetas)
5. [Modelo de datos](#5-modelo-de-datos)
6. [Funciones implementadas](#6-funciones-implementadas)
7. [Rutas de la aplicación](#7-rutas-de-la-aplicación)
8. [Seguridad](#8-seguridad)
9. [Conceptos clave para entender el código](#9-conceptos-clave-para-entender-el-código)
10. [Instalación y uso](#10-instalación-y-uso)
11. [Variables de entorno](#11-variables-de-entorno)
12. [Despliegue](#12-despliegue)
13. [Migración a PostgreSQL o MySQL](#13-migración-a-postgresql-o-mysql)
14. [Hoja de ruta](#14-hoja-de-ruta)
15. [Historial de etapas](#historial-de-etapas)

---

## 1. Qué es el proyecto

El sistema tiene dos áreas:

**Área pública** (`/`)
Muestra en una TV o monitor las tasas actuales: bandera, código, nombre, símbolo, precio de compra y precio de venta. Se actualiza sola, avisa visualmente cuando una tasa sube o baja, y sigue funcionando si se pierde la conexión.

**Área administrativa** (`/admin`)
Panel con usuario y contraseña donde el personal:

- Crea, edita, activa/desactiva y ordena monedas.
- Cambia las tasas de compra y venta.
- Consulta el historial de cambios (quién, cuándo, valor anterior y nuevo).
- Configura la compañía (nombre y logo) y administra usuarios *(Etapas 8 y 9)*.

**Requisitos de diseño:** profesional, minimalista, responsive (desktop, laptop, tablet, TV, monitor vertical y teléfono). Base de datos en un archivo local, con la aplicación preparada para migrar a PostgreSQL o MySQL sin reescribirla.

---

## 2. Tecnologías

| Tecnología | Uso |
|---|---|
| **Next.js 16** (App Router) | Framework único para la web pública, el panel y la API |
| **React 19** + **TypeScript** | Interfaz y tipado estricto |
| **Tailwind CSS v4** | Estilos y tokens de diseño (definidos en `globals.css` con `@theme`) |
| **Prisma 6** | ORM. Fijado en la versión 6 por su configuración estable con SQLite |
| **SQLite** | Base de datos local (`data/exchange.db`) |
| **Zod** | Validación de datos en el servidor |
| **bcryptjs** | Hash de contraseñas (JavaScript puro, sin compilar en Windows) |
| **lucide-react** | Íconos |
| **flag-icons** | Banderas en SVG que funcionan sin internet y se ven bien en Windows |
| **Blob** / `Uint8Array` (nativos) | Entrega del logo desde `/api/logo` evitando incompatibilidades de tipos entre `Buffer` y `BodyInit` |
| **clsx** + **tailwind-merge** | Combinar clases CSS (`cn()` en `src/lib/utils.ts`) |
| **server-only** | Hace fallar el build si código del servidor se importa desde el navegador |
| **tsx** | Ejecuta el seed en TypeScript |
| **PM2** | Mantiene la aplicación corriendo en el servidor y la reinicia si falla o si el servidor se reinicia |
| **Caddy** | Proxy inverso con HTTPS automático para el despliegue en VPS |

**Requisito:** Node.js 20.9 o superior (recomendado 22 LTS).

---

## 3. Arquitectura

El código se organiza en capas. Cada capa solo habla con la que tiene debajo:

```
Componentes y páginas (src/app, src/components)
        │  llaman a
        ▼
Server Actions (src/server/actions)      ← reciben datos del navegador, validan permisos y formato
        │
        ▼
Servicios (src/server/services)          ← reglas de negocio y transacciones
        │
        ▼
Repositorios (src/server/repositories)   ← único lugar que habla con Prisma
        │
        ▼
Prisma → SQLite (o PostgreSQL / MySQL)
```

**Por qué así:**

- **Portabilidad de base de datos.** Los repositorios usan solo la API de Prisma (sin SQL crudo) y devuelven tipos propios (`number`, `Date`) definidos en `src/server/domain/types.ts`, nunca objetos de Prisma. Cambiar de motor es cambiar el `provider` y la URL.
- **Seguridad.** Todo lo que está en `src/server` lleva `import "server-only"` (salvo `password.ts`, que el seed también usa fuera de Next).
- **Reglas en un solo sitio.** Las validaciones compartidas entre formulario y servidor (por ejemplo `checkRatePair`) viven en `src/lib` para que nunca se desincronicen.

---

## 4. Estructura de carpetas

```
exchange-system/
├── data/                              Base de datos local (fuera de git)
├── prisma/
│   ├── schema.prisma                  Esquema de la base de datos
│   ├── seed.ts                        Datos iniciales (admin, monedas de ejemplo)
│   └── migrations/                    Migraciones (sí van a git)
├── public/
└── src/
    ├── proxy.ts                       Filtro rápido de /admin (cookie presente)
    ├── app/
    │   ├── layout.tsx                 Layout raíz (fuente, banderas)
    │   ├── globals.css                Tokens de diseño y estilos de la pantalla pública
    │   ├── (public)/                  Pantalla pública
    │   │   ├── page.tsx
    │   │   └── error.tsx              Reintento automático si falla la carga
    │   ├── (auth)/login/              Inicio de sesión
    │   ├── (admin)/admin/             Panel administrativo
    │   │   ├── layout.tsx             Sesión + shell del panel
    │   │   ├── page.tsx               Dashboard
    │   │   ├── currencies/            Listado, /new, /[id]/edit
    │   │   ├── rates/                 Editor de tasas
    │   │   ├── history/               Historial con filtros
    │   │   ├── settings/              (Etapa 8, provisional)
    │   │   └── users/                 (Etapa 9, provisional)
    │   └── api/display/route.ts       API pública de la pantalla
    ├── components/
    │   ├── ui/                        Button, Input, Card, Alert, Select, Switch, TextField, FlagIcon
    │   ├── admin/                     Shell, sidebar, formularios, listas, editor de tasas, paginación
    │   └── display/                   Pantalla pública: filas, reloj, logo, hooks
    ├── config/site.ts                 Nombre, descripción y locale (formato de números y fechas)
    ├── lib/                           Código compartido cliente/servidor
    │   ├── utils.ts                   cn()
    │   ├── format.ts                  Formato de tasas, fechas, porcentajes, tiempo relativo
    │   ├── rates.ts                   Parseo y validación de tasas
    │   ├── history.ts                 Constantes del historial
    │   └── display.ts                 Tipos y lógica de la pantalla pública
    └── server/                        Solo servidor
        ├── db/client.ts               Cliente Prisma y transacciones
        ├── domain/types.ts            Tipos propios de la aplicación
        ├── repositories/              Acceso a datos
        ├── services/                  Lógica de negocio
        ├── actions/                   Server Actions
        ├── validation/                Esquemas Zod
        ├── auth/                      Sesiones, tokens, contraseñas
        └── format.ts                  Fechas con la zona horaria configurada
```

> El alias `@/*` apunta a `./src/*`. No debe existir una carpeta `app/` en la raíz: Next.js le daría prioridad sobre `src/app`.

---

## 5. Modelo de datos

| Modelo | Tabla | Descripción |
|---|---|---|
| `User` | `users` | Usuario del panel. Rol como texto (`ADMIN` u `OPERATOR`), contador de intentos fallidos y bloqueo temporal |
| `Session` | `sessions` | Sesión activa. Guarda solo el **hash** del token, nunca el token |
| `Currency` | `currencies` | Moneda: código único, nombre, símbolo, código de bandera, `buyRate`, `sellRate`, orden, estado y `ratesUpdatedAt` |
| `RateHistory` | `rate_history` | Un registro por cada cambio de tasas: valores anterior y nuevo, fecha, usuario |
| `CompanySetting` | `company_settings` | Un único registro (`id = "singleton"`): nombre, logo (`logoData`/`logoMimeType`), nota del pie, segundos de actualización, monedas por pantalla y segundos de rotación |

Decisiones para que el esquema sea portable:

- Los roles son **texto**, no enums (no todos los motores los soportan igual).
- Los usuarios se guardan en **minúsculas** desde el repositorio, porque MySQL ignora mayúsculas y SQLite/PostgreSQL no.
- El historial guarda una **copia** del código de la moneda y del nombre del usuario, así sigue siendo legible aunque cambien o se eliminen.
- Las monedas **no se eliminan**: se desactivan, porque el historial las referencia (`onDelete: Restrict`).
- Las tasas son `Decimal` en la base y `number` en la aplicación (los repositorios convierten).
- El logo se guarda **dentro de la base de datos** (`Bytes`), no en el disco: funciona igual en un VPS con SQLite o en un despliegue con PostgreSQL sin carpetas de subida que configurar. `settingsRepository.get()` nunca trae esos bytes (solo `hasLogo`); se leen aparte en `/api/logo`.

---

## 6. Funciones implementadas

### 6.1 Autenticación (Etapa 3)

- Inicio de sesión con usuario y contraseña, con botón para mostrar/ocultar la contraseña.
- Sesión de **8 horas** guardada en la base de datos y enlazada a una cookie `exchange_session`.
- **Bloqueo:** 5 intentos fallidos bloquean al usuario 15 minutos. Al bloquear, el contador vuelve a 0.
- Cierre de sesión, que borra la sesión en la base y la cookie.
- Redirección `?next=` tras el login, restringida a rutas de `/admin` (evita *open redirect*).
- Si ya hay una sesión válida, `/login` redirige a `/admin`.

### 6.2 Panel administrativo (Etapa 4)

- **Sidebar fijo** desde 1024 px; en tablet y teléfono es un menú deslizable (se cierra con el fondo, `Esc` o al elegir una opción).
- **Roles en el menú:** "Monedas", "Configuración" y "Usuarios" solo aparecen para `ADMIN`. Ocultar el enlace no es seguridad: cada página y acción valida el rol en el servidor.
- **Dashboard:** monedas activas e inactivas, cambios en 24 horas, última actualización, tasas vigentes y últimos cambios.
- Enlace a la pantalla pública (se abre en otra pestaña).

### 6.3 Gestión de monedas (Etapa 5) — solo `ADMIN`

- **Listado** con búsqueda instantánea (sin distinguir tildes: `dolar` encuentra `Dólar`).
- **Activar/desactivar** con un interruptor. Las inactivas no aparecen en la pantalla pública.
- **Ordenar** con flechas subir/bajar (funciona igual en teléfono, tablet y teclado). Se deshabilitan mientras hay una búsqueda activa.
- **Crear** con datos, tasas iniciales y estado. Registra la "alta inicial" en el historial dentro de una transacción.
- **Editar** solo datos descriptivos (código, nombre, símbolo, bandera). Las tasas se cambian en la sección Tasas para que cada cambio quede en el historial.
- **Validaciones:** código único (2–8 caracteres, letras/números/guion), nombre 2–60 caracteres, bandera de 2 letras, y la venta no puede ser menor que la compra. El formulario conserva lo escrito tras un error.
- **No existe eliminar**, a propósito.

### 6.4 Tasas e historial (Etapa 6)

**Editor de tasas** (`ADMIN` y `OPERATOR`)

- Una sola pantalla con todas las monedas. Solo se envían las filas **modificadas**.
- Acepta `58.5` o `58,5`, hasta 6 decimales.
- **Guardado atómico:** todos los cambios se aplican o ninguno. Cada moneda que realmente cambió genera una fila en el historial; las que no cambiaron no lo ensucian.
- **Control de concurrencia:** si otra persona modificó la misma moneda mientras editabas, se rechaza el guardado con un aviso y la opción de recargar. Ver [concurrencia optimista](#concurrencia-optimista).
- **Aviso de error de digitación:** si una tasa cambia un 10 % o más, aparece una advertencia ámbar (no bloquea).
- Barra de guardado fija, botón "Descartar" y aviso del navegador al cerrar la pestaña con cambios sin guardar.

> Limitación conocida: el aviso de cambios sin guardar cubre cerrar o recargar la pestaña, no la navegación interna por el menú.

**Historial** (`ADMIN` y `OPERATOR`)

- Cada fila: fecha, moneda, compra y venta (valor anterior tachado → nuevo, con flecha y diferencia) y usuario.
- Filtros por moneda y por período (24 h, 7 días, 30 días, todo). Los filtros viven en la URL, así que se pueden compartir.
- Paginación de 25 registros. Una página inexistente muestra la última.
- Tabla en pantallas de 1280 px o más; tarjetas apiladas en el resto.

### 6.5 Pantalla pública (Etapa 7)

- **Diseño escalable:** todo se mide con una unidad propia `u` (`--u = min(1vw, 0.5625vh)`). El lienzo mide 100u × 177.78u (9:16). En 1080×1920, `1u = 10.8 px`; en 4K vertical se ve idéntico, solo más grande. En otras pantallas se muestra la misma composición centrada, sin deformarse.
- **Legibilidad:** fondo azul oscuro, texto blanco, compra y venta como lo más grande. El tamaño del número se reduce solo si algún valor es muy largo.
- **Actualización automática:** consulta `/api/display` cada `refreshSeconds` (mínimo 10 s).
- **Cambios de tasa:** la fila destella y aparece una flecha verde (sube) o roja (baja) durante 30 s.
- **Muchas monedas:** hasta 12 por página; si hay más, se reparten en páginas equilibradas (13 → 7 + 6) que rotan cada 15 s con puntos indicadores.
- **Sin conexión:** conserva las últimas tasas, muestra un aviso ámbar y reintenta cada 10 s. Se recupera sola al volver la red.
- **Pantalla siempre encendida:** recarga automática cada 12 h (solo tras una respuesta exitosa) y bloqueo de suspensión con la Wake Lock API (requiere HTTPS o `localhost`).
- **Pantalla completa:** botón que aparece al mover el mouse y se oculta a los 3 s junto con el cursor. También con la tecla `F`.
- **Errores de carga inicial:** `error.tsx` muestra "Tasas no disponibles" y reintenta cada 10 s.
- Reloj con hora y fecha en la zona horaria configurada.

**Cómo dejarla en la TV**

- Gira la pantalla en el sistema operativo (Windows: *Configuración → Pantalla → Orientación → Vertical*).
- Modo quiosco en Chrome/Windows:
  ```
  "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --noerrdialogs --disable-infobars http://IP-DEL-SERVIDOR:3000/
  ```
- Si la TV accede por `http://192.168.x.x` (sin HTTPS), desactiva la suspensión desde las opciones de energía del equipo.

### 6.6 Configuración de la compañía (Etapa 8) — solo `ADMIN`

**General**

- Nombre de la compañía (se refleja en el panel, `/login` y la pantalla pública), nota del pie (opcional, hasta 160 caracteres) y segundos de actualización de `/api/display` (10 a 3600).
- **Monedas por pantalla** (`rowsPerPage`, 3 a 20): cuántas filas caben en una página de la pantalla pública.
- **Segundos entre páginas** (`rotationSeconds`, 5 a 120): cada cuánto rota a la siguiente página. Solo se nota cuando hay más monedas activas que las que caben en una página; con todo en una sola página, los puntos indicadores del pie desaparecen.
- Todo en un solo formulario con validación Zod y errores por campo. Los cambios se aplican en la pantalla pública **sin recargarla**, en el siguiente ciclo de `refreshSeconds`.

**Logo**

- Se guarda dentro de la base de datos, no en el disco (ver [§5](#5-modelo-de-datos)).
- Formatos admitidos: **PNG, JPG, WEBP**. Se descarta SVG a propósito (puede llevar JavaScript embebido y lo vería cualquiera que abra la pantalla pública).
- Tamaño máximo: **1.5 MB**, validado en el navegador antes de subir y de nuevo en el servidor.
- Vista previa local del archivo elegido antes de subirlo; vista previa del logo ya guardado.
- Reemplazar sube uno nuevo en el lugar del anterior (no se acumulan archivos); quitar vuelve al ícono genérico.
- Se sirve por `/api/display` con caché agresiva (`Cache-Control: immutable`) porque la URL incluye `?v=<marca de tiempo>` y cambia cada vez que el logo cambia.

### 6.7 Usuarios (Etapa 9) — solo `ADMIN`

- **Listado** con rol, estado, última vez que entró (o "Nunca ha ingresado") y una etiqueta "Tú" en la propia cuenta.
- **Crear** con usuario (inmutable tras crearlo, solo minúsculas/números/`.`/`-`/`_`), nombre, contraseña (mínimo 10 caracteres, con confirmación) y rol.
- **Editar** nombre, rol y estado activo/inactivo. El nombre de usuario no se puede cambiar.
- **Activar/desactivar** con un interruptor en el listado, igual que las monedas.
- **Restablecer contraseña** desde un formulario aparte en la página de edición, sin pedir la contraseña actual (la sesión del administrador ya es la autorización). Los campos se limpian tras guardar.
- **Regla del último administrador:** no se puede desactivar ni cambiar a `OPERATOR` al último `ADMIN` activo. Se calcula contando administradores activos en la base, así que protege también ante una llamada directa a la acción del servidor, no solo el clic accidental en el panel.
- **No existe eliminar**, igual que con las monedas: se desactiva en su lugar.
- Si un administrador se desactiva o degrada a sí mismo (permitido cuando hay más de un `ADMIN` activo), su sesión deja de ser válida en la siguiente petición y vuelve a `/login` automáticamente.

### 6.8 Producción (Etapa 10)

- **Respaldos automáticos:** `npm run db:backup` copia `data/exchange.db` a `backups/` con fecha en el nombre y elimina los de más de 30 días. Se programa con `cron` (Linux) o el Programador de tareas (Windows).
- **Restauración probada:** procedimiento documentado para detener la aplicación, sustituir el archivo de base de datos por un respaldo y reiniciar.
- **Build más liviano:** `next.config.ts` con `output: "standalone"`, que empaqueta solo lo necesario para ejecutar en producción (`.next/standalone/server.js`).
- **Configuración de Prisma modernizada:** `prisma.config.ts` reemplaza el bloque obsoleto `package.json#prisma`.
- **Guía de despliegue en VPS/mini PC:** Node 22, firewall (`ufw`), PM2 para mantener la app corriendo, Caddy para HTTPS automático con dominio propio, y un flujo de actualización con `git pull`.
- **Lista de verificación final** antes de dar el sistema por listo (contraseñas, variables de entorno, respaldo probado, HTTPS, dos administradores activos, etc.).
- **Guía de migración a PostgreSQL o MySQL** para cuando el negocio lo requiera: cambiar `datasource` en `schema.prisma`, regenerar migraciones y volver a correr el seed, sin tocar repositorios, servicios, acciones ni componentes.

---

## 7. Rutas de la aplicación

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Público | Pantalla de tasas para TV |
| `/api/display` | Público | JSON con monedas activas y datos de la compañía (`Cache-Control: no-store`) |
| `/login` | Público | Inicio de sesión |
| `/admin` | Sesión | Dashboard |
| `/admin/rates` | `ADMIN`, `OPERATOR` | Editor de tasas |
| `/admin/history` | `ADMIN`, `OPERATOR` | Historial |
| `/admin/currencies` | `ADMIN` | Listado de monedas |
| `/admin/currencies/new` | `ADMIN` | Crear moneda |
| `/admin/currencies/[id]/edit` | `ADMIN` | Editar moneda |
| `/admin/settings` | `ADMIN` | Configuración: nombre, nota del pie, actualización, paginación y logo |
| `/admin/users` | `ADMIN` | Listado de usuarios |
| `/admin/users/new` | `ADMIN` | Crear usuario |
| `/admin/users/[id]/edit` | `ADMIN` | Editar usuario y restablecer contraseña |
| `/api/logo` | Público | Logo de la compañía. `404` si no hay uno configurado |

---

## 8. Seguridad

| Medida | Detalle |
|---|---|
| Contraseñas | bcrypt con costo 12 |
| Token de sesión | 32 bytes aleatorios; en la base solo se guarda su hash SHA-256, así que robar la base no permite suplantar sesiones |
| Cookie | `HttpOnly`, `SameSite=Lax`, `Secure` en producción, expira a las 8 h |
| Fuerza bruta | 5 fallos bloquean 15 min; se ejecuta un bcrypt de relleno cuando el usuario no existe para igualar tiempos de respuesta |
| Mensajes de error | Genéricos ("Usuario o contraseña incorrectos") para no revelar si el usuario existe o está desactivado |
| Protección de rutas | Dos capas: `proxy.ts` (¿hay cookie?) y `requireUser()` / `requireRole()` (¿la sesión es real?) |
| Autorización | Cada Server Action y página valida el rol en el servidor, no solo en el menú |
| CSRF | Los Server Actions verifican el origen; la cookie es `SameSite=Lax` |
| Redirecciones | `?next=` solo acepta rutas internas de `/admin` |
| Validación | Zod en el servidor para todo lo que llega del navegador; los parámetros de URL desconocidos se ignoran |
| Cabeceras | `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`; se oculta `X-Powered-By` |
| Datos públicos | `/api/display` solo expone monedas activas y datos de la compañía |

---

## 9. Conceptos clave para entender el código

**Server Components y Server Actions.** Las páginas de `src/app` se ejecutan en el servidor y pueden leer la base de datos directamente (a través de servicios). Los formularios y botones llaman a **Server Actions** (archivos con `"use server"`), funciones que se ejecutan en el servidor pero se invocan desde el navegador. Son públicas de facto, por eso cada una empieza validando la sesión.

**`requireUser()` y `requireRole()`** (`src/server/auth/session.ts`). Devuelven el usuario actual o redirigen a `/login` (o a `/admin` si el rol no alcanza). Los layouts no se vuelven a ejecutar en cada navegación interna, así que **cada página y cada acción protegida las llama por su cuenta**.

**Repositorios.** Un archivo por tabla en `src/server/repositories`. Reciben un parámetro opcional `db` para poder ejecutarse dentro de una transacción (`withTransaction`). Se importan desde `@/server/repositories` como `currencyRepository`, `userRepository`, etc.

**Servicios.** Contienen las reglas de negocio y las transacciones. Ejemplo: `createCurrency` crea la moneda **y** su alta inicial en el historial, todo o nada.

**Estados de formulario.** Los formularios usan `useActionState`. La acción devuelve `{ error, fieldErrors, values }` y el formulario conserva lo escrito y muestra cada error bajo su campo.

<a id="concurrencia-optimista"></a>
**Concurrencia optimista.** Al cargar `/admin/rates`, cada moneda lleva su `ratesUpdatedAt` como "versión". Al guardar, el servidor hace un `updateMany` condicionado a esa versión (`updateRatesIfUnchanged`). Si otra persona guardó antes, cuenta 0 filas afectadas: se detecta el conflicto, se deshace toda la transacción y se avisa. Funciona igual en SQLite, PostgreSQL y MySQL.

**Validación compartida de tasas** (`src/lib/rates.ts`). `parseRate` y `checkRatePair` los usan tanto el formulario (para avisar mientras escribes) como el servidor (para no confiar en el navegador).

**Unidad `u` de la pantalla pública.** `u(6)` en `components/display/layout.ts` equivale a `calc(var(--u) * 6)`. Como `--u` depende del tamaño de la pantalla, todo el diseño escala proporcionalmente sin media queries.

**Actualización de la pantalla.** `useDisplayData` consulta `/api/display`, compara con los datos anteriores (`diffRates`) para marcar qué tasas subieron o bajaron, y ante un fallo conserva los últimos datos y reintenta. El servidor entrega los textos ya formateados (`buyText`, `sellText`).

**Banderas.** `FlagIcon` usa el paquete `flag-icons` (clases `fi fi-us`). El tamaño lo controla el `font-size` del contenedor. En la base se guarda solo el código ISO de 2 letras (`us`, `eu`, `gb`, `do`), no el emoji, porque Windows no dibuja bien las banderas emoji.

**Formato de números y fechas.** `siteConfig.locale` en `src/config/site.ts` controla el formato: `"es"` usa coma decimal (`58,50`) y `"es-DO"` usa punto (`58.50`). La zona horaria se define con `APP_TIMEZONE`.

**`Buffer` vs `Uint8Array<ArrayBuffer>`/`BlobPart`.** Con las versiones recientes de `@types/node`, `Buffer` se tipa como `Buffer<ArrayBufferLike>`, un tipo más amplio que el `Uint8Array<ArrayBuffer>` que exigen los campos `Bytes` de Prisma y el `BodyInit`/`BlobPart` de la API `Response`. Por eso `settings.repository.ts` usa `Uint8Array.from(buffer)` antes de guardar o leer el logo, y `api/logo/route.ts` construye un `Blob` a partir de ese `Uint8Array` en vez de pasar el `Buffer` directo. El contenido es idéntico; solo cambia el tipo con el que TypeScript lo describe.

**Límite de tamaño de los Server Actions.** Next.js limita a 1 MB el cuerpo de una petición a un Server Action por defecto. Como el logo admite hasta 1.5 MB, `next.config.ts` sube ese límite con `experimental.serverActions.bodySizeLimit`.

---

## 10. Instalación y uso

```bash
# 1. Instalar dependencias (genera el cliente de Prisma automáticamente)
npm install

# 2. Crear el archivo de variables de entorno
cp .env.example .env         # en Windows: copy .env.example .env
# Edita .env y define SEED_ADMIN_PASSWORD (mínimo 10 caracteres)

# 3. Crear la base de datos, datos iniciales y arrancar
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Abre `http://localhost:3000/` (pantalla pública) y `http://localhost:3000/login` (panel).

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm start` | Servidor de producción |
| `npm run lint` | Revisión de código |
| `npm run db:migrate` | Crea/aplica migraciones en desarrollo |
| `npm run db:seed` | Datos iniciales (seguro de repetir: no duplica ni sobrescribe) |
| `npm run db:studio` | Explorador visual de la base en `http://localhost:5555` |
| `npm run db:reset` | Borra y recrea la base (**destruye los datos**) |
| `npm run db:backup` | Copia `data/exchange.db` a `backups/` con fecha en el nombre; borra respaldos de más de 30 días |

### Datos iniciales (seed)

Crea la configuración de la compañía, el usuario administrador (con `SEED_ADMIN_USERNAME` y `SEED_ADMIN_PASSWORD`) y 8 monedas de ejemplo (USD, EUR, GBP, CAD, CHF, MXN, BRL, COP). Las tasas de ejemplo son ficticias: se cambian desde el panel.

---

## 11. Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Ruta de la base. SQLite: `file:../data/exchange.db` (relativa a la carpeta `prisma/`) |
| `SEED_ADMIN_USERNAME` | Usuario administrador inicial (solo el seed) |
| `SEED_ADMIN_PASSWORD` | Contraseña inicial, mínimo 10 caracteres (solo el seed) |
| `SESSION_COOKIE_SECURE` | `"true"` fuerza cookie `Secure`, `"false"` la desactiva. Vacío: `Secure` solo en producción. Ponlo en `"false"` si en producción usas HTTP en una red local |
| `APP_TIMEZONE` | Zona horaria para fechas y horas (ej. `America/Santo_Domingo`). Vacío: la del servidor |
| `DIRECT_URL` | Solo con PostgreSQL en Neon/Vercel: conexión directa sin *pooling* |

`.env` no se sube a git. `.env.example` sí, sin claves reales.

---

## 12. Despliegue

**Requisito según la base de datos:** SQLite necesita un servidor con **disco persistente**. No funciona en Vercel, cuyas funciones tienen disco de solo lectura.

### Vercel + PostgreSQL (solo pruebas)

- Se usa una rama aparte (`vercel-test`) con `provider = "postgresql"`, `directUrl`, y `"build": "prisma db push --skip-generate && next build"`.
- Base gratuita en Neon: `DATABASE_URL` con *pooling* (`&pgbouncer=true`) y `DIRECT_URL` sin *pooling*.
- El esquema y el seed se aplican una vez desde el computador local con las variables apuntando a Neon.
- El plan Hobby de Vercel es solo para uso personal y no comercial.
- La base de Neon es accesible desde internet: usar una contraseña de administrador fuerte.

### VPS o mini PC con SQLite (recomendado para producción)

```bash
git clone <repositorio> && cd exchange-system
# crear .env (usar SEED_ADMIN_PASSWORD fuerte y real)
npm ci
npx prisma migrate deploy
npm run db:seed
npm run build
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
sudo npm install -g pm2
PORT=3000 pm2 start .next/standalone/server.js --name exchange
pm2 save && pm2 startup
```

- HTTPS con **Caddy** y un dominio propio (certificado automático, `reverse_proxy localhost:3000`). Sin HTTPS, `SESSION_COOKIE_SECURE="false"` y accede por IP local.
- Firewall (`ufw`) con los puertos 80 y 443 abiertos. En Oracle Cloud, también hay que abrirlos en la *Security List* de la consola.
- Actualizar: `git pull && npm ci && npx prisma migrate deploy && npm run build`, recopiar `public`/`.next/static` y `pm2 restart exchange`.
- Opciones de alojamiento: Oracle Cloud "Always Free" (la única con disco persistente gratuito; capacidad no garantizada), Railway o Fly.io (de pago tras la prueba), un VPS económico, o un mini PC en la compañía (con Cloudflare Tunnel si hace falta acceso externo).
- **Respaldos automáticos** con `npm run db:backup` programado por `cron`; copiar `backups/` fuera del servidor de vez en cuando. Restauración probada y documentada (ver `scripts/backup.mjs` y el procedimiento de restauración en la Etapa 10).

### Lista de verificación antes de producción

- Contraseña de administrador real y fuerte (no la de pruebas).
- `.env` fuera de git; `SESSION_COOKIE_SECURE` correcto según haya o no HTTPS; `APP_TIMEZONE` real.
- Al menos dos usuarios `ADMIN` activos.
- Respaldo automático programado y una restauración probada al menos una vez.
- Pantalla pública probada en la TV real, en modo quiosco.
- PM2 configurado para reiniciar la app si el servidor se reinicia (`pm2 startup` + `pm2 save`).

---

## 13. Migración a PostgreSQL o MySQL

Cuando el negocio lo requiera (varias sucursales, más tráfico, o un proveedor con base de datos administrada):

1. Cambiar `provider` en `prisma/schema.prisma` (`postgresql` o `mysql`) y, para PostgreSQL, agregar `directUrl`.
2. Cambiar `DATABASE_URL` (y `DIRECT_URL` en PostgreSQL).
3. Borrar `prisma/migrations` y generar migraciones nuevas para el motor elegido (`npx prisma migrate dev --name init_<motor>`).
4. Ejecutar `npm run db:seed`.

No requiere tocar servicios, acciones ni componentes, porque:

- Los repositorios usan solo la API de Prisma, sin SQL crudo.
- Los roles son texto, no enums.
- Los nombres de usuario se normalizan a minúsculas antes de guardarse.
- La concurrencia se controla con `updateMany` condicionado (`updateRatesIfUnchanged`), no con funciones propias del motor.
- El resto de la aplicación solo ve tipos propios (`number`, `Date`).

Tras migrar, el script de respaldo (`scripts/backup.mjs`, que copia el archivo `.db`) debe reemplazarse por `pg_dump` o `mysqldump` según el motor.

---

## 14. Hoja de ruta

| # | Etapa | Estado |
|---|---|---|
| 1 | Proyecto base: Next.js, Tailwind, estructura de carpetas, tokens de diseño | ✅ Completada |
| 2 | Base de datos: Prisma + SQLite, esquema, repositorios, seed | ✅ Completada |
| 3 | Autenticación: login, sesiones seguras, logout, protección de `/admin` | ✅ Completada |
| 4 | Layout del admin: sidebar responsive, dashboard | ✅ Completada |
| 5 | Gestión de monedas: crear, editar, activar/desactivar, ordenar | ✅ Completada |
| 6 | Tasas e historial: edición con auditoría, concurrencia, filtros | ✅ Completada |
| 7 | Pantalla pública: TV vertical, autorefresco, sin conexión, pantalla completa | ✅ Completada |
| 8 | Configuración de la compañía: nombre, nota del pie, actualización, paginación, logo | ✅ Completada |
| 9 | Usuarios: administrar usuarios y roles | ✅ Completada |
| 10 | Producción: pruebas, respaldos, despliegue, guía de migración a PostgreSQL/MySQL | ✅ Completada |

**Posible mejora futura (no implementada):** ocultar las tasas en la pantalla pública tras un tiempo prolongado sin conexión, para no mostrar precios desactualizados. Se puede agregar si se desea.

---

## Historial de etapas

Registro de lo realizado en cada etapa. Se agrega una entrada al terminar cada una.

### Etapa 1 — Proyecto base
- Proyecto creado con `create-next-app` (TypeScript, ESLint, Tailwind, `src/`, App Router, alias `@/*`).
- Estructura de carpetas, tokens de diseño (paleta azul corporativa, colores de compra/venta, superficies) y fuente Inter.
- Grupos de rutas `(public)`, `(auth)` y `(admin)` con páginas provisionales.
- Carpeta `data/` excluida de git.
- **Corrección posterior:** `create-next-app` había creado `app/` en la raíz y el alias `@/*` apuntaba a `./*`; se movió todo a `src/` y se corrigió `tsconfig.json`.

### Etapa 2 — Base de datos
- Prisma 6 + SQLite. Modelos `User`, `Session`, `Currency`, `RateHistory`, `CompanySetting`.
- Capa de repositorios con tipos de dominio propios (`server-only`, sin SQL crudo).
- Cliente Prisma con soporte de transacciones (`withTransaction`).
- Seed idempotente: configuración, administrador, 8 monedas de ejemplo con su alta inicial en el historial.
- Scripts `db:migrate`, `db:seed`, `db:studio`, `db:reset`.

### Etapa 3 — Autenticación
- Login con Server Action y Zod. Sesiones en base de datos con token hasheado (SHA-256) y cookie `HttpOnly`.
- Bloqueo tras 5 intentos fallidos (15 min) y bcrypt de relleno contra enumeración de usuarios.
- `requireUser()` / `requireRole()`; `proxy.ts` como filtro rápido de `/admin`.
- Redirección `?next=` segura; cabeceras de seguridad en `next.config.ts`.
- Componentes UI base: `Button`, `Input`, `Label`, `Alert`.

### Etapa 4 — Layout del admin
- Sidebar responsive (fijo en escritorio, deslizable en móvil y tablet), cabecera con usuario y rol.
- Navegación por roles. Dashboard con indicadores, tasas actuales y últimos cambios (servicio `dashboard.service.ts`).
- Helpers de formato (`format.ts`) y zona horaria con `APP_TIMEZONE`.
- Páginas provisionales para todas las secciones; `Card`, `PageHeader`, `StatCard`; `buttonClasses` para dar aspecto de botón a enlaces.

### Etapa 5 — Gestión de monedas
- Listado con búsqueda sin tildes, interruptor activa/inactiva y reordenamiento con flechas.
- Crear (con alta inicial en historial, transaccional) y editar datos descriptivos.
- Validación Zod con errores por campo; regla "venta ≥ compra". Sin eliminar: solo desactivar.
- Banderas con `flag-icons`. Componentes `FlagIcon`, `Switch`, `TextField`. "Monedas" solo para `ADMIN`.

### Etapa 6 — Tasas e historial
- Editor de tasas con guardado atómico de solo las filas modificadas.
- Control de concurrencia optimista con `ratesUpdatedAt`; aviso de cambios grandes (≥ 10 %); aviso al cerrar con cambios sin guardar.
- Historial con filtros por moneda y período (en la URL) y paginación de 25.
- Validación compartida cliente/servidor (`src/lib/rates.ts`). `Alert` con variantes, `Select` nuevo.
- Operadores y administradores pueden cambiar tasas y ver el historial.

### Etapa 7 — Pantalla pública
- Diseño escalable con la unidad `u` para 1080×1920, 4K vertical y otras resoluciones.
- Endpoint público `/api/display` con textos ya formateados; autorefresco con reintentos y modo sin conexión.
- Destello y flecha verde/roja cuando una tasa cambia; rotación de páginas con más de 12 monedas.
- Reloj, pantalla completa (botón y tecla `F`), Wake Lock, recarga preventiva cada 12 h, `error.tsx` con reintento automático.
- Pruebas de despliegue: guía para Vercel + Neon (rama `vercel-test`) y comparativa de alojamiento para SQLite.

### Etapa 8 — Configuración de la compañía
- Formulario "General": nombre, nota del pie, segundos de actualización, **monedas por pantalla** (`rowsPerPage`) y **segundos de rotación** (`rotationSeconds`); estos dos últimos se agregaron sobre la etapa original para poder ajustar la paginación de la pantalla pública sin tocar código.
- Logo guardado **dentro de la base de datos** (`Bytes`), servido por `/api/logo` con caché agresiva (`?v=` por versión) y `404` si no hay uno configurado. Admite PNG/JPG/WEBP hasta 1.5 MB, con vista previa local antes de subir.
- `settingsRepository.get()` nunca trae los bytes del logo (solo `hasLogo`); se leen aparte solo en la ruta que los sirve.
- `display.service.ts` entrega `rowsPerPage` y `rotationSeconds` ya recortados a su rango válido; `display-screen.tsx` los usa en vez de constantes fijas, así que un cambio en Configuración se refleja solo, en el siguiente ciclo de actualización.
- Correcciones de tipos propias de TypeScript/Node recientes: `Buffer` → `Uint8Array.from(...)` para los campos `Bytes` de Prisma y para construir el `Blob` de la respuesta; `bodySizeLimit` de los Server Actions subido a 2 MB en `next.config.ts` para admitir el logo.

### Etapa 9 — Usuarios
- CRUD de usuarios (sin eliminar, solo desactivar) reutilizando los repositorios de las Etapas 2 y 3, sin cambios de esquema.
- Nombre de usuario inmutable tras crearlo. Roles `ADMIN`/`OPERATOR` con `Select`.
- Restablecer contraseña en un formulario aparte, sin pedir la contraseña actual.
- Regla central: `assertNotRemovingLastAdmin` en `user.service.ts` impide desactivar o degradar al último administrador activo, contando en la base (no comparando con la sesión actual), así que también protege una llamada directa a la acción.
- Efecto colateral esperado: un administrador que se desactiva o degrada a sí mismo (permitido con más de un `ADMIN` activo) pierde su sesión en la siguiente petición.

### Etapa 10 — Producción
- Configuración de Prisma modernizada: `prisma.config.ts` reemplaza el bloque obsoleto `package.json#prisma`.
- `next.config.ts` con `output: "standalone"` para un build de producción más liviano (`.next/standalone/server.js`, con `public` y `.next/static` copiados aparte).
- Script `scripts/backup.mjs` (`npm run db:backup`): copia con fecha, limpieza de respaldos de más de 30 días; procedimiento de restauración documentado y probado.
- Guía completa de despliegue en VPS/mini PC: Node 22, firewall, PM2, Caddy con HTTPS automático, flujo de actualización con `git pull`.
- Lista de verificación final antes de producción y guía de migración a PostgreSQL/MySQL.
- Corrección de linting en `logo-manager.tsx`: se separó el ajuste de estado durante el render (limpiar la vista previa) de los efectos imperativos (refrescar datos, resetear el `<input type="file">`), siguiendo la regla `react-hooks/set-state-in-effect`.

---

**Proyecto completo.** Las 10 etapas están implementadas y verificadas. El sistema está listo para desplegarse en producción siguiendo la guía de la [sección 12](#12-despliegue).
