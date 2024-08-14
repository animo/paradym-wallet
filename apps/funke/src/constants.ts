export const FUNKE_WALLET_SEED_CREDENTIAL_RECORD_ID = 'FUNKE_WALLET_SEED_CREDENTIAL_RECORD_ID '
export const FUNKE_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID = 'FUNKE_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID'

// https://demo.pid-issuer.bundesdruckerei.de
const bdrPidIssuerCertificate = `-----BEGIN CERTIFICATE-----
MIICeTCCAiCgAwIBAgIUB5E9QVZtmUYcDtCjKB/H3VQv72gwCgYIKoZIzj0EAwIwgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMB4XDTI0MDUzMTA2NDgwOVoXDTM0MDUyOTA2NDgwOVowgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYGzdwFDnc7+Kn5ibAvCOM8ke77VQxqfMcwZL8IaIA+WCROcCfmY/giH92qMru5p/kyOivE0RC/IbdMONvDoUyaNmMGQwHQYDVR0OBBYEFNRWGMCJOOgOWIQYyXZiv6u7xZC+MB8GA1UdIwQYMBaAFNRWGMCJOOgOWIQYyXZiv6u7xZC+MBIGA1UdEwEB/wQIMAYBAf8CAQAwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMCA0cAMEQCIGEm7wkZKHt/atb4MdFnXW6yrnwMUT2u136gdtl10Y6hAiBuTFqvVYth1rbxzCP0xWZHmQK9kVyxn8GPfX27EIzzsw==
-----END CERTIFICATE-----`

// https://funke.animo.id
const animoFunkeRelyingPartyCertificate =
  'MIIBAzCBq6ADAgECAhArxq0w60RTDK4WY9HzgcvBMAoGCCqGSM49BAMCMAAwIBcNNzAwMTAxMDAwMDAwWhgPMjI4NjExMjAxNzQ2NDBaMAAwOTATBgcqhkjOPQIBBggqhkjOPQMBBwMiAALcD1XzKepFxWMAOqV+ln1fybBt7DRO5CV0f9A6mRp2xaMlMCMwIQYDVR0RBBowGIYWaHR0cHM6Ly9mdW5rZS5hbmltby5pZDAKBggqhkjOPQQDAgNHADBEAiAfvGG6sqrvzIMWYpJB5VLloo9f51loYXSkKxJIOztlNwIgLLSvEl0Dmp5vtj2buZ2nXQ2RBKxiLbc5eYGeMeoUnjk='

export const trustedX509Certificates = [bdrPidIssuerCertificate, animoFunkeRelyingPartyCertificate]

// https://gitlab.opencode.de/bmi/eudi-wallet/eidas-2.0-architekturkonzept/-/blob/main/architecture-proposal.md#pid-contents
const sdJwtVcVcts = ['https://example.bmi.bund.de/credential/pid/1.0', 'urn:eu.europa.ec.eudi:pid:1']

// https://github.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework/blob/main/docs/annexes/annex-3/annex-3.01-pid-rulebook.md#221-eu-wide-attestation-type-and-namespace-for-pid
const msoMdocDoctypes = ['eu.europa.ec.eudi.pid.1']

export const pidSchemes = {
  sdJwtVcVcts,
  msoMdocDoctypes,
}
