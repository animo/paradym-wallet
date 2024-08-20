export const AUSWEIS_WALLET_SEED_CREDENTIAL_RECORD_ID = 'AUSWEIS_WALLET_SEED_CREDENTIAL_RECORD_ID'
export const AUSWEIS_WALLET_PID_PIN_KEY_ID = 'AUSWEIS_WALLET_PID_PIN_KEY_ID'
export const AUSWEIS_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID = 'AUSWEIS_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID'

// https://demo.pid-issuer.bundesdruckerei.de
const bdrPidIssuerCertificate = `-----BEGIN CERTIFICATE-----
MIICeTCCAiCgAwIBAgIUB5E9QVZtmUYcDtCjKB/H3VQv72gwCgYIKoZIzj0EAwIwgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMB4XDTI0MDUzMTA2NDgwOVoXDTM0MDUyOTA2NDgwOVowgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYGzdwFDnc7+Kn5ibAvCOM8ke77VQxqfMcwZL8IaIA+WCROcCfmY/giH92qMru5p/kyOivE0RC/IbdMONvDoUyaNmMGQwHQYDVR0OBBYEFNRWGMCJOOgOWIQYyXZiv6u7xZC+MB8GA1UdIwQYMBaAFNRWGMCJOOgOWIQYyXZiv6u7xZC+MBIGA1UdEwEB/wQIMAYBAf8CAQAwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMCA0cAMEQCIGEm7wkZKHt/atb4MdFnXW6yrnwMUT2u136gdtl10Y6hAiBuTFqvVYth1rbxzCP0xWZHmQK9kVyxn8GPfX27EIzzsw==
-----END CERTIFICATE-----`

// https://funke.animo.id
const animoFunkeRelyingPartyCertificate =
  'MIH6MIGhoAMCAQICEDlbxpcN1V1PRbmc2TtPjNQwCgYIKoZIzj0EAwIwADAeFw03MDAxMDEwMDAwMDBaFw0yNTExMjIwODIyMTJaMAAwOTATBgcqhkjOPQIBBggqhkjOPQMBBwMiAALcD1XzKepFxWMAOqV+ln1fybBt7DRO5CV0f9A6mRp2xaMdMBswGQYDVR0RBBIwEIIOZnVua2UuYW5pbW8uaWQwCgYIKoZIzj0EAwIDSAAwRQIhAIFd2jlrZAzLTLsXdUE7O+CRuxuzk04lGo1eVYIbgT8iAiAQhR/FonhoLLTFjU/3tn5rPyB2DaOl3W18W5ugLWHjhQ=='

export const trustedX509Certificates = [bdrPidIssuerCertificate, animoFunkeRelyingPartyCertificate]

// https://gitlab.opencode.de/bmi/eudi-wallet/eidas-2.0-architekturkonzept/-/blob/main/architecture-proposal.md#pid-contents
const sdJwtVcVcts = ['https://example.bmi.bund.de/credential/pid/1.0', 'urn:eu.europa.ec.eudi:pid:1']

// TODO
const msoMdocNamespaces = ['org.iso.18013.5.1.mDL']

export const pidSchemes = {
  sdJwtVcVcts,
  msoMdocNamespaces,
}
