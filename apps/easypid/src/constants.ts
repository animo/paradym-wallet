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

const ubiqueRootCertificate =
  'MIIBZjCCAQygAwIBAgIGAZGJt173MAoGCCqGSM49BAMCMB8xHTAbBgNVBAMMFGh0dHBzOi8vYXV0aG9yaXR5LmNoMB4XDTI0MDgyNTEzMjYyMVoXDTI1MDgyNTEzMjYyMVowHzEdMBsGA1UEAwwUaHR0cHM6Ly9hdXRob3JpdHkuY2gwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAScIjAmHrkp3TC6bisgaqmszbKkpY0iGTdHF2rcRemJCV+ikotDt7G+ApwG0m6fxt8aBJHeJ2mssLvZBmZj5LtWozQwMjAfBgNVHREEGDAWghRodHRwczovL2F1dGhvcml0eS5jaDAPBgNVHRMBAf8EBTADAQH/MAoGCCqGSM49BAMCA0gAMEUCIQCpQsxyQx/5knqhGnDCiAo6MpQmTCd7vA9WehF4/1P8/QIgEnAtFVTP1uThuTEna1RD4Ji35+z1h8pDoMyLPd3Uaig='

export const trustedX509Certificates = [
  bdrPidIssuerCertificate,
  animoFunkeRelyingPartyCertificate,
  ubiqueRootCertificate,
  oldAnimoFunkeRelyingPartyCertificate,
  'MIIBJzCBzqADAgECAhBKouhMYz90wxkcp/B/V5aoMAoGCCqGSM49BAMCMA0xCzAJBgNVBAYTAk5MMB4XDTcwMDEwMTAwMDAwMFoXDTI1MTEyMjA4MjIxMlowDTELMAkGA1UEBhMCTkwwOTATBgcqhkjOPQIBBggqhkjOPQMBBwMiAALcD1XzKepFxWMAOqV+ln1fybBt7DRO5CV0f9A6mRp2xaMwMC4wLAYDVR0RBCUwI4IhMDRkNy0yMTctMTIzLTE4LTI2Lm5ncm9rLWZyZWUuYXBwMAoGCCqGSM49BAMCA0gAMEUCIBRCajJr2ahZQtwimW2hTLxajpWXHKjBiLM4vKxFRRnEAiEArt7Scc5onNghS+XrX21tyj0rTNSr5lM6AeruffOxk+Y=',
]

// https://gitlab.opencode.de/bmi/eudi-wallet/eidas-2.0-architekturkonzept/-/blob/main/architecture-proposal.md#pid-contents
const sdJwtVcVcts = ['https://example.bmi.bund.de/credential/pid/1.0', 'urn:eu.europa.ec.eudi:pid:1']

// https://github.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework/blob/main/docs/annexes/annex-3/annex-3.01-pid-rulebook.md#221-eu-wide-attestation-type-and-namespace-for-pid
const msoMdocDoctypes = ['eu.europa.ec.eudi.pid.1']

export const pidSchemes = {
  sdJwtVcVcts,
  msoMdocDoctypes,
}
