import { useSetPageTitle } from '../../components/shell/pageTitle'
import { useAssistant } from './useAssistant'
import { AssistantDesktop } from './AssistantDesktop'
import { AssistantMobile } from './AssistantMobile'
import styles from './assistant.module.css'

/**
 * Écran Assistant IA (Phase 12, sous-bloc 1). Chat conversationnel branché sur
 * `/api/ai/chat` (stub déterministe pour l'instant). État local (le fil est
 * éphémère) partagé entre desktop et mobile via `useAssistant`. SUGGESTION ONLY :
 * l'écran n'affiche que du texte (+ barres lecture seule), aucun bouton n'exécute
 * d'action financière.
 */
export function Assistant() {
  const state = useAssistant()
  useSetPageTitle('Assistant')
  return (
    <>
      <h1 className={styles.srOnly}>Assistant financier</h1>
      <AssistantDesktop {...state} className={styles.desktop} />
      <AssistantMobile {...state} className={styles.mobile} />
    </>
  )
}
