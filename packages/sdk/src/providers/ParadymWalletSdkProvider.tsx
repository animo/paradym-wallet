import type { PropsWithChildren } from 'react'
import { createContext, useContext } from 'react'
import type { ParadymWalletSdk } from '../ParadymWalletSdk'

const ParadymWalletSdkContext = createContext<ParadymWalletSdk | undefined>(undefined)

export const useParadymWalletSdk = () => {
  const paradymWalletSdk = useContext(ParadymWalletSdkContext)

  if (!paradymWalletSdk) {
    throw new Error('useCredentials must be used within a ParadymWalletSdkProvider')
  }

  return paradymWalletSdk
}

interface Props {
  paradymWalletSdk?: ParadymWalletSdk
  recordIds: string[]
}

export const ParadymWalletSdkProvider: React.FC<PropsWithChildren<Props>> = ({
  paradymWalletSdk,
  recordIds,
  children,
}) => {
  return (
    <ParadymWalletSdkContext.Provider value={paradymWalletSdk}>
      {paradymWalletSdk ? (
        <paradymWalletSdk.Provider recordIds={recordIds}>{children}</paradymWalletSdk.Provider>
      ) : (
        children
      )}
    </ParadymWalletSdkContext.Provider>
  )
}
