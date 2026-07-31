import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export interface DIYStep {
  order: number;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  tipsEs?: string;
  tipsEn?: string;
  image?: string;
}

export interface DIYProject {
  id: string;
  slug: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  timeEs: string;
  timeEn: string;
  budgetEs: string;
  budgetEn: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  coverImage?: string;
  steps: DIYStep[];
  materialsEs: string;
  materialsEn: string;
  toolsEs: string;
  toolsEn: string;
  tipsEs?: string;
  tipsEn?: string;
  relatedContractors: string[];
}

const SEED_PROJECTS: DIYProject[] = [
  {
    id: "diy_paint_room",
    slug: "pintar-habitacion",
    category: "catReparaciones",
    difficulty: "easy",
    timeEs: "4-6 horas",
    timeEn: "4-6 hours",
    budgetEs: "$50–$150",
    budgetEn: "$50–$150",
    titleEs: "Pintar una habitación",
    titleEn: "Paint a Room",
    descEs: "Transforma cualquier espacio con una capa de pintura fresca. Sigue esta guía para obtener resultados profesionales sin contratar a un pintor.",
    descEn: "Transform any space with a fresh coat of paint. Follow this guide to get professional results without hiring a painter.",
    coverImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=85",
    steps: [
      {
        order: 1,
        titleEs: "Prepara la habitación",
        titleEn: "Prep the room",
        descEs: "Mueve los muebles al centro y cúbrelos con plástico. Retira los cuadros y cubre los enchufes con cinta de pintor.",
        descEn: "Move furniture to the center and cover with plastic. Remove wall art and cover outlets with painter's tape.",
        tipsEs: "Usa láminas de plástico de 2 milésimas para proteger el piso.",
        tipsEn: "Use 2-mil plastic sheeting to protect the floor.",
      },
      {
        order: 2,
        titleEs: "Lija y limpia las paredes",
        titleEn: "Sand and clean walls",
        descEs: "Lija ligeramente las paredes con lija de grano 120 para que la pintura nueva se adhiera mejor. Limpia el polvo con un trapo húmedo.",
        descEn: "Lightly sand walls with 120-grit sandpaper so new paint adheres better. Wipe dust with a damp cloth.",
      },
      {
        order: 3,
        titleEs: "Aplica la imprimación",
        titleEn: "Apply primer",
        descEs: "Aplica una capa de imprimación si estás cubriendo un color oscuro o pintando sobre paredes nuevas. Deja secar 2 horas.",
        descEn: "Apply a coat of primer if covering a dark color or painting over new drywall. Let dry 2 hours.",
      },
      {
        order: 4,
        titleEs: "Pinta los bordes",
        titleEn: "Cut in the edges",
        descEs: "Usa una brocha de 2 pulgadas para pintar los bordes donde la pared encuentra el techo, esquinas y marcos de puertas.",
        descEn: "Use a 2-inch brush to paint edges where walls meet the ceiling, corners, and door frames.",
      },
      {
        order: 5,
        titleEs: "Aplica la pintura con rodillo",
        titleEn: "Roll the paint",
        descEs: "Usa un rodillo de 9 pulgadas con cubierta de microfibra. Aplica en forma de 'W' y rellena sin levantar el rodillo. Dos capas es lo ideal.",
        descEn: "Use a 9-inch roller with a microfiber cover. Apply in a 'W' pattern and fill in without lifting the roller. Two coats is ideal.",
        tipsEs: "No cargues demasiado el rodillo — un exceso de pintura causa goteo.",
        tipsEn: "Don't overload the roller — too much paint causes drips.",
      },
      {
        order: 6,
        titleEs: "Retira la cinta y disfruta",
        titleEn: "Remove tape and enjoy",
        descEs: "Retira la cinta de pintor mientras la pintura aún está ligeramente húmeda para evitar que se desprenda con la cinta.",
        descEn: "Remove painter's tape while paint is still slightly damp to prevent peeling.",
      },
    ],
    materialsEs: "Pintura (1 galón por cada 400 pies²), imprimación, cinta de pintor, plástico para piso",
    materialsEn: "Paint (1 gal per 400 sq ft), primer, painter's tape, drop cloth",
    toolsEs: "Rodillo de 9 pulgadas, brocha de 2 pulgadas, bandeja para pintura, lija de grano 120, trapo",
    toolsEn: "9-inch roller, 2-inch brush, paint tray, 120-grit sandpaper, rag",
    tipsEs: "Compra pintura de alta calidad — cubre mejor y dura más años.",
    tipsEn: "Buy high-quality paint — it covers better and lasts years longer.",
    relatedContractors: [],
  },
  {
    id: "diy_backsplash",
    slug: "instalar-backsplash",
    category: "catCocinas",
    difficulty: "medium",
    timeEs: "6-8 horas",
    timeEn: "6-8 hours",
    budgetEs: "$200–$600",
    budgetEn: "$200–$600",
    titleEs: "Instalar un backsplash",
    titleEn: "Install a Backsplash",
    descEs: "Dale vida a tu cocina con un backsplash de azulejos. Este proyecto es ideal para un fin de semana y transforma completamente el espacio.",
    descEn: "Bring your kitchen to life with a tile backsplash. This weekend project completely transforms the space.",
    coverImage: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=900&q=85",
    steps: [
      {
        order: 1,
        titleEs: "Elige y compra los azulejos",
        titleEn: "Choose and buy tile",
        descEs: "Mide el área y compra un 10% extra. Los azulejos tipo metro (subway) de 3x6 son los más fáciles para principiantes.",
        descEn: "Measure the area and buy 10% extra. 3x6 subway tiles are the easiest for beginners.",
      },
      {
        order: 2,
        titleEs: "Prepara la superficie",
        titleEn: "Prepare the surface",
        descEs: "Limpia bien la pared con desengrasante. Marca una línea recta horizontal con nivel para asegurar la primera fila.",
        descEn: "Clean the wall thoroughly with degreaser. Mark a level horizontal line for the first row.",
      },
      {
        order: 3,
        titleEs: "Aplica el pegamento",
        titleEn: "Apply adhesive",
        descEs: "Usa un adhesivo delgado (thinset) mezclado según instrucciones. Aplica con llana dentada de ¼ pulgada en secciones pequeñas.",
        descEn: "Use thinset mortar mixed per instructions. Apply with a ¼-inch notched trowel in small sections.",
      },
      {
        order: 4,
        titleEs: "Coloca los azulejos",
        titleEn: "Set the tile",
        descEs: "Presiona cada azulejo en el adhesivo con un ligero giro. Usa separadores de 1/16 pulgada para espacio uniforme.",
        descEn: "Press each tile into the adhesive with a slight twist. Use 1/16-inch spacers for even gaps.",
      },
      {
        order: 5,
        titleEs: "Aplica la lechada",
        titleEn: "Apply grout",
        descEs: "Espera 24 horas. Mezcla la lechada y aplícala con una llana de goma en diagonal. Limpia el exceso con una esponja húmeda.",
        descEn: "Wait 24 hours. Mix grout and apply with a rubber float at a diagonal. Wipe excess with a damp sponge.",
      },
      {
        order: 6,
        titleEs: "Sella y disfruta",
        titleEn: "Seal and enjoy",
        descEs: "Aplica sellador de lechada después de 72 horas de curado. ¡Disfruta de tu nueva cocina!",
        descEn: "Apply grout sealer after 72 hours of curing. Enjoy your new kitchen!",
        tipsEs: "La lechada con sellador integrado ahorra este paso extra.",
        tipsEn: "Grout with built-in sealer saves this extra step.",
      },
    ],
    materialsEs: "Azulejos, adhesivo thinset, lechada, sellador, separadores",
    materialsEn: "Tile, thinset mortar, grout, sealer, spacers",
    toolsEs: "Llana dentada, llana de goma, cortador de azulejos, nivel, esponja, cubeta",
    toolsEn: "Notched trowel, rubber float, tile cutter, level, sponge, bucket",
    tipsEs: "Empieza desde el centro y trabaja hacia los extremos para un diseño simétrico.",
    tipsEn: "Start from the center and work outward for a symmetrical layout.",
    relatedContractors: [],
  },
  {
    id: "diy_cabinets",
    slug: "renovar-gabinetes",
    category: "catCocinas",
    difficulty: "medium",
    timeEs: "2-3 días",
    timeEn: "2-3 days",
    budgetEs: "$100–$300",
    budgetEn: "$100–$300",
    titleEs: "Renovar gabinetes de cocina",
    titleEn: "Refinish Kitchen Cabinets",
    descEs: "Transforma tus gabinetes sin reemplazarlos. Una capa de pintura y herrajes nuevos pueden hacer que tu cocina luzca completamente diferente.",
    descEn: "Transform your cabinets without replacing them. New paint and hardware can make your kitchen look completely different.",
    coverImage: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=900&q=85",
    steps: [
      {
        order: 1,
        titleEs: "Retira puertas y herrajes",
        titleEn: "Remove doors and hardware",
        descEs: "Numera cada puerta y su ubicación para facilitar el reensamblaje. Guarda los tornillos en bolsas etiquetadas.",
        descEn: "Number each door and its location for easy reassembly. Store screws in labeled bags.",
      },
      {
        order: 2,
        titleEs: "Lija todas las superficies",
        titleEn: "Sand all surfaces",
        descEs: "Lija con lija de grano 120 para quitar el acabado brillante. No necesitas llegar a la madera desnuda, solo crear una superficie adherente.",
        descEn: "Sand with 120-grit to remove glossy finish. You don't need to reach bare wood — just create a toothy surface.",
      },
      {
        order: 3,
        titleEs: "Limpia y desengrasa",
        titleEn: "Clean and degrease",
        descEs: "Limpia todo con un desengrasante fuerte (TSP funciona bien). El polvo de lija y la grasa son enemigos de la pintura.",
        descEn: "Clean everything with a strong degreaser (TSP works well). Sanding dust and grease are paint's enemies.",
      },
      {
        order: 4,
        titleEs: "Aplica imprimación y pintura",
        titleEn: "Prime and paint",
        descEs: "Usa imprimación para superficies difíciles. Aplica pintura con rodillo de espuma para un acabado liso. 2-3 capas finas son mejores que una gruesa.",
        descEn: "Use stain-blocking primer. Apply paint with a foam roller for a smooth finish. 2-3 thin coats are better than one thick coat.",
        tipsEs: "Usa pintura a base de aceite para mayor durabilidad en la cocina.",
        tipsEn: "Use oil-based paint for better durability in the kitchen.",
      },
      {
        order: 5,
        titleEs: "Instala nuevos herrajes",
        titleEn: "Install new hardware",
        descEs: "Mide y taladra agujeros para tiradores nuevos. Usa una plantilla para asegurar consistencia en todas las puertas.",
        descEn: "Measure and drill holes for new handles. Use a jig to ensure consistency across all doors.",
      },
      {
        order: 6,
        titleEs: "Reensambla y disfruta",
        titleEn: "Reassemble and enjoy",
        descEs: "Espera 48 horas para que la pintura cure completamente antes de colgar las puertas y colocar objetos pesados.",
        descEn: "Wait 48 hours for paint to fully cure before hanging doors and placing heavy items.",
      },
    ],
    materialsEs: "Pintura para gabinetes, imprimación, desengrasante (TSP), herrajes nuevos",
    materialsEn: "Cabinet paint, primer, degreaser (TSP), new hardware",
    toolsEs: "Lija de grano 120, rodillo de espuma, brocha, taladro, plantilla para herrajes, bolsas para etiquetar",
    toolsEn: "120-grit sandpaper, foam roller, brush, drill, hardware jig, labeling bags",
    tipsEs: "Los gabinetes blancos o tonos claros hacen que la cocina se vea más grande y luminosa.",
    tipsEn: "White or light-toned cabinets make the kitchen look larger and brighter.",
    relatedContractors: [],
  },
  {
    id: "diy_gardening",
    slug: "jardineria-basica",
    category: "catJardineria",
    difficulty: "easy",
    timeEs: "3-4 horas",
    timeEn: "3-4 hours",
    budgetEs: "$100–$300",
    budgetEn: "$100–$300",
    titleEs: "Jardinería básica para principiantes",
    titleEn: "Basic Gardening for Beginners",
    descEs: "Crea un jardín floreciente desde cero. Esta guía cubre selección de plantas, preparación del suelo y cuidados básicos para el éxito.",
    descEn: "Create a thriving garden from scratch. This guide covers plant selection, soil preparation, and basic care for success.",
    coverImage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=85",
    steps: [
      {
        order: 1,
        titleEs: "Elige la ubicación",
        titleEn: "Choose the location",
        descEs: "Observa cuántas horas de sol directo recibe el área. La mayoría de las plantas comestibles necesitan 6-8 horas de sol al día.",
        descEn: "Observe how many hours of direct sun the area gets. Most edible plants need 6-8 hours of sun daily.",
      },
      {
        order: 2,
        titleEs: "Prepara el suelo",
        titleEn: "Prepare the soil",
        descEs: "Remueve la tierra a 12 pulgadas de profundidad. Mezcla compost orgánico para enriquecer el suelo. Retira piedras y malas hierbas.",
        descEn: "Turn soil to 12 inches deep. Mix in organic compost to enrich. Remove rocks and weeds.",
      },
      {
        order: 3,
        titleEs: "Selecciona tus plantas",
        titleEn: "Select your plants",
        descEs: "Para principiantes: albahaca, tomates cherry, lechuga, caléndulas y suculentas. Elige plantas nativas para menos mantenimiento.",
        descEn: "For beginners: basil, cherry tomatoes, lettuce, marigolds, and succulents. Choose native plants for less maintenance.",
      },
      {
        order: 4,
        titleEs: "Planta con cuidado",
        titleEn: "Plant carefully",
        descEs: "Cava agujeros del doble del ancho del contenedor de la planta. Coloca la planta a la misma profundidad que estaba en su maceta. Riega bien después de plantar.",
        descEn: "Dig holes twice as wide as the plant container. Plant at the same depth as in its pot. Water well after planting.",
      },
      {
        order: 5,
        titleEs: "Aplica mulching",
        titleEn: "Apply mulch",
        descEs: "Cubre el suelo con 2-3 pulgadas de mulch orgánico. Esto conserva humedad, suprime malas hierbas y regula la temperatura del suelo.",
        descEn: "Cover soil with 2-3 inches of organic mulch. This retains moisture, suppresses weeds, and regulates soil temperature.",
      },
    ],
    materialsEs: "Compost orgánico, mulch, plantas o semillas, tierra para macetas (si aplica)",
    materialsEn: "Organic compost, mulch, plants or seeds, potting soil (if applicable)",
    toolsEs: "Palita, guantes de jardinería, manguera con rociador, rastrillo",
    toolsEn: "Trowel, gardening gloves, hose with sprayer, rake",
    tipsEs: "Riega en la mañana temprano para reducir la evaporación y prevenir hongos.",
    tipsEn: "Water early morning to reduce evaporation and prevent fungal issues.",
    relatedContractors: [],
  },
  {
    id: "diy_thermostat",
    slug: "instalar-termostato-inteligente",
    category: "catReparaciones",
    difficulty: "medium",
    timeEs: "30-60 minutos",
    timeEn: "30-60 minutes",
    budgetEs: "$30–$250",
    budgetEn: "$30–$250",
    titleEs: "Instalar un termostato inteligente",
    titleEn: "Install a Smart Thermostat",
    descEs: "Ahorra en tu factura de energía instalando un termostato inteligente. La mayoría de los modelos modernos son compatibles con sistemas existentes.",
    descEn: "Save on your energy bill by installing a smart thermostat. Most modern models are compatible with existing systems.",
    coverImage: "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=900&q=85",
    steps: [
      {
        order: 1,
        titleEs: "Apaga la electricidad",
        titleEn: "Turn off power",
        descEs: "Apaga el interruptor del horno/AC en el panel eléctrico. Esto es crítico para tu seguridad — confirma que no hay voltaje con un multímetro.",
        descEn: "Turn off the furnace/AC breaker at the electrical panel. This is critical for safety — confirm no voltage with a multimeter.",
        tipsEs: "Toma una foto del cableado existente antes de desconectar nada.",
        tipsEn: "Take a photo of the existing wiring before disconnecting anything.",
      },
      {
        order: 2,
        titleEs: "Retira el termostato viejo",
        titleEn: "Remove old thermostat",
        descEs: "Desatornilla la cubierta y etiqueta cada cable con la letra del terminal (R, W, Y, G, C, etc.). Desconecta los cables uno por uno.",
        descEn: "Unscrew the cover and label each wire with its terminal letter (R, W, Y, G, C, etc.). Disconnect wires one at a time.",
      },
      {
        order: 3,
        titleEs: "Instala la placa base nueva",
        titleEn: "Install new base plate",
        descEs: "Pasa los cables por la placa base y atorníllala a la pared. Conecta cada cable al terminal correspondiente siguiendo las etiquetas.",
        descEn: "Feed wires through the base plate and screw it to the wall. Connect each wire to the matching terminal following your labels.",
      },
      {
        order: 4,
        titleEs: "Conecta y configura",
        titleEn: "Connect and configure",
        descEs: "Coloca el termostato en la placa base hasta que encaje. Restablece la electricidad y sigue las instrucciones en pantalla para conectarlo al WiFi.",
        descEn: "Snap the thermostat onto the base plate. Restore power and follow on-screen instructions to connect to WiFi.",
      },
    ],
    materialsEs: "Termostato inteligente, etiquetas para cables (incluidas con el termostato)",
    materialsEn: "Smart thermostat, wire labels (included with thermostat)",
    toolsEs: "Destornillador Phillips, taladro (si se requieren nuevos agujeros), nivel, multímetro (opcional)",
    toolsEn: "Phillips screwdriver, drill (if new holes needed), level, multimeter (optional)",
    tipsEs: "Verifica si tu sistema necesita un cable 'C' común — algunos termostatos vienen con un adaptador.",
    tipsEn: "Check if your system needs a 'C' common wire — some thermostats include an adapter.",
    relatedContractors: [],
  },
  {
    id: "diy_patio",
    slug: "renovar-patio-pequeno",
    category: "catPatios",
    difficulty: "hard",
    timeEs: "1-2 fines de semana",
    timeEn: "1-2 weekends",
    budgetEs: "$500–$2,000",
    budgetEn: "$500–$2,000",
    titleEs: "Renovar un patio pequeño",
    titleEn: "Renovate a Small Patio",
    descEs: "Convierte tu patio pequeño en un oasis exterior con losetas, plantas y una iluminación acogedora. Un proyecto gratificante para cualquier nivel.",
    descEn: "Turn your small patio into an outdoor oasis with tiles, plants, and cozy lighting. A rewarding project at any skill level.",
    coverImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=900&q=85",
    steps: [
      {
        order: 1,
        titleEs: "Diseña el espacio",
        titleEn: "Design the space",
        descEs: "Mide el patio y dibuja un plano. Define zonas: comedor, lounge, jardín. Elige un estilo y paleta de colores cohesiva.",
        descEn: "Measure the patio and sketch a layout. Define zones: dining, lounge, garden. Choose a cohesive style and color palette.",
      },
      {
        order: 2,
        titleEs: "Prepara la base",
        titleEn: "Prepare the base",
        descEs: "Nivela el suelo y coloca una barrera contra malas hierbas. Si instalas losetas, asegúrate de que la superficie esté firme y nivelada.",
        descEn: "Level the ground and lay a weed barrier. If installing tiles, make sure the surface is firm and level.",
      },
      {
        order: 3,
        titleEs: "Instala el piso",
        titleEn: "Install the flooring",
        descEs: "Usa losetas de vinilo o cemento entrelazadas (interlocking) — son fáciles de instalar y no requieren pegamento. Trabaja desde una esquina.",
        descEn: "Use interlocking vinyl or cement tiles — they're easy to install and require no adhesive. Work from a corner.",
      },
      {
        order: 4,
        titleEs: "Agrega mobiliario y plantas",
        titleEn: "Add furniture and plants",
        descEs: "Elige muebles plegables o multiusos para espacios pequeños. Las plantas en macetas verticales maximizan el espacio.",
        descEn: "Choose foldable or multi-use furniture for small spaces. Vertical potted plants maximize space.",
      },
      {
        order: 5,
        titleEs: "Instala iluminación ambiental",
        titleEn: "Install ambient lighting",
        descEs: "Cuerdas de luces LED, faroles solares y velas crean ambiente sin necesidad de electricidad. Los focos LED recargables son ideales.",
        descEn: "LED string lights, solar lanterns, and candles create ambiance without needing electricity. Rechargeable LED spotlights are ideal.",
      },
    ],
    materialsEs: "Losetas entrelazadas, barrera anti-hierbas, plantas, macetas, cuerda de luces LED",
    materialsEn: "Interlocking tiles, weed barrier, plants, pots, LED string lights",
    toolsEs: "Cinta métrica, nivel, cuchillo para cortar losetas, pala pequeña",
    toolsEn: "Tape measure, level, utility knife for tiles, small shovel",
    tipsEs: "Los muebles plegables de teca o aluminio resisten mejor la intemperie.",
    tipsEn: "Foldable teak or aluminum furniture holds up best outdoors.",
    relatedContractors: [],
  },
  {
    id: "diy_closet",
    slug: "organizar-armario",
    category: "catAlmacenamiento",
    difficulty: "easy",
    timeEs: "3-5 horas",
    timeEn: "3-5 hours",
    budgetEs: "$50–$200",
    budgetEn: "$50–$200",
    titleEs: "Organizar un armario",
    titleEn: "Organize a Closet",
    descEs: "Maximiza el espacio de tu armario con un sistema de organización simple que puedes instalar tú mismo en un fin de semana.",
    descEn: "Maximize your closet space with a simple organization system you can install yourself in a weekend.",
    coverImage: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900&q=85",
    steps: [
      { order: 1, titleEs: "Vacía todo el armario", titleEn: "Empty the closet completely", descEs: "Saca todo y clasifica en pilas: conservar, donar, tirar. Sé honesto con lo que realmente usas.", descEn: "Take everything out and sort into piles: keep, donate, discard. Be honest about what you actually use." },
      { order: 2, titleEs: "Limpia a fondo", titleEn: "Deep clean", descEs: "Aspira el polvo, limpia las repisas y paredes. Aprovecha para colocar bolsitas de lavanda o cedro contra polillas.", descEn: "Vacuum dust, wipe shelves and walls. Add lavender or cedar sachets for moth prevention." },
      { order: 3, titleEs: "Mide y planifica", titleEn: "Measure and plan", descEs: "Mide el espacio y decide qué va dónde: ropa colgada, doblada, zapatos, accesorios. Compra organizadores que se ajusten a tus medidas.", descEn: "Measure the space and decide what goes where: hanging clothes, folded, shoes, accessories. Buy organizers that fit your measurements." },
      { order: 4, titleEs: "Instala los organizadores", titleEn: "Install organizers", descEs: "Coloca repisas adicionales, barras dobles para colgar, cestas plegables y ganchos en la puerta. No necesitas taladro para sistemas tensionados.", descEn: "Add extra shelves, double hanging rods, foldable bins, and door hooks. No drill needed for tension systems." },
      { order: 5, titleEs: "Dobla y organiza", titleEn: "Fold and organize", descEs: "Usa el método KonMari para doblar verticalmente. Agrupa por tipo y color. Cada cosa debe tener su lugar designado.", descEn: "Use the KonMari method for vertical folding. Group by type and color. Everything should have a designated spot." },
    ],
    materialsEs: "Organizadores de armario, cestas plegables, ganchos, bolsas de lavanda/cedro, etiquetas",
    materialsEn: "Closet organizers, foldable bins, hooks, lavender/cedar sachets, labels",
    toolsEs: "Cinta métrica, aspiradora, destornillador (si aplica)",
    toolsEn: "Tape measure, vacuum, screwdriver (if applicable)",
    tipsEs: "Los organizadores modulares de tela son económicos y fáciles de reconfigurar.",
    tipsEn: "Modular fabric organizers are affordable and easy to reconfigure.",
    relatedContractors: [],
  },
  {
    id: "diy_windows",
    slug: "sellar-ventanas",
    category: "catReparaciones",
    difficulty: "easy",
    timeEs: "1-2 horas por ventana",
    timeEn: "1-2 hours per window",
    budgetEs: "$10–$50 por ventana",
    budgetEn: "$10–$50 per window",
    titleEs: "Sellar ventanas para ahorrar energía",
    titleEn: "Seal Windows for Energy Savings",
    descEs: "Reduce tu factura de energía sellando las corrientes de aire alrededor de las ventanas. Un proyecto económico con resultados inmediatos.",
    descEn: "Lower your energy bill by sealing drafts around windows. An inexpensive project with immediate results.",
    coverImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=85",
    steps: [
      { order: 1, titleEs: "Identifica las corrientes de aire", titleEn: "Find the drafts", descEs: "En un día ventoso, pasa una vela encendida cerca de los bordes de la ventana. Si la llama titila, hay una filtración.", descEn: "On a windy day, pass a lit candle near window edges. If the flame flickers, there's a leak." },
      { order: 2, titleEs: "Limpia los marcos", titleEn: "Clean the frames", descEs: "Limpia los marcos y el vidrio donde aplicarás el sellador. El sellador no se adhiere bien a superficies sucias o húmedas.", descEn: "Clean frames and glass where you'll apply sealant. Sealant won't adhere well to dirty or damp surfaces." },
      { order: 3, titleEs: "Aplica masilla selladora", titleEn: "Apply caulk", descEs: "Aplica masilla de silicona en las juntas entre el marco y la pared. Usa una pistola de calafateo para una línea uniforme. Alisa con el dedo humedecido.", descEn: "Apply silicone caulk to gaps between frame and wall. Use a caulking gun for an even bead. Smooth with a damp finger." },
      { order: 4, titleEs: "Instala burletes adhesivos", titleEn: "Install weatherstripping", descEs: "Coloca burletes adhesivos de espuma en las partes móviles de la ventana donde el marco se encuentra con la hoja. Corta a la medida exacta.", descEn: "Apply adhesive foam weatherstripping to moving parts where the sash meets the frame. Cut to exact length." },
      { order: 5, titleEs: "Agrega film aislante (opcional)", titleEn: "Add insulation film (optional)", descEs: "Para ventanas muy viejas, el film aislante transparente con cinta de doble cara puede reducir la pérdida de calor hasta un 50%. Se instala con secador de pelo.", descEn: "For very old windows, clear insulation film with double-sided tape can reduce heat loss by up to 50%. Install with a hair dryer." },
    ],
    materialsEs: "Masilla de silicona, burletes adhesivos de espuma, film aislante (opcional), limpiador",
    materialsEn: "Silicone caulk, adhesive foam weatherstripping, insulation film (optional), cleaner",
    toolsEs: "Pistola de calafateo, tijeras, secador de pelo (para film), cuchillo, vela (para detectar filtraciones)",
    toolsEn: "Caulking gun, scissors, hair dryer (for film), utility knife, candle (for detecting drafts)",
    tipsEs: "El burlete de espuma adhesiva es el más fácil para principiantes y cuesta menos de $10 por ventana.",
    tipsEn: "Adhesive foam weatherstripping is easiest for beginners and costs under $10 per window.",
    relatedContractors: [],
  },
];

const DATA_DIR = path.join(process.cwd(), ".data");
const DIY_FILE = path.join(DATA_DIR, "diy-projects.json");

function defaultProjects(): DIYProject[] {
  return SEED_PROJECTS.map((p) => ({ ...p }));
}

export async function listProjects(): Promise<DIYProject[]> {
  try {
    const raw = await readFile(DIY_FILE, "utf-8");
    return JSON.parse(raw) as DIYProject[];
  } catch {
    const projects = defaultProjects();
    await writeFile(DIY_FILE, JSON.stringify(projects, null, 2), "utf-8");
    return projects;
  }
}

export async function getProjectBySlug(slug: string): Promise<DIYProject | null> {
  const projects = await listProjects();
  return projects.find((p) => p.slug === slug) ?? null;
}

export async function getCategories(lang: "es" | "en"): Promise<{ key: string; label: string }[]> {
  const cats: Record<string, { es: string; en: string }> = {
    catCocinas: { es: "Cocinas", en: "Kitchens" },
    catBanos: { es: "Baños", en: "Bathrooms" },
    catPatios: { es: "Patios", en: "Patios" },
    catVidaAlAireLibre: { es: "Vida al aire libre", en: "Outdoor Living" },
    catJardineria: { es: "Jardinería", en: "Gardening" },
    catReparaciones: { es: "Reparaciones", en: "Repairs" },
    catAmpliaciones: { es: "Ampliaciones", en: "Home Additions" },
    catDIY: { es: "Proyectos DIY", en: "DIY Projects" },
  };
  return Object.entries(cats).map(([key, val]) => ({
    key,
    label: val[lang],
  }));
}
