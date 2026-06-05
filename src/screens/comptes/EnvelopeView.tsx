import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon, Progress } from '../../components/primitives'
import { Card, Drawer, BottomSheet } from '../../components/ui'
import { useSetPageTitle } from '../../components/shell/pageTitle'
import { money } from '../../lib/money'
import { formatIsoDay } from '../../lib/date'
import { MoneyInput, ErrorBanner } from '../onboarding/parts'
import { useAccount, useEnvelope, useEnvelopeMutations, type EnvelopeRow } from './useComptes'
import styles from './comptes.module.css'

const MONTHS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'] // prettier-ignore
/** « 2026-05 » → « mai ». */
const monthLabel = (period: string): string => MONTHS_FR[Number(period.slice(5, 7)) - 1] ?? period

/** Vrai en dessous du breakpoint shell (mobile) — choisit Drawer vs BottomSheet. */
function useIsMobile(): boolean {
  const [m, setM] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const onChange = () => setM(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return m
}

export function EnvelopeView() {
  const { id = '' } = useParams()
  const accountQ = useAccount(id)
  const envQ = useEnvelope(id)
  useSetPageTitle('Espèces')

  if (accountQ.isPending || envQ.isPending) {
    return (
      <div className={styles.skeleton} aria-hidden="true">
        <div className={`${styles.skelCard} ${styles.skelTall}`} />
      </div>
    )
  }
  if (accountQ.isError || !accountQ.data) {
    return (
      <div className={styles.centerState}>
        <Card className={styles.skeleton}>
          <div>Compte introuvable.</div>
          <Link to="/comptes" className="btn primary">
            Retour aux comptes
          </Link>
        </Card>
      </div>
    )
  }

  const envelope = envQ.data
  return (
    <div className={styles.detailCol}>
      <div className={styles.deskHead}>
        <div>
          <div className="t-eyebrow">{accountQ.data.account.bank}</div>
          <div className={styles.pageTitle}>Espèces</div>
        </div>
        <Link to="/comptes" className="btn">
          <Icon name="chevron" size={15} className={styles.backChevron} /> Comptes
        </Link>
      </div>

      {envelope ? <Envelope env={envelope} /> : <ActivateEnvelope accountId={id} />}
    </div>
  )
}

/** État « à activer » : aucun plafond défini → on en saisit un (anti-écran-mort). */
function ActivateEnvelope({ accountId }: { accountId: string }) {
  const { create } = useEnvelopeMutations(accountId)
  const [cap, setCap] = useState(0)
  const [error, setError] = useState('')

  const submit = () => {
    setError('')
    if (!Number.isInteger(cap) || cap <= 0) return setError('Plafond positif requis.')
    create.mutate(cap, { onError: (e) => setError(e instanceof Error ? e.message : 'Erreur réseau.') })
  }

  return (
    <Card pad="pad-sm" className={styles.envActivate}>
      <div className={`row-ico ${styles.envActivateIco}`}>
        <Icon name="cash" size={22} />
      </div>
      <div className={styles.envActivateTitle}>Activer le mode enveloppe</div>
      <div className={`t-faint ${styles.envActivateText}`}>
        Fixez un plafond périodique et ne saisissez que l'essentiel — vous réconcilierez le
        reste de temps en temps, sans micro-saisie.
      </div>
      {error && <ErrorBanner message={error} />}
      <MoneyInput label="Plafond de l'enveloppe" value={cap} onChange={setCap} />
      <button
        type="button"
        className="btn primary block"
        onClick={submit}
        disabled={create.isPending}
      >
        {create.isPending ? 'Activation…' : 'Activer le mode enveloppe'}
      </button>
    </Card>
  )
}

function Envelope({ env }: { env: EnvelopeRow }) {
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [reconcileOpen, setReconcileOpen] = useState(false)
  const pct = env.cap > 0 ? (env.spent / env.cap) * 100 : 0

  return (
    <>
      {/* Hero enveloppe (porté de CashEnvelopeMob) */}
      <Card className="feature-card">
        <div className="r between">
          <span className={styles.envEyebrow}>Enveloppe cash · {monthLabel(env.period)}</span>
          <Icon name="cash" size={18} className={styles.envDim} />
        </div>
        <div className={`kpi-val ${styles.envLeft}`}>
          {money(env.left)} <span className={styles.envLeftUnit}>FCFA restants</span>
        </div>
        <div className={styles.envProg}>
          <Progress pct={pct} colorToken="on-solid" />
        </div>
        <div className={`r between ${styles.envProgFoot}`}>
          <span>Dépensé {money(env.spent)}</span>
          <span>Plafond {money(env.cap)}</span>
        </div>
      </Card>

      {/* Mode de suivi du cash — segment (Enveloppe actif ; Détaillé → détail compte ;
          Réconcilié honnêtement différé). Anti-bouton-mort sur les 3. */}
      <Card pad="pad-sm">
        <div className="r">
          <div className={`set-ico ${styles.modeIco}`}>
            <Icon name="sliders" size={16} />
          </div>
          <div>
            <div className={styles.modeTitle}>Mode de suivi du cash</div>
            <div className="t-faint">Choisissez la charge de saisie</div>
          </div>
        </div>
        <div className={`seg-full ${styles.modeSeg}`} role="group" aria-label="Mode de suivi">
          <button type="button" onClick={() => void navigate(`/comptes/${env.accountId}`)}>
            Détaillé
          </button>
          <button type="button" className="on" aria-pressed="true">
            Enveloppe
          </button>
          <button type="button" className={styles.soon} disabled title="Bientôt disponible">
            Réconcilié
          </button>
        </div>
        <div className={`t-faint ${styles.modeText}`}>
          En mode enveloppe, vous fixez un plafond et ne saisissez que l'essentiel — vous
          réconciliez périodiquement.
        </div>
      </Card>

      {/* Réconciliation — le geste central (déclarer le reste). */}
      <Card pad="pad-sm">
        <div className={`r between ${styles.reconHead}`}>
          <div className="card-title">Réconciliation</div>
          <span className="t-faint">
            {env.lastReconciledAt ? `Dernière : ${formatIsoDay(env.lastReconciledAt)}` : 'Jamais'}
          </span>
        </div>
        <div className={`t-faint ${styles.reconText}`}>
          Déclarez ce qu'il vous reste réellement en espèces — l'app enregistre la dépense
          correspondante.
        </div>
        <button type="button" className="btn primary block" onClick={() => setReconcileOpen(true)}>
          <Icon name="check" size={15} /> Déclarer le reste
        </button>
      </Card>

      {isMobile ? (
        <BottomSheet open={reconcileOpen} onClose={() => setReconcileOpen(false)} title="Réconcilier">
          <ReconcileForm env={env} onClose={() => setReconcileOpen(false)} />
        </BottomSheet>
      ) : (
        <Drawer open={reconcileOpen} onClose={() => setReconcileOpen(false)} title="Réconcilier l'enveloppe">
          <ReconcileForm env={env} onClose={() => setReconcileOpen(false)} />
        </Drawer>
      )}
    </>
  )
}

/**
 * Geste de réconciliation : saisie du reste → RÉCAP (la validation explicite, règle
 * capture) → confirmation → transaction cash créée. Pas de création au submit direct.
 */
function ReconcileForm({ env, onClose }: { env: EnvelopeRow; onClose: () => void }) {
  const { reconcile } = useEnvelopeMutations(env.accountId)
  const [step, setStep] = useState<'input' | 'recap'>('input')
  const [remaining, setRemaining] = useState(env.left)
  const [error, setError] = useState('')

  const spend = env.left - remaining

  const toRecap = () => {
    setError('')
    if (!Number.isInteger(remaining) || remaining < 0) return setError('Reste positif ou nul requis.')
    // Garde honnête côté UI (le 400 serveur reste le filet).
    if (remaining > env.left)
      return setError(
        'Le reste déclaré dépasse le solde suivi — vérifiez le montant ou ajoutez un revenu.',
      )
    setStep('recap')
  }

  const confirm = () => {
    setError('')
    reconcile.mutate(remaining, {
      onSuccess: onClose,
      onError: (e) => setError(e instanceof Error ? e.message : 'Erreur réseau.'),
    })
  }

  if (step === 'input') {
    return (
      <div className={styles.formFields}>
        {error && <ErrorBanner message={error} />}
        <div className={`t-faint ${styles.reconText}`}>
          Solde suivi de l'enveloppe : <span className="t-mono">{money(env.left)}</span> FCFA.
        </div>
        <MoneyInput label="Reste réel en espèces" value={remaining} onChange={setRemaining} />
        <div className={styles.drawerActions}>
          <button type="button" className="btn block" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="btn primary block" onClick={toRecap}>
            Continuer
          </button>
        </div>
      </div>
    )
  }

  // step === 'recap' — récap AVANT confirmation = la validation explicite.
  return (
    <div className={styles.formFields}>
      {error && <ErrorBanner message={error} />}
      <Card pad="pad-sm" className={styles.recapCard}>
        {spend > 0 ? (
          <>
            <div className={styles.recapLead}>Vous allez enregistrer une dépense de</div>
            <div className={`kpi-val ${styles.recapAmount}`}>
              {money(spend)} <span className="kpi-cur">FCFA</span>
            </div>
            <div className="t-faint">en espèces — l'enveloppe passera à {money(remaining)} FCFA.</div>
          </>
        ) : (
          <div className={styles.recapLead}>
            Le reste déclaré égale le solde suivi : aucune dépense à enregistrer, on met
            simplement à jour la date de réconciliation.
          </div>
        )}
      </Card>
      <div className={styles.drawerActions}>
        <button
          type="button"
          className="btn block"
          onClick={() => setStep('input')}
          disabled={reconcile.isPending}
        >
          Retour
        </button>
        <button
          type="button"
          className="btn primary block"
          onClick={confirm}
          disabled={reconcile.isPending}
        >
          {reconcile.isPending ? 'Enregistrement…' : spend > 0 ? 'Confirmer la dépense' : 'Confirmer'}
        </button>
      </div>
    </div>
  )
}
