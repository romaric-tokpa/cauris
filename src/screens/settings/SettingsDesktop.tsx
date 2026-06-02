import { Link } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card, Switch } from '../../components/ui'
import { SettingRow, FixedValue } from './parts'
import { initial, type BlockedSummary } from './useSettings'
import styles from './settings.module.css'

/** Nav latérale SET_NAV (1:1 wireframe). Profil/Préférences/Sécurité = ancres vers les
 *  sections présentes ; les 4 autres sont « à venir » (atténuées, non cliquables). */
const NAV_ANCHORS = [
  { icon: 'user', label: 'Profil', href: '#profil' },
  { icon: 'gear', label: 'Préférences', href: '#preferences' },
  { icon: 'shield', label: 'Sécurité', href: '#securite' },
] as const
const NAV_SOON = [
  { icon: 'tag', label: 'Catégories' },
  { icon: 'download', label: 'Import / Export' },
  { icon: 'card', label: 'Sauvegarde' },
  { icon: 'help', label: "Centre d'aide" },
] as const

interface Props {
  name: string | undefined
  email: string | undefined
  dark: boolean
  setDark: (v: boolean) => void
  blocked: BlockedSummary
  onEditPassword: () => void
  onLogout: () => void
  className?: string
}

/** Paramètres — desktop (ParamsDesk de screens-settings.jsx) : nav latérale + 3 sections. */
export function SettingsDesktop({
  name,
  email,
  dark,
  setDark,
  blocked,
  onEditPassword,
  onLogout,
  className = '',
}: Props) {
  return (
    <div className={className}>
      <div>
        <div className="t-eyebrow">Compte personnel</div>
        <div className={styles.pageTitle}>Paramètres</div>
      </div>

      <div className={styles.grid}>
        {/* nav latérale */}
        <nav className="set-nav" aria-label="Sections des paramètres">
          {NAV_ANCHORS.map((n) => (
            <a key={n.label} href={n.href} className="si2">
              <Icon name={n.icon} size={17} /> {n.label}
            </a>
          ))}
          {NAV_SOON.map((n) => (
            <span key={n.label} className={`si2 ${styles.soon}`} aria-disabled="true" title="Bientôt disponible">
              <Icon name={n.icon} size={17} /> {n.label}
            </span>
          ))}
        </nav>

        {/* colonne de contenu */}
        <div className={styles.content}>
          {/* Profil — lecture seule (nom + email réels de la session) */}
          <Card id="profil" className={`r between ${styles.profileCard}`}>
            <div className={`r ${styles.profileLeft}`}>
              <div className={`avatar ${styles.avatarLg}`}>{initial(name)}</div>
              <div>
                <div className={styles.profileName}>{name ?? '—'}</div>
                <div className={`t-faint ${styles.profileMeta}`}>{email ?? '—'}</div>
              </div>
            </div>
            <button type="button" className={`btn ${styles.soon}`} disabled title="Bientôt disponible">
              <Icon name="edit" size={15} /> Modifier
            </button>
          </Card>

          {/* Préférences */}
          <Card id="preferences">
            <div className={`card-title ${styles.cardTitle}`}>Préférences</div>
            <SettingRow icon="wallet" label="Devise" sub="Affichage des montants" right={<FixedValue>FCFA (XOF)</FixedValue>} />
            <SettingRow icon="globe" label="Langue" sub="Langue de l’application" right={<FixedValue>Français</FixedValue>} />
            <SettingRow
              icon="moon"
              label="Mode sombre"
              sub="Thème de l’interface"
              right={<Switch label="Mode sombre" on={dark} onChange={setDark} />}
            />
            <SettingRow
              icon="bell"
              label="Notifications push"
              sub="Alertes budgets, échéances, objectifs"
              right={<Switch label="Notifications push" on={false} disabled title="Bientôt disponible" />}
            />
          </Card>

          {/* Sécurité */}
          <Card id="securite">
            <div className={`card-title ${styles.cardTitle}`}>Sécurité</div>
            <SettingRow
              icon="lock"
              label="Mot de passe"
              sub="Connexion par mot de passe"
              right={
                <button type="button" className="btn" onClick={onEditPassword}>
                  Modifier
                </button>
              }
            />
            <SettingRow
              icon="shield"
              label="Authentification biométrique"
              sub="Empreinte / Face ID"
              right={<Switch label="Authentification biométrique" on={false} disabled title="Bientôt disponible" />}
            />
            <SettingRow
              icon="lock"
              label="Comptes bloqués"
              sub={blocked.label}
              danger={blocked.count > 0}
              right={
                <Link to="/comptes" className="card-link">
                  Gérer <Icon name="chevron" size={13} />
                </Link>
              }
            />
            <SettingRow
              icon="logout"
              label="Déconnexion"
              right={
                <button type="button" className={`btn ${styles.dangerBtn}`} onClick={onLogout}>
                  Se déconnecter
                </button>
              }
            />
          </Card>
        </div>
      </div>
    </div>
  )
}
