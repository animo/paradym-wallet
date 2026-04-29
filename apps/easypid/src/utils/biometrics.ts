export const getBiometricsType = (biometryType?: string | null): 'face' | 'fingerprint' => {
  const normalizedBiometryType = biometryType?.toLowerCase()

  if (normalizedBiometryType?.includes('face') || normalizedBiometryType?.includes('optic')) {
    return 'face'
  }

  return 'fingerprint'
}
