import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, apiMutate } from '../../lib/api'
import type { IconName } from '../../components/primitives'

/** Notification projetée par l'API (href résolu côté serveur ; link_* masqués). */
export interface NotificationItem {
  id: string
  title: string
  body: string
  tone: 'over' | 'warn' | 'ok' | null
  icon: IconName
  read: boolean
  href: string | null
  createdAt: string // ISO
}

export interface NotificationsResponse {
  notifications: NotificationItem[]
  unreadCount: number
}

/** Liste des notifications + compteur de non-lues (query partagée avec la cloche). */
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<NotificationsResponse>('/api/notifications'),
  })
}

/** Compteur de non-lues seul (badge cloche du shell). Réutilise la query ci-dessus. */
export function useUnreadCount(): number {
  const q = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<NotificationsResponse>('/api/notifications'),
    select: (d) => d.unreadCount,
  })
  return q.data ?? 0
}

/**
 * Mutations notifications. Marquer lu (une / toutes) invalide `['notifications']`
 * (liste + cloche) ET `['dashboard']` (qui intègre les notifs) → cohérence vivante.
 */
export function useNotifMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['notifications'] })
    void qc.invalidateQueries({ queryKey: ['dashboard'] })
  }
  const markRead = useMutation({
    mutationFn: (id: string) =>
      apiMutate<{ notification: NotificationItem; unreadCount: number }>(
        `/api/notifications/${id}`,
        'PATCH',
        { read: true },
      ),
    onSuccess: invalidate,
  })
  const markAllRead = useMutation({
    mutationFn: () => apiMutate<{ status: string; unreadCount: number }>(
      '/api/notifications/read-all',
      'POST',
    ),
    onSuccess: invalidate,
  })
  return { markRead, markAllRead }
}
