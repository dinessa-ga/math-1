import { Character, LevelConfig } from "./types";

export const MAIN_CHARACTER: Character = {
  id: 'astronaut',
  name: 'Astronauta',
  emoji: '👨‍🚀',
  color: 'bg-blue-500'
};

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: "Exploradores",
    role: "Descubrir operaciones básicas con 100",
    theme: "Escenario clásico con estrellas",
    icon: "⭐",
    bgClass: "from-blue-900 to-black",
    objectEmoji: "⭐",
    successMessage: "¡Van muy bien, sigan así!",
    description: "Operaciones simples con 100"
  },
  {
    id: 2,
    name: "Constructores",
    role: "Construir bases sólidas con decimales",
    theme: "Escenario espacial con planetas",
    icon: "🪐",
    bgClass: "from-indigo-900 to-black",
    objectEmoji: "🪐",
    successMessage: "¡Excelente trabajo en equipo, continúen avanzando!",
    description: "Decimales entre 10, 100 y 1000"
  },
  {
    id: 3,
    name: "Escaladores",
    role: "Subir y superar obstáculos con decimales complejos",
    theme: "Escenario terrestre con montañas",
    icon: "🏔️",
    bgClass: "from-slate-800 to-slate-900",
    objectEmoji: "🏔️",
    successMessage: "¡Gran esfuerzo, están listos para el siguiente reto!",
    description: "Operaciones con decimales complejos"
  },
  {
    id: 4,
    name: "Navegantes",
    role: "Orientarse en aguas profundas con números grandes",
    theme: "Escenario acuático con burbujas",
    icon: "🫧",
    bgClass: "from-cyan-900 to-blue-950",
    objectEmoji: "🫧",
    successMessage: "¡Navegantes, cruzaron el océano unidos!",
    description: "Mixtas con decimales y números grandes"
  },
  {
    id: 5,
    name: "Constructores de ciudad",
    role: "Organizar y levantar estructuras rápidas y precisas",
    theme: "Escenario urbano con edificios",
    icon: "🏙️",
    bgClass: "from-gray-800 to-gray-950",
    objectEmoji: "🏙️",
    successMessage: "¡Constructores de ciudad, levantaron su comunidad con esfuerzo colectivo!",
    description: "Operaciones rápidas y precisas"
  },
  {
    id: 6,
    name: "Corredores de la meta",
    role: "Correr juntos hacia la victoria final",
    theme: "Carrera final hasta la meta",
    icon: "🏁",
    bgClass: "from-orange-900 to-red-950",
    objectEmoji: "🏁",
    successMessage: "¡Corredores, alcanzaron la meta gracias al esfuerzo de todos!",
    description: "Carrera final: Enteros y decimales"
  }
];

export const GROWTH_MESSAGES = {
  success: [
    "¡Tu esfuerzo valió!",
    "¡Aprendiste y ganaste!",
    "¡Sigue así!",
    "¡Lo estás logrando!",
    "¡Logro por práctica!"
  ],
  error: [
    "¡El error enseña!",
    "¡Sigue intentando!",
    "¡Aprende del error!",
    "¡Casi lo tienes!",
    "¡Tú puedes mejorar!"
  ]
};

export const SUCCESS_THRESHOLD = 5; // Correct answers to level up
