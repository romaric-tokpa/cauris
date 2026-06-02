import type { NotificationItem } from './useNotifications'

/** Onglets desktop — 1:1 du wireframe (subnav NotifDesk). */
export const TABS = ['Toutes', 'Non lues', 'Alertes', 'Rappels'] as const
/** Chips mobile — 1:1 du wireframe (pas « Rappels »). */
export const MOBILE_TABS = ['Toutes', 'Non lues', 'Alertes'] as const
export const DEFAULT_TAB = 'Toutes'

/**
 * Filtre dérivé des données (documenté) :
 * - Toutes  : toutes les notifs.
 * - Non lues: `read === false`.
 * - Alertes : `tone ∈ {over, warn}` (dépassement / avertissement).
 * - Rappels : `icon ∈ {bank, calendar}` (échéances de prêt / factures à venir).
 * Sur les 7 notifs seedées : Toutes=7, Non lues=3, Alertes=3, Rappels=2 — aucune
 * notif ne disparaît du groupe « Toutes », aucun doublon (chaque filtre est un sous-ensemble).
 */
export function filterByTab(items: NotificationItem[], tab: string): NotificationItem[] {
  switch (tab) {
    case 'Non lues':
      return items.filter((n) => !n.read)
    case 'Alertes':
      return items.filter((n) => n.tone === 'over' || n.tone === 'warn')
    case 'Rappels':
      return items.filter((n) => n.icon === 'bank' || n.icon === 'calendar')
    default:
      return items
  }
}
