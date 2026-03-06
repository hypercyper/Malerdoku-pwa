import { useState, useEffect, useRef } from 'react';
import { loadProjects, saveProjects, compressImage } from './storage';

// ─── Icons ───
const I = {
  plus: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" strokeLinecap="round"/></svg>,
  camera: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  back: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  room: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  trash: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  pdf: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  check: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  edit: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  img: <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  pen: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>,
  type: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>,
  undo: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
  arrow: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  gallery: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
};

// ─── Theme ───
const t = {
  bg:"#0F1118", sf:"#1A1D27", sf2:"#242836",
  acc:"#E8A838", accD:"#C48A20",
  tx:"#F0EDE6", txM:"#8A8D9A",
  err:"#E05252", ok:"#4CAF7D",
  brd:"#2A2E3A", r:"14px", rs:"10px",
};

const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = (d) => new Date(d).toLocaleDateString("de-DE", { day:"2-digit", month:"2-digit", year:"numeric" });

// ─── Styles ───
const S = {
  input: { width:"100%", background:t.sf2, border:`1px solid ${t.brd}`, borderRadius:t.rs, padding:"13px 16px", color:t.tx, fontSize:"15px", outline:"none", boxSizing:"border-box", fontFamily:"inherit" },
  textarea: { width:"100%", background:t.sf2, border:`1px solid ${t.brd}`, borderRadius:t.rs, padding:"13px 16px", color:t.tx, fontSize:"15px", outline:"none", boxSizing:"border-box", minHeight:"100px", resize:"vertical", fontFamily:"inherit" },
  label: { fontSize:"12px", fontWeight:600, color:t.txM, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:"8px", display:"block" },
  btnP: { width:"100%", background:`linear-gradient(135deg, ${t.acc}, ${t.accD})`, color:"#000", border:"none", borderRadius:t.rs, padding:"15px", fontSize:"15px", fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", fontFamily:"inherit" },
  btnS: { background:t.sf2, color:t.tx, border:`1px solid ${t.brd}`, borderRadius:t.rs, padding:"12px 18px", fontSize:"14px", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:"8px", fontFamily:"inherit" },
  btnI: { background:"transparent", border:"none", color:t.txM, cursor:"pointer", padding:"8px", borderRadius:"10px", display:"flex", alignItems:"center", justifyContent:"center" },
  card: { background:t.sf, borderRadius:t.r, padding:"16px", marginBottom:"12px", border:`1px solid ${t.brd}`, cursor:"pointer" },
  badge: (on) => ({ background:on?`${t.ok}22`:t.sf2, color:on?t.ok:t.txM, fontSize:"12px", fontWeight:600, padding:"4px 10px", borderRadius:"20px" }),
  section: { fontSize:"13px", fontWeight:700, color:t.txM, textTransform:"uppercase", letterSpacing:"1px", marginBottom:"12px", marginTop:"24px" },
  divider: { height:"1px", background:t.brd, margin:"16px 0" },
};

const DRAW_COLORS = ["#FF3B30","#FF9500","#FFCC00","#34C759","#007AFF","#AF52DE","#FFFFFF","#000000"];

// ─── Shared Components ───
const Header = ({ title, sub, onBack, right }) => (
  <div style={{ display:"flex", alignItems:"center", padding:"16px 20px", paddingTop: "env(safe-area-inset-top, 48px)", background:`linear-gradient(180deg, ${t.sf} 0%, transparent 100%)`, position:"sticky", top:0, zIndex:100 }}>
    <button style={S.btnI} onClick={onBack}>{I.back}</button>
    <div style={{ textAlign:"center", flex:1 }}>
      <div style={{ fontSize:"20px", fontWeight:700, letterSpacing:"-0.3px" }}>{title}</div>
      {sub && <div style={{ fontSize:"12px", color:t.txM, marginTop:"2px" }}>{sub}</div>}
    </div>
    {right || <div style={{ width:38 }}/>}
  </div>
);

const Field = ({ label, value, onChange, placeholder, type }) => (
  <div style={{ marginBottom:"20px" }}>
    <label style={S.label}>{label}</label>
    <input style={S.input} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} type={type||"text"}/>
  </div>
);

// ═══════════════════════════════════════
// PHOTO EDITOR
// ═══════════════════════════════════════
const PhotoEditor = ({ photoData, onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#FF3B30");
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState(null);
  const [arrowStart, setArrowStart] = useState(null);
  const lastPoint = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const container = canvas.parentElement;
    const w = container.clientWidth;
    const h = Math.round(w * 0.75);
    canvas.width = w * 2;
    canvas.height = h * 2;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.scale(2, 2);

    if (photoData) {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, w, h); setHistory([canvas.toDataURL()]); };
      img.src = photoData;
    } else {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#667eea"); grad.addColorStop(1, "#764ba2");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      setHistory([canvas.toDataURL()]);
    }
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = (canvas.width / 2) / rect.width;
    const sy = (canvas.height / 2) / rect.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy };
  };

  const getEndPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const sx = (canvas.width / 2) / rect.width;
    const sy = (canvas.height / 2) / rect.height;
    const cx = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const cy = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy };
  };

  const startDraw = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    if (tool === "text") { setTextPos(pos); return; }
    if (tool === "arrow") { setArrowStart(pos); return; }
    setIsDrawing(true);
    lastPoint.current = pos;
  };

  const moveDraw = (e) => {
    e.preventDefault();
    if (!isDrawing || tool !== "pen") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPoint.current = pos;
  };

  const endDraw = (e) => {
    e.preventDefault();
    if (tool === "arrow" && arrowStart) {
      const end = getEndPos(e);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const headLen = 14;
      const angle = Math.atan2(end.y - arrowStart.y, end.x - arrowStart.x);
      ctx.beginPath(); ctx.moveTo(arrowStart.x, arrowStart.y); ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = color; ctx.lineWidth = lineWidth + 1; ctx.lineCap = "round"; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x - headLen * Math.cos(angle - Math.PI/6), end.y - headLen * Math.sin(angle - Math.PI/6));
      ctx.lineTo(end.x - headLen * Math.cos(angle + Math.PI/6), end.y - headLen * Math.sin(angle + Math.PI/6));
      ctx.closePath(); ctx.fillStyle = color; ctx.fill();
      setArrowStart(null);
      saveState();
      return;
    }
    if (isDrawing) { setIsDrawing(false); saveState(); }
  };

  const addText = () => {
    if (!textInput.trim() || !textPos) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.font = `bold 16px 'DM Sans', sans-serif`;
    const m = ctx.measureText(textInput);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(textPos.x - 5, textPos.y - 21, m.width + 10, 26);
    ctx.fillStyle = color;
    ctx.fillText(textInput, textPos.x, textPos.y);
    setTextInput(""); setTextPos(null); saveState();
  };

  const saveState = () => { const c = canvasRef.current; if (c) setHistory(p => [...p, c.toDataURL()]); };

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current; const ctx = canvas.getContext("2d");
    const nh = history.slice(0, -1);
    const img = new Image();
    img.onload = () => { ctx.clearRect(0, 0, canvas.width/2, canvas.height/2); ctx.drawImage(img, 0, 0, canvas.width/2, canvas.height/2); setHistory(nh); };
    img.src = nh[nh.length - 1];
  };

  const toolBtn = (name, icon, label) => (
    <button onClick={() => setTool(name)} style={{
      display:"flex", flexDirection:"column", alignItems:"center", gap:"2px",
      padding:"8px 10px", borderRadius:"10px", border:"none", cursor:"pointer",
      background: tool === name ? `${t.acc}33` : "transparent",
      color: tool === name ? t.acc : t.txM, fontFamily:"inherit", fontSize:"10px",
    }}>{icon}<span>{label}</span></button>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:t.bg, zIndex:400, display:"flex", flexDirection:"column" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"48px 12px 8px", flexShrink:0 }}>
        <button style={{ ...S.btnS, padding:"8px 14px", fontSize:"13px" }} onClick={onCancel}>Abbrechen</button>
        <span style={{ fontSize:"15px", fontWeight:700, color:t.tx }}>Bearbeiten</span>
        <button style={{ ...S.btnP, width:"auto", padding:"8px 18px", fontSize:"13px" }} onClick={() => { const c = canvasRef.current; if (c) onSave(c.toDataURL("image/jpeg", 0.85)); }}>{I.check} Fertig</button>
      </div>
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"8px 12px", overflow:"hidden", position:"relative" }}>
        <div style={{ width:"100%", maxWidth:"460px", position:"relative" }}>
          <canvas ref={canvasRef} style={{ borderRadius:t.rs, touchAction:"none", display:"block" }}
            onMouseDown={startDraw} onMouseMove={moveDraw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={moveDraw} onTouchEnd={endDraw}/>
          {textPos && (
            <div style={{ position:"absolute", left:0, right:0, bottom:"-56px", display:"flex", gap:"6px" }}>
              <input style={{ ...S.input, flex:1, padding:"10px 12px", fontSize:"14px" }}
                placeholder="Text eingeben..." value={textInput} onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addText()} autoFocus/>
              <button style={{ ...S.btnP, width:"auto", padding:"10px 14px", fontSize:"13px" }} onClick={addText}>{I.check}</button>
              <button style={{ ...S.btnS, padding:"10px 12px" }} onClick={() => setTextPos(null)}>X</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ flexShrink:0, padding:"8px 12px 28px", background:t.sf, borderTop:`1px solid ${t.brd}` }}>
        <div style={{ display:"flex", justifyContent:"center", gap:"6px", marginBottom:"12px" }}>
          {toolBtn("pen", I.pen, "Stift")}
          {toolBtn("arrow", I.arrow, "Pfeil")}
          {toolBtn("text", I.type, "Text")}
          <button onClick={undo} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"2px", padding:"8px 10px", borderRadius:"10px", border:"none", cursor:"pointer", background:"transparent", color:history.length>1?t.tx:t.txM+"55", fontFamily:"inherit", fontSize:"10px" }}>{I.undo}<span>Zurück</span></button>
        </div>
        <div style={{ display:"flex", justifyContent:"center", gap:"8px", marginBottom:"10px" }}>
          {DRAW_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{ width:color===c?32:26, height:color===c?32:26, borderRadius:"50%", border:color===c?`3px solid ${t.acc}`:"2px solid #555", background:c, cursor:"pointer", transition:"all 0.15s", padding:0 }}/>
          ))}
        </div>
        {tool === "pen" && (
          <div style={{ display:"flex", alignItems:"center", gap:"10px", justifyContent:"center" }}>
            <span style={{ fontSize:"11px", color:t.txM }}>Dünn</span>
            <input type="range" min="1" max="12" value={lineWidth} onChange={e => setLineWidth(+e.target.value)} style={{ width:"140px", accentColor:t.acc }}/>
            <span style={{ fontSize:"11px", color:t.txM }}>Dick</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
export default function App() {
  const [projects, setProjects] = useState([]);
  const [screen, setScreen] = useState("list");
  const [projId, setProjId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [viewPhoto, setViewPhoto] = useState(null);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [toast, setToast] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Load from IndexedDB
  useEffect(() => { loadProjects().then(p => { setProjects(p); setLoaded(true); }); }, []);

  // Save on every change
  useEffect(() => { if (loaded) saveProjects(projects); }, [projects, loaded]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const proj = () => projects.find(p => p.id === projId);
  const updateProj = (id, fn) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...fn(p) } : p));

  const goDetail = (id) => { setProjId(id); setScreen("detail"); };
  const goRoom = (id) => { setRoomId(id); setScreen("room"); };
  const goBack = () => {
    if (screen === "room") { setRoomId(null); setScreen("detail"); }
    else if (screen === "report") setScreen("detail");
    else { setProjId(null); setScreen("list"); }
  };

  const saveEditedPhoto = (newData) => {
    if (!editingPhoto) return;
    updateProj(projId, p => ({
      rooms: p.rooms.map(rm => rm.id === roomId
        ? { ...rm, photos: rm.photos.map(ph => ph.id === editingPhoto.photoId ? { ...ph, data: newData } : ph) }
        : rm)
    }));
    setEditingPhoto(null);
    showToast("Bild gespeichert!");
  };

  // ─── LIST ───
  const ListScreen = () => (
    <div>
      <div style={{ padding:"52px 20px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:"24px", fontWeight:700 }}><span style={{ color:t.acc }}>Maler</span>Doku</div>
          <div style={{ fontSize:"12px", color:t.txM }}>{projects.length} Projekte</div>
        </div>
        <button style={{ ...S.btnP, width:"auto", padding:"12px 18px", fontSize:"14px" }} onClick={() => setScreen("create")}>{I.plus} Neu</button>
      </div>
      <div style={{ padding:"8px 20px 100px" }}>
        {projects.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", color:t.txM }}>
            <div style={{ fontSize:"48px", marginBottom:"16px", opacity:0.3 }}>🏠</div>
            <div style={{ fontSize:"16px", fontWeight:600, marginBottom:"6px" }}>Noch keine Projekte</div>
            <div style={{ fontSize:"14px" }}>Tippe auf "Neu" um loszulegen</div>
          </div>
        )}
        {[...projects].sort((a,b) => new Date(b.created)-new Date(a.created)).map(p => {
          const pc = p.rooms?.reduce((s,r) => s+(r.photos?.length||0),0)||0;
          return (
            <div key={p.id} style={S.card} onClick={() => goDetail(p.id)}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"16px", fontWeight:700 }}>{p.name}</div>
                  <div style={{ fontSize:"13px", color:t.txM, marginTop:"4px" }}>{p.address||"—"}</div>
                </div>
                <span style={S.badge(!!p.fazit)}>{p.fazit?"Fertig":"Offen"}</span>
              </div>
              <div style={S.divider}/>
              <div style={{ display:"flex", gap:"16px", fontSize:"13px", color:t.txM }}>
                <span style={{ display:"flex", alignItems:"center", gap:"4px" }}>{I.room} {p.rooms?.length||0}</span>
                <span>{pc} Fotos</span>
                <span style={{ marginLeft:"auto" }}>{fmtDate(p.created)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── CREATE ───
  const CreateScreen = () => {
    const [f, setF] = useState({ name:"", number:"", address:"", contact:"", phone:"" });
    const set = (k,v) => setF({...f,[k]:v});
    const save = () => {
      if (!f.name.trim()) { showToast("Bitte Projektname eingeben!"); return; }
      const np = { id:uid(), ...f, rooms:[], fazit:"", created:new Date().toISOString() };
      setProjects(prev => [...prev, np]);
      setProjId(np.id); setScreen("detail");
      showToast("Projekt erstellt!");
    };
    return (
      <div>
        <Header title="Neues Projekt" onBack={goBack}/>
        <div style={{ padding:"8px 20px 40px" }}>
          <Field label="Projektbezeichnung *" value={f.name} onChange={v=>set("name",v)} placeholder="z.B. Villa Müller Renovierung"/>
          <Field label="Projektnummer" value={f.number} onChange={v=>set("number",v)} placeholder="z.B. 2026-042"/>
          <Field label="Adresse" value={f.address} onChange={v=>set("address",v)} placeholder="Straße, PLZ Ort"/>
          <div style={S.divider}/>
          <Field label="Ansprechpartner" value={f.contact} onChange={v=>set("contact",v)} placeholder="Name"/>
          <Field label="Telefon / E-Mail" value={f.phone} onChange={v=>set("phone",v)} placeholder="Kontaktdaten" type="tel"/>
          <div style={{ marginTop:"12px" }}><button style={S.btnP} onClick={save}>{I.check} Projekt anlegen</button></div>
        </div>
      </div>
    );
  };

  // ─── DETAIL ───
  const DetailScreen = () => {
    const p = proj();
    if (!p) { setScreen("list"); return null; }
    const [newRoom, setNewRoom] = useState("");
    const [editFazit, setEditFazit] = useState(false);
    const [fazitTxt, setFazitTxt] = useState(p.fazit||"");
    const pc = p.rooms?.reduce((s,r)=>s+(r.photos?.length||0),0)||0;
    const addRoom = () => {
      if (!newRoom.trim()) return;
      updateProj(p.id, pr => ({ rooms:[...(pr.rooms||[]),{id:uid(),name:newRoom.trim(),photos:[]}] }));
      setNewRoom(""); showToast("Raum hinzugefügt!");
    };
    return (
      <div>
        <Header title={p.name} sub={p.number||"Ohne Nr."} onBack={goBack}/>
        <div style={{ padding:"8px 20px 40px" }}>
          <div style={{ ...S.card, cursor:"default" }}>
            <div style={{ fontSize:"13px", color:t.txM, lineHeight:1.8 }}>
              <div>📍 {p.address||"—"}</div><div>👤 {p.contact||"—"}</div>
              <div>📞 {p.phone||"—"}</div><div>📅 {fmtDate(p.created)}</div>
            </div>
          </div>
          <div style={S.section}>Räume ({p.rooms?.length||0})</div>
          <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
            <input style={{...S.input,flex:1}} placeholder="Neuer Raum (z.B. Flur EG)" value={newRoom}
              onChange={e=>setNewRoom(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addRoom()}/>
            <button style={{...S.btnS,padding:"12px 14px"}} onClick={addRoom}>{I.plus}</button>
          </div>
          {(p.rooms||[]).map(r => (
            <div key={r.id} style={S.card} onClick={() => goRoom(r.id)}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <div style={{ color:t.acc }}>{I.room}</div>
                  <div><div style={{ fontWeight:600 }}>{r.name}</div><div style={{ fontSize:"12px", color:t.txM }}>{r.photos?.length||0} Fotos</div></div>
                </div>
                <button style={S.btnI} onClick={e => { e.stopPropagation(); updateProj(p.id,pr=>({rooms:pr.rooms.filter(x=>x.id!==r.id)})); }}>{I.trash}</button>
              </div>
              {r.photos?.length > 0 && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"6px", marginTop:"12px" }}>
                  {r.photos.slice(0,4).map((ph,i) => (
                    <div key={i} style={{ aspectRatio:"1", borderRadius:t.rs, overflow:"hidden" }}>
                      {ph.data ? <img src={ph.data} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/> : <div style={{ width:"100%", height:"100%", background:"#444" }}/>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div style={S.section}>Fazit</div>
          {editFazit ? (
            <div style={{ ...S.card, cursor:"default" }}>
              <textarea style={S.textarea} placeholder="Gesamteindruck, Hinweise..." value={fazitTxt} onChange={e=>setFazitTxt(e.target.value)}/>
              <div style={{ display:"flex", gap:"8px", marginTop:"12px" }}>
                <button style={{...S.btnS,flex:1}} onClick={() => setEditFazit(false)}>Abbrechen</button>
                <button style={{...S.btnP,flex:1}} onClick={() => { updateProj(p.id,()=>({fazit:fazitTxt})); setEditFazit(false); showToast("Fazit gespeichert!"); }}>{I.check} Speichern</button>
              </div>
            </div>
          ) : (
            <div style={S.card} onClick={() => { setFazitTxt(p.fazit||""); setEditFazit(true); }}>
              {p.fazit ? <div style={{ fontSize:"14px", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{p.fazit}</div>
                : <div style={{ color:t.txM, fontSize:"14px", display:"flex", alignItems:"center", gap:"8px" }}>{I.edit} Fazit hinzufügen...</div>}
            </div>
          )}
          <div style={{...S.section,marginTop:"32px"}}>Aktionen</div>
          <button style={{...S.btnP,marginBottom:"12px"}} onClick={() => setScreen("report")}>{I.pdf} PDF-Bericht anzeigen</button>
          <button style={{...S.btnS,width:"100%",justifyContent:"center",color:t.err,borderColor:`${t.err}33`}}
            onClick={() => { setProjects(prev=>prev.filter(x=>x.id!==p.id)); setScreen("list"); setProjId(null); }}>{I.trash} Projekt löschen</button>
        </div>
      </div>
    );
  };

  // ─── ROOM ───
  const RoomScreen = () => {
    const p = proj();
    const currentRoom = projects.find(x=>x.id===projId)?.rooms?.find(x=>x.id===roomId);
    if (!p || !currentRoom) { setScreen("detail"); return null; }
    const [desc, setDesc] = useState("");
    const [tempPhoto, setTempPhoto] = useState(null);
    const cameraRef = useRef(null);
    const galleryRef = useRef(null);

    const handleFile = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const compressed = await compressImage(ev.target.result);
        setTempPhoto(compressed);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // reset for same file
    };

    const savePhoto = () => {
      if (!tempPhoto && !desc.trim()) return;
      updateProj(p.id, pr => ({
        rooms: pr.rooms.map(rm => rm.id===roomId
          ? { ...rm, photos:[...(rm.photos||[]),{ id:uid(), data:tempPhoto||null, desc, time:new Date().toISOString() }] }
          : rm)
      }));
      setTempPhoto(null); setDesc("");
      showToast("Foto gespeichert!");
    };

    const delPhoto = (pid) => updateProj(p.id, pr => ({ rooms:pr.rooms.map(rm=>rm.id===roomId?{...rm,photos:rm.photos.filter(x=>x.id!==pid)}:rm) }));
    const updDesc = (pid,d) => updateProj(p.id, pr => ({ rooms:pr.rooms.map(rm=>rm.id===roomId?{...rm,photos:rm.photos.map(x=>x.id===pid?{...x,desc:d}:x)}:rm) }));
    const photos = currentRoom?.photos || [];

    return (
      <div>
        <Header title={currentRoom.name} sub={p.name} onBack={goBack}/>
        <div style={{ padding:"8px 20px 120px" }}>
          {/* Hidden file inputs */}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleFile}/>
          <input ref={galleryRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleFile}/>

          {tempPhoto ? (
            <div style={{ ...S.card, cursor:"default" }}>
              <img src={tempPhoto} alt="" style={{ width:"100%", borderRadius:t.rs, marginBottom:"12px" }}/>
              <label style={S.label}>Beschreibung</label>
              <textarea style={{...S.textarea,minHeight:"80px"}} placeholder="Was ist zu sehen? Welche Arbeiten nötig?" value={desc} onChange={e=>setDesc(e.target.value)}/>
              <div style={{ display:"flex", gap:"8px", marginTop:"12px" }}>
                <button style={{...S.btnS,flex:1}} onClick={() => { setTempPhoto(null); setDesc(""); }}>Verwerfen</button>
                <button style={{...S.btnP,flex:1}} onClick={savePhoto}>{I.check} Speichern</button>
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", gap:"8px", marginBottom:"20px" }}>
              <button style={{
                flex:1, ...S.btnP, padding:"18px 12px",
                background:`linear-gradient(135deg,${t.acc}22,${t.accD}22)`,
                color:t.acc, border:`2px dashed ${t.acc}55`, flexDirection:"column", gap:"4px",
              }} onClick={() => cameraRef.current?.click()}>
                {I.camera}
                <span style={{ fontSize:"12px" }}>Kamera</span>
              </button>
              <button style={{
                flex:1, ...S.btnP, padding:"18px 12px",
                background:`linear-gradient(135deg,${t.sf2},${t.sf})`,
                color:t.txM, border:`1px solid ${t.brd}`, flexDirection:"column", gap:"4px",
              }} onClick={() => galleryRef.current?.click()}>
                {I.gallery}
                <span style={{ fontSize:"12px" }}>Galerie</span>
              </button>
            </div>
          )}

          <div style={S.section}>Fotos ({photos.length})</div>
          {photos.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px", color:t.txM, fontSize:"14px" }}>Noch keine Fotos in diesem Raum</div>
          ) : photos.map(ph => (
            <PhotoCard key={ph.id} photo={ph}
              onDelete={() => delPhoto(ph.id)} onView={() => setViewPhoto(ph)}
              onEdit={() => setEditingPhoto({ photoId:ph.id, data:ph.data })}
              onDescChange={v => updDesc(ph.id,v)} showToast={showToast}/>
          ))}
        </div>

        {viewPhoto && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", zIndex:300, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px" }} onClick={() => setViewPhoto(null)}>
            {viewPhoto.data ? <img src={viewPhoto.data} alt="" style={{ maxWidth:"100%", maxHeight:"70vh", borderRadius:t.r }}/> :
              <div style={{ width:"280px", height:"280px", borderRadius:t.r, background:"#444" }}/>}
            {viewPhoto.desc && <div style={{ color:t.tx, marginTop:"16px", fontSize:"14px", textAlign:"center" }}>{viewPhoto.desc}</div>}
          </div>
        )}

        {editingPhoto && <PhotoEditor photoData={editingPhoto.data} onSave={saveEditedPhoto} onCancel={() => setEditingPhoto(null)}/>}

        {!tempPhoto && !editingPhoto && (
          <button style={{ position:"fixed", bottom:"28px", right:"20px", width:"58px", height:"58px", borderRadius:"50%", background:`linear-gradient(135deg,${t.acc},${t.accD})`, color:"#000", border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:`0 8px 32px ${t.acc}44`, zIndex:200 }}
            onClick={() => cameraRef.current?.click()}>{I.camera}</button>
        )}
      </div>
    );
  };

  // ─── PhotoCard ───
  const PhotoCard = ({ photo, onDelete, onView, onEdit, onDescChange, showToast }) => {
    const [editing, setEditing] = useState(false);
    const [txt, setTxt] = useState(photo.desc);
    return (
      <div style={{ ...S.card, cursor:"default" }}>
        <div onClick={onView} style={{ cursor:"pointer" }}>
          {photo.data ? <img src={photo.data} alt="" style={{ width:"100%", borderRadius:t.rs, marginBottom:photo.desc?"10px":"0" }}/> :
            <div style={{ width:"100%", height:"180px", borderRadius:t.rs, background:"#444", marginBottom:photo.desc?"10px":"0" }}/>}
        </div>
        {editing ? (
          <div style={{ marginTop:"8px" }}>
            <textarea style={{...S.textarea,minHeight:"60px"}} value={txt} onChange={e=>setTxt(e.target.value)}/>
            <div style={{ display:"flex", gap:"8px", marginTop:"8px" }}>
              <button style={{...S.btnS,flex:1,fontSize:"13px",padding:"8px"}} onClick={() => setEditing(false)}>Abbrechen</button>
              <button style={{...S.btnP,flex:1,fontSize:"13px",padding:"8px"}} onClick={() => { onDescChange(txt); setEditing(false); showToast("Gespeichert!"); }}>{I.check} OK</button>
            </div>
          </div>
        ) : (
          photo.desc && <div style={{ fontSize:"14px", lineHeight:1.5, color:t.txM }}>{photo.desc}</div>
        )}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"8px" }}>
          <span style={{ fontSize:"11px", color:t.txM }}>{fmtDate(photo.time)}</span>
          <div style={{ display:"flex", gap:"2px" }}>
            {photo.data && <button style={{...S.btnI,color:t.acc}} onClick={onEdit} title="Bild bearbeiten">{I.pen}</button>}
            <button style={S.btnI} onClick={() => { setTxt(photo.desc||""); setEditing(true); }}>{I.edit}</button>
            <button style={{...S.btnI,color:t.err}} onClick={onDelete}>{I.trash}</button>
          </div>
        </div>
      </div>
    );
  };

  // ─── REPORT ───
  const ReportScreen = () => {
    const p = proj();
    if (!p) { setScreen("list"); return null; }
    const totalPhotos = p.rooms?.reduce((s,r)=>s+(r.photos?.length||0),0)||0;
    const rs = {
      page:{background:"#fff",color:"#222",minHeight:"100vh",lineHeight:1.6},
      bar:{position:"sticky",top:0,zIndex:100,display:"flex",gap:"8px",padding:"12px 16px",background:"#fff",borderBottom:"1px solid #eee"},
      barBtn:{padding:"10px 16px",borderRadius:"8px",fontSize:"13px",fontWeight:700,cursor:"pointer",border:"none",fontFamily:"inherit"},
      header:{background:"#E8A838",padding:"24px 20px"},
      infoBox:{background:"#f7f7f7",borderRadius:"8px",padding:"16px 20px",margin:"16px"},
      roomHdr:{background:"#E8A838",color:"#000",fontWeight:700,fontSize:"14px",padding:"8px 14px",margin:"20px 16px 10px",borderRadius:"6px"},
      photoRow:{display:"flex",gap:"12px",margin:"0 16px 10px",paddingBottom:"10px",borderBottom:"1px solid #eee",alignItems:"flex-start",pageBreakInside:"avoid"},
    };
    return (
      <div style={rs.page}>
        <div style={rs.bar} className="no-print">
          <button style={{...rs.barBtn,background:"#eee",color:"#333"}} onClick={goBack}>{I.back}</button>
          <div style={{flex:1}}/>
          <button style={{...rs.barBtn,background:"#E8A838",color:"#000"}} onClick={() => window.print()}>{I.pdf} Drucken / PDF</button>
        </div>
        <div style={rs.header}>
          <div style={{fontSize:"22px",fontWeight:700,color:"#000"}}>Baustellenbericht</div>
          <div style={{fontSize:"12px",color:"#333",marginTop:"4px"}}>MalerDoku – {fmtDate(new Date().toISOString())}</div>
        </div>
        <div style={rs.infoBox}>
          <div style={{fontSize:"18px",fontWeight:700,marginBottom:"8px"}}>{p.name}</div>
          {p.number && <div style={{fontSize:"13px",color:"#555"}}>Projekt-Nr: {p.number}</div>}
          {p.address && <div style={{fontSize:"13px",color:"#555"}}>Adresse: {p.address}</div>}
          {p.contact && <div style={{fontSize:"13px",color:"#555"}}>Ansprechpartner: {p.contact}</div>}
          {p.phone && <div style={{fontSize:"13px",color:"#555"}}>Kontakt: {p.phone}</div>}
          <div style={{fontSize:"13px",color:"#555"}}>Erstellt: {fmtDate(p.created)}</div>
        </div>
        <div style={{margin:"0 16px 16px",fontSize:"13px",color:"#666",borderBottom:"1px solid #ddd",paddingBottom:"12px"}}>
          {p.rooms?.length||0} Räume &bull; {totalPhotos} Fotos &bull; {p.fazit?"Abgeschlossen":"Offen"}
        </div>
        {(p.rooms||[]).map(room => (
          <div key={room.id}>
            <div style={rs.roomHdr}>{room.name}<span style={{float:"right",fontSize:"12px",fontWeight:400}}>{room.photos?.length||0} Fotos</span></div>
            {!room.photos?.length ? <div style={{margin:"0 16px 16px",fontSize:"13px",color:"#999",fontStyle:"italic"}}>Keine Fotos</div>
              : room.photos.map(ph => (
                <div key={ph.id} style={rs.photoRow}>
                  {ph.data ? <img src={ph.data} alt="" style={{width:"160px",height:"120px",objectFit:"cover",borderRadius:"6px",flexShrink:0}}/> :
                    <div style={{width:"60px",height:"45px",borderRadius:"6px",background:"#ddd",flexShrink:0}}/>}
                  <div style={{flex:1}}>
                    {ph.desc && <div style={{fontSize:"13px",color:"#444",whiteSpace:"pre-wrap",marginBottom:"4px"}}>{ph.desc}</div>}
                    <div style={{fontSize:"11px",color:"#aaa"}}>{fmtDate(ph.time)}</div>
                  </div>
                </div>
              ))}
          </div>
        ))}
        {p.fazit && (<><div style={rs.roomHdr}>Fazit</div><div style={{margin:"8px 16px 24px",fontSize:"13px",color:"#333",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{p.fazit}</div></>)}
        <div style={{marginTop:"40px",padding:"16px 20px",borderTop:"1px solid #ddd",fontSize:"10px",color:"#bbb",display:"flex",justifyContent:"space-between"}}>
          <span>MalerDoku – {p.name}</span><span>{fmtDate(new Date().toISOString())}</span>
        </div>
      </div>
    );
  };

  if (!loaded) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:t.bg }}>
      <div style={{ fontSize:"24px", fontWeight:700 }}><span style={{color:t.acc}}>Maler</span>Doku</div>
    </div>
  );

  return (
    <div style={{ maxWidth:"480px", margin:"0 auto", position:"relative", minHeight:"100vh" }}>
      {screen === "list" && <ListScreen/>}
      {screen === "create" && <CreateScreen/>}
      {screen === "detail" && <DetailScreen/>}
      {screen === "room" && <RoomScreen/>}
      {screen === "report" && <ReportScreen/>}
      {toast && (
        <div style={{ position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)", background:t.sf, color:t.tx, padding:"12px 24px", borderRadius:"30px", fontSize:"14px", fontWeight:600, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", border:`1px solid ${t.brd}`, zIndex:500, whiteSpace:"nowrap" }}>{toast}</div>
      )}
    </div>
  );
}
