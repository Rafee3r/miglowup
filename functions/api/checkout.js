/**
 * Crea una Suscripción (Preapproval) en MercadoPago con free trial
 * de 7 días y cobro recurrente de $12.990/mes (o $89.990/año).
 *
 * Modelo: "7 días GRATIS → $12.990/mes auto"
 * - Día 0: Usuaria autoriza tarjeta, NO se cobra nada
 * - Día 8: MP auto-cobra el monto recurrente
 * - Cada mes/año desde entonces: cobro automático
 *
 * Uso desde el frontend:
 *   GET /api/checkout?plan=MONTHLY&variant=F_singym
 *   → devuelve { init_point: "https://..." } para redirigir al usuario
 */

const SITE_URL = 'https://miglowup.cl';

const PLANS = {
  MONTHLY: {
    amount: 12990,
    frequency: 1,
    frequency_type: 'months',
    reason: 'MiGlowUp Membresía Mensual',
  },
  ANNUAL: {
    amount: 89990,
    frequency: 12,
    frequency_type: 'months',
    reason: 'MiGlowUp Membresía Anual',
  },
};

const TRIAL_DAYS = 7;

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const plan = (url.searchParams.get('plan') || 'MONTHLY').toUpperCase();
    const variant = url.searchParams.get('variant') || 'direct';

    if (!PLANS[plan]) return json({ ok: false, error: 'Invalid plan' }, 400);
    if (!env.MP_ACCESS_TOKEN) {
      return json({ ok: false, error: 'MP_ACCESS_TOKEN not configured' }, 500);
    }

    const planConfig = PLANS[plan];
    const externalRef = `${variant}_${plan}_${Date.now()}`;

    // start_date debe ser ≥ ahora. MP usa free_trial.frequency para
    // diferir el primer cobro. La autorización es inmediata.
    const startDate = new Date(Date.now() + 60 * 1000); // +1 min para evitar 400

    const preapproval = {
      reason: planConfig.reason,
      external_reference: externalRef,
      auto_recurring: {
        frequency: planConfig.frequency,
        frequency_type: planConfig.frequency_type,
        start_date: startDate.toISOString(),
        transaction_amount: planConfig.amount,
        currency_id: 'CLP',
        free_trial: {
          frequency: TRIAL_DAYS,
          frequency_type: 'days',
        },
      },
      back_url: `${SITE_URL}/gracias?subscribed=1&plan=${plan}&variant=${variant}`,
      status: 'pending',
    };

    const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preapproval),
    });

    if (!mpRes.ok) {
      const err = await mpRes.text();
      console.error('MP preapproval error:', err);
      return json({ ok: false, error: 'MP API error', detail: err }, 500);
    }

    const data = await mpRes.json();
    return json({
      ok: true,
      preapproval_id: data.id,
      init_point: data.init_point,
      external_reference: externalRef,
      trial_days: TRIAL_DAYS,
      next_charge_amount: planConfig.amount,
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
