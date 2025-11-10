import { useEffect, useMemo, useState } from "react";

/* ---------- Mini router a hash ---------- */
function useHashRoute(): string {
  const getHash = () => (window.location.hash.replace(/^#/, "") || "/");
  const [route, setRoute] = useState<string>(getHash());
  useEffect(() => {
    const onHash = () => setRoute(getHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return route;
}

type LinkProps = { to: string; className?: string; children: React.ReactNode };
function Link({ to, className, children }: LinkProps) {
  return (
    <a href={`#${to}`} className={className}>
      {children}
    </a>
  );
}

/* ---------- Layout & Navbar ---------- */
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <header className="nav">
        <div className="container nav__inner">
          <a href="#/" className="brand">Valutare Casa</a>
          <nav className="nav__links">
            <Link to="/" className="nav__link">Home</Link>
            <Link to="/calcolatore" className="nav__link">Calcolatore</Link>
            <Link to="/pacchetti" className="nav__link">Pacchetti</Link>
          </nav>
        </div>
      </header>
      <main className="container">{children}</main>
      <footer className="footer">© {new Date().getFullYear()} Valutare Casa</footer>
    </div>
  );
}

/* ---------- HOME ---------- */
function Home() {
  return (
    <section className="card">
      <h1 className="h1">Valuta la tua casa in pochi minuti</h1>
      <p className="muted">
        Stima gratuita per Italia, Francia e Germania. Nessun obbligo di agenzia.
      </p>

      <div className="grid3 mt">
        <div className="pill">
          <h3 className="h3">Gratis</h3>
          <p className="muted">Stima istantanea senza impegno.</p>
        </div>
        <div className="pill">
          <h3 className="h3">Affidabile</h3>
          <p className="muted">Modello basato su comparabili e caratteristiche.</p>
        </div>
        <div className="pill">
          <h3 className="h3">Scalabile</h3>
          <p className="muted">Pacchetti dal report alla perizia.</p>
        </div>
      </div>

      <div className="mt">
        <Link to="/calcolatore" className="btn">Prova ora il calcolatore</Link>
      </div>
    </section>
  );
}

/* ---------- LOGICA CALCOLO ---------- */
function basePrice(paese: string): number {
  return { IT: 2200, FR: 3500, DE: 3200 }[paese as "IT" | "FR" | "DE"] ?? 2000; // €/mq demo
}
function energyMultiplier(classe: string): number {
  const map: Record<string, number> = {
    A4: 1.15, A3: 1.12, A2: 1.10, A1: 1.08, B: 1.06, C: 1.04, D: 1.02, E: 1.00, F: 0.96, G: 0.92,
  };
  return map[classe] ?? 1.0;
}

type FormState = {
  paese: "IT" | "FR" | "DE";
  via: string;
  cap: string;
  citta: string;
  metri: string; // tengo string per input control
  bagni: number;
  camere: number;
  box: number;
  piano: number;
  ascensore: "si" | "no";
  classeEnergetica: "A4"|"A3"|"A2"|"A1"|"B"|"C"|"D"|"E"|"F"|"G";
  ristrutturato: "no" | "parziale" | "totale";
};

/* ---------- CALCOLATORE ---------- */
function Calcolatore() {
  const [form, setForm] = useState<FormState>({
    paese: "IT",
    via: "",
    cap: "",
    citta: "",
    metri: "",
    bagni: 1,
    camere: 2,
    box: 0,
    piano: 0,
    ascensore: "no",
    classeEnergetica: "G",
    ristrutturato: "no",
  });

  const stima = useMemo(() => {
    const mq = Number(form.metri || 0);
    if (!mq) return 0;
    let p = basePrice(form.paese);
    p *= energyMultiplier(form.classeEnergetica);
    p *= 1 + (form.bagni * 0.015);
    p *= 1 + (form.camere * 0.01);
    p *= 1 + (form.box * 0.02);
    if (form.ascensore === "si" && form.piano >= 2) p *= 1.03;
    if (form.piano < 0) p *= 0.93;
    if (form.ristrutturato === "parziale") p *= 1.03;
    if (form.ristrutturato === "totale") p *= 1.08;
    return Math.round(p * mq);
  }, [form]);

  const onChange =
    <K extends keyof FormState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.type === "number"
        ? Number((e.target as HTMLInputElement).value)
        : e.target.value;
      setForm((prev) => ({ ...prev, [key]: value as FormState[K] }));
    };

  return (
    <section className="card">
      <h1 className="h1">Calcolatore</h1>
      <p className="muted">Compila i campi per ottenere una stima indicativa.</p>

      <form className="grid3 mt" onSubmit={(e) => e.preventDefault()}>
        <select className="input" value={form.paese} onChange={onChange("paese")}>
          <option value="IT">Italia</option>
          <option value="FR">Francia</option>
          <option value="DE">Germania</option>
        </select>
        <input className="input" placeholder="Via e numero" value={form.via} onChange={onChange("via")} />
        <input className="input" placeholder="CAP" value={form.cap} onChange={onChange("cap")} />
        <input className="input" placeholder="Città" value={form.citta} onChange={onChange("citta")} />
        <input className="input" placeholder="Metri quadrati" type="number" min={10}
               value={form.metri} onChange={(e)=>setForm(f=>({...f, metri: (e.target as HTMLInputElement).value}))} />

        <input className="input" type="number" min={0} value={form.bagni} onChange={onChange("bagni")} placeholder="Bagni" />
        <input className="input" type="number" min={0} value={form.camere} onChange={onChange("camere")} placeholder="Camere" />
        <input className="input" type="number" min={0} value={form.box} onChange={onChange("box")} placeholder="Box" />

        <input className="input" type="number" min={-2} value={form.piano} onChange={onChange("piano")} placeholder="Piano" />
        <select className="input" value={form.ascensore} onChange={onChange("ascensore")}>
          <option value="no">Ascensore: no</option>
          <option value="si">Ascensore: sì</option>
        </select>

        <select className="input" value={form.classeEnergetica} onChange={onChange("classeEnergetica")}>
          {["A4","A3","A2","A1","B","C","D","E","F","G"].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className="input" value={form.ristrutturato} onChange={onChange("ristrutturato")}>
          <option value="no">Non ristrutturato</option>
          <option value="parziale">Ristrutturazione parziale</option>
          <option value="totale">Ristrutturazione totale</option>
        </select>
      </form>

      <div className="notice mt">
        <div className="h3">Stima indicativa</div>
        <div className="big">{stima ? ("€ " + stima.toLocaleString("it-IT")) : "—"}</div>
        <p className="muted small">
          Valore demo basato su parametri inseriti. Per report o perizia, vedi Pacchetti.
        </p>
      </div>

      <div className="mt">
        <Link to="/pacchetti" className="btn btn--outline">Vai ai Pacchetti</Link>
      </div>
    </section>
  );
}

/* ---------- PACCHETTI ---------- */
function Pacchetti() {
  const plans = [
    { name: "Gratis", price: "€0", features: ["Stima istantanea", "Export email"] },
    { name: "Report", price: "€49", features: ["PDF dettagliato", "Comparabili", "Consigli lavori"] },
    { name: "Perizia", price: "Su preventivo", features: ["Sopralluogo", "Relazione firmata", "Uso bancario"] },
  ] as const;

  return (
    <section>
      <h1 className="h1">Pacchetti</h1>
      <div className="cards mt">
        {plans.map((p) => (
          <div key={p.name} className="card">
            <div className="h3">{p.name}</div>
            <div className="price">{p.price}</div>
            <ul className="list">
              {p.features.map((f) => <li key={f}>• {f}</li>)}
            </ul>
            <button className="btn btn--ghost" onClick={() => alert(`Demo: contatto per ${p.name}`)}>
              Seleziona
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- APP ---------- */
export default function App() {
  const route = useHashRoute();
 let page = <Home />;
if (route.startsWith("/calcolatore")) page = <Calcolatore />;
  else if (route.startsWith("/pacchetti")) page = <Pacchetti />;
  return <Layout>{page}</Layout>;
}
