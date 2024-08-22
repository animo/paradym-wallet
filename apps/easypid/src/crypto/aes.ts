import { AUSWEIS_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID } from '@easypid/constants'
import { aes256Gcm } from '@package/agent'

export const ausweisAes256Gcm = aes256Gcm(AUSWEIS_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID)
