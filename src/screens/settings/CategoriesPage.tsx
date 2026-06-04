import { useState } from 'react'
import { Icon } from '../../components/primitives'
import { Card, Badge, Drawer, BottomSheet } from '../../components/ui'
import { EmptyState } from '../../components/states'
import { SettingsSubPage } from './SettingsSubPage'
import { CategoryForm } from './CategoryForm'
import { useCategories, type CategoryRow } from './useCategories'
import { useIsMobile } from './useSettings'
import styles from './settings.module.css'

type Filter = 'all' | 'expense' | 'income'

/* token cat-N → classe de pastille colorée (fond wash + ink). */
const catClass = (t: string | null): string => (t ? (styles[t.replace('-', '')] ?? '') : '')

function Row({ c, onEdit }: { c: CategoryRow; onEdit: () => void }) {
  return (
    <div className="set-row">
      <div className={`set-ico ${styles.catIco} ${catClass(c.colorToken)}`}>
        <Icon name="tag" size={17} />
      </div>
      <div className={styles.catRowText}>
        <div className={styles.catName}>{c.name}</div>
        <div className={`t-faint ${styles.catMeta}`}>
          {c.txnCount} opération{c.txnCount > 1 ? 's' : ''} ce mois
        </div>
      </div>
      {c.hasBudget && (
        <Badge tone="ok" className={styles.budgetTag}>
          Budget lié
        </Badge>
      )}
      <button type="button" className="icon-btn" aria-label={`Modifier ${c.name}`} onClick={onEdit}>
        <Icon name="edit" size={15} />
      </button>
    </div>
  )
}

export function CategoriesPage() {
  const q = useCategories()
  const isMobile = useIsMobile()
  const [filter, setFilter] = useState<Filter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (c: CategoryRow) => {
    setEditing(c)
    setFormOpen(true)
  }
  const close = () => setFormOpen(false)

  const cats = q.data?.categories ?? []
  const expense = cats.filter((c) => c.kind !== 'income')
  const income = cats.filter((c) => c.kind === 'income')
  const showExpense = filter !== 'income'
  const showIncome = filter !== 'expense'

  const action = (
    <button type="button" className="btn primary" onClick={openNew}>
      <Icon name="plus" size={16} /> Nouvelle catégorie
    </button>
  )

  return (
    <SettingsSubPage active="categories" eyebrow="Compte personnel" title="Catégories" actions={action}>
      {q.isError ? (
        <Card>
          <EmptyState icon="alert" title="Chargement impossible" text="Réessayez dans un instant." />
        </Card>
      ) : q.isPending ? (
        <Card>
          <EmptyState icon="tag" title="Chargement…" text="Vos catégories arrivent." />
        </Card>
      ) : (
        <>
          {/* filtre + total */}
          <Card pad="pad-sm" className={`r between ${styles.catFilterCard}`}>
            <div className="r" role="group" aria-label="Filtrer les catégories">
              {(
                [
                  ['all', 'Toutes'],
                  ['expense', 'Dépenses'],
                  ['income', 'Revenus'],
                ] as [Filter, string][]
              ).map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  className={'chip' + (filter === key ? ' on' : '')}
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className={`t-faint ${styles.catCount}`}>{cats.length} catégories</span>
          </Card>

          {cats.length === 0 ? (
            <Card>
              <EmptyState
                icon="tag"
                title="Aucune catégorie"
                text="Créez votre première catégorie pour classer vos opérations."
              />
            </Card>
          ) : (
            <>
              {showExpense && (
                <Card>
                  <div className={`card-title ${styles.catSectionTitle}`}>Dépenses</div>
                  {expense.map((c) => (
                    <Row key={c.id} c={c} onEdit={() => openEdit(c)} />
                  ))}
                  {expense.length === 0 && <div className={`t-faint ${styles.emptyHelp}`}>Aucune catégorie de dépense.</div>}
                </Card>
              )}
              {showIncome && (
                <Card>
                  <div className={`card-title ${styles.catSectionTitle}`}>Revenus</div>
                  {income.map((c) => (
                    <Row key={c.id} c={c} onEdit={() => openEdit(c)} />
                  ))}
                  {income.length === 0 && <div className={`t-faint ${styles.emptyHelp}`}>Aucune catégorie de revenu.</div>}
                </Card>
              )}
            </>
          )}

          {/* Catégorisation automatique — décoratif (pas de moteur d'auto-cat) : honnête. */}
          <Card className={`r ${styles.autoCatCard}`}>
            <div className={`row-ico ${styles.autoCatIco}`}>
              <Icon name="grid" size={18} />
            </div>
            <div>
              <div className={styles.autoCatTitle}>Catégorisation automatique</div>
              <div className={`t-muted ${styles.autoCatText}`}>
                Le classement automatique des opérations par l’IA arrive bientôt. En attendant, classez
                vos opérations à la main.
              </div>
            </div>
          </Card>
        </>
      )}

      {/* drawer (desktop) / bottom sheet (mobile) — Créer / Modifier */}
      {isMobile ? (
        <BottomSheet
          open={formOpen}
          onClose={close}
          title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        >
          <CategoryForm initial={editing ?? undefined} onClose={close} onExit={close} />
        </BottomSheet>
      ) : (
        <Drawer
          open={formOpen}
          onClose={close}
          title={editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        >
          <CategoryForm initial={editing ?? undefined} onClose={close} onExit={close} />
        </Drawer>
      )}
    </SettingsSubPage>
  )
}
