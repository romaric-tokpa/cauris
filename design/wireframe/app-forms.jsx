// app-forms.jsx — Dossier dédié : écrans d'actions qui n'avaient aucun formulaire
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
        <DCSection id="ana-actions" title="Analytics — actions" subtitle="Exporter le rapport · Période (formulaires en drawer)">
          <DCArtboard id="ana-export" label="Desktop · Exporter le rapport (drawer)" width={1440} height={900}><AnaExportDesk /></DCArtboard>
          <DCArtboard id="ana-period" label="Desktop · Période (drawer + calendrier)" width={1440} height={900}><AnaPeriodDesk /></DCArtboard>
        </DCSection>

        <DCSection id="set-pages" title="Paramètres — sous-pages" subtitle="Catégories · Import/Export · Sauvegarde · Centre d'aide">
          <DCArtboard id="set-cat" label="Desktop · Catégories" width={1440} height={960}><ParamsCategoriesDesk /></DCArtboard>
          <DCArtboard id="set-cat-mob" label="Mobile · Catégories" width={390} height={980}><ParamsCategoriesMob /></DCArtboard>
          <DCArtboard id="set-io" label="Desktop · Import / Export" width={1440} height={900}><ParamsImportExportDesk /></DCArtboard>
          <DCArtboard id="set-io-mob" label="Mobile · Import / Export" width={390} height={1020}><ParamsImportExportMob /></DCArtboard>
          <DCArtboard id="set-backup" label="Desktop · Sauvegarde & restauration" width={1440} height={960}><ParamsBackupDesk /></DCArtboard>
          <DCArtboard id="set-backup-mob" label="Mobile · Sauvegarde" width={390} height={1040}><ParamsBackupMob /></DCArtboard>
          <DCArtboard id="set-help" label="Desktop · Centre d'aide" width={1440} height={900}><ParamsHelpDesk /></DCArtboard>
          <DCArtboard id="set-help-mob" label="Mobile · Centre d'aide" width={390} height={1000}><ParamsHelpMob /></DCArtboard>
        </DCSection>

        <DCSection id="ai-insights" title="Assistant — Insights" subtitle="Onglet Insights (desktop + mobile)">
          <DCArtboard id="ai-insights-desk" label="Desktop · Insights" width={1440} height={720}><AIInsightsDesk /></DCArtboard>
          <DCArtboard id="ai-insights-mob" label="Mobile · Insights (onglet)" width={390} height={1000}><AIInsightsMob /></DCArtboard>
        </DCSection>

        <DCSection id="set-security" title="Paramètres — notifications & sécurité" subtitle="Préférences push · Biométrie">
          <DCArtboard id="set-push" label="Desktop · Préférences push" width={1440} height={960}><ParamsPushDesk /></DCArtboard>
          <DCArtboard id="set-push-mob" label="Mobile · Préférences push" width={390} height={1000}><ParamsPushMob /></DCArtboard>
          <DCArtboard id="set-bio" label="Mobile · Biométrie (setup)" width={390} height={1000}><BiometricMob /></DCArtboard>
        </DCSection>

        <DCSection id="auth-rec" title="Authentification — récupération" subtitle="Mot de passe oublié · Réinitialisation">
          <DCArtboard id="auth-forgot" label="Mobile · Mot de passe oublié" width={390} height={844}><AuthForgotMob /></DCArtboard>
          <DCArtboard id="auth-reset" label="Mobile · Réinitialisation" width={390} height={844}><AuthResetMob /></DCArtboard>
        </DCSection>

        <DCSection id="txn-crud" title="Transactions — formulaires" subtitle="Détail · Modifier · Récurrentes · Transfert interne">
          <DCArtboard id="txn-detail" label="Desktop · Détail (drawer)" width={1440} height={900}><TxnDetailDesk /></DCArtboard>
          <DCArtboard id="txn-edit" label="Desktop · Modifier (drawer)" width={1440} height={900}><TxnEditDesk /></DCArtboard>
          <DCArtboard id="txn-recurring" label="Desktop · Transactions récurrentes" width={1440} height={820}><TxnRecurringDesk /></DCArtboard>
          <DCArtboard id="txn-transfer" label="Desktop · Transfert interne (drawer)" width={1440} height={900}><TransferDesk /></DCArtboard>
          <DCArtboard id="txn-transfer-mob" label="Mobile · Transfert interne (sheet)" width={390} height={844}><TransferMob /></DCArtboard>
        </DCSection>

        <DCSection id="budget-crud" title="Budgets — formulaires" subtitle="Créer / modifier · Archivés">
          <DCArtboard id="budget-form" label="Desktop · Créer un budget (drawer)" width={1440} height={820}><BudgetFormDesk /></DCArtboard>
          <DCArtboard id="budget-archived" label="Desktop · Budgets archivés" width={1440} height={720}><BudgetArchivedDesk /></DCArtboard>
        </DCSection>

        <DCSection id="obj-crud" title="Objectifs — formulaires" subtitle="Créer · Historique des contributions">
          <DCArtboard id="obj-create" label="Desktop · Nouvel objectif (drawer)" width={1440} height={760}><ObjCreateDesk /></DCArtboard>
          <DCArtboard id="obj-create-mob" label="Mobile · Nouvel objectif" width={390} height={920}><ObjCreateMob /></DCArtboard>
          <DCArtboard id="obj-history" label="Desktop · Historique des contributions" width={1440} height={760}><ObjHistoryDesk /></DCArtboard>
        </DCSection>

        <DCSection id="acc-crud" title="Comptes — formulaires" subtitle="Ajouter · Modifier">
          <DCArtboard id="acc-add" label="Desktop · Ajouter un compte (drawer)" width={1440} height={820}><AccountAddDesk /></DCArtboard>
          <DCArtboard id="acc-add-mob" label="Mobile · Ajouter un compte" width={390} height={920}><AccountAddMob /></DCArtboard>
          <DCArtboard id="acc-edit" label="Desktop · Modifier un compte (drawer)" width={1440} height={820}><AccountEditDesk /></DCArtboard>
        </DCSection>

        <DCSection id="profile-crud" title="Paramètres — profil" subtitle="Édition du profil utilisateur">
          <DCArtboard id="profile-edit" label="Desktop · Profil (édition)" width={1440} height={760}><ProfileEditDesk /></DCArtboard>
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
