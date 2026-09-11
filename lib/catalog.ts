export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  kind: "physical" | "audio" | "ebook" | "course";
  description: string;
  image: string;
  gallery?: string[];
  video?: string;
  tag?: string;
  sku: string;
  published?: boolean;
};
export const images = {
  crystal:
    "https://images.unsplash.com/photo-1659233236926-add1ff68173f?auto=format&fit=crop&w=1200&q=85",
  bowl: "https://images.unsplash.com/photo-1746802401350-b99c6e692a05?auto=format&fit=crop&w=1200&q=85",
  ritual:
    "https://images.pexels.com/photos/6634253/pexels-photo-6634253.jpeg?auto=compress&cs=tinysrgb&w=1800",
  sound:
    "https://images.pexels.com/photos/10574239/pexels-photo-10574239.jpeg?auto=compress&cs=tinysrgb&w=1000",
};
export const categories = [
  "Todos",
  "Pulseras de cuarzos",
  "Cuencos tibetanos",
  "Cuencos de cuarzo",
  "Japamalas",
  "Arcángeles",
  "Cuarzos",
];
export const products: Product[] = [
  {
    id: "amatista-natural",
    sku: "CZ-AM-01",
    name: "Amatista natural",
    category: "Cuarzos",
    price: 38000,
    stock: 12,
    kind: "physical",
    description:
      "Una pieza de amatista en bruto para acompañar tu rincón de calma. Cada mineral tiene formas y tonalidades únicas. Fotografía ilustrativa; confirma dimensiones y pieza final antes de publicar.",
    image: images.crystal,
    gallery: [images.crystal],
    tag: "Natural y única",
  },
  {
    id: "cuenco-tibetano",
    sku: "CT-01",
    name: "Cuenco tibetano · Ritual",
    category: "Cuencos tibetanos",
    price: 129000,
    stock: 6,
    kind: "physical",
    description:
      "Cuenco con baqueta para crear un momento de escucha consciente. Incluye base de apoyo. La ficha está preparada para incorporar la grabación de sonido de cada pieza.",
    image: images.bowl,
    gallery: [images.bowl, images.sound],
    tag: "Sonido y calma",
  },
  {
    id: "cuenco-artesanal",
    sku: "CT-02",
    name: "Cuenco tibetano · Esencia",
    category: "Cuencos tibetanos",
    price: 169000,
    stock: 3,
    kind: "physical",
    description:
      "Un cuenco para tus prácticas de meditación y relajación. Catálogo de muestra: el tamaño, composición y grabación deben confirmarse con el proveedor.",
    image: images.sound,
    gallery: [images.sound, images.bowl],
  },
  {
    id: "coleccion-amatista",
    sku: "CZ-AM-02",
    name: "Amatista · Pequeño ritual",
    category: "Cuarzos",
    price: 24000,
    stock: 9,
    kind: "physical",
    description:
      "Pequeña selección de amatista para un espacio personal. Su belleza está en sus variaciones naturales. Imagen ilustrativa del tipo de mineral.",
    image: images.crystal,
    tag: "Para empezar",
  },
  {
    id: "meditacion-descanso",
    sku: "AU-01",
    name: "Descanso profundo",
    category: "Meditaciones",
    price: 14900,
    stock: 999,
    kind: "audio",
    description:
      "Meditación exclusiva para cerrar el día. Reproducción y descarga desde tu biblioteca después de la compra. Contenido de muestra pendiente de la grabación definitiva.",
    image: images.ritual,
  },
  {
    id: "meditacion-presencia",
    sku: "AU-02",
    name: "El arte de estar presente",
    category: "Meditaciones",
    price: 19900,
    stock: 999,
    kind: "audio",
    description:
      "Una práctica para volver al momento presente. Incluye acceso personal en línea y descarga. Contenido editorial de muestra.",
    image: images.crystal,
  },
  {
    id: "libro-rituales",
    sku: "PDF-01",
    name: "Tu cuaderno de rituales",
    category: "Recursos",
    price: 18900,
    stock: 999,
    kind: "ebook",
    description:
      "Cuaderno digital para acompañar tus prácticas y reflexiones. El archivo definitivo se cargará antes de habilitar la venta.",
    image: images.ritual,
  },
  {
    id: "curso-meditacion",
    sku: "CUR-01",
    name: "Meditación desde cero",
    category: "Cursos",
    price: 69000,
    stock: 20,
    kind: "course",
    description:
      "Cuatro encuentros para construir una práctica personal. Modalidad en línea. Fechas y disponibilidad por confirmar antes de abrir inscripciones.",
    image: images.bowl,
  },
];
export const topics = [
  "Todos",
  "Presencia",
  "Descanso",
  "Gratitud",
  "Respiración",
];
export const meditations = [
  [
    "Vuelve a tu respiración",
    "Respiración",
    "Nota el aire entrar y salir, sin cambiarlo.",
  ],
  ["Una pausa para ti", "Presencia", "Permítete detenerte por un momento."],
  ["Empieza con calma", "Presencia", "Abre el día con una intención sencilla."],
  ["Suelta el día", "Descanso", "Deja para mañana lo que puede esperar."],
  [
    "Un momento de gratitud",
    "Gratitud",
    "Reconoce algo pequeño que agradeces.",
  ],
  ["Aquí y ahora", "Presencia", "Observa los sonidos de este momento."],
  [
    "Respira a tu ritmo",
    "Respiración",
    "Deja que tu respiración encuentre su propio ritmo.",
  ],
  [
    "Descansa los hombros",
    "Descanso",
    "Suelta suavemente la tensión de tus hombros.",
  ],
  [
    "Tu espacio seguro",
    "Presencia",
    "Busca una postura en la que te sientas a gusto.",
  ],
  ["Agradece tu camino", "Gratitud", "Reconoce el esfuerzo que has hecho hoy."],
  [
    "La calma de la noche",
    "Descanso",
    "Permite que el ritmo del día se vuelva más lento.",
  ],
  ["Escucha tu cuerpo", "Presencia", "Observa tus sensaciones sin juzgarlas."],
  [
    "Una respiración nueva",
    "Respiración",
    "Regresa con suavidad a cada nueva respiración.",
  ],
  ["Pequeñas alegrías", "Gratitud", "Recuerda un detalle que te hizo sonreír."],
  [
    "Deja pasar los pensamientos",
    "Presencia",
    "Observa tus pensamientos como nubes que pasan.",
  ],
  [
    "Antes de descansar",
    "Descanso",
    "No necesitas resolver nada en este momento.",
  ],
  [
    "Habita el silencio",
    "Presencia",
    "Escucha el espacio que hay entre los sonidos.",
  ],
  [
    "Gracias por este momento",
    "Gratitud",
    "Dedica esta pausa a algo que valoras.",
  ],
  [
    "Regresa con suavidad",
    "Respiración",
    "Si te distraes, vuelve a sentir la respiración.",
  ],
  ["Un cierre consciente", "Descanso", "Despide tu práctica con amabilidad."],
].map(([name, topic, prompt], i) => ({
  id: `pausa-${i + 1}`,
  name,
  topic,
  prompt,
  src: `/audio/pausa-${i + 1}.wav`,
  free: true,
}));
export function money(cents: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
