# NKST Community API (`nkst_api`)

Backend API service for the **NKST App MVP** built with **NestJS**, **Prisma**, **PostgreSQL**, **JWT JSON:API Authentication**, and **Scalar OpenAPI Documentation**.

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
```

## API Documentation (Scalar)

- **Scalar Interactive Docs:** `http://localhost:3000/docs`
- **Raw OpenAPI JSON:** `http://localhost:3000/openapi.json`
- **Health Check:** `http://localhost:3000/health`
- **API Base URL:** `http://localhost:3000/api/v1`

## Default Seeded Platform Admin

- **Email:** `admin@nkst.org.ng`
- **Phone:** `+2348000000001`
- **Password:** `ChangeMe@123!`
- **Church:** NKST National Headquarters, Mkar (Gboko LGA, Benue State)
