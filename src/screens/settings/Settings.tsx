import { useState } from 'react'
import { Drawer, BottomSheet } from '../../components/ui'
import { useSetPageTitle } from '../../components/shell/pageTitle'
import { useTheme } from '../../theme/themeContext'
import { useSession, signOut } from '../../lib/auth-client'
import { SettingsDesktop } from './SettingsDesktop'
import { SettingsMobile } from './SettingsMobile'
import { PasswordForm } from './PasswordForm'
import { useBlockedAccounts, useIsMobile } from './useSettings'
import styles from './settings.module.css'

/**
 * Écran Paramètres (Phase 13, sous-bloc A) — porté 1:1 de screens-settings.jsx.
 * Branché RÉELLEMENT : nom/email (session Better Auth), Mode sombre (ThemeProvider),
 * comptes bloqués (/api/accounts), changement de mot de passe (authClient.changePassword),
 * déconnexion (signOut). Réglages sans support → « à venir » honnêtes ; Devise/Langue =
 * choix produit fixes en lecture seule. Aucun contrôle inerte trompeur.
 */
export function Settings() {
  useSetPageTitle('Paramètres')
  const { data } = useSession()
  const theme = useTheme()
  const { summary: blocked } = useBlockedAccounts()
  const isMobile = useIsMobile()
  const [pwdOpen, setPwdOpen] = useState(false)

  const onLogout = () => {
    void signOut().finally(() => window.location.assign('/auth'))
  }

  const shared = {
    name: data?.user?.name,
    email: data?.user?.email,
    dark: theme.dark,
    setDark: theme.setDark,
    blocked,
    onEditPassword: () => setPwdOpen(true),
    onLogout,
  }

  return (
    <>
      <h1 className={styles.srOnly}>Paramètres</h1>
      <SettingsDesktop {...shared} className={styles.desktop} />
      <SettingsMobile {...shared} className={styles.mobile} />

      {isMobile ? (
        <BottomSheet open={pwdOpen} onClose={() => setPwdOpen(false)} title="Modifier le mot de passe">
          <PasswordForm onClose={() => setPwdOpen(false)} />
        </BottomSheet>
      ) : (
        <Drawer open={pwdOpen} onClose={() => setPwdOpen(false)} title="Modifier le mot de passe">
          <PasswordForm onClose={() => setPwdOpen(false)} />
        </Drawer>
      )}
    </>
  )
}
