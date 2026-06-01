import { createContext, useContext, useEffect } from 'react'

/**
 * Titre d'écran optionnel : permet à un écran de surcharger le titre affiché par
 * la chrome du shell (MobileHeader), sans casser les autres modules qui gardent
 * leur libellé de route. Le Dashboard l'utilise pour « Bonjour, {prénom} ».
 */
export interface PageTitleContextValue {
  title: string | null
  setTitle: (title: string | null) => void
}

export const PageTitleContext = createContext<PageTitleContextValue>({
  title: null,
  setTitle: () => {},
})

/** Lit le titre surchargé courant (null = aucun → la chrome retombe sur la route). */
export function usePageTitle(): string | null {
  return useContext(PageTitleContext).title
}

/** Pose un titre d'écran le temps que le composant est monté (nettoyé au démontage). */
export function useSetPageTitle(title: string): void {
  const { setTitle } = useContext(PageTitleContext)
  useEffect(() => {
    setTitle(title)
    return () => setTitle(null)
  }, [title, setTitle])
}
