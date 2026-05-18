# MiGlowUp — App

App principal de MiGlowUp. Vive en `app.miglowup.cl` (la landing en `miglowup.cl` sigue siendo el repo padre).

## Stack
- **Next.js 16** (App Router, Turbopack)
- **Tailwind v4** (tema glow inline en `app/globals.css`)
- **Supabase** (auth con magic link + Postgres + Storage)
- **DeepSeek API** (Coach IA, streaming)
- **Cloudflare Pages** (deploy)

## Setup local (primera vez)

1. **Crea proyecto Supabase**: https://supabase.com/dashboard → New project (gratis)
2. **SQL Editor → pega `supabase/schema.sql` → Run** (crea las tablas)
3. **Settings → API → copia URL y `anon` key**
4. **Crea API key DeepSeek**: https://platform.deepseek.com/api_keys
5. Copia `.env.local.example` a `.env.local` y rellena:
   ```bash
   cp .env.local.example .env.local
   ```
6. Instala y corre:
   ```bash
   npm install
   npm run dev
   ```
7. Abre http://localhost:3000

### Configuración Supabase Auth
- En Supabase → Authentication → URL Configuration:
  - Site URL: `http://localhost:3000` (dev) o `https://app.miglowup.cl` (prod)
  - Redirect URLs: agrega `http://localhost:3000/auth/callback` y `https://app.miglowup.cl/auth/callback`

## Estructura de páginas
- `/` — Home pública (redirige a `/dashboard` si tienes sesión)
- `/login` — Magic link
- `/onboarding` — Wizard 4 pasos
- `/dashboard` — Home autenticado
- `/rutinas` y `/rutinas/[slug]` — Biblioteca de rutinas
- `/coach` — Chat IA con DeepSeek
- `/tracking` — Peso y medidas
- `/comunidad` — Link al grupo WhatsApp

## Deploy a Cloudflare Pages

1. Cloudflare Pages → Create project → Connect to Git → repo `Rafee3r/miglowup`
2. **Configuración**:
   - Root directory: `/app`
   - Build command: `npm install && npm run build`
   - Build output: `.next`
   - Framework preset: `Next.js`
3. **Variables de entorno** (mismas de `.env.local` + `NEXT_PUBLIC_SITE_URL=https://app.miglowup.cl`)
4. **Custom domain**: agrega `app.miglowup.cl`

## Notas
- El proxy (antes middleware) está en `proxy.ts` — cambio de nombre en Next 16.
- Páginas privadas viven dentro del grupo `(app)` con auth checks server-side.
- DeepSeek ≈ $0.14/M tokens entrada — muy barato.
