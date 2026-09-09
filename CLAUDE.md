# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"Servicios Neumáticos IMS" — an academic thesis project: an inventory/repair-shop management system for a valve repair workshop ("taller de válvulas"). Monorepo with an Express/MySQL backend and a Create-React-App frontend, run together via Docker Compose.

## Commands

Run from repo root unless noted. `backend/` and `frontend/` are independent npm packages (own `package.json`, own `node_modules`) — install and run inside each.

```bash
# Root: lint both projects concurrently; generate JSDoc into docs/
npm run lint
npm run gen-docs

# Backend (from backend/)
npm run dev              # nodemon server.js — dev server with reload
npm start                # node server.js
npm test                 # cross-env NODE_ENV=test jest --detectOpenHandles
npx jest __tests__/repairOrder.service.test.js   # single test file
npx jest -t "nombre del test"                    # single test by name
npm run lint              # eslint src/**/*.js

# Frontend (from frontend/)
npm start                 # react-scripts start (dev server)
npm run build
npm test                  # react-scripts test (watch mode)
npm run lint               # eslint src/**/*.{js,jsx}
```

Docker Compose (`docker-compose.yml`) brings up MySQL 8.0, the backend (port 3001), and the frontend (port 80) together.

### Backend test database

Backend tests are integration tests that hit a **real MySQL database**, not mocks. `backend/src/config/db.config.js` switches the connection's target schema based on `NODE_ENV`: when `NODE_ENV=test`, it connects to `DB_NAME_TEST` instead of `DB_NAME` (both read from `backend/.env`). Test suites (e.g. `__tests__/repairOrder.api.test.js`) truncate relevant tables in `beforeAll` and seed fixture rows before asserting — a test DB with the schema from `migracion_taller.sql` applied must exist and be reachable before running `npm test`. Never run tests against the dev/prod database.

## Architecture

### Backend: strict three-layer architecture (see `CHECKLIST.md`)

`routes/` → `controllers/` → `services/` → `models/` → MySQL pool (`config/db.config.js`), one file per domain entity in each layer (e.g. `repairOrder.routes.js` → `repairOrder.controller.js` → `repairOrder.service.js` → `models/RepairOrder.js`).

- **Routes**: thin Express routers, just wire paths to controller methods.
- **Controllers**: parse `req`, do basic input-shape validation, call the service, map results/errors to HTTP status + `{ success, message, data }` JSON. No business logic or SQL.
- **Services**: all business logic lives here — validation of business rules, orchestrating multi-step/transactional work across models, whitelisting sort/filter params, shaping DTOs returned to controllers. Business errors are thrown as `Error` with a `.statusCode` property, which controllers read to set the HTTP status.
- **Models**: raw SQL via the `mysql2/promise` pool (`const { pool: db } = require('../config/db.config')`), no business logic. Multi-table writes that must be atomic (e.g. creating a `RepairOrder` and updating its linked `Producto` rows) are wrapped in an explicit transaction started in the service (`db.getConnection()` → `beginTransaction()` → pass the same `connection` into model calls → `commit()`/`rollback()` → `connection.release()` in `finally`).

Enforcing this separation matters more here than in a typical project — `CHECKLIST.md` explicitly calls out "business logic must live in Services, not Controllers" as a review criterion, along with keeping functions small (no 20-30+ line monoliths) and documenting every function with JSDoc comments in Spanish.

### Database

MySQL, schema defined in `migracion_taller.sql` (also the source of truth for the Docker `mysql-taller` service). Naming convention: table names in PascalCase (`OrdenReparacion`, `Producto`, `Cliente`), columns in snake_case (`id_orden_reparacion`, `fecha_creacion`). Core domain: `Cliente` (customer) → `Producto` (a valve/item, tracked through an `EstadoProducto` state machine: Recibido → En Reparación → Reparado → Entregado, etc.) → `OrdenReparacion` (repair order, links a client and its repaired products, tracked via `EstadoOrdenReparacion`) with pricing driven by `PrecioPorCategoria` / `CategoriaCliente`. Once a product reaches "Entregado" its repair history must not be mutated further (business rule, not currently DB-enforced).

### Frontend

Create React App + React Router v7 + Tailwind CSS. Structure under `frontend/src/`:
- `pages/<Domain>/` — one folder per feature area (`Clients`, `Products`, `Receipts`, `RepairOrders`, `Configuration`, `Login`, `Inicio`), each with list/create/update page components.
- `services/<domain>.service.js` — one file per backend module, wraps `fetch` calls to `API_BASE_URL` (from `src/config.js`, defaults to `http://localhost:3001/api`), attaches `Authorization: Bearer <token>` from `localStorage.getItem('user_token')`, and normalizes backend error responses into thrown `Error`s for the UI to catch.
- `contexts/AuthContext.js` — auth state (`user`, `isAuthenticated`) exposed via `useAuth()`.
- `App.js` — all routes are declared here; everything except `/login` is wrapped in a `PrivateRoute` that redirects to `/login` when unauthenticated, then rendered inside the shared `Layout`/`Sidebar` chrome.

When adding a new domain feature, follow the existing pattern end-to-end: backend route/controller/service/model files, a matching frontend `services/*.service.js`, and a `pages/<Domain>/` folder, wired into `App.js`.

## Commit message format

Follow the Conventional Commits style already used throughout this repo's history:

```
type(scope): Descripción breve en español, en modo imperativo

- Capa: detalle de qué se hizo, con `nombres.de(funciones)` y archivos entre backticks.
- Otra capa: idem.
```

- **type**: `feat` for the vast majority of commits so far (also acceptable: `fix`, `test`, `docs`, `refactor` when they truly apply).
- **scope**: the domain/module in kebab-case, matching the feature area — e.g. `payments`, `repair-order`/`repair-orders`, `receipt`/`receipts`, `products`, `pricing`, `ui`. Singular vs. plural is inconsistent in history; pick whichever reads naturally for the scope.
- **subject**: short, in Spanish, starts with a capital or lowercase letter (both appear in history — not strictly enforced), verb first (`Implementar`, `Define`, `Crea`, `Agrega`), no trailing period.
- **body** (optional, used for multi-layer changes): bullet list, one line per architectural layer touched (`Modelo`, `Servicio`, `Controlador y Rutas`, `Integración`, `UI`, `Tests`), each starting with a bold-ish label followed by a colon and a concise description of what changed and why. Wrap function/file names in backticks. Omit the body entirely for small, single-purpose commits.

Example from this repo's history:

```
feat(repair-order): Implementar modificación de órdenes de reparación

- Modelo: Añade `RepairOrder.update` y `Product.unlinkFromRepairOrder`; extiende `findProductPricesByClient` para incluir válvulas "Reparado" desvinculadas.
- Servicio: Implementa `updateRepairOrder` con regla de inmutabilidad sobre órdenes Cerradas (Fail-Fast) y diff transaccional entre válvulas vinculadas y desvinculadas.
- Controlador y Rutas: Expone `PUT /api/repair-orders/:id` con validación de forma y mapeo semántico de errores de negocio (404/409/400).
- Integración: Añade `updateRepairOrder` al servicio frontend.
- UI: Habilita edición de válvulas y precios en `UpdateRepairOrderPage` para órdenes Abiertas; bloquea edición e impresión (tambien por navegador) en órdenes Cerradas/Abiertas según corresponda.
- Tests: Cubre `updateRepairOrder` con pruebas unitarias y de integración para creación, diff, cierre e inmutabilidad.
```
