import { Link } from 'react-router-dom'
import styles from './assistant.module.css'

/** Onglet du module IA — 1:1 wireframe AISub (`.subnav`/`.si`/`.si.on`). */
type AiTab = 'Assistant' | 'Chat' | 'Prévisions' | 'Anomalies'

/**
 * Sous-navigation du module IA (AISub de screens-ai.jsx). « Insights » vit sur le
 * dashboard (sous-bloc 2) — pas d'écran d'onglet dédié → rendu « à venir » (atténué,
 * honnête). Les autres onglets sont des liens de NAVIGATION (jamais d'action). Rendue
 * aux deux largeurs (pas d'impasse mobile pour Prévisions/Anomalies).
 */
export function AiTabs({ active }: { active: AiTab }) {
  return (
    <div className="subnav">
      <Tab label="Assistant" to="/assistant-ia" active={active === 'Assistant'} />
      <Tab label="Chat" to="/assistant-ia/chat" active={active === 'Chat'} />
      <span className={`si ${styles.soon}`} title="Disponible sur le tableau de bord" aria-disabled="true">
        Insights
      </span>
      <Tab label="Prévisions" to="/assistant-ia/previsions" active={active === 'Prévisions'} />
      <Tab label="Anomalies" to="/assistant-ia/anomalies" active={active === 'Anomalies'} />
    </div>
  )
}

function Tab({ label, to, active }: { label: string; to: string; active: boolean }) {
  if (active) {
    return (
      <span className="si on" aria-current="page">
        {label}
      </span>
    )
  }
  return (
    <Link to={to} className={`si ${styles.tabLink}`}>
      {label}
    </Link>
  )
}
