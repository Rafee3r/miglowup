# MiGlowUp — Guía de setup (paso a paso)

Esta es una landing de **validación**: simula que la app ya existe y cobra $990 por trial de 7 días. Si la gente paga, validaste la idea antes de gastar en desarrollo real.

---

## 🎯 Objetivo de los próximos 14 días

| Día | Tarea | Costo |
|---|---|---|
| 1 | Comprar dominio miglowup.cl | ~$10.000 CLP/año |
| 1 | Crear cuenta Mercado Pago | Gratis |
| 1-2 | Deploy de la landing | Gratis |
| 3-4 | Crear cuenta Meta Business + pixel | Gratis |
| 4-5 | Grabar 3 videos con la coach | $0 (celular) |
| 6 | Lanzar primera campaña FB/IG ads | USD 100-200 (~$95-190k CLP) |
| 7-14 | Medir CAC, optimizar, decidir si construir la app | — |

**Meta de validación:** conseguir 20-50 trials pagados ($990 c/u) en 14 días con un CAC menor a $8.000 CLP. Si lo logras → construir la app vale la pena.

---

## 1️⃣ Comprar el dominio (5 min)

1. Ve a **nic.cl** o **hostingplus.cl**.
2. Compra `miglowup.cl` (~$10.000 CLP/año).
3. Guarda los datos de acceso.

---

## 2️⃣ Crear cuenta de Mercado Pago (10 min)

1. Entra a https://www.mercadopago.cl/ y crea cuenta personal (no necesitas empresa para empezar).
2. Verifica tu identidad con cédula.
3. Ve a **"Tu negocio" → "Cobrar" → "Link de pago"**.
4. Crea un link de **$990 CLP** con:
   - Título: `MiGlowUp — Trial 7 días`
   - Descripción: `Acceso completo a MiGlowUp por 7 días`
   - Cantidad: 1
5. Copia el link generado (algo como `https://link.mercadopago.cl/miglowupchile`).
6. Abre `index.html` y reemplaza en la línea ~310:
   ```js
   const MP_LINKS = {
     MONTHLY: 'https://link.mercadopago.cl/TUNUEVOLINK',
     ANNUAL:  'https://link.mercadopago.cl/TUNUEVOLINK',
   };
   ```
   (Por ahora ambos pueden apuntar al mismo link — lo importante es validar.)

> **Nota:** Mercado Pago Chile aún no permite suscripciones automáticas con tarjeta para personas naturales. Para esta fase de validación basta con el cobro único de $990. Si validas, después se crea la empresa y se activan las suscripciones recurrentes vía **Flow.cl**.

---

## 3️⃣ Deploy de la landing (5 min, gratis)

**Opción A — Cloudflare Pages (recomendado):**

1. Crea cuenta en https://pages.cloudflare.com
2. "Create project" → "Upload assets"
3. Sube la carpeta `miglowup/` completa
4. Te dan una URL tipo `miglowup.pages.dev`
5. En "Custom domains" agregas `miglowup.cl` (sigue las instrucciones DNS)

**Opción B — Netlify (más simple):**

1. Ve a https://app.netlify.com/drop
2. Arrastra la carpeta `miglowup/` al sitio
3. Te dan URL inmediata
4. Configuras dominio custom en "Domain settings"

**Opción C — Vercel:**

1. Ve a https://vercel.com → "Add new project" → "Import"
2. Conecta el repo de GitHub (ver paso 5)
3. Deploy automático en cada push

---

## 4️⃣ Personalizar la landing

Abre `index.html` y reemplaza:

| Línea aprox. | Qué reemplazar |
|---|---|
| Tag `<title>` | Ya está OK |
| `[Foto Coach]` (en sección coach) | Pon una foto real de la coach con `<img src="coach.jpg" />` |
| `Coach [Nombre]` | Nombre real de la coach |
| Testimonios | Cuando tengas las primeras 3-5 chicas reales, reemplaza con fotos antes/después de ellas (con permiso por escrito) |
| `MP_LINKS` | Tus links de Mercado Pago |
| `TU_PIXEL_ID_AQUI` | Tu Pixel ID de Meta (paso 5) |

**Importante para la validación inicial:** los testimonios y la foto de coach pueden ser "aspiracionales" mientras la app aún no existe, **pero** debes ser honesto con quien pague: cuando alguien pague el trial, escríbele por WhatsApp explicando que la app está en lanzamiento y dale acceso al grupo + contenido manual mientras se construye. Devuelve el dinero a quien no quiera esperar. Esto se llama **"concierge MVP"** y es estándar para validar SaaS.

---

## 5️⃣ Configurar Meta Pixel + Ads (30 min)

1. Crea cuenta en https://business.facebook.com
2. Crea un **Pixel** ("Eventos web") y copia el ID
3. En `index.html`, descomenta el bloque del Pixel al final y pega tu ID
4. Verifica en https://www.facebook.com/ads/manager que el Pixel recibe eventos
5. Crea campaña tipo **"Conversiones"** con objetivo **`InitiateCheckout`** (se dispara cuando hacen clic en "Empezar trial")

**Configuración recomendada de la primera campaña:**

- **Objetivo:** Conversiones
- **Evento:** InitiateCheckout
- **Audiencia:** Mujeres 25-45, Chile (todas las regiones), intereses: "Fitness y bienestar", "Pérdida de peso", "Yoga", "Crossfit"
- **Presupuesto:** $5.000-10.000 CLP/día (USD 5-10)
- **Creativos:** 3 videos verticales 9:16, 15-30 seg, formato UGC (la coach hablando al celular)
- **Copy del ad:**
  > *"Chilenas: si llevas meses diciendo 'el lunes empiezo'... este es tu lunes. 8 semanas, sin gym, sin dietas locas. Prueba 7 días por $990. Cupos limitados →"*

---

## 6️⃣ Medir y decidir

Después de 7-14 días con $100-200 USD gastados en ads:

| Métrica | Verde 🟢 | Amarillo 🟡 | Rojo 🔴 |
|---|---|---|---|
| CAC (costo por pago de $990) | < $8.000 | $8.000-$15.000 | > $15.000 |
| CTR del ad | > 2% | 1-2% | < 1% |
| Visitas → trial | > 3% | 1-3% | < 1% |

- **Verde:** construir la app real. Tienes producto.
- **Amarillo:** iterar landing/ads otra semana antes de decidir.
- **Rojo:** cambiar nicho o propuesta antes de gastar más.

---

## 7️⃣ Siguientes pasos cuando valides

1. Constituir empresa (SpA Express, ~$50.000 CLP, 1 día en línea via Tu Empresa en un Día)
2. Activar suscripciones recurrentes en **Flow.cl**
3. Construir la app real (Next.js + Supabase, ~USD 2.000-3.000)
4. Onboardear las primeras cohortes manualmente vía WhatsApp mientras se construye

---

## Estructura del proyecto

```
miglowup/
├── index.html      ← La landing (todo en un archivo)
├── SETUP.md        ← Este archivo
└── README.md       ← Resumen del proyecto
```

## Stack actual

- **Frontend:** HTML + Tailwind CSS (vía CDN, sin build step)
- **Hosting:** Cloudflare Pages / Netlify / Vercel (gratis)
- **Pagos:** Mercado Pago (link de pago manual fase 1)
- **Analytics:** Meta Pixel
- **Comunidad MVP:** Grupo de WhatsApp manual

Sin servidor, sin base de datos. **Lo justo para validar.**
