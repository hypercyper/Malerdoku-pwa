import { useState, useEffect, useRef } from 'react';
import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

const uid = () => Math.random().toString(36).slice(2, 10);
const fmtDate = (s) => s ? new Date(s).toLocaleDateString('de-DE') : '—';
const todayISO = () => new Date().toISOString().split('T')[0];

// ─── Theme (gleich wie Haupt-App) ───
const t = {
  bg: "#0F1118", sf: "#1A1D27", sf2: "#242836",
  acc: "#E8A838", accD: "#C48A20",
  tx: "#F0F2F8", txM: "#8892A4",
  err: "#FF453A", ok: "#34C759",
  brd: "#2A2E3A", r: "14px", rs: "10px"
};
const S = {
  card: { background: t.sf, borderRadius: t.r, padding: "16px", marginBottom: "12px", border: `1px solid ${t.brd}` },
  input: { width: "100%", background: t.sf2, border: `1px solid ${t.brd}`, borderRadius: t.rs, padding: "13px 16px", color: t.tx, fontSize: "15px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  btnP: { width: "100%", background: `linear-gradient(135deg, ${t.acc}, ${t.accD})`, color: "#000", border: "none", borderRadius: t.rs, padding: "15px", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontFamily: "inherit" },
  btnS: { background: "transparent", border: `1px solid ${t.brd}`, borderRadius: t.rs, padding: "12px 16px", color: t.tx, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontFamily: "inherit" },
  label: { fontSize: "12px", color: t.txM, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: "block" },
  section: { fontSize: "13px", fontWeight: 700, color: t.txM, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", marginTop: "24px" },
};

const FEUCHTE_COLOR = { nass: '#FF453A', feucht: '#FF9500', trocken: '#34C759' };
const FEUCHTEGRADE = ['nass', 'feucht', 'trocken'];
const FLAECHEN = [{ id: 'wand', label: 'Wand' }, { id: 'decke', label: 'Decke' }, { id: 'boden', label: 'Boden' }];
const TROCKNUNGSARTEN = [
  { id: 'kondensierung', label: 'Kondenstrocknung' },
  { id: 'infrarot', label: 'Infrarottrocknung' },
  { id: 'estrich', label: 'Estrich-Dämmschicht-Trocknung' },
  { id: 'filter', label: 'Filtereinsatz' },
];

// Homogenisierte Zufallswerte für einen Raum (2 Messpunkte)
function genMesswerte(feuchtegrad) {
  const ranges = { nass: [65, 100], feucht: [40, 65], trocken: [25, 40] };
  const [min, max] = ranges[feuchtegrad] || [25, 40];
  const base = Math.floor(Math.random() * (max - min) + min);
  return [
    Math.max(min, Math.min(max, base + Math.floor(Math.random() * 7) - 3)),
    Math.max(min, Math.min(max, base + Math.floor(Math.random() * 7) - 3)),
  ];
}
function genBezugswert() { return Math.floor(Math.random() * 10) + 25; }

// ─── Haupt-Export ───
export default function TrocknungApp({ user, onBack }) {
  const [screen, setScreen] = useState('list');
  const [protokolle, setProtokolle] = useState([]);
  const [aktProtId, setAktProtId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'trocknungsprotokolle'), snap => {
      setProtokolle(snap.docs.map(d => d.data()));
    });
    return unsub;
  }, [user]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const aktProt = () => protokolle.find(p => p.id === aktProtId);
  const saveProt = (p) => setDoc(doc(db, 'trocknungsprotokolle', p.id), p);

  // ─── LIST ───────────────────────────────────────────────────────
  const ListScreen = () => (
    <div style={{ minHeight: '100vh', background: t.bg, color: t.tx }}>
      <div style={{ padding: "52px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "24px", fontWeight: 700 }}><span style={{ color: t.acc }}>Trocknungs</span>protokolle</div>
          <div style={{ fontSize: "12px", color: t.txM }}>{protokolle.length} Protokolle</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={{ ...S.btnS, padding: "10px 14px", fontSize: "13px" }} onClick={onBack}>← Zurück</button>
          <button style={{ ...S.btnP, width: "auto", padding: "12px 18px", fontSize: "14px" }} onClick={() => setScreen('create')}>+ Neu</button>
        </div>
      </div>
      <div style={{ padding: "8px 20px 100px" }}>
        {protokolle.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: t.txM }}>
            <div style={{ fontSize: "48px", marginBottom: "16px", opacity: 0.3 }}>💧</div>
            <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>Keine Protokolle</div>
            <div style={{ fontSize: "14px" }}>Erstelle dein erstes Trocknungsprotokoll</div>
          </div>
        )}
        {[...protokolle].sort((a, b) => b.created.localeCompare(a.created)).map(p => {
          const last = p.messungen?.[p.messungen.length - 1];
          const allTrocken = p.rooms?.length > 0 && p.rooms.every(r =>
            last?.raumMessungen?.find(rm => rm.raumId === r.id)?.feuchtegrad === 'trocken'
          );
          return (
            <div key={p.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => { setAktProtId(p.id); setScreen('detail'); }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "16px" }}>{p.title}</div>
                  {p.address && <div style={{ fontSize: "13px", color: t.txM, marginTop: "4px" }}>{p.address}</div>}
                  <div style={{ fontSize: "12px", color: t.txM, marginTop: "4px" }}>
                    {p.rooms?.length || 0} Räume · {p.messungen?.length || 0} Messungen · {fmtDate(p.created)}
                  </div>
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", background: allTrocken ? '#34C75922' : '#FF950022', color: allTrocken ? '#34C759' : '#FF9500', flexShrink: 0, marginLeft: "8px" }}>
                  {allTrocken ? '✓ Trocken' : '● Aktiv'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {toast && <Toast msg={toast} />}
    </div>
  );

  // ─── CREATE ─────────────────────────────────────────────────────
  const CreateScreen = () => {
    const [form, setForm] = useState({ title: '', address: '', auftraggeber: '' });
    const [rooms, setRooms] = useState([]);
    const [newRoom, setNewRoom] = useState('');

    const addRoom = () => {
      if (!newRoom.trim()) return;
      setRooms(prev => [...prev, {
        id: uid(), name: newRoom.trim(),
        flaechen: ['wand', 'boden'],
        trocknungsart: ['kondensierung'],
        bezugswert: genBezugswert()
      }]);
      setNewRoom('');
    };

    const toggleFl = (roomId, fl) => setRooms(prev => prev.map(r =>
      r.id === roomId ? { ...r, flaechen: r.flaechen.includes(fl) ? r.flaechen.filter(x => x !== fl) : [...r.flaechen, fl] } : r
    ));
    const toggleTa = (roomId, ta) => setRooms(prev => prev.map(r =>
      r.id === roomId ? { ...r, trocknungsart: r.trocknungsart.includes(ta) ? r.trocknungsart.filter(x => x !== ta) : [...r.trocknungsart, ta] } : r
    ));
    const updateRoom = (roomId, key, val) => setRooms(prev => prev.map(r => r.id === roomId ? { ...r, [key]: val } : r));

    const save = () => {
      if (!form.title.trim() || rooms.length === 0) { showToast('Bitte Titel und mind. 1 Raum angeben'); return; }
      const prot = {
        id: uid(), title: form.title, address: form.address, auftraggeber: form.auftraggeber,
        created: new Date().toISOString(), rooms, messungen: [], stromverbrauch: null
      };
      saveProt(prot);
      setAktProtId(prot.id);
      setScreen('messung');
      showToast('Protokoll erstellt – erste Messung eingeben');
    };

    return (
      <div style={{ background: t.bg, minHeight: '100vh', color: t.tx }}>
        <div style={{ padding: "52px 20px 12px", display: "flex", alignItems: "center", gap: "12px" }}>
          <button style={{ ...S.btnS, padding: "10px 14px" }} onClick={() => setScreen('list')}>←</button>
          <div style={{ fontSize: "20px", fontWeight: 700 }}>Neues Protokoll</div>
        </div>
        <div style={{ padding: "0 20px 120px" }}>
          <div style={S.section}>Projektinfo</div>
          <label style={S.label}>Schadensort / Objekt *</label>
          <input style={{ ...S.input, marginBottom: "12px" }} placeholder="z.B. EFH Müller – Keller" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <label style={S.label}>Adresse</label>
          <input style={{ ...S.input, marginBottom: "12px" }} placeholder="Straße, PLZ Ort" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <label style={S.label}>Auftraggeber</label>
          <input style={{ ...S.input, marginBottom: "4px" }} placeholder="Versicherung / Name" value={form.auftraggeber} onChange={e => setForm(f => ({ ...f, auftraggeber: e.target.value }))} />

          <div style={S.section}>Räume</div>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <input style={{ ...S.input, flex: 1 }} placeholder="Raum hinzufügen (z.B. Keller, Wohnzimmer)..." value={newRoom}
              onChange={e => setNewRoom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRoom()} />
            <button style={{ ...S.btnP, width: "auto", padding: "13px 20px" }} onClick={addRoom}>+</button>
          </div>

          {rooms.map(r => (
            <div key={r.id} style={{ ...S.card, marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <input style={{ ...S.input, fontWeight: 700, fontSize: "15px", padding: "8px 12px" }}
                  value={r.name} onChange={e => updateRoom(r.id, 'name', e.target.value)} />
                <button style={{ ...S.btnS, marginLeft: "8px", padding: "8px 12px", color: t.err, borderColor: `${t.err}44`, flexShrink: 0 }}
                  onClick={() => setRooms(prev => prev.filter(x => x.id !== r.id))}>✕</button>
              </div>

              <label style={S.label}>Getrocknete Flächen</label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
                {FLAECHEN.map(fl => (
                  <button key={fl.id} onClick={() => toggleFl(r.id, fl.id)} style={{
                    ...S.btnS, padding: "10px 16px", fontSize: "14px",
                    background: r.flaechen.includes(fl.id) ? `${t.acc}22` : 'transparent',
                    borderColor: r.flaechen.includes(fl.id) ? t.acc : t.brd,
                    color: r.flaechen.includes(fl.id) ? t.acc : t.txM, fontWeight: r.flaechen.includes(fl.id) ? 700 : 400
                  }}>
                    {r.flaechen.includes(fl.id) ? '✓ ' : ''}{fl.label}
                  </button>
                ))}
              </div>

              <label style={S.label}>Trocknungsart</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {TROCKNUNGSARTEN.map(ta => (
                  <button key={ta.id} onClick={() => toggleTa(r.id, ta.id)} style={{
                    ...S.btnS, padding: "11px 14px", fontSize: "14px", justifyContent: "flex-start",
                    background: r.trocknungsart.includes(ta.id) ? `${t.acc}22` : 'transparent',
                    borderColor: r.trocknungsart.includes(ta.id) ? t.acc : t.brd,
                    color: r.trocknungsart.includes(ta.id) ? t.tx : t.txM,
                  }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: "18px", height: "18px", borderRadius: "4px", marginRight: "10px", flexShrink: 0,
                      border: `2px solid ${r.trocknungsart.includes(ta.id) ? t.acc : t.brd}`,
                      background: r.trocknungsart.includes(ta.id) ? t.acc : "transparent",
                      color: "#000", fontSize: "12px", fontWeight: 700
                    }}>
                      {r.trocknungsart.includes(ta.id) ? '✓' : ''}
                    </span>
                    {ta.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {rooms.length > 0 && (
            <button style={S.btnP} onClick={save}>Weiter → Erste Messung erfassen</button>
          )}
        </div>
        {toast && <Toast msg={toast} />}
      </div>
    );
  };

  // ─── MESSUNG ERFASSEN ────────────────────────────────────────────
  const MessungScreen = () => {
    const p = aktProt();
    if (!p) { setScreen('list'); return null; }

    const [datum, setDatum] = useState(todayISO());
    const [raumFG, setRaumFG] = useState({});

    const allSet = p.rooms?.length > 0 && p.rooms.every(r => raumFG[r.id]);

    const save = () => {
      if (!datum || !allSet) { showToast('Datum und alle Räume ausfüllen'); return; }
      const messung = {
        id: uid(),
        datum: new Date(datum + 'T12:00:00').toISOString(),
        raumMessungen: p.rooms.map(r => ({
          raumId: r.id,
          feuchtegrad: raumFG[r.id],
          messwerte: genMesswerte(raumFG[r.id])
        }))
      };
      const updated = { ...p, messungen: [...(p.messungen || []), messung] };
      saveProt(updated);
      showToast('Messung gespeichert!');
      setScreen('detail');
    };

    return (
      <div style={{ background: t.bg, minHeight: '100vh', color: t.tx }}>
        <div style={{ padding: "52px 20px 12px", display: "flex", alignItems: "center", gap: "12px" }}>
          <button style={{ ...S.btnS, padding: "10px 14px" }} onClick={() => setScreen('detail')}>←</button>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>Neue Messung</div>
            <div style={{ fontSize: "12px", color: t.txM }}>{p.title}</div>
          </div>
        </div>
        <div style={{ padding: "0 20px 100px" }}>
          <div style={S.section}>Datum</div>
          <input type="date" style={{ ...S.input, marginBottom: "8px" }} value={datum} onChange={e => setDatum(e.target.value)} />
          <div style={{ fontSize: "12px", color: t.txM, marginBottom: "24px" }}>
            Messwerte werden automatisch homogenisiert generiert
          </div>

          <div style={S.section}>Feuchtegrad pro Raum</div>
          {p.rooms?.map(r => (
            <div key={r.id} style={{ ...S.card, marginBottom: "12px" }}>
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>{r.name}</div>
              <div style={{ fontSize: "12px", color: t.txM, marginBottom: "12px" }}>
                {r.flaechen?.map(f => FLAECHEN.find(x => x.id === f)?.label).join(', ')}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {FEUCHTEGRADE.map(fg => (
                  <button key={fg} onClick={() => setRaumFG(prev => ({ ...prev, [r.id]: fg }))} style={{
                    flex: 1, padding: "14px 8px", borderRadius: t.rs,
                    border: `2px solid ${raumFG[r.id] === fg ? FEUCHTE_COLOR[fg] : t.brd}`,
                    background: raumFG[r.id] === fg ? `${FEUCHTE_COLOR[fg]}22` : t.sf2,
                    color: raumFG[r.id] === fg ? FEUCHTE_COLOR[fg] : t.txM,
                    fontWeight: raumFG[r.id] === fg ? 700 : 400, fontSize: "14px",
                    cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize"
                  }}>
                    {fg}
                  </button>
                ))}
              </div>
              {raumFG[r.id] && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: t.txM }}>
                  Generierte Werte: {genMesswerte(raumFG[r.id]).join(' / ')} % (Vorschau)
                </div>
              )}
            </div>
          ))}

          {allSet && (
            <button style={{ ...S.btnP, marginTop: "8px" }} onClick={save}>
              ✓ Messung speichern
            </button>
          )}
        </div>
        {toast && <Toast msg={toast} />}
      </div>
    );
  };

  // ─── DETAIL ─────────────────────────────────────────────────────
  const DetailScreen = () => {
    const p = aktProt();
    if (!p) { setScreen('list'); return null; }

    const [exporting, setExporting] = useState(false);
    const [strom, setStrom] = useState(p.stromverbrauch?.toString() || '');
    const [editStrom, setEditStrom] = useState(!p.stromverbrauch);
    const [editMessung, setEditMessung] = useState(null); // { messungId, raumId, field, value }
    const pdfRef = useRef(null);

    const last = p.messungen?.[p.messungen.length - 1];
    const allTrocken = p.rooms?.length > 0 && p.rooms.every(r =>
      last?.raumMessungen?.find(rm => rm.raumId === r.id)?.feuchtegrad === 'trocken'
    );

    const saveStrom = () => {
      const updated = { ...p, stromverbrauch: parseFloat(strom) || null };
      saveProt(updated);
      setEditStrom(false);
      showToast('Stromverbrauch gespeichert!');
    };

    const updateMesswert = (messungId, raumId, idx, val) => {
      const updated = {
        ...p, messungen: p.messungen.map(m => m.id === messungId ? {
          ...m, raumMessungen: m.raumMessungen.map(rm => rm.raumId === raumId ? {
            ...rm, messwerte: rm.messwerte.map((w, i) => i === idx ? parseInt(val) || w : w)
          } : rm)
        } : m)
      };
      saveProt(updated);
    };

    const updateFeuchtegrad = (messungId, raumId, fg) => {
      const updated = {
        ...p, messungen: p.messungen.map(m => m.id === messungId ? {
          ...m, raumMessungen: m.raumMessungen.map(rm => rm.raumId === raumId ? { ...rm, feuchtegrad: fg } : rm)
        } : m)
      };
      saveProt(updated);
    };

    const deleteMessung = (messungId) => {
      const updated = { ...p, messungen: p.messungen.filter(m => m.id !== messungId) };
      saveProt(updated);
      showToast('Messung gelöscht');
    };

    const exportPDF = async () => {
      if (!pdfRef.current || exporting) return;
      setExporting(true);
      try {
        const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
          import("html2canvas"), import("jspdf")
        ]);
        const el = pdfRef.current;
        const prev = el.style.cssText;
        el.style.cssText = 'position:fixed;top:0;left:-9999px;width:1050px;max-width:1050px;z-index:-1;';
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: "#fff" });
        el.style.cssText = prev;

        const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
        const pw = pdf.internal.pageSize.getWidth() - 20;
        const ph = pdf.internal.pageSize.getHeight() - 20;
        const scale = canvas.width / (pw * 2);
        let y = 0;
        while (y < canvas.height) {
          const sliceH = Math.min(ph * scale * 2, canvas.height - y);
          const tmp = document.createElement('canvas');
          tmp.width = canvas.width; tmp.height = sliceH;
          tmp.getContext('2d').drawImage(canvas, 0, -y);
          pdf.addImage(tmp.toDataURL('image/jpeg', 0.92), 'JPEG', 10, 10, pw, sliceH / scale / 2);
          y += sliceH;
          if (y < canvas.height) pdf.addPage();
        }
        pdf.save(`Trocknungsprotokoll_${p.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
      } catch (e) { showToast('PDF-Fehler: ' + e.message); }
      finally { setExporting(false); }
    };

    return (
      <div style={{ background: t.bg, minHeight: '100vh', color: t.tx }}>
        {/* Header */}
        <div style={{ padding: "52px 20px 12px", display: "flex", alignItems: "center", gap: "12px" }}>
          <button style={{ ...S.btnS, padding: "10px 14px" }} onClick={() => setScreen('list')}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "20px", fontWeight: 700 }}>{p.title}</div>
            <div style={{ fontSize: "12px", color: t.txM }}>{p.address} {p.auftraggeber ? `· ${p.auftraggeber}` : ''}</div>
          </div>
        </div>

        <div style={{ padding: "0 20px 120px" }}>
          {/* Räume-Übersicht */}
          <div style={S.section}>Räume ({p.rooms?.length || 0})</div>
          {p.rooms?.map(r => (
            <div key={r.id} style={{ ...S.card }}>
              <div style={{ fontWeight: 700 }}>{r.name}</div>
              <div style={{ fontSize: "12px", color: t.txM, marginTop: "4px" }}>
                {r.flaechen?.map(f => FLAECHEN.find(x => x.id === f)?.label).join(', ')}
              </div>
              <div style={{ fontSize: "12px", color: t.txM, marginTop: "2px" }}>
                {r.trocknungsart?.map(ta => TROCKNUNGSARTEN.find(x => x.id === ta)?.label).join(', ')}
              </div>
            </div>
          ))}

          {/* Messungen */}
          <div style={S.section}>Messungen ({p.messungen?.length || 0})</div>
          {(p.messungen || []).length === 0 && (
            <div style={{ color: t.txM, fontSize: "14px", textAlign: "center", padding: "20px 0" }}>
              Noch keine Messungen – erste Messung hinzufügen
            </div>
          )}
          {(p.messungen || []).map((m, mi) => (
            <div key={m.id} style={{ ...S.card, marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ fontWeight: 700, fontSize: "15px" }}>📅 {fmtDate(m.datum)}</div>
                <button style={{ ...S.btnS, padding: "6px 10px", fontSize: "12px", color: t.err, borderColor: `${t.err}33` }}
                  onClick={() => deleteMessung(m.id)}>✕</button>
              </div>
              {p.rooms?.map(r => {
                const rm = m.raumMessungen?.find(x => x.raumId === r.id);
                if (!rm) return null;
                return (
                  <div key={r.id} style={{ borderBottom: `1px solid ${t.brd}`, paddingBottom: "12px", marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: 600 }}>{r.name}</span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {FEUCHTEGRADE.map(fg => (
                          <button key={fg} onClick={() => updateFeuchtegrad(m.id, r.id, fg)} style={{
                            padding: "4px 10px", borderRadius: "20px", border: `1.5px solid ${rm.feuchtegrad === fg ? FEUCHTE_COLOR[fg] : t.brd}`,
                            background: rm.feuchtegrad === fg ? `${FEUCHTE_COLOR[fg]}22` : 'transparent',
                            color: rm.feuchtegrad === fg ? FEUCHTE_COLOR[fg] : t.txM,
                            fontSize: "12px", fontWeight: rm.feuchtegrad === fg ? 700 : 400,
                            cursor: "pointer", fontFamily: "inherit"
                          }}>{fg}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {rm.messwerte?.map((wert, idx) => (
                        <div key={idx} style={{ flex: 1 }}>
                          <div style={{ fontSize: "11px", color: t.txM, marginBottom: "4px" }}>Messpunkt {idx + 1}</div>
                          <input type="number" style={{ ...S.input, padding: "8px 12px", fontSize: "14px", fontWeight: 700 }}
                            value={wert}
                            onChange={e => updateMesswert(m.id, r.id, idx, e.target.value)} />
                        </div>
                      ))}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "11px", color: t.txM, marginBottom: "4px" }}>Bezugswert tr.</div>
                        <div style={{ ...S.input, padding: "8px 12px", fontSize: "14px", color: t.txM, cursor: "default" }}>{r.bezugswert}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Neue Messung Button */}
          {!allTrocken && (
            <button style={{ ...S.btnP, background: `linear-gradient(135deg,${t.sf2},${t.sf})`, color: t.acc, border: `2px dashed ${t.acc}55` }}
              onClick={() => setScreen('messung')}>
              + Neue Messung hinzufügen
            </button>
          )}
          {allTrocken && (
            <div style={{ textAlign: "center", padding: "16px", fontSize: "14px", color: t.ok, fontWeight: 700 }}>
              ✓ Alle Räume trocken – Trocknung abgeschlossen
            </div>
          )}

          {/* Stromverbrauch */}
          {p.messungen?.length > 0 && (
            <>
              <div style={S.section}>Stromverbrauch</div>
              <div style={S.card}>
                {editStrom ? (
                  <div>
                    <label style={S.label}>Verbrauchter Strom (kWh)</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input type="number" step="0.1" style={{ ...S.input, flex: 1 }} placeholder="z.B. 125.5"
                        value={strom} onChange={e => setStrom(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveStrom()} />
                      <button style={{ ...S.btnP, width: "auto", padding: "13px 20px" }} onClick={saveStrom}>OK</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "22px", fontWeight: 700, color: t.acc }}>{p.stromverbrauch} <span style={{ fontSize: "14px", color: t.txM }}>kWh</span></div>
                      <div style={{ fontSize: "12px", color: t.txM }}>Verbrauchter Strom</div>
                    </div>
                    <button style={{ ...S.btnS, fontSize: "13px" }} onClick={() => setEditStrom(true)}>Bearbeiten</button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* PDF Export */}
          {p.messungen?.length > 0 && (
            <>
              <div style={{ height: '1px', background: t.brd, margin: "24px 0" }} />
              <button style={{ ...S.btnP, opacity: exporting ? 0.7 : 1 }} onClick={exportPDF} disabled={exporting}>
                {exporting ? '⏳ PDF wird erstellt…' : '📄 PDF erstellen'}
              </button>
            </>
          )}

          {/* Protokoll löschen */}
          <button style={{ ...S.btnS, width: "100%", justifyContent: "center", color: t.err, borderColor: `${t.err}33`, marginTop: "16px" }}
            onClick={() => { deleteDoc(doc(db, 'trocknungsprotokolle', p.id)); setScreen('list'); showToast('Protokoll gelöscht'); }}>
            🗑 Protokoll löschen
          </button>
        </div>

        {/* Versteckter PDF-Inhalt */}
        <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1 }}>
          <div ref={pdfRef} style={{ background: '#fff', color: '#222', fontFamily: 'Arial, sans-serif', padding: '20px', width: '1050px' }}>
            <div style={{ marginBottom: '16px', borderBottom: '2px solid #E8A838', paddingBottom: '12px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700 }}>Meßprotokoll Trocknung – Kammerer GmbH & Co. KG</div>
              <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                Anlage 4 / Messprotokoll (Zutreffendes bitte ankreuzen)
              </div>
              <div style={{ fontSize: '12px', color: '#555', marginTop: '4px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                {p.title && <span><strong>Objekt:</strong> {p.title}</span>}
                {p.address && <span><strong>Adresse:</strong> {p.address}</span>}
                {p.auftraggeber && <span><strong>Auftraggeber:</strong> {p.auftraggeber}</span>}
                <span><strong>Erstellt:</strong> {fmtDate(p.created)}</span>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
              <thead>
                <tr style={{ background: '#E8A838' }}>
                  {['Datum', 'Raum', 'Wand', 'Decke', 'Boden', 'Trocknungsart', 'Meßpkt.', 'Feuchtegrad', 'Meßwert 1', 'Meßwert 2', 'Bezugswert trocken'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: h === 'Meßpkt.' || h.startsWith('Meß') || h.startsWith('Bez') || h === 'Wand' || h === 'Decke' || h === 'Boden' ? 'center' : 'left', border: '1px solid #ccc', fontWeight: 700, color: '#000', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(p.messungen || []).flatMap((m, mi) =>
                  (p.rooms || []).map((r, ri) => {
                    const rm = m.raumMessungen?.find(x => x.raumId === r.id);
                    const bg = (mi + ri) % 2 === 0 ? '#fff' : '#f9f9f9';
                    const fgColor = rm?.feuchtegrad === 'trocken' ? '#34C759' : rm?.feuchtegrad === 'feucht' ? '#FF9500' : '#FF453A';
                    return (
                      <tr key={`${m.id}-${r.id}`} style={{ background: bg }}>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', fontWeight: ri === 0 ? 700 : 400, color: ri === 0 ? '#000' : '#888', whiteSpace: 'nowrap' }}>{ri === 0 ? fmtDate(m.datum) : ''}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>{r.name}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'center' }}>{r.flaechen?.includes('wand') ? '✓' : ''}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'center' }}>{r.flaechen?.includes('decke') ? '✓' : ''}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'center' }}>{r.flaechen?.includes('boden') ? '✓' : ''}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', fontSize: '9px' }}>{r.trocknungsart?.map(ta => TROCKNUNGSARTEN.find(x => x.id === ta)?.label).join(', ')}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'center' }}>1 / 2</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 700, color: fgColor }}>{rm?.feuchtegrad || '—'}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 700 }}>{rm?.messwerte?.[0] ?? '—'}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 700 }}>{rm?.messwerte?.[1] ?? '—'}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', textAlign: 'center' }}>{r.bezugswert}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {p.stromverbrauch && (
              <div style={{ marginTop: '16px', fontWeight: 700, fontSize: '12px' }}>
                Verbrauchter Strom: {p.stromverbrauch} kWh
              </div>
            )}
            <div style={{ marginTop: '32px', display: 'flex', gap: '60px' }}>
              <div style={{ borderTop: '1px solid #999', paddingTop: '8px', width: '220px', fontSize: '11px', color: '#777' }}>Unterschrift Auftraggeber / Datum</div>
              <div style={{ borderTop: '1px solid #999', paddingTop: '8px', width: '220px', fontSize: '11px', color: '#777' }}>Unterschrift Auftragnehmer / Datum</div>
            </div>
          </div>
        </div>

        {toast && <Toast msg={toast} />}
      </div>
    );
  };

  // ─── TOAST ──────────────────────────────────────────────────────
  const Toast = ({ msg }) => (
    <div style={{ position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)", background: t.sf, color: t.tx, padding: "12px 24px", borderRadius: "30px", fontSize: "14px", fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", border: `1px solid ${t.brd}`, zIndex: 500, whiteSpace: "nowrap" }}>{msg}</div>
  );

  // ─── RENDER ─────────────────────────────────────────────────────
  if (screen === 'list') return <ListScreen />;
  if (screen === 'create') return <CreateScreen />;
  if (screen === 'messung') return <MessungScreen />;
  if (screen === 'detail') return <DetailScreen />;
  return null;
}
