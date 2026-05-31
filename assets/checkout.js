/**
 * Helper compartido para todas las landings de MiGlowUp.
 * Soporta de forma cooperativa tanto llamadas dinámicas a /api/checkout (Cloudflare Functions)
 * como redirecciones estáticas si el hosting es 100% estático (cPanel/HostingPlus)
 * mediante la configuración global de window.MP_LINKS o fallback resiliente.
 *
 * Uso desde cualquier landing:
 *   <script src="/assets/checkout.js"></script>
 *   ...
 *   <button onclick="goToCheckout('MONTHLY','F_singym')">Empezar $990</button>
 */
(function() {
  // Configuración de links estáticos de respaldo oficiales de MiGlowUp
  const DEFAULT_MP_LINKS = {
    MONTHLY: 'https://link.mercadopago.cl/miglowupchile',
    ANNUAL: 'https://link.mercadopago.cl/miglowupchile' // O el link anual si el cliente lo configura
  };

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

    // 2. Comprobar si existen links estáticos configurados de forma explícita en la ventana
    const staticLinks = window.MP_LINKS || DEFAULT_MP_LINKS;
    const staticUrl = staticLinks[plan] || staticLinks['MONTHLY'] || DEFAULT_MP_LINKS.MONTHLY;

    // Si el usuario configuró explícitamente forzar links estáticos (útil en hosting sin backend)
    if (window.FORCE_STATIC_CHECKOUT) {
      console.log('[Checkout] Forzando redirección directa a link de pago estático:', staticUrl);
      window.location.href = staticUrl;
      return;
    }

    // 3. Intentar crear preferencia en MP de forma dinámica
    try {
      console.log('[Checkout] Intentando checkout dinámico...');
      const res = await fetch(`/api/checkout?plan=${encodeURIComponent(plan)}&variant=${encodeURIComponent(variant)}`);
      
      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Respuesta no-JSON del servidor');
      }

      const data = await res.json();

      if (!data.ok || !data.init_point) {
        throw new Error(data.error || data.detail || 'No init_point');
      }
      
      console.log('[Checkout] Checkout dinámico exitoso, redirigiendo a:', data.init_point);
      window.location.href = data.init_point;
    } catch (err) {
      // 4. Degradación elegante: Si el servidor devuelve 404 (hosting estático) o falla, redirigimos en silencio al link estático.
      console.warn('[Checkout] Falló el checkout dinámico debido a:', err.message);
      console.warn('[Checkout] Realizando degradación elegante automática a link estático de pago:', staticUrl);
      
      // Añadir un micro retraso para que el usuario perciba fluidez antes de la redirección
      setTimeout(() => {
        window.location.href = staticUrl;
      }, 100);
    }
  };

  // Auto-bindeo: cualquier elemento con data-checkout o data-mp-link
  document.addEventListener('DOMContentLoaded', function() {
    // Escuchar data-checkout="MONTHLY:F_singym"
    document.querySelectorAll('[data-checkout]').forEach(function(el) {
      const [plan, variant] = (el.getAttribute('data-checkout') || 'MONTHLY:direct').split(':');
      el.addEventListener('click', function(e) {
        e.preventDefault();
        goToCheckout(plan, variant);
      });
      if (el.tagName === 'A' && !el.getAttribute('href')) el.setAttribute('href', '#');
    });

    // Escuchar data-plan="MONTHLY" o data-mp-link="MONTHLY"
    document.querySelectorAll('[data-plan], [data-mp-link]').forEach(function(el) {
      const plan = el.getAttribute('data-plan') || el.getAttribute('data-mp-link') || 'MONTHLY';
      el.addEventListener('click', function(e) {
        e.preventDefault();
        // Intentar obtener una variante del contexto si existe
        const variant = window.VARIANT || 'direct';
        goToCheckout(plan, variant);
      });
      if (el.tagName === 'A' && !el.getAttribute('href')) el.setAttribute('href', '#');
    });
  });
})();

