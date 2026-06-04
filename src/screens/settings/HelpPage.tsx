import { useMemo, useState } from 'react'
import { Icon, type IconName } from '../../components/primitives'
import { Card } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { SettingsSubPage } from './SettingsSubPage'
import styles from './settings.module.css'

/* Guides & FAQ : contenu d'aide statique (pas une donnée backend). */
const GUIDES: { icon: IconName; label: string; sub: string }[] = [
  { icon: 'bolt', label: 'Démarrer', sub: 'Premiers pas avec Cauris' },
  { icon: 'wallet', label: 'Comptes & soldes', sub: 'Mobile money et banques' },
  { icon: 'target', label: 'Budgets & objectifs', sub: 'Suivre vos finances' },
]

const FAQ: { q: string; c: string }[] = [
  { q: 'Comment ajouter un compte Orange Money ou Wave ?', c: 'Comptes' },
  { q: 'Pourquoi un solde s’affiche-t-il en ••• ••• ?', c: 'Comptes' },
  { q: 'Comment créer un budget par catégorie ?', c: 'Budgets' },
  { q: 'Comment fonctionne l’épargne vers un objectif ?', c: 'Objectifs' },
  { q: 'Mes données sont-elles chiffrées ?', c: 'Sécurité' },
  { q: 'Comment exporter mes opérations en CSV ?', c: 'Données' },
]

const CONTACTS: { icon: IconName; label: string; sub: string }[] = [
  { icon: 'message', label: 'Chat en direct', sub: 'Réponse ~2 min' },
  { icon: 'send', label: 'E-mail', sub: 'aide@cauris.ci' },
  { icon: 'globe', label: 'WhatsApp', sub: '+225 07 00 00 00' },
]

export function HelpPage() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return FAQ
    return FAQ.filter((f) => `${f.q} ${f.c}`.toLowerCase().includes(needle))
  }, [query])

  return (
    <SettingsSubPage active="aide" eyebrow="Assistance" title="Centre d'aide">
      {/* recherche — RÉELLE : filtre la FAQ ci-dessous */}
      <div className="field">
        <Icon name="search" size={17} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une question, un sujet…"
          aria-label="Rechercher dans l’aide"
        />
      </div>

      {/* guides */}
      <div className={styles.guideGrid}>
        {GUIDES.map((g) => (
          <Card key={g.label}>
            <div className={`row-ico ${styles.guideIco}`}>
              <Icon name={g.icon} size={18} />
            </div>
            <div className={styles.guideTitle}>{g.label}</div>
            <div className={`t-faint ${styles.guideSub}`}>{g.sub}</div>
          </Card>
        ))}
      </div>

      {/* faq filtrable */}
      <Card>
        <div className={`card-title ${styles.catSectionTitle}`}>Questions fréquentes</div>
        {filtered.length === 0 ? (
          <EmptyState icon="search" title="Aucun résultat" text="Essayez d’autres mots-clés." />
        ) : (
          filtered.map((f) => (
            <div className="faq-row" key={f.q}>
              <Icon name="help" size={17} className="t-faint" />
              <span className={styles.faqQ}>{f.q}</span>
              <span className="tag-cat">{f.c}</span>
              <Icon name="chevron" size={15} className="t-faint" />
            </div>
          ))
        )}
      </Card>

      {/* contact — informations honnêtes (non cliquables : coordonnées de démo) */}
      <Card>
        <div className={`card-title ${styles.cardTitleMb}`}>Nous contacter</div>
        <div className={`r ${styles.contactRow}`}>
          {CONTACTS.map((c) => (
            <Card key={c.label} soft pad="pad-sm" className={`r ${styles.contactCard}`}>
              <div className="set-ico">
                <Icon name={c.icon} size={17} />
              </div>
              <div>
                <div className={styles.contactTitle}>{c.label}</div>
                <div className={`t-faint ${styles.contactSub}`}>{c.sub}</div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </SettingsSubPage>
  )
}
