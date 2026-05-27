/**
 * Crea una Suscripción (Preapproval) en MercadoPago para el cobro
 * recurrente de $12.990/mes (o $89.990/año) que arranca 7 días después
 * del pago del trial.
 *
 * Uso desde gracias.html (después que el usuario completó el trial $990):
 *   GET /api/subscribe?payment_id=12345678&plan=MONTHLY
 *
 * Devuelve init_point URL para que el usuario autorice el cobro recurrente
 * en MP. Solo entonces queda "subscrito".
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

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const paymentId = url.searchParams.get('payment_id');
    const plan = (url.searchParams.get('plan') || 'MONTHLY').toUpperCase();

    if (!paymentId) return json({ ok: false, error: 'payment_id required' }, 400);
    if (!PLANS[plan]) return json({ ok: false, error: 'Invalid plan' }, 400);
    if (!env.MP_ACCESS_TOKEN) {
      return json({ ok: false, error: 'MP_ACCESS_TOKEN not configured' }, 500);
    }

    // 1. Consultar el pago para obtener email + external_reference
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
    });
    if (!payRes.ok) {
      const e = await payRes.text();
      return json({ ok: false, error: 'Payment not found', detail: e }, 404);
    }
    const payment = await payRes.json();

    if (payment.status !== 'approved') {
      return json({ ok: false, error: 'Payment not approved', status: payment.status }, 400);
    }

    const email = payment.payer?.email;
    if (!email) return json({ ok: false, error: 'No payer email in payment' }, 400);

    const externalRef = payment.external_reference || `sub_${paymentId}`;
    const planConfig = PLANS[plan];

    // 2. Calcular start_date = 7 días desde el pago
    const trialDays = 7;
    const startDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

    const preapproval = {
      reason: planConfig.reason,
      external_reference: `subscribe_${externalRef}`,
      payer_email: email,
      auto_recurring: {
        frequency: planConfig.frequency,
        frequency_type: planConfig.frequency_type,
        start_date: startDate.toISOString(),
        transaction_amount: planConfig.amount,
        currency_id: 'CLP',
      },
      back_url: `${SITE_URL}/gracias?subscribed=1&plan=${plan}`,
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
      return json({ ok: false, error: 'MP preapproval failed', detail: err }, 500);
    }

    const data = await mpRes.json();

    return json({
      ok: true,
      preapproval_id: data.id,
      init_point: data.init_point,
      start_date: startDate.toISOString(),
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
