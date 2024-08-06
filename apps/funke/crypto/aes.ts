import { aes256Gcm } from '@package/agent'
import { FUNKE_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID } from '../constants'

export const funkeAes256Gcm = aes256Gcm(FUNKE_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID)
