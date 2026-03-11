import { useState, useEffect, useRef } from 'react';
import { compressImage } from './storage';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

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
  ruler: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M2 12h20M12 2v20M4.5 4.5l15 15" strokeLinecap="round"/><rect x="2" y="2" width="20" height="20" rx="2" strokeLinecap="round"/></svg>,
  upload: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round"/><polyline points="17 8 12 3 7 8" strokeLinecap="round"/><line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round"/></svg>,
  ai: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" strokeLinecap="round"/></svg>,
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
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [photoStore, setPhotoStore] = useState({});

  // Auth state
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  // Firestore real-time listener (nur wenn eingeloggt)
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'projects'), (snap) => {
      const data = snap.docs.map(d => d.data());
      // Migration: Alte Fotos mit data im Projektdokument in photos-Collection verschieben
      snap.docs.forEach(d => {
        const proj = d.data();
        let needsStrip = false;
        proj.rooms?.forEach(room => {
          room.photos?.forEach(ph => {
            if (ph.data) {
              needsStrip = true;
              setDoc(doc(db, 'photos', ph.id), { id: ph.id, projectId: proj.id, roomId: room.id, data: ph.data, desc: ph.desc || '', time: ph.time || '' });
            }
          });
        });
        if (needsStrip) {
          const stripped = { ...proj, rooms: proj.rooms?.map(r => ({ ...r, photos: r.photos?.map(({ id, desc, time }) => ({ id, desc, time })) || [] })) || [] };
          setDoc(doc(db, 'projects', proj.id), stripped);
        }
      });
      setProjects(data);
      setLoaded(true);
    });
    return unsub;
  }, [user]);

  // Foto-Daten separat laden (Firestore 1MB-Limit umgehen)
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'photos'), (snap) => {
      const store = {};
      snap.docs.forEach(d => { store[d.id] = d.data(); });
      setPhotoStore(store);
    });
    return unsub;
  }, [user]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const proj = () => projects.find(p => p.id === projId);
  const updateProj = (id, fn) => setProjects(prev => {
    const updated = prev.map(p => {
      if (p.id !== id) return p;
      const next = { ...p, ...fn(p) };
      // Foto-Daten (base64) NICHT in Projektdokument speichern (1MB-Limit)
      const forFirestore = {
        ...next,
        rooms: next.rooms?.map(r => ({
          ...r,
          photos: r.photos?.map(({ id, desc, time }) => ({ id, desc, time })) || []
        })) || []
      };
      setDoc(doc(db, 'projects', id), forFirestore);
      return next;
    });
    return updated;
  });

  const goDetail = (id) => { setProjId(id); setScreen("detail"); };
  const goRoom = (id) => { setRoomId(id); setScreen("room"); };
  const goBack = () => {
    if (screen === "room") { setRoomId(null); setScreen("detail"); }
    else if (screen === "report") setScreen("detail");
    else if (screen === "aufmass") setScreen("detail");
    else { setProjId(null); setScreen("list"); }
  };

  const saveEditedPhoto = (newData) => {
    if (!editingPhoto) return;
    updateProj(projId, p => ({
      rooms: p.rooms.map(rm => rm.id === roomId
        ? { ...rm, photos: rm.photos.map(ph => ph.id === editingPhoto.photoId ? { ...ph, data: newData } : ph) }
        : rm)
    }));
    const existing = photoStore[editingPhoto.photoId];
    if (existing) setDoc(doc(db, 'photos', editingPhoto.photoId), { ...existing, data: newData });
    setEditingPhoto(null);
    showToast("Bild gespeichert!");
  };

  // ─── LIST ───
  const ListScreen = () => (
    <div>
      <div style={{ padding:"52px 20px 12px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:"24px", fontWeight:700 }}><span style={{ color:t.acc }}>Maler</span>Doku</div>
          <div style={{ fontSize:"12px", color:t.txM }}>{projects.length} Projekte · {user?.email}</div>
        </div>
        <div style={{ display:"flex", gap:"8px" }}>
          <button style={{ ...S.btnS, padding:"10px 14px", fontSize:"13px" }} onClick={() => signOut(auth)}>Abmelden</button>
          <button style={{ ...S.btnP, width:"auto", padding:"12px 18px", fontSize:"14px" }} onClick={() => setScreen("create")}>{I.plus} Neu</button>
        </div>
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
      setDoc(doc(db, 'projects', np.id), np);
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
    const [editInfo, setEditInfo] = useState(false);
    const [infoForm, setInfoForm] = useState({ name:p.name||"", number:p.number||"", address:p.address||"", contact:p.contact||"", phone:p.phone||"" });
    const [editRoomId, setEditRoomId] = useState(null);
    const [editRoomName, setEditRoomName] = useState("");
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
          {editInfo ? (
            <div style={{ ...S.card, cursor:"default" }}>
              <Field label="Projektbezeichnung *" value={infoForm.name} onChange={v=>setInfoForm(f=>({...f,name:v}))} placeholder="z.B. Villa Müller Renovierung"/>
              <Field label="Projektnummer" value={infoForm.number} onChange={v=>setInfoForm(f=>({...f,number:v}))} placeholder="z.B. 2026-042"/>
              <Field label="Adresse" value={infoForm.address} onChange={v=>setInfoForm(f=>({...f,address:v}))} placeholder="Straße, PLZ Ort"/>
              <Field label="Ansprechpartner" value={infoForm.contact} onChange={v=>setInfoForm(f=>({...f,contact:v}))} placeholder="Name"/>
              <Field label="Telefon / E-Mail" value={infoForm.phone} onChange={v=>setInfoForm(f=>({...f,phone:v}))} placeholder="Kontaktdaten" type="tel"/>
              <div style={{ display:"flex", gap:"8px", marginTop:"12px" }}>
                <button style={{...S.btnS,flex:1}} onClick={() => setEditInfo(false)}>Abbrechen</button>
                <button style={{...S.btnP,flex:1}} onClick={() => {
                  if (!infoForm.name.trim()) { showToast("Bitte Projektname eingeben!"); return; }
                  updateProj(p.id, () => ({ ...infoForm }));
                  setEditInfo(false); showToast("Projektdaten gespeichert!");
                }}>{I.check} Speichern</button>
              </div>
            </div>
          ) : (
            <div style={{ ...S.card, cursor:"default" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ fontSize:"13px", color:t.txM, lineHeight:1.8 }}>
                  <div>📍 {p.address||"—"}</div><div>👤 {p.contact||"—"}</div>
                  <div>📞 {p.phone||"—"}</div><div>📅 {fmtDate(p.created)}</div>
                </div>
                <button style={S.btnI} onClick={() => { setInfoForm({ name:p.name||"", number:p.number||"", address:p.address||"", contact:p.contact||"", phone:p.phone||"" }); setEditInfo(true); }}>{I.edit}</button>
              </div>
            </div>
          )}
          <div style={S.section}>Räume ({p.rooms?.length||0})</div>
          <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
            <input style={{...S.input,flex:1}} placeholder="Neuer Raum (z.B. Flur EG)" value={newRoom}
              onChange={e=>setNewRoom(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addRoom()}/>
            <button style={{...S.btnS,padding:"12px 14px"}} onClick={addRoom}>{I.plus}</button>
          </div>
          {(p.rooms||[]).map(r => (
            <div key={r.id} style={S.card} onClick={() => editRoomId===r.id ? null : goRoom(r.id)}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"10px", flex:1 }}>
                  <div style={{ color:t.acc }}>{I.room}</div>
                  {editRoomId===r.id ? (
                    <input style={{...S.input,flex:1,marginBottom:0}} value={editRoomName}
                      onChange={e=>setEditRoomName(e.target.value)}
                      onKeyDown={e=>{ if(e.key==="Enter"&&editRoomName.trim()){ updateProj(p.id,pr=>({rooms:pr.rooms.map(x=>x.id===r.id?{...x,name:editRoomName.trim()}:x)})); setEditRoomId(null); showToast("Raum umbenannt!"); } if(e.key==="Escape") setEditRoomId(null); }}
                      onClick={e=>e.stopPropagation()} autoFocus/>
                  ) : (
                    <div><div style={{ fontWeight:600 }}>{r.name}</div><div style={{ fontSize:"12px", color:t.txM }}>{r.photos?.length||0} Fotos</div></div>
                  )}
                </div>
                {editRoomId===r.id ? (
                  <div style={{ display:"flex", gap:"6px" }} onClick={e=>e.stopPropagation()}>
                    <button style={S.btnI} onClick={() => setEditRoomId(null)}>✕</button>
                    <button style={S.btnI} onClick={() => { if(editRoomName.trim()){ updateProj(p.id,pr=>({rooms:pr.rooms.map(x=>x.id===r.id?{...x,name:editRoomName.trim()}:x)})); setEditRoomId(null); showToast("Raum umbenannt!"); } }}>{I.check}</button>
                  </div>
                ) : (
                  <div style={{ display:"flex", gap:"6px" }}>
                    <button style={S.btnI} onClick={e => { e.stopPropagation(); setEditRoomName(r.name); setEditRoomId(r.id); }}>{I.edit}</button>
                    <button style={S.btnI} onClick={e => { e.stopPropagation(); updateProj(p.id,pr=>({rooms:pr.rooms.filter(x=>x.id!==r.id)})); }}>{I.trash}</button>
                  </div>
                )}
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
          <button style={{...S.btnS,width:"100%",justifyContent:"center",marginBottom:"12px"}} onClick={() => setScreen("aufmass")}>{I.ruler} Aufmaß erfassen</button>
          <button style={{...S.btnP,marginBottom:"12px"}} onClick={() => setScreen("report")}>{I.pdf} PDF-Bericht anzeigen</button>
          <button style={{...S.btnS,width:"100%",justifyContent:"center",color:t.err,borderColor:`${t.err}33`}}
            onClick={() => { deleteDoc(doc(db, 'projects', p.id)); setScreen("list"); setProjId(null); }}>{I.trash} Projekt löschen</button>
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
    const [dragOver, setDragOver] = useState(false);
    const cameraRef = useRef(null);
    const galleryRef = useRef(null);

    const processFile = async (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const compressed = await compressImage(ev.target.result);
        setTempPhoto(compressed);
      };
      reader.readAsDataURL(file);
    };

    const handleFile = async (e) => {
      const file = e.target.files?.[0];
      await processFile(file);
      e.target.value = '';
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      await processFile(file);
    };

    const savePhoto = () => {
      if (!tempPhoto && !desc.trim()) return;
      const newPhoto = { id: uid(), data: tempPhoto || null, desc, time: new Date().toISOString() };
      updateProj(p.id, pr => ({
        rooms: pr.rooms.map(rm => rm.id===roomId
          ? { ...rm, photos:[...(rm.photos||[]), newPhoto] }
          : rm)
      }));
      if (newPhoto.data) {
        setDoc(doc(db, 'photos', newPhoto.id), { id: newPhoto.id, projectId: p.id, roomId, data: newPhoto.data, desc: newPhoto.desc, time: newPhoto.time });
      }
      setTempPhoto(null); setDesc("");
      showToast("Foto gespeichert!");
    };

    const delPhoto = (pid) => {
      updateProj(p.id, pr => ({ rooms:pr.rooms.map(rm=>rm.id===roomId?{...rm,photos:rm.photos.filter(x=>x.id!==pid)}:rm) }));
      deleteDoc(doc(db, 'photos', pid));
    };
    const updDesc = (pid,d) => {
      updateProj(p.id, pr => ({ rooms:pr.rooms.map(rm=>rm.id===roomId?{...rm,photos:rm.photos.map(x=>x.id===pid?{...x,desc:d}:x)}:rm) }));
      const existing = photoStore[pid];
      if (existing) setDoc(doc(db, 'photos', pid), { ...existing, desc: d });
    };
    // Foto-Daten aus photoStore einbinden (base64 nicht im Projektdokument)
    const photos = (currentRoom?.photos || []).map(ph => ({ ...ph, data: photoStore[ph.id]?.data ?? ph.data }));

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
            <>
              <div style={{ display:"flex", gap:"8px", marginBottom:"10px" }}>
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
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => galleryRef.current?.click()}
                style={{
                  marginBottom:"20px", borderRadius:t.rs, padding:"24px 16px",
                  border:`2px dashed ${dragOver ? t.acc : t.brd}`,
                  background: dragOver ? `${t.acc}11` : t.sf2,
                  display:"flex", flexDirection:"column", alignItems:"center", gap:"8px",
                  cursor:"pointer", transition:"border-color 0.15s, background 0.15s",
                  color: dragOver ? t.acc : t.txM,
                }}
              >
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize:"13px", fontWeight:600 }}>
                  {dragOver ? "Loslassen zum Hochladen" : "Bild hierher ziehen"}
                </span>
                <span style={{ fontSize:"11px", opacity:0.6 }}>oder klicken zum Auswählen</span>
              </div>
            </>
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

  // ─── AUFMASS ───
  const AufmassScreen = () => {
    const p = proj();
    if (!p) { setScreen("list"); return null; }

    const [apiKey, setApiKey] = useState(() => localStorage.getItem("aufmass_api_key") || "");
    const [showKey, setShowKey] = useState(!localStorage.getItem("aufmass_api_key"));
    const [grundriss, setGrundriss] = useState(p.grundriss || null);
    const grundrissRef = useRef(null);

    const saveApiKey = (v) => {
      setApiKey(v);
      localStorage.setItem("aufmass_api_key", v);
    };

    const handleGrundrissUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const compressed = await compressImage(ev.target.result);
        setGrundriss(compressed);
        updateProj(p.id, () => ({ grundriss: compressed }));
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };

    const totalWand = (p.rooms || []).reduce((s, r) => {
      const m = r.meas;
      if (!m) return s;
      return s + (2 * (m.length + m.width)) * m.height;
    }, 0);
    const totalBoden = (p.rooms || []).reduce((s, r) => {
      const m = r.meas;
      if (!m) return s;
      return s + m.length * m.width;
    }, 0);

    return (
      <div>
        <Header title="Aufmaß" sub={p.name} onBack={goBack}/>
        <div style={{ padding:"8px 20px 60px" }}>

          {/* API Key */}
          <div style={{ ...S.card, cursor:"default" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" }} onClick={() => setShowKey(v => !v)}>
              <span style={{ fontSize:"13px", fontWeight:600, color:t.txM }}>Claude API-Key (für KI-Auslesen)</span>
              <span style={{ fontSize:"12px", color:t.acc }}>{showKey ? "▲ Einklappen" : "▼ Anzeigen"}</span>
            </div>
            {showKey && (
              <div style={{ marginTop:"12px" }}>
                <input
                  style={{ ...S.input, fontFamily:"monospace", fontSize:"13px" }}
                  type="password"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={e => saveApiKey(e.target.value)}
                />
                <div style={{ fontSize:"11px", color:t.txM, marginTop:"6px" }}>
                  Key wird nur lokal im Browser gespeichert.
                </div>
              </div>
            )}
          </div>

          {/* Grundriss Upload */}
          <div style={S.section}>Grundriss / Skizze</div>
          <input ref={grundrissRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleGrundrissUpload}/>
          {grundriss ? (
            <div style={{ ...S.card, cursor:"default" }}>
              <img src={grundriss} alt="Grundriss" style={{ width:"100%", borderRadius:t.rs, marginBottom:"10px" }}/>
              <button style={{ ...S.btnS, width:"100%", justifyContent:"center", fontSize:"13px" }} onClick={() => grundrissRef.current?.click()}>
                {I.upload} Andere Skizze hochladen
              </button>
            </div>
          ) : (
            <div style={{ ...S.card, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"10px", padding:"24px 16px", border:`2px dashed ${t.brd}` }} onClick={() => grundrissRef.current?.click()}>
              {I.upload}
              <span style={{ fontSize:"14px", color:t.txM }}>Grundriss oder Skizze hochladen</span>
              <span style={{ fontSize:"11px", color:t.txM, opacity:0.7 }}>Wird für KI-Maßerkennung verwendet</span>
            </div>
          )}

          {/* Room Measure Cards */}
          <div style={S.section}>Räume ({p.rooms?.length || 0})</div>
          {(p.rooms || []).length === 0 && (
            <div style={{ textAlign:"center", padding:"30px 20px", color:t.txM, fontSize:"14px" }}>
              Noch keine Räume im Projekt — zuerst Räume in der Detailansicht anlegen.
            </div>
          )}
          {(p.rooms || []).map(room => (
            <RoomMeasCard
              key={room.id}
              room={room}
              projId={p.id}
              grundriss={grundriss}
              apiKey={apiKey}
              updateProj={updateProj}
              showToast={showToast}
            />
          ))}

          {/* Total Summary */}
          {(p.rooms || []).some(r => r.meas) && (
            <>
              <div style={S.section}>Gesamtflächen</div>
              <div style={{ ...S.card, cursor:"default" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                  <SumBox label="Wandfläche gesamt" value={totalWand} unit="m²"/>
                  <SumBox label="Bodenfläche gesamt" value={totalBoden} unit="m²"/>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const SumBox = ({ label, value, unit }) => (
    <div style={{ background:t.sf2, borderRadius:t.rs, padding:"12px", textAlign:"center" }}>
      <div style={{ fontSize:"22px", fontWeight:700, color:t.acc }}>{value.toFixed(1)}<span style={{ fontSize:"13px", color:t.txM }}> {unit}</span></div>
      <div style={{ fontSize:"11px", color:t.txM, marginTop:"4px" }}>{label}</div>
    </div>
  );

  const RoomMeasCard = ({ room, projId: pid, grundriss, apiKey, updateProj: updProj, showToast: toast2 }) => {
    const meas = room.meas || { length: 0, width: 0, height: 0 };
    // Use string state so typing doesn't trigger project save → no App re-render → no cursor jump
    const [strs, setStrs] = useState({
      length: meas.length > 0 ? String(meas.length) : "",
      width:  meas.width  > 0 ? String(meas.width)  : "",
      height: meas.height > 0 ? String(meas.height) : "",
    });
    const [loading, setLoading] = useState(false);

    const nums = {
      length: parseFloat(strs.length) || 0,
      width:  parseFloat(strs.width)  || 0,
      height: parseFloat(strs.height) || 0,
    };

    // Only save to project on blur — prevents re-render while typing
    const saveNums = (next) => {
      updProj(pid, pr => ({
        rooms: pr.rooms.map(r => r.id === room.id ? { ...r, meas: next } : r)
      }));
    };

    const wand = (2 * (nums.length + nums.width)) * nums.height;
    const boden = nums.length * nums.width;
    const umfang = 2 * (nums.length + nums.width);
    const hasValues = nums.length > 0 || nums.width > 0 || nums.height > 0;

    const runAI = async () => {
      if (!grundriss || !apiKey) {
        toast2(!grundriss ? "Bitte zuerst Grundriss hochladen!" : "Bitte API-Key eingeben!");
        return;
      }
      setLoading(true);
      try {
        // Strip data URL prefix to get raw base64
        const base64 = grundriss.replace(/^data:image\/[a-z]+;base64,/, "");
        const mediaType = grundriss.startsWith("data:image/png") ? "image/png" : "image/jpeg";
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 300,
            messages: [{
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
                { type: "text", text: `Lies die Maße für den Raum "${room.name}" aus diesem Grundriss. Antworte NUR mit JSON: {"length_m": number, "width_m": number, "height_m": number}. Unbekannte Werte = 0. Kein weiterer Text.` }
              ]
            }]
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        const text = data.content?.[0]?.text || "";
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Kein JSON in Antwort");
        const parsed = JSON.parse(match[0]);
        const next = {
          length: parsed.length_m || 0,
          width: parsed.width_m || 0,
          height: parsed.height_m || 0,
        };
        setStrs({
          length: next.length > 0 ? String(next.length) : "",
          width:  next.width  > 0 ? String(next.width)  : "",
          height: next.height > 0 ? String(next.height) : "",
        });
        saveNums(next);
        toast2("Maße ausgelesen!");
      } catch (e) {
        toast2("KI-Fehler: " + e.message);
      }
      setLoading(false);
    };

    return (
      <div style={{ ...S.card, cursor:"default" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <div style={{ color:t.acc }}>{I.room}</div>
            <span style={{ fontWeight:700 }}>{room.name}</span>
          </div>
          <button
            style={{ ...S.btnS, padding:"8px 12px", fontSize:"12px", opacity: loading ? 0.6 : 1 }}
            onClick={runAI}
            disabled={loading}
          >
            {loading ? "…" : <>{I.ai} KI auslesen</>}
          </button>
        </div>

        {/* Input fields */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginBottom:"12px" }}>
          {[
            { key:"length", label:"Länge (m)" },
            { key:"width",  label:"Breite (m)" },
            { key:"height", label:"Höhe (m)" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={{ ...S.label, fontSize:"10px" }}>{label}</label>
              <input
                style={{ ...S.input, padding:"10px 10px", fontSize:"15px", textAlign:"center" }}
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={strs[key]}
                placeholder="0"
                onChange={e => setStrs(prev => ({ ...prev, [key]: e.target.value }))}
                onBlur={() => saveNums({ ...nums, [key]: parseFloat(strs[key]) || 0 })}
              />
            </div>
          ))}
        </div>

        {/* Calculated values */}
        {hasValues && (
          <div style={{ background:t.sf2, borderRadius:t.rs, padding:"10px 12px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
              <CalcRow label="Wandfläche" value={wand} unit="m²"/>
              <CalcRow label="Bodenfläche" value={boden} unit="m²"/>
              <CalcRow label="Deckenfläche" value={boden} unit="m²"/>
              <CalcRow label="Umfang" value={umfang} unit="m"/>
            </div>
          </div>
        )}
      </div>
    );
  };

  const CalcRow = ({ label, value, unit }) => (
    <div>
      <div style={{ fontSize:"10px", color:t.txM, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</div>
      <div style={{ fontSize:"16px", fontWeight:700, color:t.tx }}>{value.toFixed(2)} <span style={{ fontSize:"11px", color:t.txM }}>{unit}</span></div>
    </div>
  );

  // ─── LOGIN ───
  const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const login = async () => {
      if (!email || !pw) return;
      setLoading(true); setErr("");
      try {
        await signInWithEmailAndPassword(auth, email, pw);
      } catch (e) {
        setErr("E-Mail oder Passwort falsch.");
      }
      setLoading(false);
    };
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"100vh", padding:"32px 24px", background:t.bg }}>
        <div style={{ marginBottom:"32px", textAlign:"center" }}>
          <div style={{ fontSize:"32px", fontWeight:700 }}><span style={{ color:t.acc }}>Maler</span>Doku</div>
          <div style={{ fontSize:"14px", color:t.txM, marginTop:"6px" }}>Bitte anmelden</div>
        </div>
        <div style={{ width:"100%", maxWidth:"360px" }}>
          <Field label="E-Mail" value={email} onChange={setEmail} placeholder="name@firma.de" type="email"/>
          <Field label="Passwort" value={pw} onChange={setPw} placeholder="••••••••" type="password"/>
          {err && <div style={{ color:t.err, fontSize:"13px", marginBottom:"12px", textAlign:"center" }}>{err}</div>}
          <button style={{ ...S.btnP, opacity: loading ? 0.6 : 1 }} onClick={login} disabled={loading}>
            {loading ? "Anmelden…" : "Anmelden"}
          </button>
        </div>
      </div>
    );
  };

  // ─── REPORT ───
  const ReportScreen = () => {
    const p = proj();
    if (!p) { setScreen("list"); return null; }
    const totalPhotos = p.rooms?.reduce((s,r)=>s+(r.photos?.length||0),0)||0;
    const contentRef = useRef(null);
    const [exporting, setExporting] = useState(false);
    const rs = {
      page:{background:"#fff",color:"#222",minHeight:"100vh",lineHeight:1.6},
      bar:{position:"sticky",top:0,zIndex:100,display:"flex",gap:"8px",padding:"12px 16px",background:"#fff",borderBottom:"1px solid #eee"},
      barBtn:{padding:"10px 16px",borderRadius:"8px",fontSize:"13px",fontWeight:700,cursor:"pointer",border:"none",fontFamily:"inherit"},
      header:{background:"#E8A838",padding:"24px 20px"},
      infoBox:{background:"#f7f7f7",borderRadius:"8px",padding:"16px 20px",margin:"16px"},
      roomHdr:{background:"#E8A838",color:"#000",fontWeight:700,fontSize:"14px",padding:"8px 14px",margin:"20px 16px 10px",borderRadius:"6px"},
      photoRow:{display:"flex",gap:"12px",margin:"0 16px 10px",paddingBottom:"10px",borderBottom:"1px solid #eee",alignItems:"flex-start",pageBreakInside:"avoid"},
    };

    const downloadPDF = async () => {
      if (!contentRef.current || exporting) return;
      setExporting(true);
      try {
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
          import("html2canvas"),
          import("jspdf"),
        ]);

        const element = contentRef.current;

        // Render at A4 width (794px ≈ 210mm @ 96dpi) to avoid mobile-stretch distortion
        const prevStyle = element.style.cssText;
        element.style.cssText += ';position:fixed;top:0;left:-9999px;width:794px;max-width:794px;';
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        const containerRect = element.getBoundingClientRect();

        // Measure all image positions (in DOM pixels, relative to container top)
        const imgEls = element.querySelectorAll("img");
        const imgRanges = Array.from(imgEls).map(el => {
          const r = el.getBoundingClientRect();
          return { top: r.top - containerRect.top, bottom: r.bottom - containerRect.top };
        });

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        element.style.cssText = prevStyle;

        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const printW = pageW - margin * 2;
        const printH = pageH - margin * 2;

        // Scale: canvas pixels per DOM pixel
        const domToCanvas = canvas.width / containerRect.width;
        // Page height expressed in canvas pixels
        const pageHpx = printH * (canvas.width / printW);

        // Convert image ranges to canvas pixels
        const noBreak = imgRanges.map(r => ({
          top: r.top * domToCanvas,
          bottom: r.bottom * domToCanvas,
        }));

        // Build page slices, shifting breaks to avoid cutting images
        const slices = [];
        let y = 0;
        while (y < canvas.height) {
          let end = y + pageHpx;
          if (end >= canvas.height) { slices.push([y, canvas.height]); break; }
          for (const nb of noBreak) {
            if (end > nb.top && end < nb.bottom) { end = nb.top; break; }
          }
          if (end <= y) end = y + pageHpx; // image taller than one page — no choice
          slices.push([y, end]);
          y = end;
        }

        // Render each slice onto its own PDF page
        slices.forEach(([start, end], i) => {
          if (i > 0) pdf.addPage();
          const sliceH = end - start;
          const tmp = document.createElement("canvas");
          tmp.width = canvas.width;
          tmp.height = sliceH;
          tmp.getContext("2d").drawImage(canvas, 0, -start);
          const printSliceH = sliceH * (printW / canvas.width);
          pdf.addImage(tmp.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, printW, printSliceH);
        });

        pdf.save(`Kammerer_${p.name.replace(/\s+/g,"_")}_${new Date().toISOString().slice(0,10)}.pdf`);
      } catch (err) {
        showToast("PDF-Export fehlgeschlagen");
        console.error(err);
      }
      setExporting(false);
    };

    return (
      <div style={rs.page}>
        <div style={rs.bar} className="no-print">
          <button style={{...rs.barBtn,background:"#eee",color:"#333"}} onClick={goBack}>{I.back}</button>
          <div style={{flex:1}}/>
          <button style={{...rs.barBtn,background:"#f0f0f0",color:"#333",marginRight:"4px"}} onClick={() => window.print()}>{I.pdf} Drucken</button>
          <button style={{...rs.barBtn,background:"#E8A838",color:"#000",opacity:exporting?0.6:1}} onClick={downloadPDF} disabled={exporting}>
            {exporting ? "…" : <>{I.pdf} PDF speichern</>}
          </button>
        </div>
        <div ref={contentRef}>
          <div style={rs.header}>
            <div style={{fontSize:"22px",fontWeight:700,color:"#000"}}>Baustellenbericht</div>
            <div style={{fontSize:"12px",color:"#333",marginTop:"4px"}}>Kammerer GmbH & Co. KG – {fmtDate(new Date().toISOString())}</div>
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
                : room.photos.map(ph => {
                  const photoData = photoStore[ph.id]?.data ?? ph.data;
                  return (
                  <div key={ph.id} style={rs.photoRow}>
                    {photoData ? <img src={photoData} alt="" style={{width:"200px",height:"auto",borderRadius:"6px",flexShrink:0}}/> :
                      <div style={{width:"60px",height:"45px",borderRadius:"6px",background:"#ddd",flexShrink:0}}/>}
                    <div style={{flex:1}}>
                      {ph.desc && <div style={{fontSize:"13px",color:"#444",whiteSpace:"pre-wrap",marginBottom:"4px"}}>{ph.desc}</div>}
                      <div style={{fontSize:"11px",color:"#aaa"}}>{fmtDate(ph.time)}</div>
                    </div>
                  </div>
                );})}
            </div>
          ))}
          {(p.rooms||[]).some(r => r.meas && (r.meas.length||r.meas.width||r.meas.height)) && (() => {
            const roomsWithMeas = (p.rooms||[]).filter(r => r.meas && (r.meas.length||r.meas.width||r.meas.height));
            const totWand    = roomsWithMeas.reduce((s,r) => s + (2*(r.meas.length+r.meas.width))*r.meas.height, 0);
            const totBoden   = roomsWithMeas.reduce((s,r) => s + r.meas.length*r.meas.width, 0);
            const totUmfang  = roomsWithMeas.reduce((s,r) => s + 2*(r.meas.length+r.meas.width), 0);
            return (
              <>
                <div style={rs.roomHdr}>Aufmaß</div>
                <div style={{margin:"0 16px 16px"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px"}}>
                    <thead>
                      <tr style={{background:"#f5f5f5"}}>
                        {["Raum","L (m)","B (m)","H (m)","Wand m²","Boden m²","Decke m²","Umfang m"].map(h => (
                          <th key={h} style={{padding:"6px 8px",textAlign:"left",borderBottom:"1px solid #ddd",fontWeight:700,fontSize:"11px",color:"#555"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roomsWithMeas.map(r => {
                        const {length:l, width:w, height:h} = r.meas;
                        return (
                          <tr key={r.id} style={{borderBottom:"1px solid #eee"}}>
                            <td style={{padding:"6px 8px",fontWeight:600}}>{r.name}</td>
                            <td style={{padding:"6px 8px"}}>{l.toFixed(2)}</td>
                            <td style={{padding:"6px 8px"}}>{w.toFixed(2)}</td>
                            <td style={{padding:"6px 8px"}}>{h.toFixed(2)}</td>
                            <td style={{padding:"6px 8px"}}>{((2*(l+w))*h).toFixed(2)}</td>
                            <td style={{padding:"6px 8px"}}>{(l*w).toFixed(2)}</td>
                            <td style={{padding:"6px 8px"}}>{(l*w).toFixed(2)}</td>
                            <td style={{padding:"6px 8px"}}>{(2*(l+w)).toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{background:"#FFF8E8",fontWeight:700}}>
                        <td style={{padding:"7px 8px",fontSize:"12px"}}>Gesamt</td>
                        <td colSpan={3}/>
                        <td style={{padding:"7px 8px"}}>{totWand.toFixed(2)}</td>
                        <td style={{padding:"7px 8px"}}>{totBoden.toFixed(2)}</td>
                        <td style={{padding:"7px 8px"}}>{totBoden.toFixed(2)}</td>
                        <td style={{padding:"7px 8px"}}>{totUmfang.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            );
          })()}
          {p.fazit && (<><div style={rs.roomHdr}>Fazit</div><div style={{margin:"8px 16px 24px",fontSize:"13px",color:"#333",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{p.fazit}</div></>)}
          <div style={{marginTop:"40px",padding:"16px 20px",borderTop:"1px solid #ddd",fontSize:"10px",color:"#bbb",display:"flex",justifyContent:"space-between"}}>
            <span>Kammerer GmbH & Co. KG – {p.name}</span><span>{fmtDate(new Date().toISOString())}</span>
          </div>
        </div>
      </div>
    );
  };

  if (authLoading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:t.bg }}>
      <div style={{ fontSize:"24px", fontWeight:700 }}><span style={{color:t.acc}}>Maler</span>Doku</div>
    </div>
  );

  if (!user) return (
    <div style={{ maxWidth:"480px", margin:"0 auto" }}>
      <LoginScreen/>
    </div>
  );

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
      {screen === "aufmass" && <AufmassScreen/>}
      {screen === "report" && <ReportScreen/>}
      {toast && (
        <div style={{ position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)", background:t.sf, color:t.tx, padding:"12px 24px", borderRadius:"30px", fontSize:"14px", fontWeight:600, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", border:`1px solid ${t.brd}`, zIndex:500, whiteSpace:"nowrap" }}>{toast}</div>
      )}
    </div>
  );
}
