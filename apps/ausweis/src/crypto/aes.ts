import { AUSWEIS_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID } from '@ausweis/constants'
import { aes128Gcm } from '@package/agent'

export const ausweisAes128Gcm = aes128Gcm(AUSWEIS_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID)
