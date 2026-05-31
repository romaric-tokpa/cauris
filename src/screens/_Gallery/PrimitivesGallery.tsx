import { useState, type ReactNode } from 'react'
import {
  Icon,
  Donut,
  Gauge,
  Bars,
  Spark,
  Progress,
  ICONS,
  type IconName,
} from '../../components/primitives'
import { money } from '../../lib/money'
import { formatDateFR } from '../../lib/date'
import styles from './PrimitivesGallery.module.css'

/* Galerie TEMPORAIRE de revue (Bloc 1) : visualise les primitives portées en
   clair/sombre/glass/accent. Remplacée par le shell au Bloc 3. */

const ACCENTS = ['#2f5d8c', '#1f7a5b', '#c2603f', '#5a55c8', '#9d4068']

const REPARTITION = [
  { name: 'Alimentation', v: 28, color: '#3a3a3e' },
  { name: 'Transport', v: 19, color: '#6f6f76' },
  { name: 'Logement', v: 22, color: '#9a9aa1' },
  { name: 'Factures', v: 14, color: '#c1c1c6' },
]
const CASHFLOW = [
  { m: 'Déc', rev: 780, dep: 640 },
  { m: 'Jan', rev: 810, dep: 590 },
  { m: 'Fév', rev: 760, dep: 700 },
  { m: 'Mar', rev: 830, dep: 620 },
  { m: 'Avr', rev: 820, dep: 580 },
  { m: 'Mai', rev: 850, dep: 612 },
]
const SPARK = [60, 58, 63, 61, 67, 64, 70, 68, 74, 72, 78, 80]
const REF = new Date(2026, 4, 31)

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={`wf-card wf-pad ${styles.section}`}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </div>
  )
}

export default function PrimitivesGallery() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [glass, setGlass] = useState(false)
  const [accent, setAccent] = useState<string | null>(null)

  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.setAttribute('data-glass', glass ? 'on' : 'off')
  if (accent) root.style.setProperty('--accent', accent)
  else root.style.removeProperty('--accent')

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cauris — primitives</h1>
          <p className={styles.subtitle}>
            Galerie de revue temporaire (Bloc 1). Vérifie le rendu des primitives en clair/sombre.
          </p>
        </div>
        <div className={styles.controls}>
          <button
            type="button"
            className={`btn${theme === 'dark' ? ' primary' : ''}`}
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'dark' ? 'Thème sombre' : 'Thème clair'}
          </button>
          <button
            type="button"
            className={`btn${glass ? ' primary' : ''}`}
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

      <div className={styles.grid}>
        <Card title={`Icon — ${Object.keys(ICONS).length} glyphes`}>
          <div className={styles.iconGrid}>
            {(Object.keys(ICONS) as IconName[]).map((name) => (
              <div key={name} className={styles.iconCell}>
                <Icon name={name} size={22} />
                <span className={styles.iconName}>{name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Donut">
          <div className={styles.center}>
            <Donut segments={REPARTITION} label="612 000" sub="dépensé" />
          </div>
        </Card>

        <Card title="Gauge (ok / warn / over)">
          <div className={styles.center}>
            <Gauge pct={76} tone="ok" />
            <Gauge pct={92} tone="warn" />
            <Gauge pct={108} tone="over" />
          </div>
        </Card>

        <Card title="Bars — cashflow">
          <Bars data={CASHFLOW} />
        </Card>

        <Card title="Spark">
          <div className={styles.center}>
            <Spark pts={SPARK} w={240} h={56} />
          </div>
        </Card>

        <Card title="Progress (défaut / ok / warn / over)">
          <div className={styles.stack}>
            <Progress pct={45} />
            <Progress pct={76} tone="ok" />
            <Progress pct={92} tone="warn" />
            <Progress pct={108} tone="over" />
          </div>
        </Card>

        <Card title="money() + dates FR">
          <div className={styles.stack}>
            <div>
              <span className={styles.amount}>{money(2480000)}</span>
              <span className={styles.amountSuffix}>FCFA</span>
            </div>
            <div>
              <span className={styles.amount}>{money(-6200)}</span>
              <span className={styles.amountSuffix}>FCFA</span>
            </div>
            <div className="t-muted">
              {formatDateFR(new Date(2026, 4, 28), { reference: REF })} ·{' '}
              {formatDateFR(new Date(2026, 5, 15), { reference: REF, withYear: true })} ·{' '}
              {formatDateFR(REF, { reference: REF })} ·{' '}
              {formatDateFR(new Date(2026, 4, 30), { reference: REF })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
