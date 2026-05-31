import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import styles from './AppShell.module.css'

/** Shell Cockpit (pattern A) : sidebar fixe + header persistants, modules dans <Outlet/>. */
export function AppShell() {
  return (
    <div className={`wf ${styles.shell}`}>
      <Sidebar />
      <main className={styles.main}>
        <Header />
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
