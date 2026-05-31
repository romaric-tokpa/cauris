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
import { Card, Button, Badge, Tag, KpiTile, Drawer, BottomSheet, Modal } from '../../components/ui'
import { money } from '../../lib/money'
import { formatDateFR } from '../../lib/date'
import styles from './PrimitivesGallery.module.css'

type OpenOverlay = 'drawer' | 'sheet' | 'modal' | null

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

function Panel({ title, children }: { title: string; children: ReactNode }) {
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
  const [overlay, setOverlay] = useState<OpenOverlay>(null)
  const close = () => setOverlay(null)

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
        <Panel title={`Icon — ${Object.keys(ICONS).length} glyphes`}>
          <div className={styles.iconGrid}>
            {(Object.keys(ICONS) as IconName[]).map((name) => (
              <div key={name} className={styles.iconCell}>
                <Icon name={name} size={22} />
                <span className={styles.iconName}>{name}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Donut">
          <div className={styles.center}>
            <Donut segments={REPARTITION} label="612 000" sub="dépensé" />
          </div>
        </Panel>

        <Panel title="Gauge (ok / warn / over)">
          <div className={styles.center}>
            <Gauge pct={76} tone="ok" />
            <Gauge pct={92} tone="warn" />
            <Gauge pct={108} tone="over" />
          </div>
        </Panel>

        <Panel title="Bars — cashflow">
          <Bars data={CASHFLOW} />
        </Panel>

        <Panel title="Spark">
          <div className={styles.center}>
            <Spark pts={SPARK} w={240} h={56} />
          </div>
        </Panel>

        <Panel title="Progress (défaut / ok / warn / over)">
          <div className={styles.stack}>
            <Progress pct={45} />
            <Progress pct={76} tone="ok" />
            <Progress pct={92} tone="warn" />
            <Progress pct={108} tone="over" />
          </div>
        </Panel>

        <Panel title="money() + dates FR">
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
        </Panel>

        <Panel title="Button (default / primary / accent / block)">
          <div className={`${styles.center} ${styles.left}`}>
            <Button>Default</Button>
            <Button variant="primary">Primary</Button>
            <Button variant="accent">Accent</Button>
            <Button disabled>Disabled</Button>
          </div>
          <Button variant="primary" block>
            <Icon name="plus" size={16} /> Bloc pleine largeur
          </Button>
        </Panel>

        <Panel title="Badge / Tag">
          <div className={`${styles.center} ${styles.left}`}>
            <Badge tone="ok">Payé</Badge>
            <Badge tone="warn">À surveiller</Badge>
            <Badge tone="over">Dépassé</Badge>
            <Tag>Alimentation</Tag>
            <Tag>Transport</Tag>
          </div>
        </Panel>

        <Panel title="Card (pad / soft)">
          <Card pad="pad-sm">
            <div className="card-title">Carte standard</div>
            <div className="t-faint" style={{ fontSize: 12, marginTop: 4 }}>
              wf-card + wf-pad-sm
            </div>
          </Card>
          <Card soft pad="pad-sm">
            <div className="card-title">Carte soft</div>
            <div className="t-faint" style={{ fontSize: 12, marginTop: 4 }}>
              wf-card.soft
            </div>
          </Card>
        </Panel>

        <Panel title="KpiTile">
          <KpiTile
            label="Solde total"
            value={2480000}
            icon="wallet"
            delta={{ label: '+3,2 % vs avril', positive: true }}
          />
          <KpiTile
            label="Dépenses"
            value={612000}
            icon="exchange"
            tone="neg"
            note="Mis à jour aujourd’hui"
          />
        </Panel>

        <Panel title="Overlays (a11y : focus piégé, Esc, scrim)">
          <div className={`${styles.center} ${styles.left}`}>
            <Button onClick={() => setOverlay('drawer')}>Ouvrir Drawer</Button>
            <Button onClick={() => setOverlay('sheet')}>Ouvrir BottomSheet</Button>
            <Button onClick={() => setOverlay('modal')}>Ouvrir Modal</Button>
          </div>
        </Panel>
      </div>

      <Drawer
        open={overlay === 'drawer'}
        onClose={close}
        title="Ajouter une transaction"
        footer={
          <>
            <Button block onClick={close}>
              Annuler
            </Button>
            <Button variant="primary" block onClick={close}>
              Enregistrer
            </Button>
          </>
        }
      >
        <div>
          <span className="lbl">Montant</span>
          <div className="inp big">
            <span>25 000</span>
            <span className="kpi-cur">FCFA</span>
          </div>
        </div>
        <div>
          <span className="lbl">Catégorie</span>
          <div className="inp">
            <span>Alimentation</span>
            <Icon name="chevron" size={16} />
          </div>
        </div>
      </Drawer>

      <BottomSheet open={overlay === 'sheet'} onClose={close} title="Ajouter une transaction">
        <div>
          <span className="lbl">Montant</span>
          <div className="inp big">
            <span>25 000</span>
            <span className="kpi-cur">FCFA</span>
          </div>
        </div>
        <Button variant="primary" block onClick={close}>
          Enregistrer
        </Button>
      </BottomSheet>

      <Modal
        open={overlay === 'modal'}
        onClose={close}
        title="Confirmer la suppression"
        footer={
          <>
            <Button onClick={close}>Annuler</Button>
            <Button variant="primary" onClick={close}>
              Supprimer
            </Button>
          </>
        }
      >
        <div className="t-muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
          Cette action est définitive. La transaction sera retirée de vos comptes.
        </div>
      </Modal>
    </div>
  )
}
