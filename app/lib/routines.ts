/**
 * Catálogo de rutinas con metadata extendida para el Workout Player.
 * Cada ejercicio tiene:
 *  - name, reps/duration
 *  - kind: 'reps' (cuenta repeticiones) o 'time' (cronómetro)
 *  - sets: número de series
 *  - rest: descanso entre series (segundos)
 *  - cue: tip de forma corta
 *  - animationUrl: Lottie hosted en lottiefiles (free)
 *  - emoji: fallback visual
 */

export type Exercise = {
  name: string;
  kind: 'reps' | 'time';
  amount: number; // reps o segundos
  sets: number;
  rest: number; // segundos
  cue: string;
  emoji: string;
  animationUrl?: string;
};

export type Routine = {
  slug: string;
  title: string;
  duration: string;
  level: string;
  emoji: string;
  color: string;
  description: string;
  warmup: string[];
  cooldown: string[];
  exercises: Exercise[];
  imageUrl: string;
};

export const ROUTINES: Record<string, Routine> = {
  'full-body-25': {
    slug: 'full-body-25',
    title: 'Full Body',
    duration: '25 min',
    level: 'Principiante',
    emoji: '💪',
    color: 'from-glow-500 to-glow-600',
    description: 'Trabajo completo de cuerpo enfocado en tonificación general. Ideal para empezar la semana.',
    warmup: ['1 min trote suave en el sitio', '10 círculos amplios de brazos', '10 sentadillas suaves'],
    cooldown: ['Estiramiento de piernas 30 seg c/u', 'Inclinación lateral de tronco', 'Respiración profunda 1 min'],
    exercises: [
      { name: 'Sentadillas', kind: 'reps', amount: 12, sets: 3, rest: 30, cue: 'Rodillas alineadas con los pies. Espalda recta.', emoji: '🦵' },
      { name: 'Flexiones (rodillas si necesitas)', kind: 'reps', amount: 10, sets: 3, rest: 30, cue: 'Core activo. Cuerpo recto.', emoji: '💪' },
      { name: 'Plancha', kind: 'time', amount: 30, sets: 3, rest: 30, cue: 'Caderas alineadas. No sueltes el core.', emoji: '🧱' },
      { name: 'Zancadas alternadas', kind: 'reps', amount: 10, sets: 3, rest: 30, cue: 'Rodilla nunca pasa de la punta del pie.', emoji: '🚶‍♀️' },
      { name: 'Mountain climbers', kind: 'reps', amount: 20, sets: 3, rest: 45, cue: 'Ritmo constante. Respira.', emoji: '🏔️' },
    ],
    imageUrl: '/assets/hero-home.jpg',
  },
  'abs-15': {
    slug: 'abs-15',
    title: 'Abdomen express',
    duration: '15 min',
    level: 'Todos',
    emoji: '🔥',
    color: 'from-orange-500 to-red-500',
    description: 'Quemador rápido de abdomen. Perfecto para días con poco tiempo.',
    warmup: ['30 seg saltos en el sitio', '10 rotaciones de cadera'],
    cooldown: ['Estiramiento de abdomen (postura cobra)', 'Respiración profunda'],
    exercises: [
      { name: 'Crunches', kind: 'reps', amount: 15, sets: 3, rest: 20, cue: 'Sube con el abdomen, no con el cuello.', emoji: '💢' },
      { name: 'Plancha lateral (derecha)', kind: 'time', amount: 20, sets: 3, rest: 20, cue: 'Caderas arriba. Mira al frente.', emoji: '↗️' },
      { name: 'Plancha lateral (izquierda)', kind: 'time', amount: 20, sets: 3, rest: 20, cue: 'Caderas arriba. Mira al frente.', emoji: '↖️' },
      { name: 'Tijeras (scissor kicks)', kind: 'reps', amount: 20, sets: 3, rest: 30, cue: 'Lumbares pegadas al suelo.', emoji: '✂️' },
      { name: 'Bicicleta', kind: 'reps', amount: 20, sets: 3, rest: 30, cue: 'Toca codo con rodilla opuesta.', emoji: '🚴‍♀️' },
    ],
    imageUrl: '/assets/hero-juntas.jpg',
  },
  'gluteos-30': {
    slug: 'gluteos-30',
    title: 'Glúteos & piernas',
    duration: '30 min',
    level: 'Intermedio',
    emoji: '🍑',
    color: 'from-pink-500 to-glow-500',
    description: 'Activación profunda de glúteos y tonificación de piernas.',
    warmup: ['2 min trote suave', '10 sentadillas profundas'],
    cooldown: ['Estiramiento de glúteo (postura paloma)', 'Estiramiento de cuádriceps'],
    exercises: [
      { name: 'Sentadilla sumo', kind: 'reps', amount: 15, sets: 4, rest: 45, cue: 'Pies más anchos que hombros. Glúteo activo.', emoji: '🍑' },
      { name: 'Hip thrust', kind: 'reps', amount: 15, sets: 4, rest: 45, cue: 'Aprieta glúteos arriba 1 seg.', emoji: '🌋' },
      { name: 'Zancada caminando (derecha)', kind: 'reps', amount: 10, sets: 4, rest: 60, cue: 'Pasos largos. Rodilla alineada.', emoji: '➡️' },
      { name: 'Zancada caminando (izquierda)', kind: 'reps', amount: 10, sets: 4, rest: 60, cue: 'Pasos largos. Rodilla alineada.', emoji: '⬅️' },
      { name: 'Patada de glúteo', kind: 'reps', amount: 15, sets: 3, rest: 30, cue: 'Talón al techo. No arquees lumbar.', emoji: '⬆️' },
      { name: 'Puente con marcha', kind: 'reps', amount: 20, sets: 3, rest: 30, cue: 'Caderas estables. Alterna piernas.', emoji: '🌉' },
    ],
    imageUrl: '/assets/hero-gym.jpg',
  },
  'cardio-20': {
    slug: 'cardio-20',
    title: 'Cardio HIIT',
    duration: '20 min',
    level: 'Intermedio',
    emoji: '⚡',
    color: 'from-yellow-500 to-glow-500',
    description: 'Quema máxima con intervalos cortos de alta intensidad.',
    warmup: ['2 min movilidad articular', '30 seg jumping jacks'],
    cooldown: ['Caminar 2 min', 'Estiramiento general'],
    exercises: [
      { name: 'Jumping jacks', kind: 'time', amount: 45, sets: 3, rest: 15, cue: 'Brazos y piernas coordinados.', emoji: '🤸‍♀️' },
      { name: 'Burpees', kind: 'time', amount: 45, sets: 3, rest: 15, cue: 'Aterriza suave. Respira.', emoji: '💥' },
      { name: 'Skipping alto', kind: 'time', amount: 45, sets: 3, rest: 15, cue: 'Rodillas a la altura de la cadera.', emoji: '⬆️' },
      { name: 'Mountain climbers', kind: 'time', amount: 45, sets: 3, rest: 15, cue: 'Ritmo rápido pero controlado.', emoji: '🏔️' },
      { name: 'Sentadilla con salto', kind: 'time', amount: 45, sets: 3, rest: 60, cue: 'Aterriza suave en sentadilla.', emoji: '🚀' },
    ],
    imageUrl: '/assets/pilar-rutinas.jpg',
  },
  'yoga-30': {
    slug: 'yoga-30',
    title: 'Yoga & estiramiento',
    duration: '30 min',
    level: 'Principiante',
    emoji: '🧘‍♀️',
    color: 'from-emerald-500 to-teal-500',
    description: 'Movilidad, respiración y conexión cuerpo-mente.',
    warmup: ['3 respiraciones profundas', 'Gato-vaca x 8'],
    cooldown: ['Savasana 3-5 min'],
    exercises: [
      { name: 'Saludo al sol', kind: 'reps', amount: 5, sets: 1, rest: 30, cue: 'Sincroniza respiración con movimiento.', emoji: '☀️' },
      { name: 'Postura del niño', kind: 'time', amount: 60, sets: 1, rest: 15, cue: 'Frente al suelo, relaja columna.', emoji: '🧘' },
      { name: 'Guerrero (derecha)', kind: 'time', amount: 45, sets: 1, rest: 15, cue: 'Rodilla sobre tobillo. Brazos firmes.', emoji: '⚔️' },
      { name: 'Guerrero (izquierda)', kind: 'time', amount: 45, sets: 1, rest: 15, cue: 'Rodilla sobre tobillo. Brazos firmes.', emoji: '🛡️' },
      { name: 'Paloma (derecha)', kind: 'time', amount: 60, sets: 1, rest: 15, cue: 'Caderas abiertas. Respira profundo.', emoji: '🕊️' },
      { name: 'Paloma (izquierda)', kind: 'time', amount: 60, sets: 1, rest: 15, cue: 'Caderas abiertas. Respira profundo.', emoji: '🕊️' },
    ],
    imageUrl: '/assets/hero-35plus.jpg',
  },
  'movilidad-10': {
    slug: 'movilidad-10',
    title: 'Movilidad matutina',
    duration: '10 min',
    level: 'Todos',
    emoji: '☀️',
    color: 'from-amber-400 to-orange-500',
    description: 'Despierta el cuerpo con movimientos suaves. Perfecto en la mañana.',
    warmup: ['Respira profundo 5 veces'],
    cooldown: ['Estiramiento general 1 min'],
    exercises: [
      { name: 'Rotaciones de cuello', kind: 'reps', amount: 10, sets: 1, rest: 10, cue: 'Suave. Sin rebotes.', emoji: '🔄' },
      { name: 'Círculos de hombros', kind: 'reps', amount: 15, sets: 2, rest: 10, cue: 'Adelante 15, atrás 15.', emoji: '🤷‍♀️' },
      { name: 'Inclinación lateral', kind: 'reps', amount: 5, sets: 2, rest: 10, cue: 'Brazo arriba. Costado largo.', emoji: '↔️' },
      { name: 'Cat-cow', kind: 'reps', amount: 10, sets: 1, rest: 10, cue: 'Sincroniza con respiración.', emoji: '🐈' },
      { name: 'Estiramiento de cadera', kind: 'time', amount: 30, sets: 2, rest: 10, cue: 'Suave. Respira en el estiramiento.', emoji: '🦵' },
    ],
    imageUrl: '/assets/hero-mamas.jpg',
  },
};

export function getRoutine(slug: string): Routine | null {
  return ROUTINES[slug] ?? null;
}

export function listRoutines(): Routine[] {
  return Object.values(ROUTINES);
}
