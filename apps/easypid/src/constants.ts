import ExpoConstants from 'expo-constants'

export const mediatorDid = ExpoConstants.expoConfig?.extra?.mediatorDid
export const appScheme = ExpoConstants.expoConfig?.scheme as string

export const EASYPID_WALLET_PID_PIN_KEY_ID = 'EASYPID_WALLET_PID_PIN_KEY_ID_NO_BIOMETRICS'
export const EASYPID_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID = 'EASYPID_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID'

// https://demo.pid-issuer.bundesdruckerei.de
export const bdrRootCertificate = `-----BEGIN CERTIFICATE-----
MIICeTCCAiCgAwIBAgIUB5E9QVZtmUYcDtCjKB/H3VQv72gwCgYIKoZIzj0EAwIwgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMB4XDTI0MDUzMTA2NDgwOVoXDTM0MDUyOTA2NDgwOVowgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYGzdwFDnc7+Kn5ibAvCOM8ke77VQxqfMcwZL8IaIA+WCROcCfmY/giH92qMru5p/kyOivE0RC/IbdMONvDoUyaNmMGQwHQYDVR0OBBYEFNRWGMCJOOgOWIQYyXZiv6u7xZC+MB8GA1UdIwQYMBaAFNRWGMCJOOgOWIQYyXZiv6u7xZC+MBIGA1UdEwEB/wQIMAYBAf8CAQAwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMCA0cAMEQCIGEm7wkZKHt/atb4MdFnXW6yrnwMUT2u136gdtl10Y6hAiBuTFqvVYth1rbxzCP0xWZHmQK9kVyxn8GPfX27EIzzsw==
-----END CERTIFICATE-----`

// https://funke.animo.id
const animoFunkePlaygroundRootCertificate = `-----BEGIN CERTIFICATE-----
MIIBxDCCAWugAwIBAgIQa6TsKQUv6w086FYfCILeBDAKBggqhkjOPQQDAjAdMQ4w
DAYDVQQDEwVBbmltbzELMAkGA1UEBhMCTkwwHhcNMjQwMjI1MjI0ODE3WhcNMjgw
MjI1MjI0ODE3WjAdMQ4wDAYDVQQDEwVBbmltbzELMAkGA1UEBhMCTkwwWTATBgcq
hkjOPQIBBggqhkjOPQMBBwNCAATcD1XzKepFxWMAOqV+ln1fybBt7DRO5CV0f9A6
mRp2xWn9lR8juDM4hIVHgX6HmVQTPlk8mZfg4jAuv3frEuDCo4GMMIGJMB0GA1Ud
DgQWBBSDpTA/oENmN71O9OdtjLOvoFlahDAOBgNVHQ8BAf8EBAMCAQYwIQYDVR0S
BBowGIYWaHR0cHM6Ly9mdW5rZS5hbmltby5pZDASBgNVHRMBAf8ECDAGAQH/AgEA
MCEGA1UdHwQaMBgwFqAUoBKGEGh0dHBzOi8vYW5pbW8uaWQwCgYIKoZIzj0EAwID
RwAwRAIgfgaNsr/T5N8Pul0I1hrW78ip57V8hYrFJjQrYb46wzUCIArvDCfAbwL5
km2s3B9ZZYemLzI4d1PjMNMbOGrt21+q
-----END CERTIFICATE-----`

export const trustedX509Certificates = [bdrRootCertificate, animoFunkePlaygroundRootCertificate]

// https://gitlab.opencode.de/bmi/eudi-wallet/eidas-2.0-architekturkonzept/-/blob/main/architecture-proposal.md#pid-contents
const sdJwtVcVcts = [
  'https://demo.pid-issuer.bundesdruckerei.de/credentials/pid/1.0',
  'https://example.bmi.bund.de/credential/pid/1.0',
]

const arfSdJwtVcVcts = ['eu.europa.ec.eudi.pid.1', 'urn:eu.europa.ec.eudi:pid:1']

// https://github.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework/blob/main/docs/annexes/annex-3/annex-3.01-pid-rulebook.md#221-eu-wide-attestation-type-and-namespace-for-pid
const msoMdocDoctypes = ['eu.europa.ec.eudi.pid.1']

const mdlSdJwtVcVcts = ['https://example.eudi.ec.europa.eu/mdl/1']

const mdlMdocDoctypes = ['org.iso.18013.5.1.mDL']

export const pidSchemes = {
  arfSdJwtVcVcts,
  sdJwtVcVcts,
  msoMdocDoctypes,
}

export const mdlSchemes = {
  mdlSdJwtVcVcts,
  mdlMdocDoctypes,
}
