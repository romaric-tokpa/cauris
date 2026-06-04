import { Link } from 'react-router-dom'
import { Icon } from '../../components/primitives'
import { Card, Switch } from '../../components/ui'
import { SettingRow, FixedValue } from './parts'
import { initial, type BlockedSummary } from './useSettings'
import styles from './settings.module.css'

interface Props {
  name: string | undefined
  email: string | undefined
  dark: boolean
  setDark: (v: boolean) => void
  blocked: BlockedSummary
  onEditProfile: () => void
  onEditPassword: () => void
  onLogout: () => void
  className?: string
}

/** Paramètres — mobile (ParamsMob de screens-settings.jsx) : profil + 3 groupes + déconnexion. */
export function SettingsMobile({
  name,
  email,
  dark,
  setDark,
  blocked,
  onEditProfile,
  onEditPassword,
  onLogout,
  className = '',
}: Props) {
  return (
    <div className={className}>
      {/* Profil — lecture seule (« Modifier » à venir → pas de chevron actionnable) */}
      <Card className={`r ${styles.profileCardMob}`}>
        <div className={`avatar ${styles.avatarMob}`}>{initial(name)}</div>
        <div className={styles.profileTextMob}>
          <div className={styles.profileNameMob}>{name ?? '—'}</div>
          <div className={`t-faint ${styles.profileMetaMob}`}>{email ?? '—'}</div>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Modifier le profil"
          onClick={onEditProfile}
        >
          <Icon name="edit" size={15} />
        </button>
      </Card>

      {/* Préférences */}
      <Card>
        <div className={`t-eyebrow ${styles.groupTitle}`}>Préférences</div>
        <SettingRow icon="wallet" label="Devise" right={<FixedValue>FCFA (XOF)</FixedValue>} />
        <SettingRow icon="globe" label="Langue" right={<FixedValue>Français</FixedValue>} />
        <SettingRow
          icon="moon"
          label="Mode sombre"
          right={<Switch label="Mode sombre" on={dark} onChange={setDark} />}
        />
        <SettingRow
          icon="bell"
          label="Notifications push"
          right={<Switch label="Notifications push" on={false} disabled title="Bientôt disponible" />}
        />
      </Card>

      {/* Sécurité */}
      <Card>
        <div className={`t-eyebrow ${styles.groupTitle}`}>Sécurité</div>
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
          label="Biométrie"
          right={<Switch label="Biométrie" on={false} disabled title="Bientôt disponible" />}
        />
        <SettingRow
          icon="lock"
          label="Comptes bloqués"
          sub={blocked.label}
          danger={blocked.count > 0}
          right={
            <Link to="/comptes" className="card-link" aria-label="Gérer les comptes bloqués">
              <Icon name="chevron" size={16} className="t-faint" />
            </Link>
          }
        />
      </Card>

      {/* Données — Catégories / Import-Export / Centre d'aide réels ; Sauvegarde à venir */}
      <Card>
        <div className={`t-eyebrow ${styles.groupTitle}`}>Données</div>
        <SettingRow
          icon="tag"
          label="Catégories"
          right={
            <Link to="/parametres/categories" className="card-link" aria-label="Gérer les catégories">
              <Icon name="chevron" size={16} className="t-faint" />
            </Link>
          }
        />
        <SettingRow
          icon="download"
          label="Import / Export"
          right={
            <Link to="/parametres/import-export" className="card-link" aria-label="Import / Export">
              <Icon name="chevron" size={16} className="t-faint" />
            </Link>
          }
        />
        <SettingRow
          icon="card"
          label="Sauvegarde & restauration"
          right={
            <span className={styles.soonTag} aria-disabled="true" title="Bientôt disponible">
              Bientôt
            </span>
          }
        />
        <SettingRow
          icon="help"
          label="Centre d'aide"
          right={
            <Link to="/parametres/aide" className="card-link" aria-label="Centre d'aide">
              <Icon name="chevron" size={16} className="t-faint" />
            </Link>
          }
        />
      </Card>

      <button type="button" className={`btn block ${styles.dangerBtn}`} onClick={onLogout}>
        <Icon name="logout" size={16} /> Se déconnecter
      </button>
    </div>
  )
}
