import ExpoConstants from 'expo-constants'

export const mediatorDid = ExpoConstants.expoConfig?.extra?.mediatorDid
export const appScheme = ExpoConstants.expoConfig?.scheme as string

export const EASYPID_WALLET_PID_PIN_KEY_ID = 'EASYPID_WALLET_PID_PIN_KEY_ID_NO_BIOMETRICS'
export const EASYPID_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID = 'EASYPID_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID'

// https://demo.pid-issuer.bundesdruckerei.de
export const bdrPidIssuerCertificate =
  'MIICeTCCAiCgAwIBAgIUB5E9QVZtmUYcDtCjKB/H3VQv72gwCgYIKoZIzj0EAwIwgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMB4XDTI0MDUzMTA2NDgwOVoXDTM0MDUyOTA2NDgwOVowgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYGzdwFDnc7+Kn5ibAvCOM8ke77VQxqfMcwZL8IaIA+WCROcCfmY/giH92qMru5p/kyOivE0RC/IbdMONvDoUyaNmMGQwHQYDVR0OBBYEFNRWGMCJOOgOWIQYyXZiv6u7xZC+MB8GA1UdIwQYMBaAFNRWGMCJOOgOWIQYyXZiv6u7xZC+MBIGA1UdEwEB/wQIMAYBAf8CAQAwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMCA0cAMEQCIGEm7wkZKHt/atb4MdFnXW6yrnwMUT2u136gdtl10Y6hAiBuTFqvVYth1rbxzCP0xWZHmQK9kVyxn8GPfX27EIzzsw=='

// https://funke.animo.id
// Old one, keeping it in to not break things
const oldAnimoFunkeRelyingPartyCertificate =
  'MIH6MIGhoAMCAQICEDlbxpcN1V1PRbmc2TtPjNQwCgYIKoZIzj0EAwIwADAeFw03MDAxMDEwMDAwMDBaFw0yNTExMjIwODIyMTJaMAAwOTATBgcqhkjOPQIBBggqhkjOPQMBBwMiAALcD1XzKepFxWMAOqV+ln1fybBt7DRO5CV0f9A6mRp2xaMdMBswGQYDVR0RBBIwEIIOZnVua2UuYW5pbW8uaWQwCgYIKoZIzj0EAwIDSAAwRQIhAIFd2jlrZAzLTLsXdUE7O+CRuxuzk04lGo1eVYIbgT8iAiAQhR/FonhoLLTFjU/3tn5rPyB2DaOl3W18W5ugLWHjhQ=='

// Includes C=NL (required for the mdoc verification)
const animoFunkeRelyingPartyCertificate =
  'MIIBEzCBu6ADAgECAhBwnaR5jboQ4R7Ne/k+sfhCMAoGCCqGSM49BAMCMA0xCzAJBgNVBAYTAk5MMB4XDTcwMDEwMTAwMDAwMFoXDTI1MTEyMjA4MjIxMlowDTELMAkGA1UEBhMCTkwwOTATBgcqhkjOPQIBBggqhkjOPQMBBwMiAALcD1XzKepFxWMAOqV+ln1fybBt7DRO5CV0f9A6mRp2xaMdMBswGQYDVR0RBBIwEIIOZnVua2UuYW5pbW8uaWQwCgYIKoZIzj0EAwIDRwAwRAIgPM5ITfUD6VWLgRm8Eu1gw53Of+SUdjS+yRClR68m//4CIDxnng7NnJyGnpsKDuUqSIl/A0rRQCwTLBZw9Hx3MZnZ'

// New Animo Funke Root certificate compliant with mdoc
const animoFunkeRootRelyingPartyCertificate =
  'MIICBjCCAa2gAwIBAgIQSmLLvu9uyoZ+jmRef5K5fjAKBggqhkjOPQQDAjAdMQ4wDAYDVQQDEwVBbmltbzELMAkGA1UEBhMCTkwwHhcNMjQwMjE5MTEwNDQ3WhcNMjgwMjE5MTEwNDQ3WjAdMQ4wDAYDVQQDEwVBbmltbzELMAkGA1UEBhMCTkwwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATcD1XzKepFxWMAOqV+ln1fybBt7DRO5CV0f9A6mRp2xWn9lR8juDM4hIVHgX6HmVQTPlk8mZfg4jAuv3frEuDCo4HOMIHLMEoGA1UdDgRDBEEE3A9V8ynqRcVjADqlfpZ9X8mwbew0TuQldH/QOpkadsVp/ZUfI7gzOISFR4F+h5lUEz5ZPJmX4OIwLr936xLgwjAOBgNVHQ8BAf8EBAMCAQYwNgYDVR0SBC8wLYYraHR0cHM6Ly8xNzkwLTE3OC0yMjQtMjIzLTI1MS5uZ3Jvay1mcmVlLmFwcDASBgNVHRMBAf8ECDAGAQH/AgEAMCEGA1UdHwQaMBgwFqAUoBKGEGh0dHBzOi8vYW5pbW8uaWQwCgYIKoZIzj0EAwIDRwAwRAIgemJ+XKNrW0PJtW2qh1FD4g4IVdGvs9AI5Y8EkOsjCRUCIH0zj+1VCvqc4rR4oYLmayeqGKOfWzGwM3NxsU12lkWx'

const ubiqueRootCertificate =
  'MIIBZjCCAQygAwIBAgIGAZGJt173MAoGCCqGSM49BAMCMB8xHTAbBgNVBAMMFGh0dHBzOi8vYXV0aG9yaXR5LmNoMB4XDTI0MDgyNTEzMjYyMVoXDTI1MDgyNTEzMjYyMVowHzEdMBsGA1UEAwwUaHR0cHM6Ly9hdXRob3JpdHkuY2gwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAScIjAmHrkp3TC6bisgaqmszbKkpY0iGTdHF2rcRemJCV+ikotDt7G+ApwG0m6fxt8aBJHeJ2mssLvZBmZj5LtWozQwMjAfBgNVHREEGDAWghRodHRwczovL2F1dGhvcml0eS5jaDAPBgNVHRMBAf8EBTADAQH/MAoGCCqGSM49BAMCA0gAMEUCIQCpQsxyQx/5knqhGnDCiAo6MpQmTCd7vA9WehF4/1P8/QIgEnAtFVTP1uThuTEna1RD4Ji35+z1h8pDoMyLPd3Uaig='

const ubiqueIssuer =
  'MIICsTCCAlegAwIBAgIUeN7cTJgPmbK39asN8Wf3VLOSCTAwCgYIKoZIzj0EAwIwgcYxCzAJBgNVBAYTAkRFMR0wGwYDVQQIDBRHZW1laW5kZSBNdXN0ZXJzdGFkdDEUMBIGA1UEBwwLTXVzdGVyc3RhZHQxHTAbBgNVBAoMFEdlbWVpbmRlIE11c3RlcnN0YWR0MQswCQYDVQQLDAJJVDEpMCcGA1UEAwwgaXNzdWFuY2UuZ2VtZWluZGUtbXVzdGVyc3RhZHQuZGUxKzApBgkqhkiG9w0BCQEWHHRlc3RAZ2VtZWluZGUtbXVzdGVyc3RhZHQuZGUwHhcNMjQxMTE1MDgzNzA4WhcNMzQxMTEzMDgzNzA4WjCBxjELMAkGA1UEBhMCREUxHTAbBgNVBAgMFEdlbWVpbmRlIE11c3RlcnN0YWR0MRQwEgYDVQQHDAtNdXN0ZXJzdGFkdDEdMBsGA1UECgwUR2VtZWluZGUgTXVzdGVyc3RhZHQxCzAJBgNVBAsMAklUMSkwJwYDVQQDDCBpc3N1YW5jZS5nZW1laW5kZS1tdXN0ZXJzdGFkdC5kZTErMCkGCSqGSIb3DQEJARYcdGVzdEBnZW1laW5kZS1tdXN0ZXJzdGFkdC5kZTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABDYXt8M+5E1ADj5N2Rv/zIwBlvkTlt3gsscrKP4owg6km9Ejv5bHqDWY+nQi29ezNH2tkhGrKe0ZsmeH9ZqUsI+jITAfMB0GA1UdDgQWBBRSW2AGYj1dJ5Nz84/XojDDjH00XzAKBggqhkjOPQQDAgNIADBFAiBJ7ohG3x9iBlbTeSLnJGTFdwfw10mM9sd1J/TpoijcfAIhALgJgE/w3/J7jJMvZq+EiUT8DkhKTTUNhN74uA+bL4v6'

export const trustedX509Certificates = [
  ubiqueIssuer,
  bdrPidIssuerCertificate,
  animoFunkeRelyingPartyCertificate,
  ubiqueRootCertificate,
  oldAnimoFunkeRelyingPartyCertificate,
  animoFunkeRootRelyingPartyCertificate,
  'MIIBJzCBz6ADAgECAhA0WLLsSm0Hf5R2/q7neHUKMAoGCCqGSM49BAMCMA0xCzAJBgNVBAYTAk5MMB4XDTcwMDEwMTAwMDAwMFoXDTI1MTEyMjA4MjIxMlowDTELMAkGA1UEBhMCTkwwOTATBgcqhkjOPQIBBggqhkjOPQMBBwMiAALcD1XzKepFxWMAOqV+ln1fybBt7DRO5CV0f9A6mRp2xaMxMC8wLQYDVR0RBCYwJIIiNGFjNS0xMDktMzctMTUwLTE5OC5uZ3Jvay1mcmVlLmFwcDAKBggqhkjOPQQDAgNHADBEAiAEqDL6WHBelM4YW3L0k2criU+Za/FlDEuAJKuY+LiY/AIgR0qGuW9qu4wUo/kcJ75mv+jAwV25ABmYAnbUX/7u5lI=',
]

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
