import { useState } from 'react'
import { Icon } from '../../components/primitives'
import {
  daysInMonth,
  firstWeekdayMondayBased,
  formatIsoDay,
  formatMonthLong,
  shiftMonth,
} from '../../lib/date'
import { DEMO_MONTH } from './useAnalytics'
import styles from './analytics.module.css'

const WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

/* Presets du wireframe : seul « Ce mois » est réel à la granularité MOIS supportée par
   les dérivations serveur. Jour/multi-mois → honnêtement désactivés (« Bientôt »). */
const PRESETS = [
  { label: "Aujourd'hui", ready: false },
  { label: '7 jours', ready: false },
  { label: 'Ce mois', ready: true },
  { label: 'Trimestre', ready: false },
  { label: 'Année', ready: false },
  { label: 'Personnalisé', ready: false },
]

interface Cell {
  day: number
  dim: boolean
}

/** Grille du mois `iso` (fillers dim avant/après pour compléter les semaines). */
function monthCells(iso: string): Cell[] {
  const lead = firstWeekdayMondayBased(iso)
  const dim = daysInMonth(iso)
  const prevDim = daysInMonth(shiftMonth(iso, -1))
  const cells: Cell[] = []
  for (let i = 0; i < lead; i++) cells.push({ day: prevDim - lead + 1 + i, dim: true })
  for (let d = 1; d <= dim; d++) cells.push({ day: d, dim: false })
  let next = 1
  while (cells.length % 7 !== 0) cells.push({ day: next++, dim: true })
  return cells
}

/** Borne calendaire d'un mois : `1 mai 2026` / `31 mai 2026` (écho honnête). */
function monthBound(iso: string, edge: 'start' | 'end'): string {
  const day = edge === 'start' ? 1 : daysInMonth(iso)
  const dd = String(day).padStart(2, '0')
  return `${formatIsoDay(`${iso}-${dd}`)} ${iso.slice(0, 4)}`
}

/**
 * Formulaire « Choisir une période » (Drawer desktop · BottomSheet mobile), porté de
 * AnaPeriodDesk. Granularité MOIS HONNÊTE : le calendrier `.cal` est porté 1:1, mais la
 * sélection active est un mois entier (range plein-mois, libellé « Mai 2026 », pas un
 * compte de jours). « Appliquer » → `?month=YYYY-MM`. Presets jour/multi-mois désactivés.
 */
export function PeriodForm({
  current,
  onApply,
  onClose,
}: {
  current: string // YYYY-MM appliqué
  onApply: (month: string) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState(current)
  const [viewed, setViewed] = useState(current)

  const cells = monthCells(viewed)
  const highlight = viewed === selected
  const lastDay = daysInMonth(viewed)
  const nextDisabled = viewed >= DEMO_MONTH // pas de mois futurs (vides)

  const pickMonth = (iso: string) => {
    setSelected(iso)
    setViewed(iso)
  }

  return (
    <div className={styles.formFields}>
      {/* presets — « Ce mois » réel, le reste honnêtement désactivé */}
      <div>
        <span className="lbl">Périodes rapides</span>
        <div className={`r ${styles.presetRow}`}>
          {PRESETS.map((p) =>
            p.ready ? (
              <button
                type="button"
                key={p.label}
                className={'chip' + (selected === DEMO_MONTH ? ' on' : '')}
                aria-pressed={selected === DEMO_MONTH}
                onClick={() => pickMonth(DEMO_MONTH)}
              >
                {p.label}
              </button>
            ) : (
              <span
                key={p.label}
                className={`chip ${styles.soon}`}
                aria-disabled="true"
                title="Bientôt disponible"
              >
                {p.label}
              </span>
            ),
          )}
        </div>
      </div>

      {/* bornes du mois sélectionné (écho dérivé, lecture seule) */}
      <div className={styles.rangeGrid}>
        <div>
          <span className="lbl">Du</span>
          <div className="inp">
            <span>{monthBound(selected, 'start')}</span>
            <Icon name="calendar" size={14} className="t-faint" />
          </div>
        </div>
        <div>
          <span className="lbl">Au</span>
          <div className="inp">
            <span>{monthBound(selected, 'end')}</span>
            <Icon name="calendar" size={14} className="t-faint" />
          </div>
        </div>
      </div>

      {/* mini-calendrier — navigation par mois ; clic d'un jour = sélectionne ce mois */}
      <div className="wf-card soft wf-pad-sm">
        <div className={`r between ${styles.calHead}`}>
          <button
            type="button"
            className="icon-btn"
            aria-label="Mois précédent"
            onClick={() => setViewed(shiftMonth(viewed, -1))}
          >
            <Icon name="chevron" size={14} className={styles.flip} />
          </button>
          <span className={styles.calMonth}>{formatMonthLong(viewed)}</span>
          <button
            type="button"
            className="icon-btn"
            aria-label="Mois suivant"
            disabled={nextDisabled}
            onClick={() => !nextDisabled && setViewed(shiftMonth(viewed, 1))}
          >
            <Icon name="chevron" size={14} />
          </button>
        </div>
        <div className="cal">
          {WEEK.map((d, i) => (
            <div key={`h${i}`} className="cd hd">
              {d}
            </div>
          ))}
          {cells.map((c, i) => {
            if (c.dim)
              return (
                <div key={i} className="cd dim">
                  {c.day}
                </div>
              )
            let mark = ''
            if (highlight) {
              if (c.day === 1) mark = ' e1'
              else if (c.day === lastDay) mark = ' e2'
              else mark = ' rng'
            }
            return (
              <button
                type="button"
                key={i}
                className={`cd${mark}`}
                aria-label={`${c.day} ${formatMonthLong(viewed)}`}
                onClick={() => pickMonth(viewed)}
              >
                {c.day}
              </button>
            )
          })}
        </div>
      </div>

      {/* mois résolu (pas un compte de jours — granularité honnête) */}
      <div className={`wf-card soft wf-pad-sm r between ${styles.durRow}`}>
        <span className="t-muted">Période sélectionnée</span>
        <span className="t-mono">{formatMonthLong(selected)}</span>
      </div>

      <div className={styles.drawerActions}>
        <button type="button" className="btn block" onClick={() => pickMonth(DEMO_MONTH)}>
          Réinitialiser
        </button>
        <button
          type="button"
          className="btn primary block"
          onClick={() => {
            onApply(selected)
            onClose()
          }}
        >
          Appliquer
        </button>
      </div>
    </div>
  )
}
