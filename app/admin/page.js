"use client";
import { useState, useEffect } from "react";
import { db } from "../../lib/firebase";
import { collection, getDocs, orderBy, query, doc, updateDoc } from "firebase/firestore";

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

const PILLAR_COLORS = { STRATEGIZE: "#00E5FF", MANAGE: "#B388FF", FEED: "#69F0AE" };

export default function AdminDashboard() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDocs(query(collection(db, "assessments"), orderBy("createdAt", "desc")));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAssessments(data);
      } catch (e) {
        console.error("Error fetching:", e);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = assessments.filter(a => {
    const s = search.toLowerCase();
    if (!s) return true;
    return (a.name || "").toLowerCase().includes(s) || (a.email || "").toLowerCase().includes(s) || (a.company || "").toLowerCase().includes(s);
  });

  const getSelectedAnswers = (answers, questionId, type) => {
    if (!answers) return [];
    const val = answers[questionId];
    if (val === undefined || val === null) return [];
    if (type === "U") return [val];
    if (Array.isArray(val)) return val;
    return [];
  };

  const bg = "#0a0e27";
  const cd = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 };
  const inp = { width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

  // ── LIST VIEW ──
  if (!selected) {
    return (
      <div style={{ minHeight: "100vh", background: bg, fontFamily: "'Outfit', sans-serif", padding: "24px 20px", color: "#fff" }}>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: 4, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>INFINIXE IMA</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#fff" }}>Dashboard de Resultados</h1>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ ...cd, padding: "10px 16px", fontSize: 13, color: "#00E5FF" }}>
                {assessments.length} participantes
              </div>
              <div style={{ ...cd, padding: "10px 16px", fontSize: 13, color: "#69F0AE" }}>
                {assessments.filter(a => a.appointmentBooked).length} agendaron
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: 20 }}>
            <input style={inp} placeholder="🔍 Buscar por nombre, correo o empresa..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Stats summary */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            {Object.entries(PILLAR_COLORS).map(([p, c]) => {
              const avg = filtered.length > 0 ? Math.round(filtered.reduce((s, a) => {
                const ps = a.results?.pillarScores?.[p];
                return s + (ps ? Math.round((ps.s / ps.m) * 100) : 0);
              }, 0) / filtered.length) : 0;
              return (
                <div key={p} style={{ ...cd, padding: "14px 20px", flex: 1, minWidth: 120, textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: c, letterSpacing: 2, marginBottom: 4 }}>{p}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{avg}%</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>promedio</div>
                </div>
              );
            })}
          </div>

          {/* Loading */}
          {loading && <p style={{ textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Cargando datos...</p>}

          {/* Table */}
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "right", margin: "0 0 6px" }}>← Desliza para ver más →</p>
          {!loading && (
            <div style={{ ...cd, overflow: "hidden" }}>
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <div style={{ minWidth: 750 }}>
              {/* Header row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 80px 80px 70px 100px", padding: "12px 16px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: 0.5, gap: 8 }}>
                <span>NOMBRE</span>
                <span>EMAIL</span>
                <span>EMPRESA</span>
                <span style={{ textAlign: "center" }}>NIVEL</span>
                <span style={{ textAlign: "center" }}>PUNTAJE</span>
                <span style={{ textAlign: "center" }}>AGENDÓ</span>
                <span style={{ textAlign: "center" }}>FECHA</span>
              </div>

              {/* Data rows */}
              {filtered.length === 0 && (
                <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                  {search ? "No se encontraron resultados" : "No hay assessments aún"}
                </div>
              )}
              {filtered.map((a, i) => {
                const lvl = a.results?.level || "—";
                const pct = a.results?.overallPct || 0;
                const date = a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString("es-ES") : "—";
                const booked = a.appointmentBooked || false;
                return (
                  <div key={a.id}
                    onClick={() => setSelected(a)}
                    style={{
                      display: "grid", gridTemplateColumns: "1fr 1fr 1fr 80px 80px 70px 100px", padding: "14px 16px",
                      borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                      transition: "background 0.2s", fontSize: 13, alignItems: "center", gap: 8,
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                    }}
                    onMouseOver={e => e.currentTarget.style.background = "rgba(0,229,255,0.06)"}
                    onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)"}
                  >
                    <span style={{ color: "#fff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name || "—"}</span>
                    <span style={{ color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.email || "—"}</span>
                    <span style={{ color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.company || "—"}</span>
                    <span style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: pct >= 68 ? "#69F0AE" : pct >= 34 ? "#FFD740" : "#FF5252" }}>{lvl}</span>
                    <span style={{ textAlign: "center", fontWeight: 700, color: "#00E5FF", fontFamily: "'Space Mono', monospace" }}>{pct}%</span>
                    <span style={{ textAlign: "center", fontSize: 14 }}>{booked ? "✅" : "—"}</span>
                    <span style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{date}</span>
                  </div>
                );
              })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── DETAIL VIEW ──
  const a = selected;
  const lvl = a.results?.level || "—";
  const pct = a.results?.overallPct || 0;
  const date = a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "'Outfit', sans-serif", padding: "24px 20px", color: "#fff" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Back button */}
        <button onClick={() => setSelected(null)}
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", color: "rgba(255,255,255,0.5)", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: 20 }}>
          ← Volver al listado
        </button>

        {/* Client header */}
        <div style={{ ...cd, padding: "24px", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "#fff" }}>{a.name}</h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: "0 0 2px" }}>{a.email}</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>{a.company} · {date}</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#00E5FF" }}>{pct}%</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: pct >= 68 ? "#69F0AE" : pct >= 34 ? "#FFD740" : "#FF5252" }}>{lvl}</div>
            </div>
          </div>
        </div>

        {/* Appointment status */}
        <div style={{ ...cd, padding: "20px 24px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, border: a.appointmentBooked ? "1px solid rgba(105,240,174,0.3)" : "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>{a.appointmentBooked ? "📅" : "🕐"}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: a.appointmentBooked ? "#69F0AE" : "rgba(255,255,255,0.5)" }}>
                {a.appointmentBooked ? "Consultoría agendada" : "Sin cita agendada"}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                {a.appointmentBooked ? "Este cliente ya tiene cita programada" : "Aún no ha agendado consultoría"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const newStatus = !a.appointmentBooked;
                try {
                  await updateDoc(doc(db, "assessments", a.id), { appointmentBooked: newStatus });
                  setSelected({ ...a, appointmentBooked: newStatus });
                  setAssessments(prev => prev.map(x => x.id === a.id ? { ...x, appointmentBooked: newStatus } : x));
                } catch (err) { console.error("Error updating:", err); }
              }}
              style={{
                background: a.appointmentBooked ? "rgba(255,82,82,0.15)" : "rgba(105,240,174,0.15)",
                border: a.appointmentBooked ? "1px solid rgba(255,82,82,0.3)" : "1px solid rgba(105,240,174,0.3)",
                borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                color: a.appointmentBooked ? "#FF5252" : "#69F0AE",
              }}>
              {a.appointmentBooked ? "✕ Desmarcar" : "✓ Marcar como agendada"}
            </button>
            <a href="https://calendly.com/infinixe/sesion-con-infinixe-1" target="_blank" rel="noopener noreferrer"
              style={{
                background: "rgba(179,136,255,0.15)", border: "1px solid rgba(179,136,255,0.3)",
                borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                color: "#B388FF", textDecoration: "none", display: "inline-block",
              }}>
              Ver Calendly ↗
            </a>
          </div>
        </div>

        {/* Pillar scores */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {Object.entries(PILLAR_COLORS).map(([p, c]) => {
            const ps = a.results?.pillarScores?.[p];
            const ppct = ps ? Math.round((ps.s / ps.m) * 100) : 0;
            return (
              <div key={p} style={{ ...cd, padding: "16px 20px", flex: 1, minWidth: 120, textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: c, letterSpacing: 2, marginBottom: 6 }}>{p}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>{ppct}%</div>
                {ps && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{ps.s} / {ps.m} pts</div>}
              </div>
            );
          })}
        </div>

        {/* Estado y paso */}
        {a.results?.estado && (
          <div style={{ ...cd, padding: "18px 20px", marginBottom: 12, borderLeft: "3px solid #00E5FF" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#00E5FF", marginBottom: 6 }}>📊 ESTADO ACTUAL</div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{a.results.estado}</p>
          </div>
        )}
        {a.results?.paso && (
          <div style={{ ...cd, padding: "18px 20px", marginBottom: 24, borderLeft: "3px solid #69F0AE" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#69F0AE", marginBottom: 6 }}>🎯 SIGUIENTE PASO</div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{a.results.paso}</p>
          </div>
        )}

        {/* Answers detail */}
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 16 }}>Respuestas detalladas</h3>

        {["STRATEGIZE", "MANAGE", "FEED"].map(pillar => {
          const pillarQs = QUESTIONS.filter(q => q.pillar === pillar);
          return (
            <div key={pillar} style={{ ...cd, padding: "20px", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: PILLAR_COLORS[pillar], letterSpacing: 2, marginBottom: 16 }}>{pillar}</div>

              {pillarQs.map((q, qi) => {
                const selIdx = getSelectedAnswers(a.answers, q.id, q.type);
                const pts = selIdx.reduce((s, i) => s + (q.answers[i]?.pts || 0), 0);
                const maxPts = q.type === "U" ? Math.max(...q.answers.map(x => x.pts)) : q.answers.reduce((s, x) => s + Math.max(0, x.pts), 0);

                return (
                  <div key={q.id} style={{ marginBottom: qi < pillarQs.length - 1 ? 20 : 0, paddingBottom: qi < pillarQs.length - 1 ? 20 : 0, borderBottom: qi < pillarQs.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    {/* Question header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: PILLAR_COLORS[pillar], fontWeight: 600 }}>{q.pilarEs}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>·</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{q.subpilar}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginLeft: "auto" }}>{q.type === "M" ? "Múltiple" : "Única"}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: "0 0 10px", lineHeight: 1.5 }}>{q.q}</p>

                    {/* Answers */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {q.answers.map((ans, ai) => {
                        const wasPicked = selIdx.includes(ai);
                        return (
                          <div key={ai} style={{
                            display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", borderRadius: 6,
                            background: wasPicked ? `${PILLAR_COLORS[pillar]}10` : "transparent",
                            border: wasPicked ? `1px solid ${PILLAR_COLORS[pillar]}30` : "1px solid transparent",
                          }}>
                            <span style={{
                              width: 16, height: 16, minWidth: 16, borderRadius: q.type === "U" ? "50%" : 3, marginTop: 2,
                              background: wasPicked ? PILLAR_COLORS[pillar] : "transparent",
                              border: wasPicked ? `2px solid ${PILLAR_COLORS[pillar]}` : "2px solid rgba(255,255,255,0.1)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              {wasPicked && <span style={{ color: "#0a0e27", fontSize: 9, fontWeight: 900 }}>✓</span>}
                            </span>
                            <span style={{ fontSize: 12, color: wasPicked ? "#fff" : "rgba(255,255,255,0.35)", lineHeight: 1.4, flex: 1 }}>{ans.text}</span>
                            <span style={{ fontSize: 10, color: wasPicked ? PILLAR_COLORS[pillar] : "rgba(255,255,255,0.15)", fontFamily: "'Space Mono', monospace", minWidth: 24, textAlign: "right" }}>{ans.pts}pts</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Score for this question */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                      <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 3 }}>
                        <div style={{ width: `${maxPts > 0 ? (pts / maxPts) * 100 : 0}%`, height: "100%", background: PILLAR_COLORS[pillar], borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, color: PILLAR_COLORS[pillar], fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>{pts}/{maxPts}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        <div style={{ textAlign: "center", marginTop: 32, marginBottom: 20 }}>
          <div style={{ fontSize: 10, letterSpacing: 5, color: "rgba(255,255,255,0.12)" }}>I N F I N I X E</div>
        </div>
      </div>
    </div>
  );
}
