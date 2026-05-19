# 🔧 Setup tracking server-side + WhatsApp + Email

Esto arregla los 3 problemas que detectamos:
1. Meta no detecta los pagos (no atribuye ventas a los ads)
2. La gente paga pero no se une al WhatsApp
3. MP no redirige a `gracias.html`

---

## 🚨 PASO 0 — URGENTE: contactar las 4 ventas existentes

Antes de arreglar nada, **rescata las 4 clientas que ya pagaron**:

1. Abre MP → Actividad → Ventas → cada Trial MiGlowUp
2. Toca el pago → copia el correo del comprador
3. Envíales este email (o WhatsApp si tienen número):

```
Hola! Te confirmamos tu inscripción a MiGlowUp 💛

Tu pago de $990 fue procesado correctamente, pero parece que no llegaste
a recibir el link del grupo de WhatsApp por un problema técnico que ya
arreglamos. Acá te lo dejamos:

👉 [LINK_WHATSAPP_AQUÍ]

Te esperamos en el grupo! Cualquier cosa, respondes este correo.
— Rafa
```

---

## PASO 1 — Actualizar el link de WhatsApp en `gracias.html`

Abre `gracias.html` → línea 22 — reemplaza:

```js
window.WHATSAPP_INVITE = 'https://chat.whatsapp.com/REEMPLAZAR_INVITE_LINK';
```

Con el link real de tu grupo (sacas en WhatsApp → grupo → ⓘ → Invitar por enlace).

---

## PASO 2 — Configurar MP para que redirija a gracias.html

El link `mpago.la/1BaojSf` es simple y NO redirige por defecto. Tienes 2 opciones:

### Opción A — Editar el link actual (más simple)
1. Abre MP → Tu negocio → Cobros → Link de pago → tu link MiGlowUp
2. Edita → busca "Personalizar URLs de retorno" o "Avanzado"
3. URL de éxito: `https://miglowup.cl/gracias?collection_status=approved`
4. URL de fallo: `https://miglowup.cl/promo`
5. URL pendiente: `https://miglowup.cl/gracias?collection_status=pending`
6. Activa "Volver automáticamente al sitio" (auto_return)

> Si tu link **no permite editar URLs de retorno**, créalo de nuevo desde:
> MP → Cobros → "Crear link de pago" → Avanzado → URLs de retorno.

### Opción B — Recrear con Checkout Pro (recomendado largo plazo)
Crea preferencias dinámicas vía API. Lo dejamos para después — la Opción A
soluciona el 90% del problema.

---

## PASO 3 — Configurar Webhook MP

Para que Meta detecte las ventas server-side (lo más importante):

1. MP Dashboard → **Tus integraciones** → crea una app si no tienes ("MiGlowUp")
2. En la app → **Webhooks** → "Configurar notificaciones"
3. URL de producción: `https://miglowup.cl/api/mp-webhook`
4. Eventos a suscribir: **Pagos (payment)**
5. Guarda

Luego copia el **Access Token de producción** (Credenciales → Token de acceso).

---

## PASO 4 — Configurar Meta Conversions API

1. Facebook Events Manager → tu pixel `4376662015813242`
2. Settings → Conversions API → "Generate access token"
3. Cópialo (lo necesitas en el paso 6)

---

## PASO 5 — (Opcional) Resend para emails automáticos

Si quieres que cada compra dispare un email con el link WhatsApp:

1. Crea cuenta gratis en https://resend.com (3.000 emails/mes free)
2. Verifica el dominio `miglowup.cl` (te da DNS records, los pegas en GoDaddy)
3. API Keys → crea una → cópiala

---

## PASO 6 — Variables de entorno en Cloudflare Pages

Cloudflare Pages → tu proyecto → **Settings** → **Environment Variables**
→ pega estas (Production):

| Variable | Valor |
|---|---|
| `MP_ACCESS_TOKEN` | (del paso 3, "Access Token de producción") |
| `META_PIXEL_ID` | `4376662015813242` |
| `META_CAPI_TOKEN` | (del paso 4) |
| `WHATSAPP_INVITE` | tu link de WhatsApp |
| `RESEND_API_KEY` | (del paso 5, opcional) |
| `RESEND_FROM` | `MiGlowUp <hola@miglowup.cl>` (opcional) |

Después de agregar variables → **Redeploy** el último deployment.

---

## PASO 7 — Probar end-to-end

1. Haz un pago de prueba ($990) desde tu celular
2. Después de pagar, deberías:
   - ✅ Volver a `miglowup.cl/gracias` automáticamente
   - ✅ Ver el botón WhatsApp gigante verde
   - ✅ Recibir email con link WhatsApp (si configuraste Resend)
3. En Meta Events Manager → Test Events → busca el evento `Purchase`
   - Debería aparecer con origen **Server** (Conversions API)

---

## 🎯 Resultado esperado

Antes:
- Meta no veía las ventas → optimizaba mal → CPM alto
- Clientas pagaban y se evaporaban

Después:
- Meta ve TODAS las ventas (incluso las que no completan redirect)
- Clientas reciben WhatsApp + email automático
- CAC baja con el tiempo conforme Meta entiende quién compra
