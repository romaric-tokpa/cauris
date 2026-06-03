// screens-capture.jsx — Couche de capture multi-canal (mobile)

// ---------- Hub de capture (le « + » du quotidien) ----------
function CaptureHubMob() {
  const { Icon, data: D } = window.WF;
  return (
    <div className="wf" style={{ background: "var(--bg)" }}>
      <div className="phone-bar"><span>9:41</span><span className="dots"><span style={{ fontWeight: 700 }}>●●●●●</span><svg width="22" height="11" viewBox="0 0 26 13" fill="none" style={{ marginLeft: 5 }}><rect x="1" y="1.5" width="20" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.3"/><rect x="3" y="3.5" width="13" height="6" rx="1" fill="currentColor"/><rect x="22.5" y="4.5" width="2.2" height="4" rx="1" fill="currentColor"/></svg></span></div>
      <div style={{ opacity: .35, pointerEvents: "none", padding: "0 18px" }}>
        <div className="r between" style={{ padding: "8px 0 14px" }}><div style={{ fontSize: 19, fontWeight: 800 }}>Accueil</div><div className="avatar" /></div>
        <div className="wf-card wf-pad feature-card" style={{ height: 120 }} />
      </div>
      {/* capture sheet */}
      <div className="sheet" style={{ padding: "8px 18px 26px" }}>
        <div className="sheet-grip" />
        <div className="r between" style={{ margin: "4px 0 4px" }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Enregistrer une opération</div>
          <div className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="plus" size={16} style={{ transform: "rotate(45deg)" }} /></div>
        </div>
        <div className="t-faint" style={{ fontSize: 12, marginBottom: 14 }}>Choisissez le mode le plus rapide pour vous.</div>
        <div className="c" style={{ gap: 10 }}>
          {D.captureModes.map((m, i) => (
            <div key={m.id} className={"cap-tile" + (i === 0 ? " feat" : "")}>
              <div className="ti"><Icon name={m.ic} size={20} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{m.l}</div>
                <div style={{ fontSize: 11.5, opacity: i === 0 ? .8 : 1 }} className={i === 0 ? "" : "t-faint"}>{m.sub}</div>
              </div>
              {m.id === "sms" ? <span className="badge ok">Auto</span> : <Icon name="chevron" size={16} className={i === 0 ? "" : "t-faint"} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.CaptureHubMob = CaptureHubMob;

// ---------- Saisie rapide (canal de paiement distinct de catégorie/compte) ----------
function QuickEntryMob() {
  const { Icon, data: D } = window.WF;
  return (
    <PhoneFrame>
      <div className="r between" style={{ marginBottom: 14, paddingTop: 4 }}>
        <div className="icon-btn" style={{ width: 34, height: 34 }}><Icon name="chevron" size={16} style={{ transform: "rotate(180deg)" }} /></div>
        <span style={{ fontWeight: 800, fontSize: 16 }}>Saisie rapide</span>
        <span className="card-link" style={{ fontSize: 12.5 }}>Note vocale</span>
      </div>

      <div className="seg-full" style={{ marginBottom: 14 }}><button className="on">Dépense</button><button>Revenu</button><button>Transfert</button></div>

      {/* montant */}
      <div className="c" style={{ alignItems: "center", marginBottom: 10 }}>
        <div className="t-eyebrow">Montant</div>
        <div className="t-mono" style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-.02em", marginTop: 4 }}>3 500 <span style={{ fontSize: 17, color: "var(--ink-faint)" }}>FCFA</span></div>
      </div>

      {/* canal de paiement — explicitly distinct */}
      <div style={{ marginBottom: 10 }}>
        <span className="lbl">Canal de paiement</span>
        <div className="r" style={{ gap: 7, flexWrap: "wrap" }}>
          {D.canaux.map((c, i) => (
            <span key={c.id} className={"chip" + (i === 0 ? " on" : "")} style={{ fontSize: 12 }}><Icon name={c.ic} size={13} /> {c.l}</span>
          ))}
        </div>
      </div>

      {/* compte + catégorie */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><span className="lbl">Compte source</span><div className="inp"><span>Wave</span><Icon name="chevron" size={14} className="t-faint" /></div></div>
        <div><span className="lbl">Catégorie</span><div className="inp"><span>Alimentation</span><Icon name="chevron" size={14} className="t-faint" /></div></div>
      </div>

      <div style={{ flex: 1 }} />
      <button className="btn primary block" style={{ padding: 14, fontSize: 14 }}>Enregistrer en 1 geste</button>
    </PhoneFrame>
  );
}
window.QuickEntryMob = QuickEntryMob;

// ---------- Note vocale — enregistrement ----------
function VoiceRecordMob() {
  const { Icon } = window.WF;
  const bars = [14, 26, 38, 22, 44, 30, 48, 36, 52, 28, 40, 18, 34, 46, 24, 38, 20, 44, 30, 16];
  return (
    <PhoneFrame>
      <div className="r between" style={{ marginBottom: 8, paddingTop: 4 }}>
        <div className="icon-btn" style={{ width: 34, height: 34 }}><Icon name="chevron" size={16} style={{ transform: "rotate(180deg)" }} /></div>
        <span style={{ fontWeight: 800, fontSize: 16 }}>Note vocale</span>
        <span style={{ width: 34 }} />
      </div>

      <div className="c" style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 18 }}>
        <span className="conf high" style={{ fontSize: 11 }}><span className="conf-dot" /> Écoute en cours</span>
        <div className="wave">
          {bars.map((h, i) => <i key={i} style={{ height: h, opacity: i > 13 ? .35 : .85 }} />)}
        </div>
        <div className="t-mono" style={{ fontSize: 15, color: "var(--ink-soft)" }}>0:04</div>
        <div className="wf-card wf-pad-sm" style={{ maxWidth: 280, textAlign: "center" }}>
          <div className="t-faint" style={{ fontSize: 11, marginBottom: 4 }}>Transcription en direct</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>« Wave 3 500 pour le déjeuner »</div>
        </div>
      </div>

      <div className="r" style={{ justifyContent: "center", alignItems: "center", gap: 24, marginBottom: 6 }}>
        <div className="icon-btn" style={{ width: 50, height: 50, borderRadius: 999 }}><Icon name="trash" size={19} /></div>
        <div style={{ width: 78, height: 78, borderRadius: 999, background: "var(--neg)", color: "#fff", display: "grid", placeItems: "center", boxShadow: "0 8px 22px rgba(0,0,0,.18)" }}><Icon name="stop" size={26} /></div>
        <div className="icon-btn" style={{ width: 50, height: 50, borderRadius: 999 }}><Icon name="check" size={20} /></div>
      </div>
      <div className="t-faint" style={{ fontSize: 11.5, textAlign: "center" }}>Dictez le montant, le canal et le motif.</div>
    </PhoneFrame>
  );
}
window.VoiceRecordMob = VoiceRecordMob;

// ---------- Note vocale — fiche pré-remplie + confiance ----------
function VoiceResultMob() {
  const { Icon, data: D } = window.WF;
  const V = D.voiceDraft;
  return (
    <PhoneFrame>
      <div className="r between" style={{ marginBottom: 14, paddingTop: 4 }}>
        <div className="icon-btn" style={{ width: 34, height: 34 }}><Icon name="chevron" size={16} style={{ transform: "rotate(180deg)" }} /></div>
        <span style={{ fontWeight: 800, fontSize: 16 }}>Vérifier la transaction</span>
        <span style={{ width: 34 }} />
      </div>

      <div className="wf-card wf-pad-sm r" style={{ gap: 11, marginBottom: 14, alignItems: "flex-start" }}>
        <div className="ai-av" style={{ width: 28, height: 28, fontSize: 11, borderRadius: 8 }}>C</div>
        <div style={{ flex: 1 }}>
          <div className="t-faint" style={{ fontSize: 11 }}>Dicté</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>« {V.transcript} »</div>
        </div>
      </div>

      <div className="t-eyebrow" style={{ marginBottom: 8 }}>Champs extraits</div>
      <div className="wf-card wf-pad-sm c" style={{ gap: 0 }}>
        {V.fields.map((f, i) => (
          <div className="row-line" key={f.k} style={{ padding: "11px 0", borderTop: i === 0 ? "none" : undefined }}>
            <div style={{ flex: 1 }}>
              <div className="t-faint" style={{ fontSize: 10.5, fontWeight: 600 }}>{f.k}</div>
              <div style={{ fontWeight: 600, fontSize: 13.5, marginTop: 1 }}>{f.v}</div>
            </div>
            <span className={"conf " + f.conf}><span className="conf-dot" /> {f.conf === "high" ? "Sûr" : f.conf === "med" ? "À vérifier" : "Incertain"}</span>
            <Icon name="edit" size={15} className="t-faint" style={{ marginLeft: 12 }} />
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />
      <div className="r" style={{ gap: 10 }}>
        <button className="btn block" style={{ padding: 13 }}>Corriger</button>
        <button className="btn primary block" style={{ padding: 13 }}>Valider</button>
      </div>
    </PhoneFrame>
  );
}
window.VoiceResultMob = VoiceResultMob;

// ---------- Saisie conversationnelle (langage naturel → transaction) ----------
function ChatEntryMob() {
  const { Icon } = window.WF;
  return (
    <MobShell active="Transactions" tab="txn" title="Saisie rapide" sub="Langage naturel">
      <div className="chat">
        <div className="msg u" style={{ maxWidth: "86%" }}><div className="bubble" style={{ fontSize: 13 }}>Orange Money 25000 pour le courant</div></div>
        <div className="msg ai" style={{ maxWidth: "92%" }}>
          <div className="ai-av" style={{ width: 26, height: 26, fontSize: 11 }}>C</div>
          <div className="bubble" style={{ fontSize: 12.5, width: "100%" }}>
            J'ai préparé cette transaction :
            <div className="wf-card wf-pad-sm c" style={{ gap: 8, marginTop: 10, background: "var(--paper)" }}>
              <div className="r between"><span className="t-faint" style={{ fontSize: 11 }}>Montant</span><span className="t-mono" style={{ fontWeight: 600 }}>−25 000 FCFA</span></div>
              <div className="r between"><span className="t-faint" style={{ fontSize: 11 }}>Canal · Compte</span><span style={{ fontWeight: 600, fontSize: 12.5 }}>Orange Money</span></div>
              <div className="r between"><span className="t-faint" style={{ fontSize: 11 }}>Catégorie</span><span className="r" style={{ gap: 6 }}><span className="tag-cat">Factures</span><span className="conf med" style={{ fontSize: 9.5 }}>À vérifier</span></span></div>
              <div className="r" style={{ gap: 8, marginTop: 4 }}>
                <button className="btn block" style={{ padding: 9, fontSize: 12 }}>Modifier</button>
                <button className="btn primary block" style={{ padding: 9, fontSize: 12 }}>Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="r" style={{ gap: 7, flexWrap: "wrap" }}>
        <span className="chip" style={{ fontSize: 11 }}>Cash 10000 maison</span>
        <span className="chip" style={{ fontSize: 11 }}>Reçu 150000 salaire</span>
      </div>
      <div className="ask"><Icon name="mic" size={16} /><span style={{ flex: 1 }}>Décrivez une opération…</span><div className="icon-btn" style={{ width: 30, height: 30, background: "var(--solid)", color: "var(--on-solid)", border: "none" }}><Icon name="send" size={15} /></div></div>
    </MobShell>
  );
}
window.ChatEntryMob = ChatEntryMob;

// ---------- SMS Android (automatisation complémentaire) ----------
function SmsImportMob() {
  const { Icon, money, data: D } = window.WF;
  return (
    <MobShell active="Transactions" tab="txn" title="SMS détectés" sub="Automatisation Android">
      <div className="wf-card wf-pad-sm r" style={{ gap: 11, alignItems: "flex-start" }}>
        <div className="row-ico" style={{ width: 32, height: 32, background: "var(--accent-wash)", color: "var(--accent)" }}><Icon name="phone" size={16} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 12.5 }}>Lecture SMS activée</div>
          <div className="t-muted" style={{ fontSize: 11.5, marginTop: 2, lineHeight: 1.45 }}>Fonctionnalité complémentaire. L'app reste complète sans elle — vous validez chaque proposition.</div>
        </div>
      </div>

      <div className="t-eyebrow" style={{ margin: "2px 2px 0" }}>3 opérations proposées</div>
      <div className="c" style={{ gap: 10 }}>
        {D.smsInbox.map((s, i) => (
          <div className="wf-card wf-pad-sm" key={i}>
            <div className="r between" style={{ marginBottom: 8 }}>
              <span className="r" style={{ gap: 7 }}><span className="tag-cat">{s.from}</span><span className="t-faint" style={{ fontSize: 10.5 }}>{s.when}</span></span>
              <span className={"row-amt " + (s.amt > 0 ? "t-pos" : "")} style={{ margin: 0, fontSize: 13.5 }}>{s.amt > 0 ? "+" : ""}{money(s.amt)}</span>
            </div>
            <div className="t-muted" style={{ fontSize: 11.5, lineHeight: 1.4, marginBottom: 9, fontStyle: "italic" }}>« {s.raw} »</div>
            <div className="r between">
              <span className="r" style={{ gap: 6 }}><span className="tag-cat">{s.cat}</span><span className={"conf " + s.conf} style={{ fontSize: 9.5 }}><span className="conf-dot" />{s.conf === "high" ? "Sûr" : "À vérifier"}</span></span>
              <div className="r" style={{ gap: 7 }}>
                <button className="btn" style={{ padding: "6px 11px", fontSize: 12 }}>Ignorer</button>
                <button className="btn primary" style={{ padding: "6px 12px", fontSize: 12 }}>Ajouter</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </MobShell>
  );
}
window.SmsImportMob = SmsImportMob;

// ---------- Cash : mode enveloppe allégé + réconciliation ----------
function CashEnvelopeMob() {
  const { Icon, Progress, money, data: D } = window.WF;
  const C = D.cashEnvelope;
  return (
    <MobShell active="Comptes" tab="more" title="Espèces" sub="Mode enveloppe (allégé)">
      <div className="wf-card wf-pad feature-card">
        <div className="r between">
          <span style={{ fontSize: 11, opacity: .7, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase" }}>Enveloppe cash · mai</span>
          <Icon name="cash" size={18} style={{ opacity: .8 }} />
        </div>
        <div className="kpi-val" style={{ fontSize: 28, marginTop: 10 }}>{money(C.left)} <span style={{ fontSize: 13, opacity: .55 }}>FCFA restants</span></div>
        <div style={{ marginTop: 12 }}><div className="wf-prog" style={{ height: 7, background: "rgba(255,255,255,.18)" }}><i className="wf-prog-fill" style={{ width: (C.spent / C.cap) * 100 + "%", background: "#fff" }} /></div></div>
        <div className="r between" style={{ marginTop: 8, fontSize: 11.5, opacity: .8 }}><span>Dépensé {money(C.spent)}</span><span>Plafond {money(C.cap)}</span></div>
      </div>

      <div className="wf-card wf-pad-sm">
        <div className="r between" style={{ marginBottom: 4 }}>
          <div className="r" style={{ gap: 9 }}><div className="set-ico" style={{ width: 32, height: 32 }}><Icon name="sliders" size={16} /></div><div><div style={{ fontWeight: 700, fontSize: 13 }}>Mode de suivi du cash</div><div className="t-faint" style={{ fontSize: 11 }}>Choisissez la charge de saisie</div></div></div>
        </div>
        <div className="seg-full" style={{ marginTop: 8 }}><button>Détaillé</button><button className="on">Enveloppe</button><button>Réconcilié</button></div>
        <div className="t-faint" style={{ fontSize: 11.5, marginTop: 9, lineHeight: 1.45 }}>En mode enveloppe, vous fixez un plafond et ne saisissez que l'essentiel — l'app réconcilie périodiquement.</div>
      </div>

      <div className="wf-card wf-pad-sm">
        <div className="card-head" style={{ marginBottom: 8 }}><div className="card-title" style={{ fontSize: 13.5 }}>À réconcilier</div><span className="t-faint" style={{ fontSize: 11 }}>Dernière : {C.lastReconcile}</span></div>
        <div className="c" style={{ gap: 0 }}>
          {D.reconcile.map((r, i) => (
            <div className="row-line" key={i} style={{ padding: "11px 0", borderTop: i === 0 ? "none" : undefined }}>
              <div className="row-ico" style={{ width: 32, height: 32, background: "var(--warn-wash)", color: "var(--warn)" }}><Icon name={r.kind === "sms" ? "phone" : r.kind === "dup" ? "repeat" : "tag"} size={15} /></div>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600, fontSize: 12.5 }}>{r.name}</div><div className="t-faint" style={{ fontSize: 11 }}>{r.sub}</div></div>
              <button className="btn" style={{ padding: "6px 11px", fontSize: 11.5 }}>Traiter</button>
            </div>
          ))}
        </div>
      </div>
    </MobShell>
  );
}
window.CashEnvelopeMob = CashEnvelopeMob;
