/**
 * Crea una preferencia de Checkout Pro en MercadoPago para el pago
 * inicial de $990 (trial 7 días). Devuelve la init_point URL para
 * redirigir al usuario.
 *
 * Uso desde el frontend:
 *   GET /api/checkout?plan=MONTHLY&variant=F_singym
 *
 * Reemplaza el link estático mpago.la/1BaojSf en todas las landings.
 *
 * Beneficios vs el link estático:
 * - back_urls configuradas → MP redirige a /gracias automáticamente
 * - external_reference con variant + plan → tracking server-side preciso
 * - notification_url → webhook recibe pagos confirmados
 * - auto_return=approved → redirección inmediata sin "Volver al sitio"
 */

const SITE_URL = 'https://miglowup.cl';

const PRICING = {
  MONTHLY: { trial: 990, name: 'MiGlowUp Trial 7 días (Plan Mensual)' },
  ANNUAL:  { trial: 990, name: 'MiGlowUp Trial 7 días (Plan Anual)' },
};

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const plan = (url.searchParams.get('plan') || 'MONTHLY').toUpperCase();
    const variant = url.searchParams.get('variant') || 'direct';

    if (!PRICING[plan]) {
      return json({ ok: false, error: 'Invalid plan' }, 400);
    }
    if (!env.MP_ACCESS_TOKEN) {
      return json({ ok: false, error: 'MP_ACCESS_TOKEN not configured' }, 500);
    }

    const externalRef = `${variant}_${plan}_${Date.now()}`;
    const pricing = PRICING[plan];

    const preference = {
      items: [
        {
          title: pricing.name,
          description: 'Trial 7 días · acceso completo a comunidad WhatsApp, rutinas, coach IA y app',
          quantity: 1,
          currency_id: 'CLP',
          unit_price: pricing.trial,
        },
      ],
      back_urls: {
        success: `${SITE_URL}/gracias?status=approved&plan=${plan}&variant=${variant}`,
        failure: `${SITE_URL}/promo?status=failed`,
        pending: `${SITE_URL}/gracias?status=pending&plan=${plan}&variant=${variant}`,
      },
      auto_return: 'approved',
      external_reference: externalRef,
      notification_url: `${SITE_URL}/api/mp-webhook`,
      statement_descriptor: 'MIGLOWUP',
      metadata: {
        plan,
        variant,
        intent: 'trial',
      },
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    if (!mpRes.ok) {
      const err = await mpRes.text();
      console.error('MP preference error:', err);
      return json({ ok: false, error: 'MP API error', detail: err }, 500);
    }

    const data = await mpRes.json();
    return json({
      ok: true,
      preference_id: data.id,
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      external_reference: externalRef,
    });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
