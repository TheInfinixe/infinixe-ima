"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";

// ─── LEVELS ─────────────────────────────────────────────────────────────────
const LEVELS = [
  { level: 0, name: "INICIAL", minPct: 0, maxPct: 16, estado: "Ocurre de forma esporádica, sin procesos ni estrategia, impulsada por necesidades urgentes con una visión únicamente desde el proyecto.", paso: "Escuchar a la dirección y a los clientes para definir retos anuales que actúen como victorias tempranas y posicionen a la innovación como el motor de cambio hacia el futuro." },
  { level: 1, name: "REACTIVA", minPct: 17, maxPct: 33, estado: "Es una respuesta a presiones externas, estableciendo procesos básicos pero aún informales y desconectados. Actúa con el tiempo encima, por lo que se siente improvisada y caótica.", paso: "Anticiparse y diseñar una planeación estratégica que permita priorizar las urgencias de la organización bajo una estructura y un orden de trabajo definidos." },
  { level: 2, name: "ESTRUCTURADA", minPct: 34, maxPct: 50, estado: "Cuenta con procesos y equipos dedicados, integrados en la cultura organizacional de mejora y crecimiento. Existen una visión desde el portafolio.", paso: "Optimizar el sistema para validar ideas de forma ágil y económica, comunicando las historias de éxito para inspirar y sumar al resto de la organización." },
  { level: 3, name: "SISTEMATIZADA", minPct: 51, maxPct: 67, estado: "Es sistemática con roles, procesos y métricas claras, para gestionar portafolios de proyectos que redefinen la cultura organizacional con nuevos retos. Existe una visión del futuro al menos para este y el siguiente año.", paso: "Trascender el área de innovación para que esta actúe como catalizadora, logrando que el resto de los departamentos mejoren y creen soluciones desde su propia experiencia." },
  { level: 4, name: "AMBIDIESTRA", minPct: 68, maxPct: 84, estado: "Equilibra la exploración de nuevas oportunidades con la explotación de unidades existentes, en un modelo abierto e integrado con el ecosistema. La innovación se siente dentro y fuera de su área.", paso: "Mantener un rol activo en el ecosistema, alianzas y foros buscando el bienestar social y ambiental, asegurando la efectividad para construir el futuro del negocio desde las acciones del presente." },
  { level: 5, name: "SOSTENIBLE", minPct: 85, maxPct: 100, estado: "Se refleja en la mentalidad y las formas de trabajo de la cultura organizacional; integrada con el ecosistema externo, busca crear valor social y ambiental continuamente.", paso: "Liderar la transformación dentro del sector industrial, adaptando y reinventando continuamente las prácticas para garantizar que este impacto positivo se expanda a largo plazo." },
];
const getLevel = (pct) => LEVELS.find(l => pct >= l.minPct && pct <= l.maxPct) || LEVELS[0];

// ─── QUESTIONS ──────────────────────────────────────────────────────────────
const QUESTIONS = [
  { id:1, pillar:"STRATEGIZE", pilarEs:"DEFINIR", subpilar:"Visión", type:"M", q:"¿La empresa desglosa su visión en destinos estratégicos a corto, mediano y largo plazo bien definidos?", answers:[{text:"No hay objetivos definidos en plazos en la empresa",pts:0},{text:"Es claro lo que la empresa busca a corto plazo",pts:5},{text:"Es claro lo que la empresa busca a mediano plazo",pts:5},{text:"Es claro lo que la empresa busca a largo plazo",pts:5},{text:"La visión de la empresa es coherente en los 3 plazos definidos",pts:5},{text:"Los destinos estratégicos son sostenibles y evitan la obsolescencia",pts:5}]},
  { id:2, pillar:"STRATEGIZE", pilarEs:"DEFINIR", subpilar:"Transformación cultural", type:"M", q:"¿Tu visión del futuro se refleja en una visión de cultura a futuro destacando las competencias a desarrollar?", answers:[{text:"No se tiene planeado desarrollar competencias",pts:0},{text:"Se tienen definidos los perfiles de puestos",pts:3},{text:"Se tienen métricas definidas para medir la cultura",pts:4},{text:"Se tienen definidas las competencias a desarrollar tanto individuales como de equipos",pts:4},{text:"Se tiene un plan de crecimiento por cada rol en la empresa",pts:3},{text:"La visión contempla una cultura sana",pts:3}]},
  { id:3, pillar:"STRATEGIZE", pilarEs:"EVALUAR", subpilar:"Tendencias externas", type:"M", q:"¿Identifican constantemente las tendencias externas que representan un riesgo u oportunidad?", answers:[{text:"No se identifican las tendencias externas, se opera ignorando el entorno",pts:0},{text:"Se tiene un análisis de la competencia actualizado",pts:4},{text:"Se tienen identificadas las tendencias de mercados similares",pts:3},{text:"Se tienen identificadas las tendencias tecnológicas",pts:4},{text:"Se tienen identificadas las tendencias regulatorias",pts:3},{text:"Se mide el riesgo o la oportunidad de las oportunidades identificadas",pts:4}]},
  { id:4, pillar:"STRATEGIZE", pilarEs:"EVALUAR", subpilar:"Recolección y filtrado", type:"U", q:"¿Existen canales para recoger ideas de proyectos dentro de la organización?", answers:[{text:"No se recogen ideas de los colaboradores",pts:0},{text:"Existe un canal de recepción de ideas",pts:2},{text:"Se reciben ideas que no se les da seguimiento",pts:4},{text:"Hay un responsable de la recolección de ideas que les da seguimiento",pts:7},{text:"Hay un proceso accesible y estandarizado para la recepción de ideas",pts:11}]},
  { id:5, pillar:"STRATEGIZE", pilarEs:"INVERTIR", subpilar:"Presupuesto", type:"M", q:"¿Definen criterios de inversión de rentabilidad mínima y capital de inversión máximo para los proyectos?", answers:[{text:"No hay criterios de inversión para los proyectos",pts:0},{text:"Hay indicadores financieros en los proyectos",pts:3},{text:"Los indicadores están asociados al tipo de proyecto",pts:4},{text:"Está definido el beneficio buscado y se compara con los indicadores financieros",pts:4},{text:"Se tiene definida la rentabilidad mínima esperada desde el inicio de los proyectos",pts:3},{text:"Se tiene definida la inversión máxima desde el inicio de los proyectos",pts:3}]},
  { id:6, pillar:"STRATEGIZE", pilarEs:"INVERTIR", subpilar:"Alianzas", type:"M", q:"¿Desarrollan alianzas para invertir capital en conjunto en oportunidades de negocios?", answers:[{text:"No se buscan alianzas para invertir en conjunto",pts:0},{text:"La empresa tiene la apertura y flexibilidad de hacer alianzas, fusiones o adquisiciones",pts:2},{text:"Se hacen análisis de las oportunidades potenciales con otras empresas",pts:2},{text:"Se tiene claras las carencias de la empresa que pueden ser resueltas con alianzas",pts:2},{text:"Se realizan inversiones con otras empresas sumando capital y conocimientos en conjunto",pts:2}]},
  { id:7, pillar:"MANAGE", pilarEs:"GESTIÓN", subpilar:"Reporteo", type:"U", q:"¿Realizan una reunión mensual con los stakeholders para compartir el avance y decidir sobre el proyecto?", answers:[{text:"No hay reuniones de reporteo",pts:0},{text:"Se reportan los avances del proyecto de forma asíncrona sin periodicidad",pts:3},{text:"Hay una periodicidad para reportar avances, pero las decisiones incurren en retrabajos o pivoteos tardíos",pts:6},{text:"La sesión se da periódicamente y se toman decisiones efectivas",pts:9},{text:"Los stakeholders retroalimentan al equipo, dan feedback y medios para un mejor avance del proyecto",pts:12}]},
  { id:8, pillar:"MANAGE", pilarEs:"GESTIÓN", subpilar:"Métricas", type:"U", q:"¿Utilizan métricas de avance para ubicar a los proyectos en función de los aprendizajes y/o los entregables esperados por etapa?", answers:[{text:"Se desconocen las métricas y entregables por etapa de los proyectos",pts:0},{text:"Los proyectos están separados por etapas según el tipo de proyecto",pts:4},{text:"Se tienen definidas métricas para cada una de las etapas",pts:8},{text:"Se definen métricas, entregables y aprendizajes (evidencia necesaria) para cada una de las etapas",pts:13}]},
  { id:9, pillar:"MANAGE", pilarEs:"DISEÑO", subpilar:"Prototipo", type:"U", q:"¿Utilizan el prototipado como una herramienta para iterar y mejorar las soluciones antes de su implementación final?", answers:[{text:"No se prototipa",pts:0},{text:"Se gasta mucho tiempo y esfuerzo en prototipos robustos",pts:3},{text:"Se comprende el concepto de MVP (Producto mínimo viable)",pts:6},{text:"Se tiene una metodología para crear y validar prototipos",pts:10},{text:"Se validan conceptos de solución antes de validar una solución completa",pts:13},{text:"Se comprende la validación obtenida del prototipado y se mejora tras cada iteración",pts:17}]},
  { id:10, pillar:"MANAGE", pilarEs:"DISEÑO", subpilar:"Pivoteo", type:"M", q:"¿Accionan cambios de enfoque de proyecto, \"pivoteos\", con autonomía y liderazgo?", answers:[{text:"Los proyectos no permiten cambios",pts:0},{text:"Son claros los criterios para realizar un pivoteo en un proyecto",pts:4},{text:"Los equipos comparten información sintetizada para tomar decisiones sobre el proyecto",pts:3},{text:"Los stakeholders deciden sobre el proyecto según la evidencia presentada",pts:4},{text:"Los equipos sugieren el rumbo del proyecto",pts:4}]},
  { id:11, pillar:"MANAGE", pilarEs:"TESTEO", subpilar:"Estudio de usuario", type:"M", q:"¿Realizan estudios cualitativos para comprender lo que los distintos actores valoran antes de crear o mejorar soluciones?", answers:[{text:"Se crean \"soluciones\" sin antes validar con los actores",pts:0},{text:"Se usan técnicas de observación con los actores",pts:3},{text:"Se usan técnicas de entrevistas con los actores",pts:3},{text:"Se usan focus groups o pequeñas muestras de personas para validar con ellos",pts:3},{text:"Se usan prototipos para validar con actores",pts:3},{text:"El desarrollo de soluciones se hace a la par que las validaciones con los actores",pts:4}]},
  { id:12, pillar:"MANAGE", pilarEs:"TESTEO", subpilar:"Estudio técnico", type:"M", q:"¿Realizan estudios de factibilidad con expertos técnicos para validar el modelo de negocio?", answers:[{text:"No se valida si es posible crear el valor del modelo",pts:0},{text:"Se conocen las actividades y procesos necesarios para crear la solución además de poderlas realizar",pts:4},{text:"Se conocen y se tienen (o se pueden obtener) los recursos necesarios para crear la solución",pts:4},{text:"Se conoce a los aliados necesarios para crear la solución y se tiene (o puede tener) un trato con ellos",pts:4},{text:"Se tienen medidos los elementos necesarios para crear la solución y su impacto en la estructura de costos",pts:4}]},
  { id:13, pillar:"FEED", pilarEs:"DESARROLLAR", subpilar:"Balance", type:"M", q:"¿Evalúan con métricas el nivel de desarrollo de forma grupal e individual?", answers:[{text:"No hay métricas ni herramientas para medir el desarrollo",pts:0},{text:"Se tiene un esquema para evaluar el nivel de desarrollo",pts:4},{text:"Se tienen herramientas para medir el desarrollo grupal e individual",pts:4},{text:"Utilizan métricas cuantitativas y cualitativas",pts:3},{text:"Existe un plan de desarrollo profesional comunicado a colaboradores",pts:5}]},
  { id:14, pillar:"FEED", pilarEs:"DESARROLLAR", subpilar:"Innovación", type:"M", q:"¿Promueven la creatividad, la divergencia y el pensamiento lateral para resolver problemas o aprovechar oportunidades?", answers:[{text:"No se promueve la creatividad",pts:0},{text:"Hay incentivos para quienes tienen propuestas creativas",pts:6},{text:"Realizan sesiones de ideación para la resolución de retos dentro de las áreas",pts:4},{text:"Existen promotores que fomenten la creatividad",pts:4},{text:"Los líderes en la organización propician la creatividad",pts:5}]},
  { id:15, pillar:"FEED", pilarEs:"INVOLUCRAR", subpilar:"Dinámicas", type:"U", q:"¿Utilizan dinámicas de equipos para innovar internamente?", answers:[{text:"No hay dinámicas dedicadas a fomentar la innovación en equipo",pts:0},{text:"Se realizan sesiones para detectar los retos más relevantes del área",pts:7},{text:"Se realizan talleres para hablar de innovación e inspirarse",pts:6},{text:"Se realizan talleres para saber hacer innovación detectando y resolviendo necesidades",pts:6},{text:"Se realizan talleres para saber detectar tendencias y reinventar soluciones existentes",pts:6}]},
  { id:16, pillar:"FEED", pilarEs:"INVOLUCRAR", subpilar:"Dinámicas", type:"U", q:"¿Utilizan dinámicas organizacionales para innovar en retos específicos?", answers:[{text:"No hay dinámicas dedicadas a fomentar la innovación en la organización",pts:0},{text:"Están claros y comunicados los retos más relevantes para la organización",pts:10},{text:"Realizan conferencias a toda la organización para hablar de innovación e inspirarse",pts:8},{text:"Realizan talleres abiertos a toda la organización para innovar en los retos organizacionales",pts:8}]},
  { id:17, pillar:"FEED", pilarEs:"CONECTAR", subpilar:"Interno", type:"M", q:"¿Fomentan la empatía, confianza y colaboración entre diferentes departamentos y equipos para nutrir la cultura organizacional?", answers:[{text:"No hay esfuerzos visibles para mejorar la colaboración entre áreas",pts:0},{text:"Hay eventos de team-building o de cohesión de equipos entre 2 o más áreas",pts:6},{text:"Se hacen reuniones de alineación entre 2 o más áreas",pts:7},{text:"Hay programas de desarrollo de habilidades blandas como comunicación y asertividad",pts:7},{text:"Hay revisiones colaborativas de resultados entre áreas",pts:6}]},
  { id:18, pillar:"FEED", pilarEs:"CONECTAR", subpilar:"Sustentabilidad", type:"M", q:"¿Fomentan el vínculo socios, directores y colaborador con eventos para reconocer, agradecer y premiar?", answers:[{text:"No existen actividades de reconocimiento",pts:0},{text:"Hay campañas de reconocimientos",pts:6},{text:"Los altos mandos participan como mentores o stakeholders",pts:6},{text:"Los socios están involucrados con las iniciativas actuales",pts:7}]},
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
const TOASTS = ["🚀 ¡Gran inicio!","💡 ¡Excelente reflexión!","⚡ ¡Vas muy bien!","🎯 ¡Registrada!","🔥 ¡Sigue así!","✨ ¡Casi llegas!","🏆 ¡Increíble!","💪 ¡No pares!","🌟 ¡Impresionante!"];

// ─── COMPONENTS ─────────────────────────────────────────────────────────────
function Donut({v,m,color,size=90}){
  const p=m>0?Math.round((v/m)*100):0, r=(size-14)/2, c=2*Math.PI*r;
  return(<svg width={size} height={size} style={{display:"block"}}>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
    <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={c} strokeDashoffset={c-(p/100)*c} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dashoffset 1.2s ease"}}/>
    <text x={size/2} y={size/2} textAnchor="middle" dy="0.35em" style={{fill:"#fff",fontSize:size*0.26,fontWeight:800,fontFamily:"inherit"}}>{p}</text>
  </svg>);
}

function LevelGauge({ pct, levelObj }) {
  const levelColors = ["#FF5252","#FF9800","#FFD740","#69F0AE","#00E5FF","#B388FF"];
  const cx = 160, cy = 150, r = 110;
  const needleAngle = Math.PI + (pct / 100) * Math.PI;
  return (
    <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
      <svg width="320" height="190" viewBox="0 0 320 190" style={{ display: "block", margin: "0 auto" }}>
        {LEVELS.map((l, i) => {
          const startA = Math.PI + (i / 6) * Math.PI;
          const endA = Math.PI + ((i + 1) / 6) * Math.PI;
          const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA);
          const x2 = cx + r * Math.cos(endA), y2 = cy + r * Math.sin(endA);
          return (<path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} fill="none" stroke={levelColors[i]} strokeWidth="20" strokeLinecap="butt" opacity={levelObj.level === i ? 1 : 0.2}/>);
        })}
        {LEVELS.map((l, i) => {
          const midA = Math.PI + ((i + 0.5) / 6) * Math.PI;
          const lx = cx + (r + 24) * Math.cos(midA), ly = cy + (r + 24) * Math.sin(midA);
          return (<text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" style={{ fill: levelObj.level === i ? "#fff" : "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: levelObj.level === i ? 700 : 400, fontFamily: "inherit" }}>{l.level}</text>);
        })}
        {(() => { const nx = cx + 85 * Math.cos(needleAngle), ny = cy + 85 * Math.sin(needleAngle); return <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#fff" strokeWidth="3" strokeLinecap="round" style={{ transition: "all 1.2s ease" }}/>; })()}
        <circle cx={cx} cy={cy} r="6" fill="#fff"/>
        <text x={cx} y={cy - 28} textAnchor="middle" style={{ fill: "#fff", fontSize: 32, fontWeight: 800, fontFamily: "inherit" }}>{pct}%</text>
      </svg>
      <div>
        <div style={{ fontSize: 10, letterSpacing: 2, color: "rgba(255,255,255,0.4)" }}>NIVEL {levelObj.level}</div>
        <div style={{ fontSize: 22, fontWeight: 800, background: "linear-gradient(135deg, #00E5FF, #B388FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{levelObj.name}</div>
      </div>
    </div>
  );
}

function CatBar({label,v,m,color,unlocked}){
  const p=m>0?Math.round((v/m)*100):0;
  return(<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
    <span style={{width:150,textAlign:"right",fontSize:11,color:unlocked?"rgba(255,255,255,0.8)":"rgba(255,255,255,0.25)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{label}</span>
    <div style={{flex:1,height:16,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden"}}>
      {unlocked?<div style={{width:`${p}%`,height:"100%",background:`linear-gradient(90deg,${color},${color}88)`,borderRadius:4,transition:"width 1s ease",minWidth:p>0?4:0}}/>
      :<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:9,color:"rgba(255,255,255,0.2)",letterSpacing:1.5}}>🔒 BLOQUEADO</span></div>}
    </div>
    {unlocked&&<span style={{fontSize:10,color:"rgba(255,255,255,0.4)",width:28,textAlign:"right",fontFamily:"'Space Mono',monospace"}}>{p}%</span>}
  </div>);
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function Home() {
  const [screen, setScreen] = useState("welcome");
  const [user, setUser] = useState({ name: "", email: "", company: "" });
  const [cQ, setCQ] = useState(0);
  const [ans, setAns] = useState({});
  const [toast, setToast] = useState("");
  const [anim, setAnim] = useState(true);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [regError, setRegError] = useState("");

  const q = QUESTIONS[cQ];

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
    if (d === 1 && cQ < QUESTIONS.length - 1) { setToast(TOASTS[cQ % TOASTS.length]); setTimeout(() => setToast(""), 1200); }
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
    const resultData = { pillarScores: pl, overallPct: oPct, level: lvl.name, levelNum: lvl.level, estado: lvl.estado, paso: lvl.paso };
    await saveAssessment(resultData);
    // Send email via API
    try {
      await fetch("/api/send-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user.name, email: user.email, company: user.company, results: resultData }),
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

  // ── WELCOME ──
  if (screen === "welcome") return (
    <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 480, animation: "fu 0.8s ease" }}>
        <div style={{ fontSize: 12, letterSpacing: 6, color: "rgba(255,255,255,0.35)", marginBottom: 16, fontWeight: 600 }}>I N F I N I X E</div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.1 }}>
          Innovation<br />Management<br />
          <span style={{ background: "linear-gradient(135deg,#00E5FF,#B388FF,#69F0AE)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Assessment</span>
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, lineHeight: 1.6, margin: "24px 0 32px" }}>
          Descubre el nivel de madurez de innovación de tu organización a través de nuestro assessment interactivo.
        </p>
        <div style={{ ...cd, padding: "16px 20px", marginBottom: 28, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {["STRATEGIZE", "MANAGE", "FEED"].map(p => (
            <span key={p} style={{ fontSize: 10, fontWeight: 700, color: PC[p].color, background: `${PC[p].color}15`, padding: "5px 12px", borderRadius: 6, letterSpacing: 1.5 }}>{p}</span>
          ))}
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 28 }}>18 preguntas • 3 pilares • ~8 minutos</p>
        <button style={b1} onClick={() => setScreen("register")} onMouseOver={e => e.target.style.transform = "scale(1.05)"} onMouseOut={e => e.target.style.transform = "scale(1)"}>Comenzar Assessment →</button>
      </div>
    </div>
  );

  // ── REGISTER ──
  if (screen === "register") {
    const ok = user.name.trim() && user.email.trim() && user.company.trim() && !loading;
    return (
      <div style={{ minHeight: "100vh", background: bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Outfit',sans-serif" }}>
        <div style={{ ...cd, padding: 36, maxWidth: 400, width: "100%", animation: "fu 0.6s ease" }}>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>INFINIXE IMA</div>
          <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>Regístrate</h2>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 24px" }}>Tus datos serán utilizados para enviar tus resultados.</p>

          {blocked ? (
            <div style={{ ...cd, padding: 24, textAlign: "center", border: "1px solid rgba(255,82,82,0.3)", background: "rgba(255,82,82,0.06)" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔒</div>
              <h3 style={{ color: "#FF5252", fontSize: 16, fontWeight: 700, margin: "0 0 8px" }}>Este email ya completó el assessment</h3>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                El email <strong style={{ color: "#fff" }}>{user.email}</strong> ya fue utilizado para completar esta evaluación. Si necesitas ayuda, contacta a Infinixe.
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[["Nombre completo", "name", "Tu nombre", "text"], ["Email corporativo", "email", "tu@empresa.com", "email"], ["Empresa", "company", "Nombre de tu empresa", "text"]].map(([l, k, p, t]) => (
                  <div key={k}><label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 5, display: "block" }}>{l}</label>
                    <input style={inp} type={t} placeholder={p} value={user[k]} onChange={e => setUser(u => ({ ...u, [k]: e.target.value }))} /></div>
                ))}
              </div>
              {regError && <p style={{ color: "#FF5252", fontSize: 12, marginTop: 10 }}>{regError}</p>}
              <button
                style={{ ...b1, width: "100%", marginTop: 24, opacity: ok ? 1 : 0.35, pointerEvents: ok ? "auto" : "none" }}
                onClick={handleRegister}>
                {loading ? "Verificando..." : "Iniciar Assessment →"}
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
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>›</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{q.pilarEs}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>›</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{q.subpilar}</span>
            </div>
            <h2 style={{ color: "#fff", fontSize: 18, fontWeight: 600, lineHeight: 1.45, margin: "0 0 6px" }}>{q.q}</h2>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "0 0 20px" }}>
              {q.type === "M" ? "Selecciona todas las que apliquen" : "Selecciona una opción"}
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
                    <span style={{ fontSize: 13, lineHeight: 1.5, color: on ? "#fff" : "rgba(255,255,255,0.6)" }}>{a.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "14px 20px", background: "linear-gradient(transparent,#0a0e27ee)", display: "flex", justifyContent: "space-between" }}>
          <button onClick={() => nav(-1)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 18px", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: cQ > 0 ? "pointer" : "default", opacity: cQ > 0 ? 1 : 0.3, fontFamily: "inherit" }}>← Anterior</button>
          <button onClick={() => nav(1)} disabled={!answered(q.id, q.type)} style={{ ...b1, opacity: answered(q.id, q.type) ? 1 : 0.3, pointerEvents: answered(q.id, q.type) ? "auto" : "none" }}>
            {cQ === QUESTIONS.length - 1 ? "Ver Resultados 🎉" : "Siguiente →"}
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

    return (
      <div style={{ minHeight: "100vh", background: bg, fontFamily: "'Outfit',sans-serif", padding: "20px 16px 60px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: 5, color: "rgba(255,255,255,0.25)", marginBottom: 6 }}>INFINIXE IMA</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0 }}>
              Innovation Management <span style={{ background: "linear-gradient(135deg,#00E5FF,#B388FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Assessment</span>
            </h1>
          </div>

          <div style={{ ...cd, padding: "18px 24px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
            <div>
              <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0 }}>{user.company}</h3>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, margin: "3px 0 0" }}>{user.name} • {new Date().toLocaleDateString("es-ES")}</p>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Versión Beta</div>
          </div>

          <div style={{ ...cd, padding: "16px 24px 8px", marginBottom: 16 }}>
            <LevelGauge pct={oPct} levelObj={lvl} />
          </div>

          <div style={{ ...cd, padding: "22px 24px", marginBottom: 16, borderLeft: "3px solid #00E5FF" }}>
            <h4 style={{ color: "#00E5FF", fontSize: 13, fontWeight: 700, margin: "0 0 8px", letterSpacing: 0.5 }}>📊 Estado actual de la innovación</h4>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{lvl.estado}</p>
          </div>
          <div style={{ ...cd, padding: "22px 24px", marginBottom: 24, borderLeft: "3px solid #69F0AE" }}>
            <h4 style={{ color: "#69F0AE", fontSize: 13, fontWeight: 700, margin: "0 0 8px", letterSpacing: 0.5 }}>🎯 El siguiente paso estratégico es...</h4>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{lvl.paso}</p>
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
                    <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", marginBottom: 6, letterSpacing: 1 }}>{spEs}</div>
                    {cats.map(ct => { const cs = cat[ct]; return <CatBar key={ct} label={ct} v={cs ? cs.s : 0} m={cs ? cs.m : 20} color={cfg.color} unlocked={unlocked.includes(ct)} />; })}
                  </div>);
                })}
              </div>
            );
          })}

          {!sent ? (
            <div style={{ ...cd, padding: "28px 24px", textAlign: "center", border: "1px solid rgba(0,229,255,0.2)", background: "linear-gradient(135deg,rgba(0,229,255,0.04),rgba(179,136,255,0.04))" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>📩</div>
              <h3 style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>Recibe tus resultados</h3>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6, margin: "0 0 20px" }}>
                Te enviaremos un resumen en PDF con los resultados de esta evaluación beta a <strong style={{ color: "#00E5FF" }}>{user.email}</strong>
              </p>
              <button style={{ ...b1, opacity: loading ? 0.5 : 1 }} onClick={handleSendResults} disabled={loading}>
                {loading ? "Guardando..." : "Enviar mis Resultados →"}
              </button>
            </div>
          ) : (
            <div style={{ ...cd, padding: "28px 24px", textAlign: "center", border: "1px solid rgba(105,240,174,0.25)", background: "rgba(105,240,174,0.04)" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
              <h3 style={{ color: "#69F0AE", fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>¡Resultados enviados!</h3>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6, margin: "0 0 24px" }}>
                Revisa tu correo <strong style={{ color: "#fff" }}>{user.email}</strong> para ver tu resumen en PDF.
              </p>
              <div style={{ ...cd, padding: "24px", textAlign: "left", border: "1px solid rgba(179,136,255,0.2)", background: "linear-gradient(135deg,rgba(179,136,255,0.06),rgba(0,229,255,0.04))" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🔓</div>
                <h4 style={{ color: "#B388FF", fontSize: 17, fontWeight: 700, margin: "0 0 10px" }}>Desbloquea el Assessment Completo</h4>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, lineHeight: 1.7, margin: "0 0 8px" }}>
                  Esta evaluación beta cubre <strong style={{ color: "#00E5FF" }}>18 preguntas</strong> de una muestra representativa.
                  El assessment completo evalúa <strong style={{ color: "#00E5FF" }}>36 indicadores en más de 100 preguntas</strong> junto con tu equipo, entregando:
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "12px 0 16px" }}>
                  {["Diagnóstico profundo de los 36 indicadores", "Recomendaciones personalizadas por subpilar", "Plan de acción estratégico con tu equipo", "Benchmarking contra +2,000 organizaciones"].map((t, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#69F0AE", fontSize: 14 }}>✓</span>
                      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{t}</span>
                    </div>
                  ))}
                </div>
                <button style={{ ...b1, background: "linear-gradient(135deg,#B388FF,#7C4DFF)", width: "100%", fontSize: 16, padding: "16px 32px" }}
                  onClick={() => window.open("https://calendly.com/infinixe/sesion-con-infinixe-1", "_blank")}>
                  Agendar Consultoría Gratuita →
                </button>
                <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, textAlign: "center", margin: "12px 0 0" }}>Sin costo · Sin compromiso · 30 minutos con un consultor de innovación</p>
              </div>
              <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 10, marginTop: 20 }}>+2,000 innovadores usan nuestros Frameworks • Zurich • MSC • Agrisal • Audi • FedEx • Conagra</p>
            </div>
          )}

          <div style={{ textAlign: "center", marginTop: 36 }}><div style={{ fontSize: 10, letterSpacing: 5, color: "rgba(255,255,255,0.12)" }}>I N F I N I X E</div></div>
        </div>
      </div>
    );
  }
  return null;
}
