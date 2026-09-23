import { mockProvider } from '../lib/providers/mockProvider'
import { PROVIDER_CONFIG } from '../lib/providers/types'
// In production, switch provider based on env. For now mock always.
export function useProvider(){
  // future: if PROVIDER_CONFIG.primary === 'helius' use heliusProvider
  return mockProvider
}
export const provider = mockProvider
