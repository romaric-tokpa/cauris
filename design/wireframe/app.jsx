// app.jsx — assemble wireframes on the design canvas + Tweaks (dark mode + accent)
const { useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false,
  "accent": "#2f5d8c",
  "brandNav": false,
  "glass": true
}/*EDITMODE-END*/;

const ACCENTS = ["#2f5d8c", "#1f7a5b", "#c2603f", "#5a55c8", "#9d4068"];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute("data-theme", t.dark ? "dark" : "light");
    r.setAttribute("data-glass", t.glass ? "on" : "off");
    r.style.setProperty("--accent", t.accent);
    if (t.brandNav) {
      r.style.setProperty("--solid", "var(--accent)");
      r.style.setProperty("--on-solid", "#ffffff");
      r.style.setProperty("--feature", "var(--accent)");
      r.style.setProperty("--feature-ink", "#ffffff");
    } else {
      ["--solid", "--on-solid", "--feature", "--feature-ink"].forEach((p) => r.style.removeProperty(p));
    }
  }, [t.dark, t.accent, t.brandNav, t.glass]);
  return (
    <React.Fragment>
      <DesignCanvas>
        <DCSection id="dash-desk" title="Dashboard — Desktop" subtitle="1440 px · deux patterns de navigation">
          <DCArtboard id="desk-a" label="A · Cockpit classique (sidebar gauche)" width={1440} height={1320}><DeskA /></DCArtboard>
          <DCArtboard id="desk-b" label="B · Signal d'abord (nav horizontale)" width={1440} height={1100}><DeskB /></DCArtboard>
        </DCSection>

        <DCSection id="dash-mob" title="Dashboard — Mobile" subtitle="390 px · écran complet (vue déroulante)">
          <DCArtboard id="mob-a" label="A · Barre basse + bouton flottant (validé)" width={390} height={1140}><MobileA /></DCArtboard>
          <DCArtboard id="mob-b" label="B · Feed priorité + pill nav" width={390} height={1140}><MobileB /></DCArtboard>
        </DCSection>

        <DCSection id="txn" title="Transactions" subtitle="Liste, filtres et ajout (drawer / sheet) — parcours 2">
          <DCArtboard id="txn-desk" label="Desktop · Liste + drawer « Ajouter »" width={1440} height={1075}><TxnDesk /></DCArtboard>
          <DCArtboard id="txn-mob" label="Mobile · Liste" width={390} height={1010}><TxnMob /></DCArtboard>
          <DCArtboard id="txn-add" label="Mobile · Ajouter (bottom sheet)" width={390} height={920}><TxnAddMob /></DCArtboard>
        </DCSection>

        <DCSection id="budget" title="Budgets" subtitle="Liste → détail → transactions liées — parcours 3">
          <DCArtboard id="budget-desk" label="Desktop · Liste des budgets" width={1440} height={900}><BudgetDesk /></DCArtboard>
          <DCArtboard id="budget-detail" label="Desktop · Détail (dépassement)" width={1440} height={970}><BudgetDetailDesk /></DCArtboard>
          <DCArtboard id="budget-mob" label="Mobile · Liste" width={390} height={1080}><BudgetMob /></DCArtboard>
        </DCSection>

        <DCSection id="obj" title="Objectifs" subtitle="Détail + ajout de contribution — parcours 4">
          <DCArtboard id="obj-desk" label="Desktop · Détail + drawer contribution" width={1440} height={970}><ObjDetailDesk /></DCArtboard>
          <DCArtboard id="obj-mob" label="Mobile · Liste des objectifs" width={390} height={840}><ObjMob /></DCArtboard>
        </DCSection>

        <DCSection id="comptes" title="Comptes" subtitle="Liste → détail → opérations du compte — parcours 5">
          <DCArtboard id="comptes-desk" label="Desktop · Liste des comptes" width={1440} height={840}><ComptesDesk /></DCArtboard>
          <DCArtboard id="compte-mob" label="Mobile · Détail compte" width={390} height={980}><CompteMobDetail /></DCArtboard>
        </DCSection>

        <DCSection id="analytics" title="Analytics" subtitle="Overview, catégories, tendances, budget vs réel — parcours 7">
          <DCArtboard id="ana-desk" label="Desktop · Overview" width={1440} height={1040}><AnalyticsDesk /></DCArtboard>
          <DCArtboard id="ana-cat" label="Desktop · Catégories" width={1440} height={900}><AnaCategoriesDesk /></DCArtboard>
          <DCArtboard id="ana-trend" label="Desktop · Tendances" width={1440} height={1000}><AnaTrendsDesk /></DCArtboard>
          <DCArtboard id="ana-budget" label="Desktop · Budget vs réel" width={1440} height={820}><AnaBudgetDesk /></DCArtboard>
          <DCArtboard id="ana-mob" label="Mobile · Overview" width={390} height={1080}><AnalyticsMob /></DCArtboard>
        </DCSection>

        <DCSection id="ai" title="Assistant IA" subtitle="Insights, assistant conversationnel, prévisions et anomalies">
          <DCArtboard id="ai-assistant" label="Desktop · Assistant financier" width={1440} height={900}><AssistantDesk /></DCArtboard>
          <DCArtboard id="ai-insights" label="Desktop · Insights" width={1440} height={720}><AIInsightsDesk /></DCArtboard>
          <DCArtboard id="ai-prev" label="Desktop · Prévisions" width={1440} height={980}><PrevisionsDesk /></DCArtboard>
          <DCArtboard id="ai-anomalies" label="Desktop · Anomalies & alertes" width={1440} height={900}><AnomaliesDesk /></DCArtboard>
          <DCArtboard id="ai-mob" label="Mobile · Assistant" width={390} height={900}><AssistantMob /></DCArtboard>
        </DCSection>

        <DCSection id="pret" title="Prêt / Dette" subtitle="Vue générale, amortissement, paiements, simulation — parcours 6">
          <DCArtboard id="pret-desk" label="Desktop · Vue générale" width={1440} height={1030}><PretDesk /></DCArtboard>
          <DCArtboard id="pret-amort" label="Desktop · Amortissement" width={1440} height={920}><PretAmortDesk /></DCArtboard>
          <DCArtboard id="pret-pay" label="Desktop · Paiements" width={1440} height={820}><PretPaiementsDesk /></DCArtboard>
          <DCArtboard id="pret-sim" label="Desktop · Simulation" width={1440} height={820}><PretSimDesk /></DCArtboard>
          <DCArtboard id="pret-mob" label="Mobile · Détail prêt" width={390} height={1080}><PretMob /></DCArtboard>
        </DCSection>

        <DCSection id="notifs" title="Notifications" subtitle="Centre d'alertes et rappels — parcours 8">
          <DCArtboard id="notif-desk" label="Desktop · Liste" width={1440} height={960}><NotifDesk /></DCArtboard>
          <DCArtboard id="notif-mob" label="Mobile · Liste" width={390} height={1000}><NotifMob /></DCArtboard>
        </DCSection>

        <DCSection id="params" title="Paramètres" subtitle="Profil, préférences, sécurité, données">
          <DCArtboard id="params-desk" label="Desktop · Préférences + sécurité" width={1440} height={900}><ParamsDesk /></DCArtboard>
          <DCArtboard id="params-mob" label="Mobile · Réglages" width={390} height={1120}><ParamsMob /></DCArtboard>
        </DCSection>

        <DCSection id="auth" title="Authentification" subtitle="Connexion et inscription (mobile)">
          <DCArtboard id="auth-login" label="Mobile · Connexion" width={390} height={844}><AuthLogin /></DCArtboard>
          <DCArtboard id="auth-signup" label="Mobile · Inscription" width={390} height={844}><AuthSignup /></DCArtboard>
        </DCSection>

        <DCSection id="onboarding" title="Onboarding" subtitle="5 étapes de première prise en main — parcours 1">
          <DCArtboard id="onb-1" label="Étape 1 · Profil" width={390} height={844}><OnbProfil /></DCArtboard>
          <DCArtboard id="onb-2" label="Étape 2 · Préférences" width={390} height={844}><OnbPrefs /></DCArtboard>
          <DCArtboard id="onb-3" label="Étape 3 · Revenus / dépenses" width={390} height={844}><OnbRevenus /></DCArtboard>
          <DCArtboard id="onb-4" label="Étape 4 · Premier objectif" width={390} height={844}><OnbObjectif /></DCArtboard>
          <DCArtboard id="onb-5" label="Étape 5 · Comptes initiaux" width={390} height={844}><OnbComptes /></DCArtboard>
        </DCSection>

        <DCSection id="etats" title="États" subtitle="Vide, confirmation, erreur — soignés pour la confiance">
          <DCArtboard id="state-empty" label="Mobile · État vide" width={390} height={844}><EmptyState /></DCArtboard>
          <DCArtboard id="state-success" label="Mobile · Confirmation" width={390} height={844}><SuccessState /></DCArtboard>
          <DCArtboard id="state-error" label="Mobile · Erreur" width={390} height={844}><ErrorState /></DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Thème" />
        <TweakToggle label="Mode sombre" value={t.dark} onChange={(v) => setTweak("dark", v)} />
        <TweakToggle label="Verre dépoli (Liquid Glass)" value={t.glass} onChange={(v) => setTweak("glass", v)} />
        <TweakColor label="Couleur d'accent" value={t.accent} options={ACCENTS} onChange={(v) => setTweak("accent", v)} />
        <TweakToggle label="Accent sur la navigation" value={t.brandNav} onChange={(v) => setTweak("brandNav", v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
