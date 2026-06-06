/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * SEAM E2E uniquement : épingle la date « aujourd'hui » du coach (`COACH_TODAY`) pour
   * que la baseline visuelle de l'écran Coach reste déterministe. Absente en prod → date réelle.
   */
  readonly VITE_COACH_TODAY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
