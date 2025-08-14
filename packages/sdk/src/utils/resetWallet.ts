import type { ParadymState } from '../hooks/useParadym'

// TODO(sdk): maybe add resetWallet to `ParadymState`
export async function resetWallet(
  paradym: ParadymState,
  additionalResetCb?: (paradym: ParadymState) => Promise<void> | void
) {
  if (paradym.state === 'unlocked') {
    paradym.paradym.reset()
  }
  if (paradym.state !== 'initializing') {
    paradym.reinitialize()
  }

  await additionalResetCb?.(paradym)
}
