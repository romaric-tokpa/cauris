import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileHeader } from './MobileHeader'
import { MobileTabBar } from './MobileTabBar'
import styles from './AppShell.module.css'

/** Shell responsive : desktop = Cockpit (sidebar + header), mobile = barre basse + FAB.
 *  Les deux chrome coexistent (CSS masque l'inactif) ; l'<Outlet/> est partagé. */
export function AppShell() {
  return (
    <div className={`wf ${styles.shell}`}>
      <Sidebar className={styles.desktopOnly} />
      <main className={styles.main}>
        <Header className={styles.desktopOnly} />
        <MobileHeader className={styles.mobileOnly} />
        <div className={styles.content}>
          <Outlet />
        </div>
        <MobileTabBar className={styles.mobileOnly} />
      </main>
    </div>
  )
}
