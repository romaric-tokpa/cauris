import { useState } from 'react'
import { Icon } from '../../components/primitives'
import { Card } from '../../components/ui'
import { buildTransactionsCsv, downloadCsv } from '../../lib/exportReport'
import { useTransactions } from '../transactions/useTransactions'
import { SettingsSubPage } from './SettingsSubPage'
import styles from './settings.module.css'

/* Formats d'export : seul CSV est généré pour de vrai (helper A5) ; Excel/PDF honnêtes. */
const FORMATS = [
  { key: 'csv', label: 'CSV', ready: true },
  { key: 'excel', label: 'Excel', ready: false },
  { key: 'pdf', label: 'PDF', ready: false },
]

/* Formats d'import affichés (décoratifs) : l'import réel n'est pas livré (risque d'intégrité). */
const IMPORT_FORMATS = [
  { icon: 'grid' as const, label: 'CSV', sub: 'Relevés tableur' },
  { icon: 'analytics' as const, label: 'Excel', sub: '.xlsx' },
  { icon: 'card' as const, label: 'Relevé bancaire', sub: 'OFX / QIF' },
]

export function ImportExportPage() {
  // « Tout l'historique » : on charge toutes les opérations (limite haute) pour l'export.
  const q = useTransactions({ limit: '100000' })
  const rows = q.data?.transactions ?? []
  const [busy, setBusy] = useState(false)

  const onExport = () => {
    setBusy(true)
    const csv = buildTransactionsCsv(rows)
    downloadCsv('cauris-operations.csv', csv)
    setBusy(false)
  }

  return (
    <SettingsSubPage active="import-export" eyebrow="Données" title="Import / Export">
      {/* import — honnêtement désactivé (import réel = risque d'intégrité, non livré) */}
      <Card>
        <div className={`card-title ${styles.cardTitleMb}`}>Importer des opérations</div>
        <div className={`dropzone ${styles.soon}`} aria-disabled="true" title="Bientôt disponible">
          <div className={`row-ico ${styles.dropIco}`}>
            <Icon name="download" size={22} />
          </div>
          <div className={styles.dropTitle}>Glissez un fichier ici</div>
          <div className={`t-faint ${styles.dropSub}`}>ou parcourez votre appareil — 10 Mo max</div>
          <button type="button" className={`btn ${styles.dropBtn}`} disabled title="Bientôt disponible">
            <Icon name="download" size={15} /> Choisir un fichier
          </button>
        </div>
        <div className={`r ${styles.importFormats}`}>
          {IMPORT_FORMATS.map((f) => (
            <Card key={f.label} soft pad="pad-sm" className={`r ${styles.importFmtCard}`}>
              <div className={`set-ico ${styles.importFmtIco}`}>
                <Icon name={f.icon} size={16} />
              </div>
              <div>
                <div className={styles.contactTitle}>{f.label}</div>
                <div className={`t-faint ${styles.contactSub}`}>{f.sub}</div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* export — RÉEL : CSV de toutes les opérations */}
      <Card>
        <div className={`card-title ${styles.cardTitleMb}`}>Exporter mes données</div>
        <div className="set-row">
          <div className="set-ico">
            <Icon name="calendar" size={18} />
          </div>
          <div className={styles.catRowText}>
            <div className={styles.catName}>Période</div>
            <div className={`t-faint ${styles.catMeta}`}>Plage des données exportées</div>
          </div>
          <span className={styles.fixedValue}>Tout l’historique</span>
        </div>
        <div className="set-row">
          <div className="set-ico">
            <Icon name="download" size={18} />
          </div>
          <div className={styles.catRowText}>
            <div className={styles.catName}>Format</div>
            <div className={`t-faint ${styles.catMeta}`}>Type de fichier généré</div>
          </div>
          <div className="seg" role="group" aria-label="Format d’export">
            {FORMATS.map((f) =>
              f.ready ? (
                <button type="button" key={f.key} className="on" aria-pressed="true">
                  {f.label}
                </button>
              ) : (
                <button key={f.key} type="button" disabled title="Bientôt disponible">
                  {f.label}
                </button>
              ),
            )}
          </div>
        </div>
        <button
          type="button"
          className={`btn primary block ${styles.exportBtn}`}
          onClick={onExport}
          disabled={busy || q.isPending || rows.length === 0}
        >
          <Icon name="download" size={16} /> Exporter ({rows.length} opérations)
        </button>
      </Card>
    </SettingsSubPage>
  )
}
