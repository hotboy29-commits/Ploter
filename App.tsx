import { useState, useEffect, useContext, createContext } from "react";

// ─── ORDERS STORE (in-memory pro demo, po Netlify deployi nahradit Supabase fetch) ─
const OrdersCtx = createContext(null);
function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const addOrder = (r) => {
    setOrders(p => [{ ...r, id: Math.random().toString(36).slice(2), created_at: new Date().toISOString(), status: "nova" }, ...p]);
    return { ok: true };
  };
  const updStatus = (id, status) => setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));
  return <OrdersCtx.Provider value={{ orders, addOrder, updStatus }}>{children}</OrdersCtx.Provider>;
}
const useOrders = () => useContext(OrdersCtx);

// ─── DATA ─────────────────────────────────────────────────────────────────────
const ADMIN_PIN = "1234";
const PRODUCTS = [
  { id:"vinyl",  name:"Vinylová samolepka",   sub:"Voděodolné · interiér i exteriér",    basePrice:25, glyph:"◈" },
  { id:"htv",    name:"Nažehlovací fólie",     sub:"Textil · trička · mikiny · tašky",    basePrice:35, glyph:"⬡" },
  { id:"polep",  name:"Polep",                 sub:"Okna · auta · výlohy · velké plochy", basePrice:60, glyph:"▣" },
];
const SIZES = [
  { id:"xs", label:"XS", dim:"5×5 cm",   mult:0.6 },
  { id:"s",  label:"S",  dim:"10×10 cm", mult:1.0 },
  { id:"m",  label:"M",  dim:"15×15 cm", mult:1.6 },
  { id:"l",  label:"L",  dim:"20×20 cm", mult:2.4 },
  { id:"xl", label:"XL", dim:"A4 max",   mult:3.5 },
];
const COLORS = [
  { id:1, label:"1 barva",  mult:1.0 },
  { id:2, label:"2 barvy",  mult:1.3 },
  { id:3, label:"3 barvy",  mult:1.6 },
  { id:4, label:"4+ barev", mult:2.0 },
];
const STATUS_MAP = {
  nova:      { label:"Nová",      color:"#00d4ff", next:"potvrzena" },
  potvrzena: { label:"Potvrzena", color:"#a8ff78", next:"ve_vyrobe" },
  ve_vyrobe: { label:"Ve výrobě", color:"#ffb347", next:"hotova"    },
  hotova:    { label:"Hotová",    color:"#da8fff", next:"odeslana"  },
  odeslana:  { label:"Odesláno",  color:"#78ffd6", next:null        },
  zrusena:   { label:"Zrušena",   color:"#ff6b6b", next:null        },
};

function calcPrice(p,s,c,q) {
  if(!p||!s||!c) return 0;
  const d = q>=50?.6:q>=20?.75:q>=10?.85:q>=5?.92:1;
  return Math.round(p.basePrice * s.mult * c.mult * q * d);
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const G = {
  bg:"#080808", bg2:"#0f0f0f", bg3:"#141414",
  border:"rgba(255,255,255,0.07)", borderH:"rgba(255,255,255,0.15)",
  accent:"#00d4ff", accent2:"#a8ff78",
  text:"#ececec", muted:"#555", muted2:"#888",
  ff:"'Outfit', sans-serif", fm:"'Space Mono', monospace",
};

const s = {
  root:   { background:G.bg, minHeight:"100vh", color:G.text, fontFamily:G.ff, WebkitFontSmoothing:"antialiased", position:"relative" },
  nav:    { position:"sticky", top:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 40px", height:64, borderBottom:`1px solid ${G.border}`, background:"rgba(8,8,8,0.92)", backdropFilter:"blur(24px)" },
  logo:   { fontSize:17, fontWeight:700, letterSpacing:".15em", color:G.text },
  logoS:  { color:G.accent },
  logoSub:{ fontSize:9, letterSpacing:".2em", color:G.muted, marginTop:2 },
  layout: { display:"flex", minHeight:"calc(100vh - 64px)" },
  sidebar:{ width:210, flexShrink:0, borderRight:`1px solid ${G.border}`, padding:"44px 28px", display:"flex", flexDirection:"column", gap:0 },
  main:   { flex:1, padding:"48px 52px", maxWidth:680 },
};

function navAdminBtn(hover) {
  return { fontSize:10, letterSpacing:".14em", color:hover?G.accent:G.muted, background:"none", border:`1px solid ${hover?G.accent:G.border}`, padding:"8px 18px", cursor:"pointer", transition:"all .2s", fontFamily:G.ff };
}

// Reusable hover button hook
function useHover() {
  const [h, setH] = useState(false);
  return [h, { onMouseEnter:()=>setH(true), onMouseLeave:()=>setH(false) }];
}

// ─── SIDEBAR STEPS ────────────────────────────────────────────────────────────
function Sidebar({ step }) {
  const steps = ["Produkt","Parametry","Množství","Podklady","Kontakt"];
  return (
    <div style={s.sidebar}>
      {steps.map((l,i) => {
        const n=i+1, active=step===n, done=step>n;
        return (
          <div key={n} style={{ display:"flex", alignItems:"flex-start", gap:14, paddingBottom:30, position:"relative" }}>
            {i < steps.length-1 && <div style={{ position:"absolute", left:11, top:26, width:1, bottom:0, background:`linear-gradient(${G.border},transparent)` }}/>}
            <div style={{ width:24, height:24, flexShrink:0, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, border:`1px solid ${done?G.accent2:active?G.accent:G.muted}`, color:done?"#080808":active?G.accent:G.muted, background:done?G.accent2:"transparent", boxShadow:active?`0 0 14px rgba(0,212,255,.35)`:"none", transition:"all .3s" }}>
              {done?"✓":n}
            </div>
            <div style={{ fontSize:11, letterSpacing:".1em", marginTop:5, color:active?G.text:G.muted, fontWeight:active?500:400, transition:"color .3s" }}>{l}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function SecTitle({ children }) {
  return <div style={{ fontSize:32, fontWeight:300, letterSpacing:"-.01em", marginBottom:6, lineHeight:1.15 }}>{children}</div>;
}
function SecSub({ children }) {
  return <div style={{ fontSize:10, letterSpacing:".18em", color:G.muted, marginBottom:36, fontFamily:G.fm }}>{children}</div>;
}
function FieldLabel({ children }) {
  return <div style={{ fontSize:9, letterSpacing:".18em", color:G.muted2, marginBottom:8, fontFamily:G.fm }}>{children}</div>;
}
function SumBox({ rows, total, note }) {
  return (
    <div style={{ border:`1px solid ${G.border}`, marginTop:24 }}>
      <div style={{ padding:"12px 18px", borderBottom:`1px solid ${G.border}`, fontSize:9, letterSpacing:".18em", color:G.muted, fontFamily:G.fm }}>SOUHRN</div>
      {rows.filter(Boolean).map(([l,v])=>(
        <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"10px 18px", fontSize:12, letterSpacing:".04em" }}>
          <span style={{ color:G.muted2 }}>{l}</span><span style={{ color:G.text }}>{v}</span>
        </div>
      ))}
      {total && (
        <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 18px", fontSize:12, letterSpacing:".04em", borderTop:`1px solid ${G.border}` }}>
          <span style={{ color:G.muted2 }}>Celkem</span>
          <span style={{ fontSize:20, fontWeight:300, color:G.accent }}>{total}</span>
        </div>
      )}
      {note && <div style={{ padding:"10px 18px", fontSize:9, letterSpacing:".1em", color:G.muted, borderTop:`1px solid ${G.border}`, fontFamily:G.fm }}>{note}</div>}
    </div>
  );
}
function BtnNext({ children, disabled, onClick }) {
  const [h, hP] = useHover();
  return (
    <button {...hP} onClick={onClick} disabled={disabled} style={{ fontSize:10, letterSpacing:".16em", background:!disabled&&h?G.accent:"transparent", border:`1px solid ${disabled?G.muted:G.accent}`, color:disabled?G.muted:h?"#080808":G.accent, padding:"13px 32px", cursor:disabled?"default":"pointer", transition:"all .25s", fontFamily:G.ff, fontWeight:500 }}>
      {children}
    </button>
  );
}
function BtnBack({ children, onClick }) {
  const [h, hP] = useHover();
  return (
    <button {...hP} onClick={onClick} style={{ fontSize:10, letterSpacing:".16em", color:h?G.text:G.muted2, background:"none", border:`1px solid ${h?G.borderH:G.border}`, padding:"13px 22px", cursor:"pointer", transition:"all .2s", fontFamily:G.ff }}>
      {children}
    </button>
  );
}

// ─── SHOP ─────────────────────────────────────────────────────────────────────
function Shop({ onAdmin }) {
  const { addOrder } = useOrders();
  const [step, setStep]   = useState(1);
  const [prod, setProd]   = useState(null);
  const [size, setSize]   = useState(null);
  const [clrs, setClrs]   = useState(null);
  const [qty,  setQty]    = useState(1);
  const [file, setFile]   = useState(null);
  const [note, setNote]   = useState("");
  const [name, setName]   = useState("");
  const [email,setEmail]  = useState("");
  const [phone,setPhone]  = useState("");
  const [done, setDone]   = useState(false);
  const [hAdmin, hAdminP] = useHover();

  const price     = calcPrice(prod, size, clrs, qty);
  const unitPrice = prod&&size&&clrs ? Math.round(prod.basePrice*size.mult*clrs.mult) : 0;
  const canNext   = [!!prod, !!size&&!!clrs, qty>=1, true, !!(name&&email)][step-1] ?? false;

  const submit = () => {
    if(!canNext) return;
    addOrder({ product_id:prod.id, product_name:prod.name, size_id:size.id, size_label:size.label, size_dim:size.dim, colors_count:clrs.id, colors_label:clrs.label, quantity:qty, unit_price:unitPrice, total_price:price, file_name:file||null, note:note||null, customer_name:name, customer_email:email, customer_phone:phone||null });
    setDone(true);
  };

  const reset = () => { setDone(false);setStep(1);setProd(null);setSize(null);setClrs(null);setQty(1);setFile(null);setNote("");setName("");setEmail("");setPhone(""); };

  if(done) return (
    <div style={{ ...s.root, display:"flex", alignItems:"center", justifyContent:"center", padding:40 }}>
      <div style={{ maxWidth:460, width:"100%" }}>
        <div style={{ fontSize:52, color:G.accent2, marginBottom:28 }}>✦</div>
        <div style={{ fontSize:36, fontWeight:300, marginBottom:10 }}>Objednávka<br/>přijata.</div>
        <div style={{ fontSize:12, letterSpacing:".08em", color:G.muted2, lineHeight:1.9, marginBottom:36 }}>Ozvu se ti do 24 hodin<br/>na {email}</div>
        <SumBox rows={[[prod?.name,"Produkt"],[`${size?.label} — ${size?.dim}`,"Velikost"],[clrs?.label,"Barvy"],[`${qty} ks`,"Množství"],file&&[file,"Soubor"]]} total={`${price.toLocaleString("cs")} Kč`} />
        <div style={{ marginTop:28 }}><BtnBack onClick={reset}>← Nová objednávka</BtnBack></div>
      </div>
    </div>
  );

  return (
    <div>
      {/* NAV */}
      <nav style={s.nav}>
        <div>
          <div style={s.logo}>CUT<span style={s.logoS}>LAB</span></div>
          <div style={s.logoSub}>ŘEZACÍ STUDIO</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:28 }}>
          {price>0 && (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:9, letterSpacing:".16em", color:G.muted }}>AKTUÁLNÍ CENA</div>
              <div style={{ fontSize:24, fontWeight:300, color:G.accent }}>{price.toLocaleString("cs")} Kč</div>
            </div>
          )}
          <button {...hAdminP} style={navAdminBtn(hAdmin)} onClick={onAdmin}>ADMIN</button>
        </div>
      </nav>

      {/* BODY */}
      <div style={s.layout}>
        <Sidebar step={step}/>
        <main style={s.main}>

          {/* STEP 1 */}
          {step===1 && (
            <div>
              <SecTitle>Vyberte<br/>produkt</SecTitle>
              <SecSub>KROK 01 / 05</SecSub>
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                {PRODUCTS.map(p => {
                  const sel = prod?.id===p.id;
                  return (
                    <div key={p.id} onClick={()=>setProd(p)} style={{ display:"flex", alignItems:"center", gap:20, padding:"20px 24px", border:`1px solid ${sel?G.accent:G.border}`, cursor:"pointer", background:sel?"rgba(0,212,255,.04)":"transparent", position:"relative", transition:"all .22s" }}>
                      <div style={{ fontSize:22, opacity:sel?1:.35, color:sel?G.accent:G.text, flexShrink:0, width:30, textAlign:"center" }}>{p.glyph}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:500, letterSpacing:".04em", marginBottom:3 }}>{p.name}</div>
                        <div style={{ fontSize:10, letterSpacing:".08em", color:G.muted2 }}>{p.sub}</div>
                      </div>
                      <div style={{ fontSize:13, fontWeight:300, color:sel?G.accent:G.muted2, flexShrink:0 }}>od {p.basePrice} Kč/ks</div>
                      {sel && <div style={{ position:"absolute", right:0, top:0, bottom:0, width:2, background:G.accent, boxShadow:`0 0 10px ${G.accent}` }}/>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step===2 && (
            <div>
              <SecTitle>Velikost<br/>& barvy</SecTitle>
              <SecSub>KROK 02 / 05</SecSub>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:2, marginBottom:36 }}>
                {SIZES.map(sz => {
                  const sel=size?.id===sz.id;
                  return (
                    <div key={sz.id} onClick={()=>setSize(sz)} style={{ padding:"16px 8px", textAlign:"center", border:`1px solid ${sel?G.accent:G.border}`, cursor:"pointer", background:sel?"rgba(0,212,255,.04)":"transparent", transition:"all .2s" }}>
                      <div style={{ fontSize:22, fontWeight:300, marginBottom:4, color:sel?G.accent:G.text }}>{sz.label}</div>
                      <div style={{ fontSize:8, letterSpacing:".1em", color:G.muted, fontFamily:G.fm }}>{sz.dim}</div>
                    </div>
                  );
                })}
              </div>
              <FieldLabel>POČET BAREV</FieldLabel>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:2 }}>
                {COLORS.map(c => {
                  const sel=clrs?.id===c.id;
                  return (
                    <div key={c.id} onClick={()=>setClrs(c)} style={{ padding:"14px 18px", border:`1px solid ${sel?G.accent:G.border}`, cursor:"pointer", background:sel?"rgba(0,212,255,.04)":"transparent", display:"flex", justifyContent:"space-between", alignItems:"center", transition:"all .2s" }}>
                      <span style={{ fontSize:12, fontWeight:400, letterSpacing:".06em" }}>{c.label}</span>
                      <div style={{ display:"flex", gap:5 }}>
                        {Array.from({length:Math.min(c.id,4)}).map((_,i)=>(
                          <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:["#00d4ff","#a8ff78","#ffb347","#da8fff"][i] }}/>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step===3 && (
            <div>
              <SecTitle>Množství</SecTitle>
              <SecSub>KROK 03 / 05</SecSub>
              <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:32 }}>
                <button onClick={()=>setQty(Math.max(1,qty-1))} style={{ width:44, height:44, border:`1px solid ${G.border}`, background:"transparent", color:G.text, fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:G.ff }}>−</button>
                <div style={{ fontSize:56, fontWeight:200, minWidth:90, textAlign:"center", lineHeight:1 }}>{qty}</div>
                <button onClick={()=>setQty(qty+1)} style={{ width:44, height:44, border:`1px solid ${G.border}`, background:"transparent", color:G.text, fontSize:20, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:G.ff }}>+</button>
              </div>
              <div style={{ display:"flex", gap:2, marginBottom:32 }}>
                {[5,10,20,50].map(n=>(
                  <button key={n} onClick={()=>setQty(n)} style={{ flex:1, padding:"10px 0", border:`1px solid ${qty===n?G.accent:G.border}`, background:qty===n?"rgba(0,212,255,.04)":"transparent", fontSize:10, letterSpacing:".12em", color:qty===n?G.accent:G.muted2, cursor:"pointer", fontFamily:G.ff }}>{n} KS</button>
                ))}
              </div>
              <div style={{ border:`1px solid ${G.border}` }}>
                {[{f:5,l:"5–9 ks",d:"−8 %"},{f:10,l:"10–19 ks",d:"−15 %"},{f:20,l:"20–49 ks",d:"−25 %"},{f:50,l:"50+ ks",d:"−40 %"}].map(r=>(
                  <div key={r.f} style={{ display:"flex", justifyContent:"space-between", padding:"11px 18px", borderBottom:`1px solid ${G.border}`, fontSize:11, letterSpacing:".06em", background:qty>=r.f?"rgba(168,255,120,.03)":"transparent" }}>
                    <span style={{ color:qty>=r.f?G.text:G.muted }}>{r.l}</span>
                    <span style={{ color:G.accent2, fontWeight:qty>=r.f?600:400 }}>{r.d}</span>
                  </div>
                ))}
              </div>
              {prod&&size&&clrs&&(
                <SumBox rows={[["Cena / ks",`${unitPrice} Kč`]]} total={`${price.toLocaleString("cs")} Kč`} />
              )}
            </div>
          )}

          {/* STEP 4 */}
          {step===4 && (
            <div>
              <SecTitle>Podklady</SecTitle>
              <SecSub>KROK 04 / 05</SecSub>
              <div style={{ border:`1px solid ${file?"rgba(168,255,120,.5)":G.border}`, borderStyle:"dashed", padding:44, textAlign:"center", cursor:"pointer", position:"relative", marginBottom:32, background:file?"rgba(168,255,120,.03)":"transparent", transition:"all .25s" }}>
                <input type="file" accept=".svg,.pdf,.ai,.png,.jpg,.eps" onChange={e=>e.target.files[0]&&setFile(e.target.files[0].name)} style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer", width:"100%", height:"100%" }}/>
                {file
                  ? <><div style={{ fontSize:26, color:G.accent2, marginBottom:12 }}>✓</div><div style={{ fontSize:12, color:G.accent2, fontWeight:500, letterSpacing:".08em" }}>{file}</div><div style={{ fontSize:9, color:G.muted, marginTop:6, fontFamily:G.fm }}>Klikněte pro změnu</div></>
                  : <><div style={{ fontSize:26, opacity:.3, marginBottom:12 }}>⊕</div><div style={{ fontSize:11, letterSpacing:".14em", color:G.muted2 }}>NAHRÁT SOUBOR</div><div style={{ fontSize:9, color:G.muted, marginTop:8, fontFamily:G.fm }}>SVG · PDF · AI · EPS · PNG · JPG</div></>
                }
              </div>
              <FieldLabel>POZNÁMKA / PŘÁNÍ</FieldLabel>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Barva pozadí, přesný odstín, text, deadline..." style={{ width:"100%", background:"transparent", border:`1px solid ${G.border}`, padding:"13px 16px", color:G.text, fontSize:13, outline:"none", resize:"vertical", minHeight:108, lineHeight:1.65, fontFamily:G.ff }}/>
            </div>
          )}

          {/* STEP 5 */}
          {step===5 && (
            <div>
              <SecTitle>Kontakt</SecTitle>
              <SecSub>KROK 05 / 05</SecSub>
              {[["JMÉNO A PŘÍJMENÍ *",name,setName,"text","Jan Novák"],["E-MAIL *",email,setEmail,"email","jan@email.cz"],["TELEFON",phone,setPhone,"tel","+420 777 123 456"]].map(([l,v,set,t,ph])=>(
                <div key={l} style={{ marginBottom:16 }}>
                  <FieldLabel>{l}</FieldLabel>
                  <input type={t} value={v} onChange={e=>set(e.target.value)} placeholder={ph} style={{ width:"100%", background:"transparent", border:`1px solid ${G.border}`, padding:"13px 16px", color:G.text, fontSize:13, letterSpacing:".03em", outline:"none", fontFamily:G.ff }}/>
                </div>
              ))}
              <SumBox
                rows={[[prod?.name,"Produkt"],[`${size?.label} — ${size?.dim}`,"Velikost"],[clrs?.label,"Barvy"],[`${qty} ks`,"Množství"],file&&[file,"Soubor"]]}
                total={`${price.toLocaleString("cs")} Kč`}
                note="* Finální cena potvrzena po kontrole podkladů."
              />
            </div>
          )}

          {/* NAV BUTTONS */}
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:48 }}>
            {step>1 ? <BtnBack onClick={()=>setStep(s=>s-1)}>← ZPĚT</BtnBack> : <div/>}
            {step<5
              ? <BtnNext disabled={!canNext} onClick={()=>setStep(s=>s+1)}>POKRAČOVAT →</BtnNext>
              : <BtnNext disabled={!canNext} onClick={submit}>ODESLAT OBJEDNÁVKU →</BtnNext>
            }
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
function AdminLogin({ onLogin, onBack }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const go = () => { if(pin===ADMIN_PIN) onLogin(); else { setErr(true); setPin(""); } };
  return (
    <div style={{ ...s.root, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ textAlign:"center", width:300 }}>
        <div style={{ fontSize:28, fontWeight:700, letterSpacing:".12em", marginBottom:4 }}>CUT<span style={s.logoS}>LAB</span></div>
        <div style={{ fontSize:9, letterSpacing:".22em", color:G.muted, marginBottom:44, fontFamily:G.fm }}>ADMIN PŘÍSTUP</div>
        <input type="password" value={pin} onChange={e=>{setPin(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="· · · ·" maxLength={8}
          style={{ width:"100%", background:"transparent", border:`1px solid ${err?"#ff6b6b":G.border}`, padding:15, color:G.text, fontSize:18, letterSpacing:".4em", textAlign:"center", outline:"none", marginBottom:10, fontFamily:G.ff, transition:"border-color .2s" }}/>
        {err && <div style={{ fontSize:10, color:"#ff6b6b", letterSpacing:".14em", marginBottom:10 }}>NESPRÁVNÝ PIN</div>}
        <BtnNext onClick={go} disabled={false}>PŘIHLÁSIT SE</BtnNext>
        <div style={{ marginTop:14 }}><BtnBack onClick={onBack}>← ZPĚT</BtnBack></div>
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ─────────────────────────────────────────────────────────────
function Admin({ onBack }) {
  const { orders, updStatus } = useOrders();
  const [filter, setFilter] = useState("vse");
  const [detail, setDetail] = useState(null);
  const [hBack, hBackP]     = useHover();

  const filtered = filter==="vse" ? orders : orders.filter(o=>o.status===filter);
  const counts   = {};
  orders.forEach(o=>{counts[o.status]=(counts[o.status]||0)+1;});
  const revenue  = orders.filter(o=>o.status!=="zrusena").reduce((s,o)=>s+o.total_price,0);

  if(detail) {
    const st = STATUS_MAP[detail.status];
    return (
      <div style={{ ...s.root, padding:"40px 48px" }}>
        <button onClick={()=>setDetail(null)} style={{ fontSize:10, letterSpacing:".14em", color:G.muted2, background:"none", border:"none", cursor:"pointer", padding:0, marginBottom:32, fontFamily:G.ff }}>← ZPĚT NA PŘEHLED</button>
        <div style={{ maxWidth:560 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:32 }}>
            <div style={{ fontSize:24, fontWeight:500 }}>#{detail.id.slice(0,8).toUpperCase()}</div>
            <div style={{ fontSize:9, letterSpacing:".14em", padding:"4px 12px", border:`1px solid ${st?.color}`, color:st?.color, fontFamily:G.fm }}>{st?.label.toUpperCase()}</div>
          </div>
          {[
            { t:"ZÁKAZNÍK", rows:[["Jméno",detail.customer_name],["E-mail",detail.customer_email],detail.customer_phone&&["Telefon",detail.customer_phone]].filter(Boolean) },
            { t:"ZAKÁZKA",  rows:[["Produkt",detail.product_name],["Velikost",`${detail.size_label} — ${detail.size_dim}`],["Barvy",detail.colors_label],["Množství",`${detail.quantity} ks`],detail.file_name&&["Soubor",detail.file_name],detail.note&&["Poznámka",detail.note],["Cena/ks",`${detail.unit_price} Kč`],["Celkem",`${detail.total_price.toLocaleString("cs")} Kč`]].filter(Boolean) },
          ].map(sec=>(
            <div key={sec.t} style={{ border:`1px solid ${G.border}`, marginBottom:2 }}>
              <div style={{ padding:"12px 22px", borderBottom:`1px solid ${G.border}`, fontSize:9, letterSpacing:".18em", color:G.muted, fontFamily:G.fm }}>{sec.t}</div>
              {sec.rows.map(([l,v])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"11px 22px", fontSize:12, letterSpacing:".04em", borderBottom:`1px solid ${G.border}` }}>
                  <span style={{ color:G.muted2 }}>{l}</span><span>{v}</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{ border:`1px solid ${G.border}`, marginTop:2 }}>
            <div style={{ padding:"12px 22px", borderBottom:`1px solid ${G.border}`, fontSize:9, letterSpacing:".18em", color:G.muted, fontFamily:G.fm }}>ZMĚNIT STAV</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:2, padding:"18px 22px" }}>
              {Object.entries(STATUS_MAP).map(([key,val])=>(
                <button key={key} onClick={()=>{ updStatus(detail.id,key); setDetail(d=>({...d,status:key})); }}
                  style={{ fontSize:9, letterSpacing:".12em", padding:"8px 14px", border:`1px solid ${val.color}`, color:detail.status===key?val.color:G.muted2, background:detail.status===key?val.color+"18":"transparent", cursor:"pointer", fontFamily:G.ff }}>
                  {val.label.toUpperCase()}
                </button>
              ))}
            </div>
            {STATUS_MAP[detail.status]?.next && (
              <div style={{ padding:"0 22px 20px" }}>
                <BtnNext onClick={()=>{ const ns=STATUS_MAP[detail.status].next; updStatus(detail.id,ns); setDetail(d=>({...d,status:ns})); }} disabled={false}>
                  → {STATUS_MAP[STATUS_MAP[detail.status].next]?.label.toUpperCase()}
                </BtnNext>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.root}>
      <div style={{ ...s.nav, position:"sticky" }}>
        <div>
          <div style={s.logo}>CUT<span style={s.logoS}>LAB</span> <span style={{ color:G.muted, fontSize:13, fontWeight:400, letterSpacing:".1em" }}>/ ADMIN</span></div>
          <div style={s.logoSub}>SPRÁVA ZAKÁZEK</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button {...hBackP} style={navAdminBtn(hBack)} onClick={onBack}>← E-SHOP</button>
        </div>
      </div>
      <div style={{ padding:"36px 48px" }}>
        {/* STATS */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:2, marginBottom:28 }}>
          {[["CELKEM",orders.length,G.text],["NOVÉ",counts["nova"]||0,G.accent],["VE VÝROBĚ",counts["ve_vyrobe"]||0,"#ffb347"],["ODH. OBRAT",`${revenue.toLocaleString("cs")} Kč`,G.accent2]].map(([l,v,c])=>(
            <div key={l} style={{ background:G.bg3, border:`1px solid ${G.border}`, padding:"20px 22px" }}>
              <div style={{ fontSize:9, letterSpacing:".18em", color:G.muted, marginBottom:10, fontFamily:G.fm }}>{l}</div>
              <div style={{ fontSize:26, fontWeight:300, color:c }}>{v}</div>
            </div>
          ))}
        </div>
        {/* FILTERS */}
        <div style={{ display:"flex", gap:2, marginBottom:20, flexWrap:"wrap" }}>
          {[["vse","VŠE"],...Object.entries(STATUS_MAP).map(([k,v])=>[k,v.label.toUpperCase()])].map(([key,label])=>(
            <button key={key} onClick={()=>setFilter(key)} style={{ fontSize:9, letterSpacing:".12em", padding:"8px 14px", border:`1px solid ${filter===key?G.accent:G.border}`, background:filter===key?"rgba(0,212,255,.04)":"transparent", color:filter===key?G.accent:G.muted2, cursor:"pointer", fontFamily:G.ff }}>
              {label}{key!=="vse"&&counts[key]?` (${counts[key]})` : ""}
            </button>
          ))}
        </div>
        {/* LIST */}
        {filtered.length===0 ? (
          <div style={{ color:G.muted, fontSize:11, letterSpacing:".12em", padding:60, textAlign:"center" }}>Žádné zakázky</div>
        ) : filtered.map(o=>{
          const st=STATUS_MAP[o.status];
          const date=new Date(o.created_at).toLocaleDateString("cs",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
          return (
            <div key={o.id} onClick={()=>setDetail(o)} style={{ display:"flex", alignItems:"center", gap:18, border:`1px solid ${G.border}`, padding:"16px 22px", marginBottom:2, cursor:"pointer", transition:"all .2s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=G.borderH}
              onMouseLeave={e=>e.currentTarget.style.borderColor=G.border}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:500, marginBottom:3 }}>{o.customer_name}</div>
                <div style={{ fontSize:10, letterSpacing:".06em", color:G.muted2 }}>{o.product_name} · {o.size_label} · {o.colors_label} · {o.quantity} ks</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:18, fontWeight:300, color:G.accent }}>{o.total_price.toLocaleString("cs")} Kč</div>
                <div style={{ fontSize:9, letterSpacing:".08em", color:G.muted, fontFamily:G.fm }}>{date}</div>
              </div>
              <div style={{ fontSize:8, letterSpacing:".14em", padding:"4px 10px", border:`1px solid ${st?.color}`, color:st?.color, flexShrink:0, fontFamily:G.fm }}>{st?.label.toUpperCase()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("shop");
  return (
    <OrdersProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        body { background:#080808; }
        @keyframes scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
      `}</style>
      {/* Scanline + grid */}
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9999, overflow:"hidden", opacity:.02 }}>
        <div style={{ position:"absolute", left:0, right:0, height:2, background:"linear-gradient(transparent,rgba(0,212,255,.9),transparent)", animation:"scan 9s linear infinite" }}/>
      </div>
      <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, backgroundImage:"linear-gradient(rgba(0,212,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,.022) 1px,transparent 1px)", backgroundSize:"64px 64px" }}/>
      <div style={{ background:"#080808", minHeight:"100vh", color:"#ececec", fontFamily:"'Outfit',sans-serif", WebkitFontSmoothing:"antialiased", position:"relative", zIndex:1 }}>
        {view==="shop"  && <Shop  onAdmin={()=>setView("login")} />}
        {view==="login" && <AdminLogin onLogin={()=>setView("admin")} onBack={()=>setView("shop")} />}
        {view==="admin" && <Admin onBack={()=>setView("shop")} />}
      </div>
    </OrdersProvider>
  );
}
