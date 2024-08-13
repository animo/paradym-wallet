import { FUNKE_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID } from '@funke/constants'
import { aes128Gcm } from '@package/agent'

export const funkeAes128Gcm = aes128Gcm(FUNKE_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID)
