import { test } from '@playwright/test'
import { expectFidelity } from './helpers/visual'

/**
 * Baseline de RÉGRESSION de l'écran Assistant IA (état initial : message d'accueil
 * seedé + chips de suggestions + champ de saisie ; desktop = rail Questions
 * fréquentes + Confidentialité). Le chat est conversationnel (POST /api/ai/chat) ;
 * le stub déterministe garantit des réponses reproductibles. Clair+sombre × 390+1440.
 */
test('assistant — état initial (clair/sombre × 390/1440)', async ({ page }) => {
  await expectFidelity(page, 'assistant', '/assistant-ia')
})
