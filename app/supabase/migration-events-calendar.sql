-- ════════════════════════════════════════════════════════════
-- CALENDARIO ANUAL DE EVENTOS — sin huecos, 10 eventos
-- ════════════════════════════════════════════════════════════
-- Limpia los eventos existentes y crea el ciclo completo.
-- "Raíz" arranca HOY y "Refugio" termina en 362 días.

-- Limpia participantes huérfanos
delete from event_participants;
delete from events;

-- Calendario continuo de eventos
insert into events (slug, title, subtitle, description, emoji, color_from, color_to, start_date, end_date, goal_workouts, is_featured) values
(
  'raiz', 'Raíz', 'Volver a tu cuerpo después del verano',
  'Un mes para anclarte. La idea no es perfección: es presencia. 25 entrenamientos en 35 días te invitan a volver al ritmo, suave pero constante.',
  '🌿', '#C8A977', '#7C5E3C',
  current_date, current_date + 34, 25, true
),
(
  'hogar', 'Hogar', 'Tu cuerpo, tu casa en invierno',
  'Mientras afuera hace frío, adentro nos cuidamos. 35 días de movilidad, fuerza y rituales de cobijo. 25 entrenamientos.',
  '🏡', '#D4926A', '#A85A3C',
  current_date + 35, current_date + 69, 25, false
),
(
  'brote', 'Brote', 'Lo que viene quiere salir',
  'El despertar pre-primavera. Sentimos el cambio antes de verlo. 25 entrenamientos en 35 días con foco en piernas, core y energía nueva.',
  '🌱', '#A4C68C', '#5E8C4F',
  current_date + 70, current_date + 104, 25, false
),
(
  '41-dias-primavera', '41 días de primavera', 'Florecer con la estación',
  'El reto más esperado del año. Entrena 30 de los 41 días de primavera con la cohorte. Nadie florece sola.',
  '🌸', '#FFB294', '#F26A47',
  current_date + 105, current_date + 145, 30, false
),
(
  'vibra', 'Vibra', 'Cuando todo te brilla por dentro',
  'Plena primavera floreciendo. 28 entrenamientos en 38 días, con foco en cardio liviano y tono.',
  '✨', '#FFD93D', '#F2A745',
  current_date + 146, current_date + 183, 28, false
),
(
  'solsticio', 'Solsticio', 'Tu mejor verano',
  'El sol más largo del año. 28 entrenamientos en 38 días para vivir el verano pleno con fuerza y energía sostenible.',
  '☀️', '#FFA94D', '#FF6B35',
  current_date + 184, current_date + 221, 28, false
),
(
  'travesia', 'Travesía', 'Lo que aprendimos en el verano',
  'Cierre del verano largo. 25 entrenamientos en 35 días con foco en recuperación activa, yoga y respiración.',
  '🌊', '#7BAFD4', '#3D6A8C',
  current_date + 222, current_date + 256, 25, false
),
(
  'cosecha', 'Cosecha', 'Lo que sembraste, ahora se ve',
  'Recolección de logros. Otoño temprano. 25 entrenamientos en 35 días para integrar todo lo que aprendiste en el año.',
  '🍂', '#D4956A', '#A85F3C',
  current_date + 257, current_date + 291, 25, false
),
(
  'equinoccio', 'Equinoccio', 'Equilibrio entre fuerza y ternura',
  'Otoño en balance. Día y noche iguales — un recordatorio de que también lo somos. 25 entrenamientos en 35 días, yoga + fuerza.',
  '🌗', '#B89882', '#7A5C4A',
  current_date + 292, current_date + 326, 25, false
),
(
  'refugio', 'Refugio', 'Tu cuerpo cuida lo que tu alma necesita',
  'Prep invierno con calma. Bajamos la intensidad y subimos el cuidado interior. 25 entrenamientos en 35 días.',
  '🕯️', '#9C8276', '#604B40',
  current_date + 327, current_date + 361, 25, false
);

-- Después del último (día +361), el ciclo se reinicia con Raíz al siguiente día.
-- Cuando llegue ese momento (1 año), correr de nuevo este script o programar un cron.
