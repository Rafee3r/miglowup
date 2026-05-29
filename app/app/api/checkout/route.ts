import { NextResponse, type NextRequest } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://miglowup.cl';

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

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl;
    const plan = (url.searchParams.get('plan') || 'MONTHLY').toUpperCase();
    const variant = url.searchParams.get('variant') || 'direct';

    if (!PLANS[plan as keyof typeof PLANS]) return NextResponse.json({ ok: false, error: 'Invalid plan' }, { status: 400 });
    const mpToken = process.env.MP_ACCESS_TOKEN;
    if (!mpToken) {
      return NextResponse.json({ ok: false, error: 'MP_ACCESS_TOKEN not configured' }, { status: 500 });
    }

    const planConfig = PLANS[plan as keyof typeof PLANS];
    const externalRef = `${variant}_${plan}_${Date.now()}`;
    const email = url.searchParams.get('email') || 'hola@miglowup.cl';

    const preapproval = {
      reason: planConfig.reason,
      external_reference: externalRef,
      auto_recurring: {
        frequency: planConfig.frequency,
        frequency_type: planConfig.frequency_type,
        transaction_amount: planConfig.amount,
        currency_id: 'CLP',
        free_trial: {
          frequency: TRIAL_DAYS,
          frequency_type: 'days',
        },
      },
      back_url: `${SITE_URL}/gracias?subscribed=1&plan=${plan}&variant=${variant}`
    };

    const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${mpToken}`,
      },
      body: JSON.stringify(preapproval),
    });

    if (!mpRes.ok) {
      const err = await mpRes.text();
      console.error('MP preapproval error:', err);
      return NextResponse.json({ ok: false, error: 'MP API error', detail: err }, { status: 500 });
    }

    const data = await mpRes.json();
    return NextResponse.json({
      ok: true,
      preapproval_id: data.id,
      init_point: data.init_point,
      external_reference: externalRef,
      trial_days: TRIAL_DAYS,
      next_charge_amount: planConfig.amount,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
