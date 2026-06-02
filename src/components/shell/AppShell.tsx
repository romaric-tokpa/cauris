import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileHeader } from './MobileHeader'
import { MobileTabBar } from './MobileTabBar'
import { PageTitleContext } from './pageTitle'
import { RouteFallback } from '../../app/guards'
import styles from './AppShell.module.css'

/** Shell responsive : desktop = Cockpit (sidebar + header), mobile = barre basse + FAB.
 *  Les deux chrome coexistent (CSS masque l'inactif) ; l'<Outlet/> est partagé.
 *  Un titre d'écran optionnel (PageTitleContext) peut surcharger la chrome. */
export function AppShell() {
  const [title, setTitle] = useState<string | null>(null)
  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      <div className={`wf ${styles.shell}`}>
        <Sidebar className={styles.desktopOnly} />
        <main className={styles.main}>
          <Header className={styles.desktopOnly} />
          <MobileHeader className={styles.mobileOnly} />
          <div className={styles.content}>
            <Suspense fallback={<RouteFallback />}>
              <Outlet />
            </Suspense>
          </div>
          <MobileTabBar className={styles.mobileOnly} />
        </main>
      </div>
    </PageTitleContext.Provider>
  )
}
