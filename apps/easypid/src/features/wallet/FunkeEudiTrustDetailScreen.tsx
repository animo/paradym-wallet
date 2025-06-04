import { FunkeTrustDetailScreen, type FunkeTrustDetailScreenProps } from './FunkeTrustDetailScreen'

export const FunkeEudiTrustDetailScreen = (props: FunkeTrustDetailScreenProps) => (
  <FunkeTrustDetailScreen {...props} trustMechanism="eudi_rp_authentication" />
)
