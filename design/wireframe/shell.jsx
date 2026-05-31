// shell.jsx — reusable Variante A shells (desktop sidebar + mobile bottom bar)
const NAV = [
  { ic: "grid", l: "Dashboard" },
  { ic: "exchange", l: "Transactions" },
  { ic: "gauge", l: "Budgets" },
  { ic: "target", l: "Objectifs" },
  { ic: "analytics", l: "Analytics" },
  { ic: "message", l: "Assistant" },
  { ic: "wallet", l: "Comptes" },
  { ic: "bank", l: "Prêt / Dette" },
];

function DeskShell({ active, eyebrow, title, actions = [], children, headerExtra }) {
  const { Icon } = window.WF;
  return (
    <div className="wf" style={{ display: "grid", gridTemplateColumns: "240px 1fr", background: "var(--bg)" }}>
      <aside style={{ background: "var(--paper)", borderRight: "1px solid var(--line)", padding: "22px 16px", display: "flex", flexDirection: "column" }}>
        <div className="logo" style={{ padding: "0 6px 4px" }}>
          <div className="logo-mark">C</div><div className="logo-name">Cauris</div>
        </div>
        <div className="nav-group">Pilotage</div>
        {NAV.map((n) => (
          <div className={"nav-item" + (n.l === active ? " on" : "")} key={n.l}><Icon name={n.ic} size={19} /> {n.l}</div>
        ))}
        <div className="nav-group">Compte</div>
        {[{ ic: "bell", l: "Notifications" }, { ic: "gear", l: "Paramètres" }].map((n) => (
          <div className={"nav-item" + (n.l === active ? " on" : "")} key={n.l}><Icon name={n.ic} size={19} /> {n.l}</div>
        ))}
        <div style={{ marginTop: "auto" }} className="wf-card soft wf-pad-sm r">
          <div className="avatar sm">A</div>
          <div style={{ marginLeft: 10, lineHeight: 1.25 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Aïcha K.</div>
            <div className="t-faint" style={{ fontSize: 11 }}>Compte personnel</div>
          </div>
        </div>
      </aside>

      <main style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <header className="r between" style={{ padding: "16px 28px", background: "var(--paper)", borderBottom: "1px solid var(--line)" }}>
          <div className="field" style={{ width: 320 }}>
            <Icon name="search" size={17} /><input placeholder="Rechercher une transaction, un compte…" readOnly />
          </div>
          <div className="r" style={{ gap: 12 }}>
            <div className="seg"><button>Jour</button><button>Semaine</button><button className="on">Mois</button><button>Année</button></div>
            <div className="icon-btn"><Icon name="bell" size={19} /><span className="dot" /></div>
            <div className="avatar">A</div>
          </div>
        </header>

        <div style={{ padding: "24px 28px", overflow: "hidden", display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="r between">
            <div>
              {eyebrow && <div className="t-eyebrow">{eyebrow}</div>}
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em", marginTop: 3 }}>{title}</div>
            </div>
            <div className="r" style={{ gap: 10 }}>
              {actions.map((a, i) => (
                <button key={i} className={"btn" + (a.primary ? " primary" : "")}>{a.ic && <Icon name={a.ic} size={16} />} {a.l}</button>
              ))}
            </div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

const StatusBar2 = () => (
  <div className="phone-bar">
    <span>9:41</span>
    <span className="dots"><span style={{ fontWeight: 700 }}>●●●●●</span><svg width="22" height="11" viewBox="0 0 26 13" fill="none" style={{ marginLeft: 5 }}><rect x="1" y="1.5" width="20" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.3"/><rect x="3" y="3.5" width="13" height="6" rx="1" fill="currentColor"/><rect x="22.5" y="4.5" width="2.2" height="4" rx="1" fill="currentColor"/></svg></span>
  </div>
);

function MobShell({ active, title, sub, children, tab = "home", back }) {
  const { Icon } = window.WF;
  return (
    <div className="wf" style={{ background: "var(--bg)" }}>
      <StatusBar2 />
      <div className="r between" style={{ padding: "8px 18px 14px" }}>
        <div className="r" style={{ gap: 11, minWidth: 0 }}>
          {back && <div className="icon-btn" style={{ width: 34, height: 34 }}><Icon name="chevron" size={17} className="" style={{ transform: "rotate(180deg)" }} /></div>}
          <div style={{ minWidth: 0 }}>
            {sub && <div className="t-faint" style={{ fontSize: 11.5, fontWeight: 600 }}>{sub}</div>}
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
          </div>
        </div>
        <div className="r" style={{ gap: 10 }}>
          <div className="icon-btn" style={{ width: 36, height: 36 }}><Icon name="bell" size={17} /><span className="dot" /></div>
          <div className="avatar">A</div>
        </div>
      </div>

      <div className="scrollcol" style={{ padding: "0 18px 84px" }}>{children}</div>

      <div className="tabbar">
        <div className={"tab" + (tab === "home" ? " on" : "")}><Icon name="home" size={20} /> Accueil</div>
        <div className={"tab" + (tab === "txn" ? " on" : "")}><Icon name="exchange" size={20} /> Transac.</div>
        <div className="fab"><Icon name="plus" size={22} /></div>
        <div className={"tab" + (tab === "budget" ? " on" : "")}><Icon name="gauge" size={20} /> Budgets</div>
        <div className={"tab" + (tab === "more" ? " on" : "")}><Icon name="more" size={20} /> Plus</div>
      </div>
    </div>
  );
}

function PhoneFrame({ children, bg = "var(--bg)", pad = true, gap = 0 }) {
  return (
    <div className="wf" style={{ background: bg, display: "flex", flexDirection: "column" }}>
      <StatusBar2 />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: pad ? "4px 22px 26px" : 0, overflow: "hidden", gap }}>{children}</div>
    </div>
  );
}

Object.assign(window, { DeskShell, MobShell, PhoneFrame, NAV });
