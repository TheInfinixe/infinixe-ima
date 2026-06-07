"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";

// ─── LEVELS ─────────────────────────────────────────────────────────────────
const LEVELS = [
  { level: 0, name: "INICIAL", nameEn: "INITIAL", minPct: 0, maxPct: 16,
    estado: "Ocurre de forma esporádica, sin procesos ni estrategia, impulsada por necesidades urgentes con una visión únicamente desde el proyecto.",
    estadoEn: "It happens sporadically, with no processes or strategy, driven by urgent needs and a view limited to the individual project.",
    paso: "Escuchar a la dirección y a los clientes para definir retos anuales que actúen como victorias tempranas y posicionen a la innovación como el motor de cambio hacia el futuro.",
    pasoEn: "Listen to leadership and customers to define annual challenges that act as early wins and position innovation as the engine of change toward the future." },
  { level: 1, name: "REACTIVA", nameEn: "REACTIVE", minPct: 17, maxPct: 33,
    estado: "Es una respuesta a presiones externas, estableciendo procesos básicos pero aún informales y desconectados. Actúa con el tiempo encima, por lo que se siente improvisada y caótica.",
    estadoEn: "It is a response to external pressures, establishing basic processes that are still informal and disconnected. It operates under time pressure, so it feels improvised and chaotic.",
    paso: "Anticiparse y diseñar una planeación estratégica que permita priorizar las urgencias de la organización bajo una estructura y un orden de trabajo definidos.",
    pasoEn: "Get ahead of events and design strategic planning that prioritizes the organization's urgent needs within a defined structure and order of work." },
  { level: 2, name: "ESTRUCTURADA", nameEn: "STRUCTURED", minPct: 34, maxPct: 50,
    estado: "Cuenta con procesos y equipos dedicados, integrados en la cultura organizacional de mejora y crecimiento. Existen una visión desde el portafolio.",
    estadoEn: "It has dedicated processes and teams, integrated into an organizational culture of improvement and growth. There is a portfolio-level vision.",
    paso: "Optimizar el sistema para validar ideas de forma ágil y económica, comunicando las historias de éxito para inspirar y sumar al resto de la organización.",
    pasoEn: "Optimize the system to validate ideas quickly and affordably, sharing success stories to inspire and engage the rest of the organization." },
  { level: 3, name: "SISTEMATIZADA", nameEn: "SYSTEMATIZED", minPct: 51, maxPct: 67,
    estado: "Es sistemática con roles, procesos y métricas claras, para gestionar portafolios de proyectos que redefinen la cultura organizacional con nuevos retos. Existe una visión del futuro al menos para este y el siguiente año.",
    estadoEn: "It is systematic, with clear roles, processes and metrics to manage project portfolios that redefine the organizational culture with new challenges. There is a vision of the future for at least this year and the next.",
    paso: "Trascender el área de innovación para que esta actúe como catalizadora, logrando que el resto de los departamentos mejoren y creen soluciones desde su propia experiencia.",
    pasoEn: "Move beyond the innovation area so it acts as a catalyst, enabling the rest of the departments to improve and create solutions from their own experience." },
  { level: 4, name: "AMBIDIESTRA", nameEn: "AMBIDEXTROUS", minPct: 68, maxPct: 84,
    estado: "Equilibra la exploración de nuevas oportunidades con la explotación de unidades existentes, en un modelo abierto e integrado con el ecosistema. La innovación se siente dentro y fuera de su área.",
    estadoEn: "It balances exploring new opportunities with exploiting existing units, in an open model integrated with the ecosystem. Innovation is felt both inside and outside its area.",
    paso: "Mantener un rol activo en el ecosistema, alianzas y foros buscando el bienestar social y ambiental, asegurando la efectividad para construir el futuro del negocio desde las acciones del presente.",
    pasoEn: "Maintain an active role in the ecosystem, alliances and forums, pursuing social and environmental well-being, ensuring effectiveness to build the future of the business through present-day actions." },
  { level: 5, name: "SOSTENIBLE", nameEn: "SUSTAINABLE", minPct: 85, maxPct: 100,
    estado: "Se refleja en la mentalidad y las formas de trabajo de la cultura organizacional; integrada con el ecosistema externo, busca crear valor social y ambiental continuamente.",
    estadoEn: "It is reflected in the mindset and ways of working of the organizational culture; integrated with the external ecosystem, it continuously seeks to create social and environmental value.",
    paso: "Liderar la transformación dentro del sector industrial, adaptando y reinventando continuamente las prácticas para garantizar que este impacto positivo se expanda a largo plazo.",
    pasoEn: "Lead the transformation within the industry, continuously adapting and reinventing practices to ensure this positive impact expands over the long term." },
];
const getLevel = (pct) => LEVELS.find(l => pct >= l.minPct && pct <= l.maxPct) || LEVELS[0];

// ─── QUESTIONS ──────────────────────────────────────────────────────────────
const QUESTIONS = [
  { id:1, pillar:"STRATEGIZE", pilarEs:"DEFINIR", subpilar:"Visión", type:"M",
    q:"¿La empresa desglosa su visión en destinos estratégicos a corto, mediano y largo plazo bien definidos?",
    qEn:"Does the company break down its vision into well-defined strategic destinations for the short, medium and long term?",
    answers:[
      {text:"No hay objetivos definidos en plazos en la empresa", textEn:"There are no time-bound objectives defined in the company", pts:0},
      {text:"Es claro lo que la empresa busca a corto plazo", textEn:"What the company seeks in the short term is clear", pts:5},
      {text:"Es claro lo que la empresa busca a mediano plazo", textEn:"What the company seeks in the medium term is clear", pts:5},
      {text:"Es claro lo que la empresa busca a largo plazo", textEn:"What the company seeks in the long term is clear", pts:5},
      {text:"La visión de la empresa es coherente en los 3 plazos definidos", textEn:"The company's vision is coherent across the 3 defined time horizons", pts:5},
      {text:"Los destinos estratégicos son sostenibles y evitan la obsolescencia", textEn:"The strategic destinations are sustainable and avoid obsolescence", pts:5}]},
  { id:2, pillar:"STRATEGIZE", pilarEs:"DEFINIR", subpilar:"Transformación cultural", type:"M",
    q:"¿Tu visión del futuro se refleja en una visión de cultura a futuro destacando las competencias a desarrollar?",
    qEn:"Is your vision of the future reflected in a future-culture vision that highlights the competencies to be developed?",
    answers:[
      {text:"No se tiene planeado desarrollar competencias", textEn:"There is no plan to develop competencies", pts:0},
      {text:"Se tienen definidos los perfiles de puestos", textEn:"Job profiles are defined", pts:3},
      {text:"Se tienen métricas definidas para medir la cultura", textEn:"There are defined metrics to measure culture", pts:4},
      {text:"Se tienen definidas las competencias a desarrollar tanto individuales como de equipos", textEn:"The competencies to develop, both individual and team-level, are defined", pts:4},
      {text:"Se tiene un plan de crecimiento por cada rol en la empresa", textEn:"There is a growth plan for each role in the company", pts:3},
      {text:"La visión contempla una cultura sana", textEn:"The vision includes a healthy culture", pts:3}]},
  { id:3, pillar:"STRATEGIZE", pilarEs:"EVALUAR", subpilar:"Tendencias externas", type:"M",
    q:"¿Identifican constantemente las tendencias externas que representan un riesgo u oportunidad?",
    qEn:"Do you constantly identify external trends that represent a risk or an opportunity?",
    answers:[
      {text:"No se identifican las tendencias externas, se opera ignorando el entorno", textEn:"External trends are not identified; operations ignore the environment", pts:0},
      {text:"Se tiene un análisis de la competencia actualizado", textEn:"An up-to-date competitor analysis is maintained", pts:4},
      {text:"Se tienen identificadas las tendencias de mercados similares", textEn:"Trends in similar markets are identified", pts:3},
      {text:"Se tienen identificadas las tendencias tecnológicas", textEn:"Technological trends are identified", pts:4},
      {text:"Se tienen identificadas las tendencias regulatorias", textEn:"Regulatory trends are identified", pts:3},
      {text:"Se mide el riesgo o la oportunidad de las oportunidades identificadas", textEn:"The risk or opportunity of identified opportunities is measured", pts:4}]},
  { id:4, pillar:"STRATEGIZE", pilarEs:"EVALUAR", subpilar:"Recolección y filtrado", type:"U",
    q:"¿Existen canales para recoger ideas de proyectos dentro de la organización?",
    qEn:"Are there channels to collect project ideas within the organization?",
    answers:[
      {text:"No se recogen ideas de los colaboradores", textEn:"Ideas are not collected from employees", pts:0},
      {text:"Existe un canal de recepción de ideas", textEn:"There is a channel to receive ideas", pts:2},
      {text:"Se reciben ideas que no se les da seguimiento", textEn:"Ideas are received but not followed up on", pts:4},
      {text:"Hay un responsable de la recolección de ideas que les da seguimiento", textEn:"There is a person responsible for collecting ideas who follows up on them", pts:7},
      {text:"Hay un proceso accesible y estandarizado para la recepción de ideas", textEn:"There is an accessible, standardized process for receiving ideas", pts:11}]},
  { id:5, pillar:"STRATEGIZE", pilarEs:"INVERTIR", subpilar:"Presupuesto", type:"M",
    q:"¿Definen criterios de inversión de rentabilidad mínima y capital de inversión máximo para los proyectos?",
    qEn:"Do you define investment criteria for minimum profitability and maximum investment capital for projects?",
    answers:[
      {text:"No hay criterios de inversión para los proyectos", textEn:"There are no investment criteria for projects", pts:0},
      {text:"Hay indicadores financieros en los proyectos", textEn:"Projects have financial indicators", pts:3},
      {text:"Los indicadores están asociados al tipo de proyecto", textEn:"The indicators are tied to the type of project", pts:4},
      {text:"Está definido el beneficio buscado y se compara con los indicadores financieros", textEn:"The intended benefit is defined and compared against the financial indicators", pts:4},
      {text:"Se tiene definida la rentabilidad mínima esperada desde el inicio de los proyectos", textEn:"The minimum expected profitability is defined from the start of the projects", pts:3},
      {text:"Se tiene definida la inversión máxima desde el inicio de los proyectos", textEn:"The maximum investment is defined from the start of the projects", pts:3}]},
  { id:6, pillar:"STRATEGIZE", pilarEs:"INVERTIR", subpilar:"Alianzas", type:"M",
    q:"¿Desarrollan alianzas para invertir capital en conjunto en oportunidades de negocios?",
    qEn:"Do you develop alliances to jointly invest capital in business opportunities?",
    answers:[
      {text:"No se buscan alianzas para invertir en conjunto", textEn:"No alliances are sought to invest jointly", pts:0},
      {text:"La empresa tiene la apertura y flexibilidad de hacer alianzas, fusiones o adquisiciones", textEn:"The company is open and flexible to form alliances, mergers or acquisitions", pts:2},
      {text:"Se hacen análisis de las oportunidades potenciales con otras empresas", textEn:"Potential opportunities with other companies are analyzed", pts:2},
      {text:"Se tiene claras las carencias de la empresa que pueden ser resueltas con alianzas", textEn:"The company's gaps that could be solved through alliances are clearly identified", pts:2},
      {text:"Se realizan inversiones con otras empresas sumando capital y conocimientos en conjunto", textEn:"Investments are made with other companies, combining capital and knowledge", pts:2}]},
  { id:7, pillar:"MANAGE", pilarEs:"GESTIÓN", subpilar:"Reporteo", type:"U",
    q:"¿Realizan una reunión mensual con los stakeholders para compartir el avance y decidir sobre el proyecto?",
    qEn:"Do you hold a monthly meeting with stakeholders to share progress and make decisions about the project?",
    answers:[
      {text:"No hay reuniones de reporteo", textEn:"There are no progress-reporting meetings", pts:0},
      {text:"Se reportan los avances del proyecto de forma asíncrona sin periodicidad", textEn:"Project progress is reported asynchronously, with no set frequency", pts:3},
      {text:"Hay una periodicidad para reportar avances, pero las decisiones incurren en retrabajos o pivoteos tardíos", textEn:"There is a regular cadence for reporting progress, but decisions lead to rework or late pivots", pts:6},
      {text:"La sesión se da periódicamente y se toman decisiones efectivas", textEn:"The session is held regularly and effective decisions are made", pts:9},
      {text:"Los stakeholders retroalimentan al equipo, dan feedback y medios para un mejor avance del proyecto", textEn:"Stakeholders give the team feedback and provide the means for better project progress", pts:12}]},
  { id:8, pillar:"MANAGE", pilarEs:"GESTIÓN", subpilar:"Métricas", type:"U",
    q:"¿Utilizan métricas de avance para ubicar a los proyectos en función de los aprendizajes y/o los entregables esperados por etapa?",
    qEn:"Do you use progress metrics to place projects according to the learnings and/or the deliverables expected at each stage?",
    answers:[
      {text:"Se desconocen las métricas y entregables por etapa de los proyectos", textEn:"The metrics and deliverables for each project stage are unknown", pts:0},
      {text:"Los proyectos están separados por etapas según el tipo de proyecto", textEn:"Projects are split into stages according to the type of project", pts:4},
      {text:"Se tienen definidas métricas para cada una de las etapas", textEn:"Metrics are defined for each stage", pts:8},
      {text:"Se definen métricas, entregables y aprendizajes (evidencia necesaria) para cada una de las etapas", textEn:"Metrics, deliverables and learnings (required evidence) are defined for each stage", pts:13}]},
  { id:9, pillar:"MANAGE", pilarEs:"DISEÑO", subpilar:"Prototipo", type:"U",
    q:"¿Utilizan el prototipado como una herramienta para iterar y mejorar las soluciones antes de su implementación final?",
    qEn:"Do you use prototyping as a tool to iterate and improve solutions before their final implementation?",
    answers:[
      {text:"No se prototipa", textEn:"No prototyping is done", pts:0},
      {text:"Se gasta mucho tiempo y esfuerzo en prototipos robustos", textEn:"A lot of time and effort is spent on robust prototypes", pts:3},
      {text:"Se comprende el concepto de MVP (Producto mínimo viable)", textEn:"The concept of MVP (Minimum Viable Product) is understood", pts:6},
      {text:"Se tiene una metodología para crear y validar prototipos", textEn:"There is a methodology to create and validate prototypes", pts:10},
      {text:"Se validan conceptos de solución antes de validar una solución completa", textEn:"Solution concepts are validated before validating a complete solution", pts:13},
      {text:"Se comprende la validación obtenida del prototipado y se mejora tras cada iteración", textEn:"The validation obtained from prototyping is understood and improved after each iteration", pts:17}]},
  { id:10, pillar:"MANAGE", pilarEs:"DISEÑO", subpilar:"Pivoteo", type:"M",
    q:"¿Accionan cambios de enfoque de proyecto, \"pivoteos\", con autonomía y liderazgo?",
    qEn:"Do you carry out changes in project direction — “pivots” — with autonomy and leadership?",
    answers:[
      {text:"Los proyectos no permiten cambios", textEn:"Projects do not allow changes", pts:0},
      {text:"Son claros los criterios para realizar un pivoteo en un proyecto", textEn:"The criteria for pivoting a project are clear", pts:4},
      {text:"Los equipos comparten información sintetizada para tomar decisiones sobre el proyecto", textEn:"Teams share synthesized information to make decisions about the project", pts:3},
      {text:"Los stakeholders deciden sobre el proyecto según la evidencia presentada", textEn:"Stakeholders decide on the project based on the evidence presented", pts:4},
      {text:"Los equipos sugieren el rumbo del proyecto", textEn:"Teams suggest the direction of the project", pts:4}]},
  { id:11, pillar:"MANAGE", pilarEs:"TESTEO", subpilar:"Estudio de usuario", type:"M",
    q:"¿Realizan estudios cualitativos para comprender lo que los distintos actores valoran antes de crear o mejorar soluciones?",
    qEn:"Do you carry out qualitative studies to understand what the different stakeholders value before creating or improving solutions?",
    answers:[
      {text:"Se crean \"soluciones\" sin antes validar con los actores", textEn:"“Solutions” are created without first validating with stakeholders", pts:0},
      {text:"Se usan técnicas de observación con los actores", textEn:"Observation techniques are used with stakeholders", pts:3},
      {text:"Se usan técnicas de entrevistas con los actores", textEn:"Interview techniques are used with stakeholders", pts:3},
      {text:"Se usan focus groups o pequeñas muestras de personas para validar con ellos", textEn:"Focus groups or small samples of people are used to validate with them", pts:3},
      {text:"Se usan prototipos para validar con actores", textEn:"Prototypes are used to validate with stakeholders", pts:3},
      {text:"El desarrollo de soluciones se hace a la par que las validaciones con los actores", textEn:"Solution development happens in parallel with validations with stakeholders", pts:4}]},
  { id:12, pillar:"MANAGE", pilarEs:"TESTEO", subpilar:"Estudio técnico", type:"M",
    q:"¿Realizan estudios de factibilidad con expertos técnicos para validar el modelo de negocio?",
    qEn:"Do you conduct feasibility studies with technical experts to validate the business model?",
    answers:[
      {text:"No se valida si es posible crear el valor del modelo", textEn:"It is not validated whether it is possible to create the model's value", pts:0},
      {text:"Se conocen las actividades y procesos necesarios para crear la solución además de poderlas realizar", textEn:"The activities and processes needed to create the solution are known, and can be carried out", pts:4},
      {text:"Se conocen y se tienen (o se pueden obtener) los recursos necesarios para crear la solución", textEn:"The resources needed to create the solution are known and available (or can be obtained)", pts:4},
      {text:"Se conoce a los aliados necesarios para crear la solución y se tiene (o puede tener) un trato con ellos", textEn:"The partners needed to create the solution are known, and an agreement with them exists (or can be reached)", pts:4},
      {text:"Se tienen medidos los elementos necesarios para crear la solución y su impacto en la estructura de costos", textEn:"The elements needed to create the solution and their impact on the cost structure are measured", pts:4}]},
  { id:13, pillar:"FEED", pilarEs:"DESARROLLAR", subpilar:"Balance", type:"M",
    q:"¿Evalúan con métricas el nivel de desarrollo de forma grupal e individual?",
    qEn:"Do you use metrics to evaluate the level of development, both at the group and individual level?",
    answers:[
      {text:"No hay métricas ni herramientas para medir el desarrollo", textEn:"There are no metrics or tools to measure development", pts:0},
      {text:"Se tiene un esquema para evaluar el nivel de desarrollo", textEn:"There is a framework to evaluate the level of development", pts:4},
      {text:"Se tienen herramientas para medir el desarrollo grupal e individual", textEn:"There are tools to measure group and individual development", pts:4},
      {text:"Utilizan métricas cuantitativas y cualitativas", textEn:"Both quantitative and qualitative metrics are used", pts:3},
      {text:"Existe un plan de desarrollo profesional comunicado a colaboradores", textEn:"There is a professional development plan communicated to employees", pts:5}]},
  { id:14, pillar:"FEED", pilarEs:"DESARROLLAR", subpilar:"Innovación", type:"M",
    q:"¿Promueven la creatividad, la divergencia y el pensamiento lateral para resolver problemas o aprovechar oportunidades?",
    qEn:"Do you promote creativity, divergence and lateral thinking to solve problems or seize opportunities?",
    answers:[
      {text:"No se promueve la creatividad", textEn:"Creativity is not promoted", pts:0},
      {text:"Hay incentivos para quienes tienen propuestas creativas", textEn:"There are incentives for those who bring creative proposals", pts:6},
      {text:"Realizan sesiones de ideación para la resolución de retos dentro de las áreas", textEn:"Ideation sessions are held to solve challenges within the areas", pts:4},
      {text:"Existen promotores que fomenten la creatividad", textEn:"There are champions who foster creativity", pts:4},
      {text:"Los líderes en la organización propician la creatividad", textEn:"Leaders in the organization encourage creativity", pts:5}]},
  { id:15, pillar:"FEED", pilarEs:"INVOLUCRAR", subpilar:"Dinámicas", type:"U",
    q:"¿Utilizan dinámicas de equipos para innovar internamente?",
    qEn:"Do you use team activities to innovate internally?",
    answers:[
      {text:"No hay dinámicas dedicadas a fomentar la innovación en equipo", textEn:"There are no activities dedicated to fostering team innovation", pts:0},
      {text:"Se realizan sesiones para detectar los retos más relevantes del área", textEn:"Sessions are held to identify the most relevant challenges of the area", pts:7},
      {text:"Se realizan talleres para hablar de innovación e inspirarse", textEn:"Workshops are held to talk about innovation and get inspired", pts:6},
      {text:"Se realizan talleres para saber hacer innovación detectando y resolviendo necesidades", textEn:"Workshops are held to learn how to innovate by detecting and solving needs", pts:6},
      {text:"Se realizan talleres para saber detectar tendencias y reinventar soluciones existentes", textEn:"Workshops are held to learn to spot trends and reinvent existing solutions", pts:6}]},
  { id:16, pillar:"FEED", pilarEs:"INVOLUCRAR", subpilar:"Dinámicas", type:"U",
    q:"¿Utilizan dinámicas organizacionales para innovar en retos específicos?",
    qEn:"Do you use organization-wide activities to innovate on specific challenges?",
    answers:[
      {text:"No hay dinámicas dedicadas a fomentar la innovación en la organización", textEn:"There are no activities dedicated to fostering innovation across the organization", pts:0},
      {text:"Están claros y comunicados los retos más relevantes para la organización", textEn:"The most relevant challenges for the organization are clear and communicated", pts:10},
      {text:"Realizan conferencias a toda la organización para hablar de innovación e inspirarse", textEn:"Company-wide talks are held to discuss innovation and get inspired", pts:8},
      {text:"Realizan talleres abiertos a toda la organización para innovar en los retos organizacionales", textEn:"Workshops open to the whole organization are held to innovate on organizational challenges", pts:8}]},
  { id:17, pillar:"FEED", pilarEs:"CONECTAR", subpilar:"Interno", type:"M",
    q:"¿Fomentan la empatía, confianza y colaboración entre diferentes departamentos y equipos para nutrir la cultura organizacional?",
    qEn:"Do you foster empathy, trust and collaboration between different departments and teams to nurture the organizational culture?",
    answers:[
      {text:"No hay esfuerzos visibles para mejorar la colaboración entre áreas", textEn:"There are no visible efforts to improve collaboration between areas", pts:0},
      {text:"Hay eventos de team-building o de cohesión de equipos entre 2 o más áreas", textEn:"There are team-building or team-cohesion events between 2 or more areas", pts:6},
      {text:"Se hacen reuniones de alineación entre 2 o más áreas", textEn:"Alignment meetings are held between 2 or more areas", pts:7},
      {text:"Hay programas de desarrollo de habilidades blandas como comunicación y asertividad", textEn:"There are programs to develop soft skills such as communication and assertiveness", pts:7},
      {text:"Hay revisiones colaborativas de resultados entre áreas", textEn:"There are collaborative reviews of results across areas", pts:6}]},
  { id:18, pillar:"FEED", pilarEs:"CONECTAR", subpilar:"Sustentabilidad", type:"M",
    q:"¿Fomentan el vínculo socios, directores y colaborador con eventos para reconocer, agradecer y premiar?",
    qEn:"Do you strengthen the bond between partners, directors and employees through events to recognize, thank and reward?",
    answers:[
      {text:"No existen actividades de reconocimiento", textEn:"There are no recognition activities", pts:0},
      {text:"Hay campañas de reconocimientos", textEn:"There are recognition campaigns", pts:6},
      {text:"Los altos mandos participan como mentores o stakeholders", textEn:"Senior leaders participate as mentors or stakeholders", pts:6},
      {text:"Los socios están involucrados con las iniciativas actuales", textEn:"Partners are involved in the current initiatives", pts:7}]},
];

const PC = {
  STRATEGIZE: { color: "#00E5FF", subpillarsEs: ["DEFINIR","EVALUAR","INVERTIR"] },
  MANAGE: { color: "#B388FF", subpillarsEs: ["GESTIÓN","DISEÑO","TESTEO"] },
  FEED: { color: "#69F0AE", subpillarsEs: ["DESARROLLAR","INVOLUCRAR","CONECTAR"] },
};
const ALL_CAT = {
  STRATEGIZE: { DEFINIR:["Propósito","Visión","Why, How & What","Transformación cultural"], EVALUAR:["Necesidades del negocio","Tendencias externas","Motivaciones clientes","Recolección y filtrado"], INVERTIR:["Portafolio","Presupuesto","Alianzas"] },
  MANAGE: { "GESTIÓN":["Entrada","Progreso","Reporteo","Salida","Project Management","Métricas"], "DISEÑO":["Investigación","Hipótesis","Prototipo","Disrupción","Pivoteo"], TESTEO:["Estudio de usuario","Estudio de mercado","Estudio técnico","Experimentación","Validación"] },
  FEED: { DESARROLLAR:["Mapa","Balance","Formación","Innovación"], INVOLUCRAR:["Dinámicas","Participación"], CONECTAR:["Interno","Externo","Sustentabilidad"] },
};

// English labels for subpillar groups (keys stay Spanish for score matching)
const SUB_EN = { DEFINIR:"DEFINE", EVALUAR:"ASSESS", INVERTIR:"INVEST", "GESTIÓN":"MANAGEMENT", "DISEÑO":"DESIGN", TESTEO:"TEST", DESARROLLAR:"DEVELOP", INVOLUCRAR:"ENGAGE", CONECTAR:"CONNECT" };
// English labels for categories (keys stay Spanish for score matching)
const CAT_EN = {
  "Propósito":"Purpose", "Visión":"Vision", "Why, How & What":"Why, How & What", "Transformación cultural":"Cultural transformation",
  "Necesidades del negocio":"Business needs", "Tendencias externas":"External trends", "Motivaciones clientes":"Customer motivations", "Recolección y filtrado":"Collection & filtering",
  "Portafolio":"Portfolio", "Presupuesto":"Budget", "Alianzas":"Alliances",
  "Entrada":"Intake", "Progreso":"Progress", "Reporteo":"Reporting", "Salida":"Output", "Project Management":"Project Management", "Métricas":"Metrics",
  "Investigación":"Research", "Hipótesis":"Hypothesis", "Prototipo":"Prototype", "Disrupción":"Disruption", "Pivoteo":"Pivoting",
  "Estudio de usuario":"User research", "Estudio de mercado":"Market study", "Estudio técnico":"Technical study", "Experimentación":"Experimentation", "Validación":"Validation",
  "Mapa":"Map", "Balance":"Balance", "Formación":"Training", "Innovación":"Innovation",
  "Dinámicas":"Activities", "Participación":"Participation",
  "Interno":"Internal", "Externo":"External", "Sustentabilidad":"Sustainability",
};
const subLabel = (sp, lang) => lang === "en" ? (SUB_EN[sp] || sp) : sp;
const catLabel = (ct, lang) => lang === "en" ? (CAT_EN[ct] || ct) : ct;

const TOASTS = {
  es: ["🚀 ¡Gran inicio!","💡 ¡Excelente reflexión!","⚡ ¡Vas muy bien!","🎯 ¡Registrada!","🔥 ¡Sigue así!","✨ ¡Casi llegas!","🏆 ¡Increíble!","💪 ¡No pares!","🌟 ¡Impresionante!"],
  en: ["🚀 Great start!","💡 Great reflection!","⚡ You're doing great!","🎯 Saved!","🔥 Keep it up!","✨ Almost there!","🏆 Amazing!","💪 Don't stop!","🌟 Impressive!"],
};

// ─── UI STRINGS ───────────────────────────────────────────────────────────────
const STR = {
  es: {
    tagline: "I N F I N I X E",
    w_title1: "Innovation", w_title2: "Management", w_title3: "Assessment",
    w_sub: "Descubre el nivel de madurez de innovación de tu organización a través de nuestro assessment interactivo.",
    w_meta: "18 preguntas • 3 pilares • ~8 minutos",
    w_cta: "Comenzar Assessment →",
    r_kicker: "INFINIXE IMA", r_title: "Regístrate",
    r_sub: "Tus datos serán utilizados para enviar tus resultados.",
    r_blocked_title: "Este email ya completó el assessment",
    r_blocked_body_a: "El email ", r_blocked_body_b: " ya fue utilizado para completar esta evaluación. Si necesitas ayuda, contacta a Infinixe.",
    f_name: "Nombre completo", f_name_ph: "Tu nombre",
    f_email: "Email corporativo", f_email_ph: "tu@empresa.com",
    f_company: "Empresa", f_company_ph: "Nombre de tu empresa",
    r_verifying: "Verificando...", r_start: "Iniciar Assessment →",
    q_multi: "Selecciona todas las que apliquen", q_single: "Selecciona una opción",
    q_prev: "← Anterior", q_next: "Siguiente →", q_results: "Ver Resultados 🎉",
    res_title2: "Assessment", res_beta: "Versión Beta",
    res_estado_h: "📊 Estado actual de la innovación", res_paso_h: "🎯 El siguiente paso estratégico es...",
    gauge_level: "NIVEL",
    send_h: "Recibe tus resultados",
    send_body_a: "Te enviaremos un resumen con los resultados de esta evaluación beta a ",
    send_saving: "Guardando...", send_btn: "Enviar mis Resultados →",
    sent_h: "¡Resultados enviados!",
    sent_body_a: "Revisa tu correo ", sent_body_b: " para ver tu resumen.",
    cta_h: "Desbloquea todo tu potencial",
    cta_body_a: "Agenda una consultoría personalizada donde analizaremos a fondo la situación de tu empresa y saldrás con un ",
    cta_body_strong: "plan de acción inmediato", cta_body_b: " para empezar a transformar tu negocio.",
    cta_bullets: ["Diagnóstico profundo y personalizado de tu organización","Recomendaciones estratégicas según tus necesidades","Plan de acción accionable e inmediato para tu equipo","Análisis completo de los 36 indicadores de innovación"],
    book_btn: "Agendar Consultoría",
    book_sub: "Consultoría personalizada directamente con CEO Infinixe Chris Baumal",
    finish: "Finalizar",
    footer_logos: "+2,000 innovadores usan nuestros Frameworks • Zurich • MSC • Agrisal • Audi • FedEx • Conagra",
    locale: "es-ES",
  },
  en: {
    tagline: "I N F I N I X E",
    w_title1: "Innovation", w_title2: "Management", w_title3: "Assessment",
    w_sub: "Discover your organization's innovation maturity level through our interactive assessment.",
    w_meta: "18 questions • 3 pillars • ~8 minutes",
    w_cta: "Start Assessment →",
    r_kicker: "INFINIXE IMA", r_title: "Register",
    r_sub: "Your information will be used to send you your results.",
    r_blocked_title: "This email already completed the assessment",
    r_blocked_body_a: "The email ", r_blocked_body_b: " has already been used to complete this assessment. If you need help, contact Infinixe.",
    f_name: "Full name", f_name_ph: "Your name",
    f_email: "Work email", f_email_ph: "you@company.com",
    f_company: "Company", f_company_ph: "Your company name",
    r_verifying: "Verifying...", r_start: "Start Assessment →",
    q_multi: "Select all that apply", q_single: "Select one option",
    q_prev: "← Previous", q_next: "Next →", q_results: "See Results 🎉",
    res_title2: "Assessment", res_beta: "Beta version",
    res_estado_h: "📊 Current state of innovation", res_paso_h: "🎯 The next strategic step is...",
    gauge_level: "LEVEL",
    send_h: "Get your results",
    send_body_a: "We'll send a summary of your beta assessment results to ",
    send_saving: "Saving...", send_btn: "Send my Results →",
    sent_h: "Results sent!",
    sent_body_a: "Check your inbox at ", sent_body_b: " to see your summary.",
    cta_h: "Unlock your full potential",
    cta_body_a: "Book a personalized consultation where we'll deeply analyze your company's situation, and you'll leave with an ",
    cta_body_strong: "immediate action plan", cta_body_b: " to start transforming your business.",
    cta_bullets: ["A deep, personalized diagnosis of your organization","Strategic recommendations tailored to your needs","An actionable, immediate plan for your team","A complete analysis of the 36 innovation indicators"],
    book_btn: "Book a Consultation",
    book_sub: "A personalized consultation directly with Infinixe CEO Chris Baumal",
    finish: "Finish",
    footer_logos: "+2,000 innovators use our Frameworks • Zurich • MSC • Agrisal • Audi • FedEx • Conagra",
    locale: "en-US",
  },
};

// ─── COMPONENTS ─────────────────────────────────────────────────────────────
function Donut({v,m,color,size=90}){
  const p=m>0?Math.round((v/m)*100):0, r=(size-14)/2, c=2*Math.PI*r;
  return(<svg width={size} height={size} style={{display:"block"}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={c} strokeDashoffset={c-(p/100)*c} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dashoffset 1.2s ease"}}/>
    <text x={size/2} y={size/2} textAnchor="middle" dy="0.35em" style={{fill:"#fff",fontSize:size*0.26,fontWeight:800,fontFamily:"inherit"}}>{p}</text>
  </svg>);
}

function LevelGauge({ pct, levelObj, lang }) {
  const levelColors = ["#FF5252","#FF9800","#FFD740","#69F0AE","#00E5FF","#B388FF"];
  const cx = 160, cy = 140, r = 105;
  const needleAngle = Math.PI + (pct / 100) * Math.PI;
  const levelName = lang === "en" ? levelObj.nameEn : levelObj.name;
  return (
    <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
      <svg width="320" height="160" viewBox="0 0 320 160" style={{ display: "block", margin: "0 auto" }}>
        {LEVELS.map((l, i) => {
          const startA = Math.PI + (i / 6) * Math.PI;
          const endA = Math.PI + ((i + 1) / 6) * Math.PI;
          const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA);
          const x2 = cx + r * Math.cos(endA), y2 = cy + r * Math.sin(endA);
          return (<path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} fill="none" stroke={levelColors[i]} strokeWidth="18" strokeLinecap="butt" opacity={levelObj.level === i ? 1 : 0.2}/>);
        })}
        {LEVELS.map((l, i) => {
          const midA = Math.PI + ((i + 0.5) / 6) * Math.PI;
          const lx = cx + (r + 22) * Math.cos(midA), ly = cy + (r + 22) * Math.sin(midA);
          return (<text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" style={{ fill: levelObj.level === i ? "#fff" : "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: levelObj.level === i ? 700 : 400, fontFamily: "inherit" }}>{l.level}</text>);
        })}
        {(() => { const nx = cx + 78 * Math.cos(needleAngle), ny = cy + 78 * Math.sin(needleAngle); return <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#fff" strokeWidth="3" strokeLinecap="round" style={{ transition: "all 1.2s ease" }}/>; })()}
        <circle cx={cx} cy={cy} r="5" fill="#fff"/>
      </svg>
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{pct}<span style={{ fontSize: 20 }}>%</span></div>
        <div style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>{lang === "en" ? "LEVEL" : "NIVEL"} {levelObj.level}</div>
        <div style={{ fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg, #00E5FF, #B388FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{levelName}</div>
      </div>
    </div>
  );
}

function CatBar({label,v,m,color,unlocked,lockedLabel}){
  const p=m>0?Math.round((v/m)*100):0;
  return(<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
    <span style={{width:150,textAlign:"right",fontSize:11,color:unlocked?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.25)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</span>
    <div style={{flex:1,height:16,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden"}}>
      {unlocked?<div style={{width:`${p}%`,height:"100%",background:`linear-gradient(90deg,${color},${color}88)`,borderRadius:4,transition:"width 1s ease",minWidth:p>0?4:0}}/>
      :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:9,color:"rgba(255,255,255,0.2)",letterSpacing:1.5}}>🔒 {lockedLabel}</span></div>}
    </div>
    {unlocked&&<span style={{fontSize:10,color:"rgba(255,255,255,0.4)",width:28,textAlign:"right",fontFamily:"'Space Mono',monospace"}}>{p}%</span>}
  </div>);
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function Home() {
  const [screen, setScreen] = useState("welcome");
  const [lang, setLang] = useState("es");
  const [user, setUser] = useState({ name: "", email: "", company: "" });
  const [cQ, setCQ] = useState(0);
  const [ans, setAns] = useState({});
  const [toast, setToast] = useState("");
  const [anim, setAnim] = useState(true);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [regError, setRegError] = useState("");

  const t = STR[lang];
  const q = QUESTIONS[cQ];
  const lockedLabel = lang === "en" ? "LOCKED" : "BLOQUEADO";

  // Check if email already used
  const checkEmail = async (email) => {
    try {
      const ref = collection(db, "assessments");
      const snap = await getDocs(query(ref, where("email", "==", email.toLowerCase().trim())));
      return !snap.empty;
    } catch (e) {
      console.error("Firebase error:", e);
      return false;
    }
  };

  // Save assessment to Firebase
  const saveAssessment = async (results) => {
    try {
      await addDoc(collection(db, "assessments"), {
        name: user.name,
        email: user.email.toLowerCase().trim(),
        company: user.company,
        answers: ans,
        results: results,
        lang: lang,
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (e) {
      console.error("Firebase save error:", e);
      return false;
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setRegError("");
    const alreadyDone = await checkEmail(user.email);
    if (alreadyDone) {
      setBlocked(true);
      setLoading(false);
      return;
    }
    setLoading(false);
    setScreen("quiz");
  };

  const handleSel = (qId, type, idx) => {
    setAns(p => {
      if (type === "U") return { ...p, [qId]: idx };
      const cur = p[qId] || [];
      return { ...p, [qId]: cur.includes(idx) ? cur.filter(i => i !== idx) : [...cur, idx] };
    });
  };

  const answered = (qId, type) => type === "U" ? ans[qId] !== undefined : (ans[qId] || []).length > 0;

  const nav = (d) => {
    if (d === 1 && cQ < QUESTIONS.length - 1) { setToast(TOASTS[lang][cQ % TOASTS[lang].length]); setTimeout(() => setToast(""), 1200); }
    if (d === 1 && cQ === QUESTIONS.length - 1) { setScreen("results"); return; }
    if (d === -1 && cQ === 0) return;
    setAnim(false); setTimeout(() => { setCQ(c => c + d); setAnim(true); }, 250);
  };

  const calc = () => {
    const pl = {}, sp = {}, cat = {};
    QUESTIONS.forEach(q => {
      const s = ans[q.id]; let pts = 0;
      if (q.type === "U" && s !== undefined) pts = q.answers[s].pts;
      else if (q.type === "M" && Array.isArray(s)) pts = s.reduce((a, i) => a + q.answers[i].pts, 0);
      const mx = q.type === "U" ? Math.max(...q.answers.map(a => a.pts)) : q.answers.reduce((a, x) => a + Math.max(0, x.pts), 0);
      if (!pl[q.pillar]) pl[q.pillar] = { s: 0, m: 0 }; pl[q.pillar].s += pts; pl[q.pillar].m += mx;
      const k = `${q.pillar}|${q.pilarEs}`; if (!sp[k]) sp[k] = { s: 0, m: 0 }; sp[k].s += pts; sp[k].m += mx;
      if (!cat[q.subpilar]) cat[q.subpilar] = { s: 0, m: 0 }; cat[q.subpilar].s += pts; cat[q.subpilar].m += mx;
    });
    return { pl, sp, cat };
  };

  const handleSendResults = async () => {
    setLoading(true);
    const { pl, sp, cat } = calc();
    const tS = Object.values(pl).reduce((s, p) => s + p.s, 0);
    const tM = Object.values(pl).reduce((s, p) => s + p.m, 0);
    const oPct = tM > 0 ? Math.round((tS / tM) * 100) : 0;
    const lvl = getLevel(oPct);
    // Stored canonical in Spanish so the admin dashboard stays consistent regardless of user's language.
    const resultData = { pillarScores: pl, overallPct: oPct, level: lvl.name, levelNum: lvl.level, estado: lvl.estado, paso: lvl.paso };
    await saveAssessment(resultData);
    // Send email via API
    try {
      await fetch("/api/send-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user.name, email: user.email, company: user.company, results: resultData, lang: lang }),
      });
    } catch (e) { console.error("Email error:", e); }
    setSent(true);
    setLoading(false);
  };

  // ── STYLES ──
  const bg = "linear-gradient(160deg,#0a0e27 0%,#131742 40%,#1a1050 70%,#0d1130 100%)";
  const cd = { background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16 };
  const b1 = { background: "linear-gradient(135deg,#00E5FF,#00B8D4)", color: "#0a0e27", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5, fontFamily: "inherit", transition: "transform 0.2s" };
  const inp = { width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#fff", fontSize: 15, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

  // ── LANGUAGE TOGGLE (welcome screen only) ──
  const LangToggle = () => (
    <div style={{ display: "inline-flex", gap: 4, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 4, marginBottom: 28 }}>
      {[["es", "ES"], ["en", "EN"]].map(([code, label]) => (
        <button key={code} onClick={() => setLang(code)}
          style={{
            border: "none", borderRadius: 7, padding: "6px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1,
            background: lang === code ? "linear-gradient(135deg,#00E5FF,#00B8D4)" : "transparent",
            color: lang === code ? "#0a0e27" : "rgba(255,255,255,0.5)",
            transition: "all 0.2s",
          }}>
          {label}
        </button>
      ))}
    </div>
  );

  // ── WELCOME ──
  if (screen === "welcome") return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 480, animation: "fu 0.8s ease" }}>
        <div style={{ fontSize: 12, letterSpacing: 6, color: "rgba(255,255,255,0.35)", marginBottom: 16, fontWeight: 600 }}>{t.tagline}</div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.1 }}>
          {t.w_title1}<br />{t.w_title2}<br />
          <span style={{ background: "linear-gradient(135deg,#00E5FF,#B388FF,#69F0AE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t.w_title3}</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, lineHeight: 1.6, margin: "24px 0 32px" }}>
          {t.w_sub}
        </p>
        <div style={{ ...cd, padding: "16px 20px", marginBottom: 28, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {["STRATEGIZE", "MANAGE", "FEED"].map(p => (
            <span key={p} style={{ fontSize: 10, fontWeight: 700, color: PC[p].color, background: `${PC[p].color}15`, padding: "5px 12px", borderRadius: 6, letterSpacing: 1.5 }}>{p}</span>
          ))}
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 28 }}>{t.w_meta}</p>
        <div><LangToggle /></div>
        <div>
          <button style={b1} onClick={() => setScreen("register")} onMouseOver={e => e.target.style.transform = "scale(1.05)"} onMouseOut={e => e.target.style.transform = "scale(1)"}>{t.w_cta}</button>
        </div>
      </div>
    </div>
  );

  // ── REGISTER ──
  if (screen === "register") {
    const ok = user.name.trim() && user.email.trim() && user.company.trim() && !loading;
    return (
      <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Outfit',sans-serif" }}>
        <div style={{ ...cd, padding: 36, maxWidth: 400, width: "100%", animation: "fu 0.6s ease" }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>{t.r_kicker}</div>
          <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>{t.r_title}</h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 24px" }}>{t.r_sub}</p>

          {blocked ? (
            <div style={{ ...cd, padding: 24, textAlign: "center", border: "1px solid rgba(255,82,82,0.3)", background: "rgba(255,82,82,0.06)" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
              <h3 style={{ color: "#FF5252", fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>{t.r_blocked_title}</h3>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                {t.r_blocked_body_a}<strong style={{ color: "#fff" }}>{user.email}</strong>{t.r_blocked_body_b}
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[[t.f_name, "name", t.f_name_ph, "text"], [t.f_email, "email", t.f_email_ph, "email"], [t.f_company, "company", t.f_company_ph, "text"]].map(([l, k, p, ty]) => (
                  <div key={k}><label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 5, display: "block" }}>{l}</label>
                    <input style={inp} type={ty} placeholder={p} value={user[k]} onChange={e => setUser(u => ({ ...u, [k]: e.target.value }))} /></div>
                ))}
              </div>
              {regError && <p style={{ color: "#FF5252", fontSize: 12, marginTop: 10 }}>{regError}</p>}
              <button
                style={{ ...b1, width: "100%", marginTop: 24, opacity: ok ? 1 : 0.35, pointerEvents: ok ? "auto" : "none" }}
                onClick={handleRegister}>
                {loading ? t.r_verifying : t.r_start}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── QUIZ ──
  if (screen === "quiz") {
    const prog = ((cQ + 1) / QUESTIONS.length) * 100;
    const pc = PC[q.pillar].color;
    const sel = q.type === "U" ? (ans[q.id] !== undefined ? [ans[q.id]] : []) : (ans[q.id] || []);

    return (
      <div style={{ minHeight: "100vh", background: bg, display: "flex", flexDirection: "column", fontFamily: "'Outfit',sans-serif" }}>
        <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 9, letterSpacing: 3, color: "rgba(255,255,255,0.25)" }}>INFINIXE</span>
          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${prog}%`, height: "100%", background: "linear-gradient(90deg,#00E5FF,#B388FF,#69F0AE)", borderRadius: 4, transition: "width 0.5s ease" }} />
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, fontFamily: "'Space Mono',monospace" }}>{cQ + 1}/{QUESTIONS.length}</span>
        </div>

        {toast && (
          <div style={{ position: "fixed", top: 70, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 100, pointerEvents: "none" }}>
            <div style={{ background: "rgba(0,229,255,0.12)", border: "1px solid rgba(0,229,255,0.25)", borderRadius: 10, padding: "8px 20px", color: "#00E5FF", fontSize: 13, fontWeight: 600, animation: "toastIn 0.3s ease" }}>{toast}</div>
          </div>
        )}

        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 16px 100px" }}>
          <div style={{ maxWidth: 580, width: "100%", opacity: anim ? 1 : 0, transform: anim ? "translateY(0)" : "translateY(16px)", transition: "all 0.25s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: pc, background: `${pc}15`, padding: "3px 10px", borderRadius: 5, letterSpacing: 1.5 }}>{q.pillar}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{subLabel(q.pilarEs, lang)}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{catLabel(q.subpilar, lang)}</span>
            </div>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 600, lineHeight: 1.45, margin: "0 0 6px" }}>{lang === "en" ? q.qEn : q.q}</h2>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "0 0 20px" }}>
              {q.type === "M" ? t.q_multi : t.q_single}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {q.answers.map((a, i) => {
                const on = sel.includes(i);
                return (
                  <button key={i} onClick={() => handleSel(q.id, q.type, i)}
                    style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", textAlign: "left", background: on ? `${pc}10` : "rgba(255,255,255,0.02)", border: on ? `1.5px solid ${pc}50` : "1.5px solid rgba(255,255,255,0.06)", borderRadius: 10, cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit", color: "#fff" }}>
                    <span style={{ width: 20, height: 20, minWidth: 20, borderRadius: q.type === "U" ? "50%" : 5, border: on ? `2px solid ${pc}` : "2px solid rgba(255,255,255,0.12)", background: on ? pc : "transparent", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, transition: "all 0.2s" }}>
                      {on && <span style={{ color: "#0a0e27", fontSize: 11, fontWeight: 900 }}>✓</span>}
                    </span>
                    <span style={{ fontSize: 13, lineHeight: 1.5, color: on ? "#fff" : "rgba(255,255,255,0.6)" }}>{lang === "en" ? a.textEn : a.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 20px", background: "linear-gradient(transparent,#0a0e27ee)", display: "flex", justifyContent: "space-between" }}>
          <button onClick={() => nav(-1)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 18px", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: cQ > 0 ? "pointer" : "default", opacity: cQ > 0 ? 1 : 0.3, fontFamily: "inherit" }}>{t.q_prev}</button>
          <button onClick={() => nav(1)} disabled={!answered(q.id, q.type)} style={{ ...b1, opacity: answered(q.id, q.type) ? 1 : 0.3, pointerEvents: answered(q.id, q.type) ? "auto" : "none" }}>
            {cQ === QUESTIONS.length - 1 ? t.q_results : t.q_next}
          </button>
        </div>
      </div>
    );
  }

  // ── RESULTS ──
  if (screen === "results") {
    const { pl, sp, cat } = calc();
    const tS = Object.values(pl).reduce((s, p) => s + p.s, 0);
    const tM = Object.values(pl).reduce((s, p) => s + p.m, 0);
    const oPct = tM > 0 ? Math.round((tS / tM) * 100) : 0;
    const lvl = getLevel(oPct);
    const unlocked = [...new Set(QUESTIONS.map(q => q.subpilar))];
    const estado = lang === "en" ? lvl.estadoEn : lvl.estado;
    const paso = lang === "en" ? lvl.pasoEn : lvl.paso;

    return (
      <div style={{ minHeight: "100vh", background: bg, fontFamily: "'Outfit',sans-serif", padding: "20px 16px 60px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 5, color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>INFINIXE IMA</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>
              Innovation Management <span style={{ background: "linear-gradient(135deg,#00E5FF,#B388FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t.res_title2}</span>
            </h1>
          </div>

          <div style={{ ...cd, padding: "18px 24px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
            <div>
              <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>{user.company}</h3>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "3px 0 0" }}>{user.name} • {new Date().toLocaleDateString(t.locale)}</p>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{t.res_beta}</div>
          </div>

          <div style={{ ...cd, padding: "16px 24px 8px", marginBottom: 16 }}>
            <LevelGauge pct={oPct} levelObj={lvl} lang={lang} />
          </div>

          <div style={{ ...cd, padding: "22px 24px", marginBottom: 16, borderLeft: "3px solid #00E5FF" }}>
            <h4 style={{ color: "#00E5FF", fontSize: 13, fontWeight: 700, margin: "0 0 8px", letterSpacing: 0.5 }}>{t.res_estado_h}</h4>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{estado}</p>
          </div>
          <div style={{ ...cd, padding: "22px 24px", marginBottom: 24, borderLeft: "3px solid #69F0AE" }}>
            <h4 style={{ color: "#69F0AE", fontSize: 13, fontWeight: 700, margin: "0 0 8px", letterSpacing: 0.5 }}>{t.res_paso_h}</h4>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{paso}</p>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 28, marginBottom: 28, flexWrap: "wrap" }}>
            {Object.entries(PC).map(([k, c]) => {
              const p = pl[k] || { s: 0, m: 1 };
              return (<div key={k} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.color, letterSpacing: 2, marginBottom: 6 }}>{k}</div>
                <Donut v={p.s} m={p.m} color={c.color} />
              </div>);
            })}
          </div>

          {Object.entries(PC).map(([pK, cfg]) => {
            const p = pl[pK] || { s: 0, m: 1 };
            return (
              <div key={pK} style={{ ...cd, padding: "20px 22px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color, letterSpacing: 2 }}>{pK}</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: cfg.color, fontFamily: "'Space Mono',monospace" }}>{Math.round((p.s / p.m) * 100)}%</span>
                </div>
                {cfg.subpillarsEs.map(spEs => {
                  const cats = ALL_CAT[pK]?.[spEs] || [];
                  return (<div key={spEs} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: 6, letterSpacing: 1 }}>{subLabel(spEs, lang)}</div>
                    {cats.map(ct => { const cs = cat[ct]; return <CatBar key={ct} label={catLabel(ct, lang)} v={cs ? cs.s : 0} m={cs ? cs.m : 20} color={cfg.color} unlocked={unlocked.includes(ct)} lockedLabel={lockedLabel} />; })}
                  </div>);
                })}
              </div>
            );
          })}

          {!sent ? (
            <div style={{ ...cd, padding: "28px 24px", textAlign: "center", border: "1px solid rgba(0,229,255,0.2)", background: "linear-gradient(135deg,rgba(0,229,255,0.04),rgba(179,136,255,0.04))" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📩</div>
              <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{t.send_h}</h3>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>
                {t.send_body_a}<strong style={{ color: "#00E5FF" }}>{user.email}</strong>
              </p>
              <button style={{ ...b1, opacity: loading ? 0.5 : 1 }} onClick={handleSendResults} disabled={loading}>
                {loading ? t.send_saving : t.send_btn}
              </button>
            </div>
          ) : (
            <div style={{ ...cd, padding: "28px 24px", textAlign: "center", border: "1px solid rgba(105,240,174,0.25)", background: "rgba(105,240,174,0.04)" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
              <h3 style={{ color: "#69F0AE", fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{t.sent_h}</h3>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6, margin: "0 0 24px" }}>
                {t.sent_body_a}<strong style={{ color: "#fff" }}>{user.email}</strong>{t.sent_body_b}
              </p>

              {/* CTA - Unlock potential */}
              <div style={{ ...cd, padding: "24px", textAlign: "left", border: "1px solid rgba(179,136,255,0.2)", background: "linear-gradient(135deg,rgba(179,136,255,0.06),rgba(0,229,255,0.04))" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🚀</div>
                <h4 style={{ color: "#B388FF", fontSize: 17, fontWeight: 700, margin: "0 0 10px" }}>{t.cta_h}</h4>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.7, margin: "0 0 8px" }}>
                  {t.cta_body_a}<strong style={{ color: "#00E5FF" }}>{t.cta_body_strong}</strong>{t.cta_body_b}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "12px 0 16px" }}>
                  {t.cta_bullets.map((txt, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#69F0AE", fontSize: 14 }}>✓</span>
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{txt}</span>
                    </div>
                  ))}
                </div>

                <button style={{ ...b1, background: "linear-gradient(135deg,#B388FF,#7C4DFF)", width: "100%", fontSize: 16, padding: "16px 32px" }}
                  onClick={() => window.open("https://calendly.com/infinixe/sesion-con-infinixe-1", "_blank")}>
                  {t.book_btn}
                </button>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, textAlign: "center", margin: "10px 0 0", lineHeight: 1.5 }}>
                  {t.book_sub}
                </p>
              </div>

              {/* Finalize button */}
              <button style={{ ...b1, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", width: "100%", marginTop: 16, fontSize: 14, padding: "12px 24px", border: "1px solid rgba(255,255,255,0.1)" }}
                onClick={() => { window.location.reload(); }}>
                {t.finish}
              </button>

              <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 10, marginTop: 20 }}>{t.footer_logos}</p>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 36 }}><div style={{ fontSize: 10, letterSpacing: 5, color: "rgba(255,255,255,0.12)" }}>I N F I N I X E</div></div>
        </div>
      </div>
    );
  }
  return null;
}
