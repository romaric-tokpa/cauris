import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Démonte le DOM rendu après chaque test (globals désactivés → cleanup manuel).
afterEach(() => {
  cleanup()
})
