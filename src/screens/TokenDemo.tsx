import { useState } from 'react'
import styles from './TokenDemo.module.css'

/* Page de démo TEMPORAIRE pour vérifier le rendu des tokens en clair / sombre /
   glass, avec accent réglable. À retirer dès la Phase 1 (design system réel). */

type Theme = 'light' | 'dark'

// Couleurs « plates » (un seul aplat) : on montre le token tel quel.
const COLOR_TOKENS: { name: string; varName: string }[] = [
  { name: 'Paper', varName: '--paper' },
  { name: 'Background', varName: '--bg' },
  { name: 'Panel', varName: '--panel' },
  { name: 'Panel 2', varName: '--panel-2' },
  { name: 'Line', varName: '--line' },
  { name: 'Line soft', varName: '--line-soft' },
  { name: 'Accent', varName: '--accent' },
  { name: 'Positif', varName: '--pos' },
  { name: 'Négatif', varName: '--neg' },
  { name: 'Warn', varName: '--warn' },
  { name: 'Accent wash', varName: '--accent-wash' },
  { name: 'Pos wash', varName: '--pos-wash' },
  { name: 'Neg wash', varName: '--neg-wash' },
  { name: 'Warn wash', varName: '--warn-wash' },
  { name: 'Solid', varName: '--solid' },
  { name: 'Feature', varName: '--feature' },
]

const INK_TOKENS: { name: string; varName: string }[] = [
  { name: 'Ink', varName: '--ink' },
  { name: 'Ink soft', varName: '--ink-soft' },
  { name: 'Ink faint', varName: '--ink-faint' },
]

// Accents réglables (PLAN §1.2).
const ACCENTS = ['#2f5d8c', '#1f7a5b', '#c2603f', '#5a55c8', '#9d4068']

export default function TokenDemo() {
  const [theme, setTheme] = useState<Theme>('light')
  const [glass, setGlass] = useState(false)
  const [accent, setAccent] = useState<string | null>(null)

  // Appliqué au <html> pour que les variables se propagent à tout le document.
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.setAttribute('data-glass', glass ? 'on' : 'off')
  if (accent) root.style.setProperty('--accent', accent)
  else root.style.removeProperty('--accent')

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cauris — palette de tokens</h1>
          <p className={styles.subtitle}>
            Page de démo temporaire. Vérifie le rendu clair / sombre, le glass et l'accent réglable.
          </p>
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={`${styles.btn} ${theme === 'dark' ? styles.btnOn : ''}`}
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'dark' ? 'Thème sombre' : 'Thème clair'}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${glass ? styles.btnOn : ''}`}
            aria-pressed={glass}
            onClick={() => setGlass((g) => !g)}
          >
            Glass {glass ? 'on' : 'off'}
          </button>
          <span className={styles.accentRow}>
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Accent ${c}`}
                aria-pressed={(accent ?? ACCENTS[0]) === c}
                className={`${styles.swatchBtn} ${(accent ?? ACCENTS[0]) === c ? styles.swatchBtnOn : ''}`}
                style={{ background: c }}
                onClick={() => setAccent(c)}
              />
            ))}
          </span>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Couleurs</h2>
      <div className={styles.grid}>
        {COLOR_TOKENS.map((t) => (
          <div key={t.varName} className={styles.swatch}>
            <div className={styles.chip} style={{ background: `var(${t.varName})` }} />
            <div className={styles.swatchMeta}>
              <div className={styles.swatchName}>{t.name}</div>
              <div className={styles.swatchVar}>{t.varName}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>Texte (sur paper)</h2>
      <div className={styles.card}>
        {INK_TOKENS.map((t) => (
          <p key={t.varName} className={styles.typeRow} style={{ color: `var(${t.varName})` }}>
            <span className={styles.typeLabel}>{t.varName}</span>
            <span className={styles.sansSample}>
              Aïcha — Le vif renard brun saute par-dessus le chien paresseux.
            </span>
          </p>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>Polices</h2>
      <div className={styles.card}>
        <p className={styles.typeRow}>
          <span className={styles.typeLabel}>Public Sans — texte (--sans)</span>
          <span className={styles.sansSample}>Solde du compte courant · NSIA Banque</span>
        </p>
        <p className={styles.typeRow}>
          <span className={styles.typeLabel}>Spline Sans Mono — chiffres (--mono)</span>
          <span className={styles.monoSample}>0123456789 · FCFA</span>
        </p>
        <p className={styles.typeRow}>
          <span className={styles.typeLabel}>Montant (mono) — espace fine insécable</span>
          <span>
            <span className={styles.amount}>2&#8239;480&#8239;000</span>
            <span className={styles.amountSuffix}>FCFA</span>
          </span>
        </p>
        <p className={styles.typeRow}>
          <span className={styles.typeLabel}>Solde masqué (compte bloqué)</span>
          <span className={styles.amount}>••• •••</span>
        </p>
      </div>

      <h2 className={styles.sectionTitle}>Tons sémantiques (texte + wash)</h2>
      <div className={styles.card}>
        <div className={styles.tones}>
          <span className={`${styles.tone} ${styles.tonePos}`}>+ 1&#8239;250&#8239;000 Revenu</span>
          <span className={`${styles.tone} ${styles.toneNeg}`}>Budget Transport 108 %</span>
          <span className={`${styles.tone} ${styles.toneWarn}`}>Échéance proche</span>
          <span className={`${styles.tone} ${styles.toneAccent}`}>Suggestion IA</span>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Surfaces fortes</h2>
      <div className={styles.grid}>
        <div className={styles.feature}>
          <div style={{ fontSize: 11, opacity: 0.8 }}>--feature / --feature-ink</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>Carte hero</div>
        </div>
        <div className={styles.card} style={{ display: 'flex', alignItems: 'center' }}>
          <button type="button" className={styles.solidBtn}>
            Bouton --solid
          </button>
        </div>
      </div>
    </div>
  )
}
