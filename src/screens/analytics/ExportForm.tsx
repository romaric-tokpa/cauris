import { useState } from 'react'
import { Icon } from '../../components/primitives'
import { formatMonthLong } from '../../lib/date'
import {
  REPORT_SECTIONS,
  buildReportCsv,
  downloadCsv,
  reportFilename,
  type ReportLang,
  type ReportSection,
} from '../../lib/exportReport'
import type { AnalyticsData } from './useAnalytics'
import styles from './analytics.module.css'

/* Formats du wireframe : seul le CSV est généré pour de vrai (côté client). PDF/Excel
   exigent une lib lourde → rendus en choix honnêtement désactivés (« Bientôt »). */
const FORMATS = [
  { key: 'csv', label: 'CSV', icon: 'grid' as const, ready: true },
  { key: 'pdf', label: 'PDF', icon: 'analytics' as const, ready: false },
  { key: 'excel', label: 'Excel', icon: 'download' as const, ready: false },
]

/* Défauts du wireframe : Synthèse, Répartition et Tendances cochés ; Budget décoché. */
const DEFAULT_SECTIONS: ReportSection[] = ['kpi', 'breakdown', 'trends']

/**
 * Formulaire « Exporter le rapport » (Drawer desktop · BottomSheet mobile), porté de
 * AnaExportDesk. Génère un CSV RÉEL à partir des données déjà dérivées (`AnalyticsData`) :
 * les cases « Sections » et le segment « Langue » pilotent réellement le fichier.
 */
export function ExportForm({ data, onClose }: { data: AnalyticsData; onClose: () => void }) {
  const [sections, setSections] = useState<Set<ReportSection>>(() => new Set(DEFAULT_SECTIONS))
  const [lang, setLang] = useState<ReportLang>('fr')
  const [preview, setPreview] = useState<string | null>(null)

  const toggle = (k: ReportSection) =>
    setSections((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })

  const chosen = REPORT_SECTIONS.filter((s) => sections.has(s.key)).map((s) => s.key)
  const canGenerate = chosen.length > 0

  const onPreview = () => {
    if (!canGenerate) return
    const csv = buildReportCsv(data, chosen, lang)
    const lines = csv.split('\n').filter((l) => l.length > 0).length
    setPreview(`${chosen.length} section(s) · ${formatMonthLong(data.period)} · ${lines} lignes`)
  }

  const onGenerate = () => {
    if (!canGenerate) return
    const csv = buildReportCsv(data, chosen, lang)
    downloadCsv(reportFilename(data.period), csv)
    onClose()
  }

  return (
    <div className={styles.formFields}>
      {/* format — CSV réel sélectionné ; PDF/Excel honnêtement désactivés */}
      <div>
        <span className="lbl">Format du fichier</span>
        <div className={`r ${styles.formatRow}`}>
          {FORMATS.map((f) => (
            <div
              key={f.key}
              className={`choice ${styles.formatChoice}${f.ready ? ' on' : ` ${styles.soon}`}`}
              aria-disabled={!f.ready}
              title={f.ready ? 'Format sélectionné' : 'Bientôt disponible'}
            >
              <Icon name={f.icon} size={20} className={f.ready ? '' : 't-muted'} />
              <span className={styles.formatLabel}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* période couverte — écho du mois actif (informatif, pas un contrôle) */}
      <div>
        <span className="lbl">Période couverte</span>
        <div className="inp">
          <span className={`r ${styles.g8}`}>
            <Icon name="calendar" size={15} className="t-faint" /> {formatMonthLong(data.period)}
          </span>
        </div>
      </div>

      {/* sections — cases réelles : pilotent le contenu du CSV */}
      <div>
        <span className="lbl">Sections à inclure</span>
        <div className={`c ${styles.sectionList}`}>
          {REPORT_SECTIONS.map((s) => {
            const on = sections.has(s.key)
            return (
              <button
                type="button"
                key={s.key}
                className={`choice ${styles.sectionRow}`}
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(s.key)}
              >
                <span className={'checkbox' + (on ? ' on' : '')} aria-hidden="true">
                  {on && <Icon name="check" size={13} />}
                </span>
                <span className={styles.sectionLabel}>{s.fr}</span>
              </button>
            )
          })}
          {/* Liste des transactions : hors AnalyticsData → honnêtement désactivée. */}
          <div
            className={`choice ${styles.sectionRow} ${styles.soon}`}
            aria-disabled="true"
            title="Bientôt disponible"
          >
            <span className="checkbox" aria-hidden="true" />
            <span className={styles.sectionLabel}>Liste des transactions</span>
          </div>
        </div>
      </div>

      {/* langue — réelle : en-têtes FR/EN du CSV */}
      <div>
        <span className="lbl">Langue du rapport</span>
        <div className="seg-full" role="group" aria-label="Langue du rapport">
          <button
            type="button"
            className={lang === 'fr' ? 'on' : ''}
            aria-pressed={lang === 'fr'}
            onClick={() => setLang('fr')}
          >
            Français
          </button>
          <button
            type="button"
            className={lang === 'en' ? 'on' : ''}
            aria-pressed={lang === 'en'}
            onClick={() => setLang('en')}
          >
            English
          </button>
        </div>
      </div>

      {preview && <div className={`wf-card soft wf-pad-sm ${styles.previewNote}`}>{preview}</div>}

      <div className={styles.drawerActions}>
        <button type="button" className="btn block" onClick={onPreview} disabled={!canGenerate}>
          Aperçu
        </button>
        <button type="button" className="btn primary block" onClick={onGenerate} disabled={!canGenerate}>
          <Icon name="download" size={16} /> Générer le CSV
        </button>
      </div>
    </div>
  )
}
