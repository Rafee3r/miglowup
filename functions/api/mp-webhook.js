/**
 * MercadoPago Webhook → Meta Conversions API
 *
 * Cuando MP confirma un pago, dispara el evento Purchase server-side
 * a Meta. Esto permite que Meta optimice los ads basado en ventas REALES
 * (no solo en clicks de la página gracias).
 *
 * Setup:
 * 1. En MP dashboard → Tus integraciones → tu app → Webhooks:
 *    URL: https://miglowup.cl/api/mp-webhook
 *    Eventos: payment
 *
 * 2. En Cloudflare Pages → Settings → Environment Variables, agrega:
 *    MP_ACCESS_TOKEN       = (de MP dashboard → Credenciales de producción → Access Token)
 *    META_PIXEL_ID         = 4376662015813242
 *    META_CAPI_TOKEN       = (Events Manager → Settings → Conversions API → Generate Access Token)
 *    WHATSAPP_INVITE       = (link de tu grupo WhatsApp)
 *    RESEND_API_KEY        = (opcional, para enviar email — https://resend.com)
 *    RESEND_FROM           = (opcional, ej: "MiGlowUp <hola@miglowup.cl>")
 */

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();

    // MP envía notificaciones de varios tipos — solo nos interesa "payment"
    const topic = body.type || body.topic;
    if (topic !== 'payment') {
      return json({ ok: true, ignored: topic });
    }

    const paymentId = body.data?.id || body.resource;
    if (!paymentId) return json({ ok: false, error: 'no payment id' }, 400);

    // 1. Consultar el pago a MP para verificar que está aprobado
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
    });
    if (!mpRes.ok) {
      const err = await mpRes.text();
      return json({ ok: false, error: 'mp api error', detail: err }, 500);
    }
    const payment = await mpRes.json();

    if (payment.status !== 'approved') {
      return json({ ok: true, status: payment.status, note: 'no aprobado, ignorado' });
    }

    const email = payment.payer?.email || null;
    const firstName = payment.payer?.first_name || null;
    const amount = payment.transaction_amount || 990;
    const externalRef = payment.external_reference || null;
    const variant = externalRef || 'unknown';

    // 2. Disparar Purchase a Meta Conversions API
    if (env.META_PIXEL_ID && env.META_CAPI_TOKEN) {
      await sendMetaPurchase({
        pixelId: env.META_PIXEL_ID,
        token: env.META_CAPI_TOKEN,
        eventId: `mp_${paymentId}`,
        email,
        firstName,
        amount,
        variant,
        eventSourceUrl: 'https://miglowup.cl/gracias',
      });
    }

    // 3. (Opcional) Enviar email con link WhatsApp
    if (env.RESEND_API_KEY && email && env.WHATSAPP_INVITE) {
      await sendWelcomeEmail({
        apiKey: env.RESEND_API_KEY,
        from: env.RESEND_FROM || 'MiGlowUp <hola@miglowup.cl>',
        to: email,
        firstName,
        whatsappInvite: env.WHATSAPP_INVITE,
      });
    }

    return json({ ok: true, paymentId, status: 'processed' });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

// MP también puede enviar GET para verificar el endpoint
export async function onRequestGet() {
  return json({ ok: true, endpoint: 'mp-webhook' });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function sha256(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str.toLowerCase().trim()));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendMetaPurchase({ pixelId, token, eventId, email, firstName, amount, variant, eventSourceUrl }) {
  const userData = {};
  if (email) userData.em = [await sha256(email)];
  if (firstName) userData.fn = [await sha256(firstName)];
  userData.country = [await sha256('cl')];

  const event = {
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: userData,
    custom_data: {
      currency: 'CLP',
      value: amount,
      content_name: 'MiGlowUp Trial 7 días',
      content_ids: [variant],
      content_type: 'product',
    },
  };

  const res = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [event] }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Meta CAPI error:', text);
  }
}

async function sendWelcomeEmail({ apiKey, from, to, firstName, whatsappInvite }) {
  const name = firstName || 'fundadora';
  const html = `
    <div style="font-family: Inter, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #1A1A1A; background: #FBF6EE;">
      <h1 style="font-size: 28px; margin: 0 0 8px;">¡Bienvenida, ${name}! 🌸</h1>
      <p style="color: #666; margin: 0 0 24px;">Tu pago de $990 fue confirmado. Ahora vienen los próximos pasos.</p>

      <div style="background: white; border-radius: 16px; padding: 24px; margin-bottom: 24px; border: 1px solid #eee;">
        <h2 style="font-size: 18px; margin: 0 0 12px;">1. Únete al grupo privado de WhatsApp</h2>
        <p style="color: #666; margin: 0 0 16px; font-size: 14px;">Acá conoces a tu cohorte y empiezas el reto.</p>
        <a href="${whatsappInvite}" style="display: inline-block; background: #25D366; color: white; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: bold;">Unirme al grupo →</a>
      </div>

      <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #eee;">
        <h2 style="font-size: 18px; margin: 0 0 8px;">2. Día 1 oficial: este lunes</h2>
        <p style="color: #666; margin: 0; font-size: 14px;">Te avisamos en el grupo cuando empiece tu cohorte.</p>
      </div>

      <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">
        ¿Dudas? Responde este correo o escríbenos a hola@miglowup.cl<br/>
        Tu trial es por 7 días · puedes cancelar cuando quieras
      </p>
    </div>
  `;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: '🌸 ¡Bienvenida a MiGlowUp! Tu acceso está listo',
      html,
    }),
  });
}
