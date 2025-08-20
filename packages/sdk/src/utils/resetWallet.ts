import type { ParadymState } from '../hooks/useParadym'

// TODO(sdk): maybe add resetWallet to `ParadymState`
export async function resetWallet(paradym: ParadymState) {
  if (paradym.state === 'unlocked') {
    paradym.paradym.reset()
  }
  if (paradym.state !== 'initializing') {
    paradym.reinitialize()
  }
}
