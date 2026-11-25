# NKST Community API (`nkst_api`)

Backend API service for the **NKST App MVP** built with **NestJS**, **Express**, **Prisma**, **PostgreSQL**, **JWT JSON:API Authentication**, and **Scalar OpenAPI Documentation**.

## Database Configuration

Configured in `.env`:
- `DB_USER=andaeiii`
- `DB_PASS=password123`
- `DB_NAME=nksst_api`
- `DATABASE_URL="postgresql://andaeiii:password123@localhost:5432/nksst_api?schema=public"`

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npm run prisma:generate

# 3. Run initial PostgreSQL migration
npm run prisma:migrate -- --name init

# 4. Seed permissions, roles, Mkar HQ church, and Platform Admin
npm run prisma:seed

# 5. Start development server
npm run start:dev

# 6. Build and run production server
npm run build
npm run start:prod
```

## Service URLs (Default Port `8080` or `PORT` in `.env`)

- **API Homepage:** `http://localhost:8080/`
- **Scalar Interactive Docs:** `http://localhost:8080/docs`
- **Raw OpenAPI JSON:** `http://localhost:8080/openapi.json`
- **Health Check:** `http://localhost:8080/health`
- **API Base URL:** `http://localhost:8080/api/v1`

## Custom API Homepage

The root URL (`/`) serves a static developer portal landing page for the NKST Digital Platform API without interfering with versioned `/api/v1/*` routes, `/docs`, `/openapi.json`, or `/health`.

### How It Is Served

- Application middleware is configured in `src/config/app-setup.ts` and invoked from `src/main.ts`.
- `/openapi.json`, `/docs`, and `/health` are mounted first, followed by `express.static()` pointed at the compiled `public/` directory with `index: 'index.html'`, `dotfiles: 'deny'`, `redirect: false`, and `fallthrough: true`.
- Any non-matching path falls through to NestJS routing and `AllExceptionsFilter` (returning standard JSON:API 1.1 error envelopes).
- On page load, `app.js` queries `/health` to display live API status, version, environment, and resolved API base URL without exposing sensitive configuration.

### Directory Structure

```text
src/public/
├── index.html   # Landing page markup (Hero, API Info, Implemented Modules, Developer Resources, Footer)
├── styles.css   # Responsive dark forest-charcoal / ivory / gold styling (zero external dependencies)
├── app.js       # Lightweight health-check and runtime metadata hydration
└── favicon.svg  # Inline SVG emblem
```

### Modifying Homepage Content & Styling

- **Content & Modules:** Edit `src/public/index.html`. Keep the **Available Services & Modules** section aligned with implemented NestJS modules under `src/modules/`.
- **Styling & Theme:** Edit CSS custom properties (`:root`) and layout rules in `src/public/styles.css`.
- **Runtime Status Script:** Edit `src/public/app.js`.
- In watch mode (`npm run start:dev`), asset changes in `src/public/` are automatically copied to `dist/public/`.

### Production Asset Bundling

`nest-cli.json` includes:

```json
"assets": [
  {
    "include": "public/**/*",
    "outDir": "dist",
    "watchAssets": true
  }
]
```

Running `npm run build` copies `src/public/**/*` into `dist/public/**/*`. `resolvePublicDir()` in `src/config/app-setup.ts` resolves the asset directory relative to `__dirname` (`../public`), so both development and compiled production execution (`node dist/main`) serve the homepage reliably without depending on source files at runtime.

## Default Seeded Platform Admin

- **Email:** `admin@nkst.org.ng`
- **Phone:** `+2348000000001`
- **Password:** `ChangeMe@123!`
- **Church:** NKST National Headquarters, Mkar (Gboko LGA, Benue State)
