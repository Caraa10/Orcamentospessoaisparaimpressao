# Workspace

## Overview

Sistema de geração de orçamentos para cirurgia plástica. Permite ao cirurgião selecionar procedimentos, complexidade e dados do paciente para gerar um PDF de orçamento personalizado.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### `artifacts/orcamentos` — Orçamentos Cirúrgicos (web, preview at `/`)
Frontend-only React + Vite app. No backend needed.
- **Purpose**: Generate PDF surgical quotes for plastic surgery patients
- **Key features**:
  - Searchable procedure selection (180+ procedures from price table)
  - Complexity selection (A, B, C) with auto-calculated prices
  - Hospital fee configuration (min/max range)
  - Optional items: Argoplasma, implant pricing table
  - PDF generation via browser print
  - Matches existing PDF template format (PLANEJAMENTO CIRÚRGICO PERSONALIZADO)
- **Key files**:
  - `src/data/procedures.ts` — All procedures with pricing by complexity
  - `src/data/includedItems.ts` — Included items text per procedure category
  - `src/utils/calculations.ts` — Payment calculation utilities
  - `src/components/QuoteForm.tsx` — Main form UI
  - `src/components/QuotePrint.tsx` — Printable PDF template
  - `src/pages/Home.tsx` — Form page
  - `src/pages/Preview.tsx` — Print preview page

### `artifacts/api-server` — API Server (api, preview at `/api`)
Express 5 backend with health check endpoint.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Payment Calculation Rules
- À vista: base price
- 1–6x (cartão): base × 1.125
- 7–12x (cartão): base × 1.25

## Procedure Categories
- `breast`: Mastoplastia, Mastopexia, Lipoenxertia Mamária
- `lipo`: All liposuction procedures
- `abdominoplasty`: Abdominoplastia, Miniabdominoplastia
- `other`: Blefaroplastia, Otoplastia, Ninfoplastia, etc.
