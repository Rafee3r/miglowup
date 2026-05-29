/**
 * Helper compartido para todas las landings de MiGlowUp.
 * Llama al endpoint /api/checkout (Cloudflare Function) que crea una
 * preferencia de MercadoPago dinámica con back_urls correctas y
 * notification_url para el webhook.
 *
 * Uso desde cualquier landing:
 *   <script src="/assets/checkout.js"></script>
 *   ...
 *   <button onclick="goToCheckout('MONTHLY','F_singym')">Empezar $990</button>
 */
(function() {
  window.goToCheckout = async function(plan, variant) {
    plan = (plan || 'MONTHLY').toUpperCase();
    variant = variant || 'direct';
    const trackingId = variant + '_' + plan;

    // 1. Tracking client-side (LandingView/InitiateCheckout)
    try { localStorage.setItem('mgu_variant', trackingId); } catch (e) {}
    if (typeof fbq !== 'undefined') {
      fbq('track', 'InitiateCheckout', {
        content_name: trackingId,
        value: 990,
        currency: 'CLP',
      });
    }

    // 2. Crear preferencia en MP
    try {
      const res = await fetch(`/api/checkout?plan=${encodeURIComponent(plan)}&variant=${encodeURIComponent(variant)}`);
      const data = await res.json();
      if (!data.ok || !data.init_point) {
        throw new Error(data.error || 'No se pudo iniciar el pago');
      }
      window.location.href = data.init_point;
    } catch (err) {
      console.error('Checkout error:', err);
      alert(`Algo falló al iniciar el pago (${err.message}). Intenta de nuevo en un momento o escríbenos a hola@miglowup.cl`);
    }
  };

  // Auto-bindeo: cualquier elemento con data-checkout="MONTHLY:F_singym"
  // se convierte en botón de checkout sin necesidad de inline JS
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-checkout]').forEach(function(el) {
      const [plan, variant] = (el.getAttribute('data-checkout') || 'MONTHLY:direct').split(':');
      el.addEventListener('click', function(e) {
        e.preventDefault();
        goToCheckout(plan, variant);
      });
      // Si no tiene href, ponle uno semántico
      if (el.tagName === 'A' && !el.getAttribute('href')) el.setAttribute('href', '#');
    });
  });
})();
