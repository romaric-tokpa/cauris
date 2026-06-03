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
        <DCSection id="cover" title="Sommaire & légende" subtitle="Vue d'ensemble du dossier de wireframes">
          <DCArtboard id="cover-1" label="Orientation · modules, parcours, légende" width={1440} height={920}><Cover /></DCArtboard>
        </DCSection>

        <DCSection id="dash-desk" title="Dashboard — Desktop" subtitle="1440 px · deux patterns de navigation">
          <DCArtboard id="desk-a" label="A · Cockpit classique (sidebar gauche)" width={1440} height={1320}><DeskA /></DCArtboard>
          <DCArtboard id="desk-b" label="B · Signal d'abord (nav horizontale)" width={1440} height={1100}><DeskB /></DCArtboard>
        </DCSection>

        <DCSection id="dash-mob" title="Dashboard — Mobile" subtitle="390 px · écran complet (vue déroulante)">
          <DCArtboard id="mob-a" label="A · Barre basse + bouton flottant (validé)" width={390} height={1240}><MobileA /></DCArtboard>
          <DCArtboard id="mob-b" label="B · Feed priorité + pill nav" width={390} height={1140}><MobileB /></DCArtboard>
        </DCSection>

        <DCSection id="txn" title="Transactions" subtitle="Liste, filtres et ajout (drawer / sheet) — parcours 2">
          <DCArtboard id="txn-desk" label="Desktop · Liste + drawer « Ajouter »" width={1440} height={1075}><TxnDesk /></DCArtboard>
          <DCArtboard id="txn-detail" label="Desktop · Détail (drawer)" width={1440} height={900}><TxnDetailDesk /></DCArtboard>
          <DCArtboard id="txn-edit" label="Desktop · Modifier (drawer)" width={1440} height={900}><TxnEditDesk /></DCArtboard>
          <DCArtboard id="txn-recurring" label="Desktop · Récurrentes" width={1440} height={820}><TxnRecurringDesk /></DCArtboard>
          <DCArtboard id="txn-transfer" label="Desktop · Transfert interne (drawer)" width={1440} height={900}><TransferDesk /></DCArtboard>
          <DCArtboard id="txn-mob" label="Mobile · Liste" width={390} height={1010}><TxnMob /></DCArtboard>
          <DCArtboard id="txn-add" label="Mobile · Ajouter (bottom sheet)" width={390} height={920}><TxnAddMob /></DCArtboard>
          <DCArtboard id="txn-transfer-mob" label="Mobile · Transfert interne (sheet)" width={390} height={844}><TransferMob /></DCArtboard>
        </DCSection>

        <DCSection id="budget" title="Budgets" subtitle="Liste → détail → transactions liées — parcours 3">
          <DCArtboard id="budget-desk" label="Desktop · Liste des budgets" width={1440} height={900}><BudgetDesk /></DCArtboard>
          <DCArtboard id="budget-form" label="Desktop · Créer un budget (drawer)" width={1440} height={820}><BudgetFormDesk /></DCArtboard>
          <DCArtboard id="budget-detail" label="Desktop · Détail (dépassement)" width={1440} height={970}><BudgetDetailDesk /></DCArtboard>
          <DCArtboard id="budget-archived" label="Desktop · Budgets archivés" width={1440} height={720}><BudgetArchivedDesk /></DCArtboard>
          <DCArtboard id="budget-mob" label="Mobile · Liste" width={390} height={1080}><BudgetMob /></DCArtboard>
        </DCSection>

        <DCSection id="capture" title="Capture multi-canal" subtitle="Saisie rapide, note vocale, langage naturel, SMS Android, cash allégé — parcours 1 & 2">
          <DCArtboard id="cap-hub" label="Mobile · Hub d'entrée (le « + »)" width={390} height={844}><CaptureHubMob /></DCArtboard>
          <DCArtboard id="cap-quick" label="Mobile · Saisie rapide (canal de paiement)" width={390} height={844}><QuickEntryMob /></DCArtboard>
          <DCArtboard id="cap-voice" label="Mobile · Note vocale — enregistrement" width={390} height={844}><VoiceRecordMob /></DCArtboard>
          <DCArtboard id="cap-voice-res" label="Mobile · Note vocale — fiche + confiance" width={390} height={844}><VoiceResultMob /></DCArtboard>
          <DCArtboard id="cap-chat" label="Mobile · Saisie conversationnelle" width={390} height={844}><ChatEntryMob /></DCArtboard>
          <DCArtboard id="cap-sms" label="Mobile · SMS Android (complémentaire)" width={390} height={980}><SmsImportMob /></DCArtboard>
          <DCArtboard id="cap-cash" label="Mobile · Cash enveloppe + réconciliation" width={390} height={1040}><CashEnvelopeMob /></DCArtboard>
        </DCSection>

        <DCSection id="obj" title="Objectifs" subtitle="Détail + ajout de contribution — parcours 4">
          <DCArtboard id="obj-desk" label="Desktop · Détail + drawer contribution" width={1440} height={970}><ObjDetailDesk /></DCArtboard>
          <DCArtboard id="obj-create" label="Desktop · Nouvel objectif (drawer)" width={1440} height={760}><ObjCreateDesk /></DCArtboard>
          <DCArtboard id="obj-history" label="Desktop · Historique des contributions" width={1440} height={760}><ObjHistoryDesk /></DCArtboard>
          <DCArtboard id="obj-mob" label="Mobile · Liste des objectifs" width={390} height={840}><ObjMob /></DCArtboard>
          <DCArtboard id="obj-create-mob" label="Mobile · Nouvel objectif" width={390} height={920}><ObjCreateMob /></DCArtboard>
        </DCSection>

        <DCSection id="comptes" title="Comptes" subtitle="Liste → détail → opérations du compte — parcours 5">
          <DCArtboard id="comptes-desk" label="Desktop · Liste des comptes" width={1440} height={1020}><ComptesDesk /></DCArtboard>
          <DCArtboard id="acc-add" label="Desktop · Ajouter un compte (drawer)" width={1440} height={1020}><AccountAddDesk /></DCArtboard>
          <DCArtboard id="acc-edit" label="Desktop · Modifier un compte (drawer)" width={1440} height={1020}><AccountEditDesk /></DCArtboard>
          <DCArtboard id="compte-mob" label="Mobile · Détail compte" width={390} height={980}><CompteMobDetail /></DCArtboard>
          <DCArtboard id="acc-add-mob" label="Mobile · Ajouter un compte" width={390} height={920}><AccountAddMob /></DCArtboard>
        </DCSection>

        <DCSection id="analytics" title="Analytics" subtitle="Overview, catégories, tendances, budget vs réel — parcours 7">
          <DCArtboard id="ana-desk" label="Desktop · Overview" width={1440} height={1040}><AnalyticsDesk /></DCArtboard>
          <DCArtboard id="ana-cat" label="Desktop · Catégories" width={1440} height={900}><AnaCategoriesDesk /></DCArtboard>
          <DCArtboard id="ana-trend" label="Desktop · Tendances" width={1440} height={1000}><AnaTrendsDesk /></DCArtboard>
          <DCArtboard id="ana-budget" label="Desktop · Budget vs réel" width={1440} height={820}><AnaBudgetDesk /></DCArtboard>
          <DCArtboard id="ana-export" label="Desktop · Exporter le rapport (drawer)" width={1440} height={900}><AnaExportDesk /></DCArtboard>
          <DCArtboard id="ana-period" label="Desktop · Période (drawer + calendrier)" width={1440} height={900}><AnaPeriodDesk /></DCArtboard>
          <DCArtboard id="ana-mob" label="Mobile · Overview" width={390} height={1080}><AnalyticsMob /></DCArtboard>
        </DCSection>

        <DCSection id="ai" title="Assistant IA" subtitle="Insights, assistant conversationnel, prévisions et anomalies">
          <DCArtboard id="ai-assistant" label="Desktop · Assistant financier" width={1440} height={900}><AssistantDesk /></DCArtboard>
          <DCArtboard id="ai-insights" label="Desktop · Insights" width={1440} height={720}><AIInsightsDesk /></DCArtboard>
          <DCArtboard id="ai-insights-mob" label="Mobile · Insights (onglet)" width={390} height={1000}><AIInsightsMob /></DCArtboard>
          <DCArtboard id="ai-prev" label="Desktop · Prévisions" width={1440} height={980}><PrevisionsDesk /></DCArtboard>
          <DCArtboard id="ai-anomalies" label="Desktop · Anomalies & alertes" width={1440} height={900}><AnomaliesDesk /></DCArtboard>
          <DCArtboard id="ai-mob" label="Mobile · Assistant" width={390} height={960}><AssistantMob /></DCArtboard>
        </DCSection>

        <DCSection id="coach" title="Coach IA — transparence & gouvernance" subtitle="4 couches (observé / analyse / confiance / reco), dégradation gracieuse, ton & mémoire — parcours 6">
          <DCArtboard id="coach-desk" label="Desktop · Avis du coach (4 couches)" width={1440} height={840}><CoachAdviceDesk /></DCArtboard>
          <DCArtboard id="coach-mob" label="Mobile · Avis du coach (4 couches)" width={390} height={1000}><CoachAdviceMob /></DCArtboard>
          <DCArtboard id="coach-degraded" label="Mobile · Dégradation gracieuse" width={390} height={1000}><CoachDegradedMob /></DCArtboard>
          <DCArtboard id="coach-settings" label="Mobile · Réglages (ton, fréquence, mémoire)" width={390} height={1120}><CoachSettingsMob /></DCArtboard>
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
          <DCArtboard id="profile-edit" label="Desktop · Profil (édition)" width={1440} height={760}><ProfileEditDesk /></DCArtboard>
          <DCArtboard id="params-mob" label="Mobile · Réglages" width={390} height={1420}><ParamsMob /></DCArtboard>
        </DCSection>

        <DCSection id="params-pages" title="Paramètres — sous-pages" subtitle="Catégories, import/export, sauvegarde, aide, push, biométrie">
          <DCArtboard id="set-cat" label="Desktop · Catégories" width={1440} height={960}><ParamsCategoriesDesk /></DCArtboard>
          <DCArtboard id="set-cat-mob" label="Mobile · Catégories" width={390} height={980}><ParamsCategoriesMob /></DCArtboard>
          <DCArtboard id="set-io" label="Desktop · Import / Export" width={1440} height={900}><ParamsImportExportDesk /></DCArtboard>
          <DCArtboard id="set-io-mob" label="Mobile · Import / Export" width={390} height={1020}><ParamsImportExportMob /></DCArtboard>
          <DCArtboard id="set-backup" label="Desktop · Sauvegarde & restauration" width={1440} height={960}><ParamsBackupDesk /></DCArtboard>
          <DCArtboard id="set-backup-mob" label="Mobile · Sauvegarde" width={390} height={1040}><ParamsBackupMob /></DCArtboard>
          <DCArtboard id="set-help" label="Desktop · Centre d'aide" width={1440} height={900}><ParamsHelpDesk /></DCArtboard>
          <DCArtboard id="set-help-mob" label="Mobile · Centre d'aide" width={390} height={1000}><ParamsHelpMob /></DCArtboard>
          <DCArtboard id="set-push" label="Desktop · Préférences push" width={1440} height={960}><ParamsPushDesk /></DCArtboard>
          <DCArtboard id="set-push-mob" label="Mobile · Préférences push" width={390} height={1000}><ParamsPushMob /></DCArtboard>
          <DCArtboard id="set-bio" label="Mobile · Biométrie (setup)" width={390} height={1000}><BiometricMob /></DCArtboard>
        </DCSection>

        <DCSection id="auth" title="Authentification" subtitle="Connexion et inscription (mobile)">
          <DCArtboard id="auth-login" label="Mobile · Connexion" width={390} height={844}><AuthLogin /></DCArtboard>
          <DCArtboard id="auth-signup" label="Mobile · Inscription" width={390} height={844}><AuthSignup /></DCArtboard>
          <DCArtboard id="auth-forgot" label="Mobile · Mot de passe oublié" width={390} height={844}><AuthForgotMob /></DCArtboard>
          <DCArtboard id="auth-reset" label="Mobile · Réinitialisation" width={390} height={844}><AuthResetMob /></DCArtboard>
        </DCSection>

        <DCSection id="onboarding" title="Onboarding" subtitle="5 étapes de première prise en main — parcours 1">
          <DCArtboard id="onb-1" label="Étape 1 · Profil" width={390} height={844}><OnbProfil /></DCArtboard>
          <DCArtboard id="onb-2" label="Étape 2 · Préférences" width={390} height={844}><OnbPrefs /></DCArtboard>
          <DCArtboard id="onb-3" label="Étape 3 · Revenus / dépenses" width={390} height={844}><OnbRevenus /></DCArtboard>
          <DCArtboard id="onb-4" label="Étape 4 · Premier objectif" width={390} height={844}><OnbObjectif /></DCArtboard>
          <DCArtboard id="onb-5" label="Étape 5 · Comptes initiaux" width={390} height={844}><OnbComptes /></DCArtboard>
          <DCArtboard id="onb-cap" label="Cold start 1 · Modes de capture" width={390} height={844}><OnbCapture /></DCArtboard>
          <DCArtboard id="onb-can" label="Cold start 2 · Canaux dominants" width={390} height={844}><OnbCanaux /></DCArtboard>
          <DCArtboard id="onb-coach" label="Cold start 3 · Calibrage du coach" width={390} height={844}><OnbCoach /></DCArtboard>
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
