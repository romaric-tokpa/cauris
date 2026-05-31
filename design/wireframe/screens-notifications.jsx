// screens-notifications.jsx — Notifications (desktop + mobile)
const NOTIF_TONE = {
  over: { c: "var(--neg)", w: "var(--neg-wash)" },
  warn: { c: "var(--warn)", w: "var(--warn-wash)" },
  ok: { c: "var(--pos)", w: "var(--pos-wash)" },
  "": { c: "var(--ink-soft)", w: "var(--panel-2)" },
};

function NotifRow({ n, compact }) {
  const { Icon } = window.WF;
  const m = NOTIF_TONE[n.tone] || NOTIF_TONE[""];
  return (
    <div className="row-line" style={{ gap: 13, alignItems: "flex-start", padding: compact ? "11px 0" : "14px 0" }}>
      <div className="row-ico" style={{ width: compact ? 34 : 38, height: compact ? 34 : 38, background: m.w, color: m.c, flex: "none" }}><Icon name={n.ic} size={compact ? 16 : 18} /></div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="r" style={{ gap: 7 }}>
          {!n.read && <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--accent)", flex: "none" }} />}
          <span style={{ fontWeight: 700, fontSize: compact ? 13 : 13.5 }}>{n.t}</span>
        </div>
        <div className="t-muted" style={{ fontSize: compact ? 11.5 : 12.5, marginTop: 2 }}>{n.s}</div>
      </div>
      <div className="c" style={{ alignItems: "flex-end", gap: 6 }}>
        <span className="t-faint" style={{ fontSize: 11, whiteSpace: "nowrap" }}>{n.when}</span>
        <Icon name="chevron" size={14} className="t-faint" />
      </div>
    </div>
  );
}

function NotifDesk() {
  const { Icon, data: D } = window.WF;
  const unread = D.notifsFull.filter((n) => !n.read);
  const earlier = D.notifsFull.filter((n) => n.read);
  return (
    <DeskShell active="Notifications" eyebrow={unread.length + " non lues"} title="Notifications"
      actions={[{ l: "Préférences", ic: "gear" }, { l: "Tout marquer comme lu", ic: "check", primary: true }]}>
      <div className="subnav">
        {["Toutes", "Non lues", "Alertes", "Rappels"].map((t, i) => <span key={t} className={"si" + (i === 0 ? " on" : "")}>{t}</span>)}
      </div>
      <div style={{ maxWidth: 820, width: "100%" }}>
        <div className="t-eyebrow" style={{ marginBottom: 8 }}>Non lues</div>
        <div className="wf-card wf-pad" style={{ paddingTop: 4, paddingBottom: 4, marginBottom: 18 }}>
          {unread.map((n, i) => <NotifRow key={i} n={n} />)}
        </div>
        <div className="t-eyebrow" style={{ marginBottom: 8 }}>Plus tôt</div>
        <div className="wf-card wf-pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
          {earlier.map((n, i) => <NotifRow key={i} n={n} />)}
        </div>
      </div>
    </DeskShell>
  );
}
window.NotifDesk = NotifDesk;

function NotifMob() {
  const { Icon, data: D } = window.WF;
  const unread = D.notifsFull.filter((n) => !n.read);
  const earlier = D.notifsFull.filter((n) => n.read);
  return (
    <MobShell active="Notifications" tab="more" title="Notifications" sub={unread.length + " non lues"}>
      <div className="r between">
        <div className="r" style={{ gap: 7 }}>
          {["Toutes", "Non lues", "Alertes"].map((t, i) => <span key={t} className={"chip" + (i === 0 ? " on" : "")} style={{ fontSize: 11.5, padding: "5px 11px" }}>{t}</span>)}
        </div>
        <span className="card-link" style={{ fontSize: 11.5 }}>Tout lire</span>
      </div>
      <div>
        <div className="t-eyebrow" style={{ margin: "2px 2px 6px" }}>Non lues</div>
        <div className="wf-card wf-pad-sm">{unread.map((n, i) => <NotifRow key={i} n={n} compact />)}</div>
      </div>
      <div>
        <div className="t-eyebrow" style={{ margin: "2px 2px 6px" }}>Plus tôt</div>
        <div className="wf-card wf-pad-sm">{earlier.map((n, i) => <NotifRow key={i} n={n} compact />)}</div>
      </div>
    </MobShell>
  );
}
window.NotifMob = NotifMob;
