import type { TrustList } from '@paradym/wallet-sdk/trust/handlers/eudiRpAuthentication'
import type { TrustedX509Entity } from '@paradym/wallet-sdk/trust/handlers/x509'
import ExpoConstants from 'expo-constants'

export const mediatorDid = ExpoConstants.expoConfig?.extra?.mediatorDid
export const appScheme = ExpoConstants.expoConfig?.scheme as string

export const EASYPID_WALLET_PID_PIN_KEY_ID = 'EASYPID_WALLET_PID_PIN_KEY_ID_NO_BIOMETRICS'
export const EASYPID_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID = 'EASYPID_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID'

export const trustedX509Entities = [
  {
    entityId: 'demo.pid-issuer.bundesdruckerei.de',
    name: 'Bundesdruckerei',
    certificate: `-----BEGIN CERTIFICATE-----
MIICeTCCAiCgAwIBAgIUB5E9QVZtmUYcDtCjKB/H3VQv72gwCgYIKoZIzj0EAwIwgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMB4XDTI0MDUzMTA2NDgwOVoXDTM0MDUyOTA2NDgwOVowgYgxCzAJBgNVBAYTAkRFMQ8wDQYDVQQHDAZCZXJsaW4xHTAbBgNVBAoMFEJ1bmRlc2RydWNrZXJlaSBHbWJIMREwDwYDVQQLDAhUIENTIElERTE2MDQGA1UEAwwtU1BSSU5EIEZ1bmtlIEVVREkgV2FsbGV0IFByb3RvdHlwZSBJc3N1aW5nIENBMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYGzdwFDnc7+Kn5ibAvCOM8ke77VQxqfMcwZL8IaIA+WCROcCfmY/giH92qMru5p/kyOivE0RC/IbdMONvDoUyaNmMGQwHQYDVR0OBBYEFNRWGMCJOOgOWIQYyXZiv6u7xZC+MB8GA1UdIwQYMBaAFNRWGMCJOOgOWIQYyXZiv6u7xZC+MBIGA1UdEwEB/wQIMAYBAf8CAQAwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMCA0cAMEQCIGEm7wkZKHt/atb4MdFnXW6yrnwMUT2u136gdtl10Y6hAiBuTFqvVYth1rbxzCP0xWZHmQK9kVyxn8GPfX27EIzzsw==
-----END CERTIFICATE-----`,
    url: 'https://demo.pid-issuer.bundesdruckerei.de',
    logoUri: 'https://funke.animo.id/assets/issuers/bdr/issuer.png',
    demo: true,
  },
  {
    entityId: 'funke-wallet.de',
    name: 'German Registrar',
    certificate: `-----BEGIN CERTIFICATE-----
MIIBdTCCARugAwIBAgIUHsSmbGuWAVZVXjqoidqAVClGx4YwCgYIKoZIzj0EAwIw
GzEZMBcGA1UEAwwQR2VybWFuIFJlZ2lzdHJhcjAeFw0yNTAzMzAxOTU4NTFaFw0y
NjAzMzAxOTU4NTFaMBsxGTAXBgNVBAMMEEdlcm1hbiBSZWdpc3RyYXIwWTATBgcq
hkjOPQIBBggqhkjOPQMBBwNCAASQWCESFd0Ywm9sK87XxqxDP4wOAadEKgcZFVX7
npe3ALFkbjsXYZJsTGhVp0+B5ZtUao2NsyzJCKznPwTz2wJcoz0wOzAaBgNVHREE
EzARgg9mdW5rZS13YWxsZXQuZGUwHQYDVR0OBBYEFMxnKLkGifbTKrxbGXcFXK6R
FQd3MAoGCCqGSM49BAMCA0gAMEUCIQD4RiLJeuVDrEHSvkPiPfBvMxAXRC6PuExo
pUGCFdfNLQIgHGSa5u5ZqUtCrnMiaEageO71rjzBlov0YUH4+6ELioY=
-----END CERTIFICATE-----`,
    url: 'https://funke-wallet.de',
    logoUri: 'https://funke.animo.id/assets/verifiers/bunde.png',
    demo: true,
  },
  {
    entityId: 'funke.animo.id',
    certificate:
      'MIIBzzCCAXWgAwIBAgIQVwAFolWQim94gmyCic3bCTAKBggqhkjOPQQDAjAdMQ4wDAYDVQQDEwVBbmltbzELMAkGA1UEBhMCTkwwHhcNMjQwNTAyMTQyMzMwWhcNMjgwNTAyMTQyMzMwWjAdMQ4wDAYDVQQDEwVBbmltbzELMAkGA1UEBhMCTkwwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQC/YyBpcRQX8ZXpHfra1TNdSbS7qzgHYHJ3msbIr8TJLPNZI8Ul8zJlFdQVIVls5+5ClCbN+J9FUvhPGs4AzA+o4GWMIGTMB0GA1UdDgQWBBQv3zBo1i/1CfEgdvkIWDGO9lS1SzAOBgNVHQ8BAf8EBAMCAQYwIQYDVR0SBBowGIYWaHR0cHM6Ly9mdW5rZS5hbmltby5pZDASBgNVHRMBAf8ECDAGAQH/AgEAMCsGA1UdHwQkMCIwIKAeoByGGmh0dHBzOi8vZnVua2UuYW5pbW8uaWQvY3JsMAoGCCqGSM49BAMCA0gAMEUCIQCTg80AmqVHJLaZt2uuhAtPqKIXafP2ghtd9OCmdD51ZwIgKvVkrgTYlxSRAbmKY6MlkH8mM3SNcnEJk9fGVwJG++0=',
    name: 'Animo Playground',
    logoUri: 'https://funke.animo.id/assets/verifiers/animo/verifier.jpg',
    url: 'https://funke.animo.id',
    demo: true,
  },
  {
    entityId: 'verifier.eudiw.dev',
    name: 'EUDI Reference Verifier',
    certificate:
      'MIIDHTCCAqOgAwIBAgIUVqjgtJqf4hUYJkqdYzi+0xwhwFYwCgYIKoZIzj0EAwMwXDEeMBwGA1UEAwwVUElEIElzc3VlciBDQSAtIFVUIDAxMS0wKwYDVQQKDCRFVURJIFdhbGxldCBSZWZlcmVuY2UgSW1wbGVtZW50YXRpb24xCzAJBgNVBAYTAlVUMB4XDTIzMDkwMTE4MzQxN1oXDTMyMTEyNzE4MzQxNlowXDEeMBwGA1UEAwwVUElEIElzc3VlciBDQSAtIFVUIDAxMS0wKwYDVQQKDCRFVURJIFdhbGxldCBSZWZlcmVuY2UgSW1wbGVtZW50YXRpb24xCzAJBgNVBAYTAlVUMHYwEAYHKoZIzj0CAQYFK4EEACIDYgAEFg5Shfsxp5R/UFIEKS3L27dwnFhnjSgUh2btKOQEnfb3doyeqMAvBtUMlClhsF3uefKinCw08NB31rwC+dtj6X/LE3n2C9jROIUN8PrnlLS5Qs4Rs4ZU5OIgztoaO8G9o4IBJDCCASAwEgYDVR0TAQH/BAgwBgEB/wIBADAfBgNVHSMEGDAWgBSzbLiRFxzXpBpmMYdC4YvAQMyVGzAWBgNVHSUBAf8EDDAKBggrgQICAAABBzBDBgNVHR8EPDA6MDigNqA0hjJodHRwczovL3ByZXByb2QucGtpLmV1ZGl3LmRldi9jcmwvcGlkX0NBX1VUXzAxLmNybDAdBgNVHQ4EFgQUs2y4kRcc16QaZjGHQuGLwEDMlRswDgYDVR0PAQH/BAQDAgEGMF0GA1UdEgRWMFSGUmh0dHBzOi8vZ2l0aHViLmNvbS9ldS1kaWdpdGFsLWlkZW50aXR5LXdhbGxldC9hcmNoaXRlY3R1cmUtYW5kLXJlZmVyZW5jZS1mcmFtZXdvcmswCgYIKoZIzj0EAwMDaAAwZQIwaXUA3j++xl/tdD76tXEWCikfM1CaRz4vzBC7NS0wCdItKiz6HZeV8EPtNCnsfKpNAjEAqrdeKDnr5Kwf8BA7tATehxNlOV4Hnc10XO1XULtigCwb49RpkqlS2Hul+DpqObUs',
    logoUri: 'https://issuer.eudiw.dev/ic-logo.png',
    url: 'https://verifier.eudiw.dev',
    demo: true,
  },
  {
    entityId: 'docusign.com',
    name: 'Docusign',
    certificate:
      'MIIC9jCCApugAwIBAgIULJzqL8PyHb0JXERTUfpqfOcLsa4wCgYIKoZIzj0EAwIwgYAxLjAsBgNVBAMMJWRvY3VzaWduLXdhbGxldC12ZXJpZmllci5kb2N1c2lnbi5uZXQxCzAJBgNVBAYTAkZSMRcwFQYDVQQIDA7DjmxlLWRlLUZyYW5jZTEOMAwGA1UEBwwFUGFyaXMxGDAWBgNVBAoMD0RvY3VzaWduIEZyYW5jZTAeFw0yNTA0MDExMDAzMTlaFw0yODAzMzExMDAzMTlaMIGAMS4wLAYDVQQDDCVkb2N1c2lnbi13YWxsZXQtdmVyaWZpZXIuZG9jdXNpZ24ubmV0MQswCQYDVQQGEwJGUjEXMBUGA1UECAwOw45sZS1kZS1GcmFuY2UxDjAMBgNVBAcMBVBhcmlzMRgwFgYDVQQKDA9Eb2N1c2lnbiBGcmFuY2UwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAATKs8uiLftrFSaQtB87XTYq0YiFZPFEmVKQ2CFeQ3j5zG0kJefW4ktgxn69g7eX9PTB1siakMSGwe48mE9BdfFLo4HwMIHtMB0GA1UdDgQWBBSaNNjHj2ZyRbU0QiqxufROmNzFPzAfBgNVHSMEGDAWgBSaNNjHj2ZyRbU0QiqxufROmNzFPzAOBgNVHQ8BAf8EBAMCBaAwIAYDVR0lAQH/BBYwFAYIKwYBBQUHAwEGCCsGAQUFBwMCMHkGA1UdEQRyMHCCQWV1ZGl3YWxsZXRwb2MtYTNhNWdnaDRhN2R3aDNnaC5mcmFuY2VjZW50cmFsLTAxLmF6dXJld2Vic2l0ZXMubmV0giVkb2N1c2lnbi13YWxsZXQtdmVyaWZpZXIuZG9jdXNpZ24ubmV0hwTAqAK+MAoGCCqGSM49BAMCA0kAMEYCIQDOSfhPlPBsEZcaBwy7+ZQ2Iqdfvwk5IrA3QAQErI/pwQIhAI8x3fFVGgbKW2qywGwbjd5WwsEUW8FOdeNvbp9RQn8s',
    url: 'https://docusign.com',
    logoUri: 'https://www.docusign.com/assets/images/android-chrome-192x192.png',
    demo: true,
  },
  {
    entityId: 'lapid.de',
    name: 'LapID Service GmbH',
    certificate: `-----BEGIN CERTIFICATE-----
MIIDUzCCAvqgAwIBAgIIEJwOS9viWVowCgYIKoZIzj0EAwIwbTELMAkGA1UEBhMC
REUxHDAaBgNVBAgTE05vcmRyaGVpbi1XZXN0ZmFsZW4xEDAOBgNVBAcTB05ldHBo
ZW4xGzAZBgNVBAoTEkxhcElEIFNlcnZpY2UgR21iSDERMA8GA1UEAxMIbGFwaWQu
ZGUwHhcNMjUwNjI3MTUwNjAwWhcNMzUwNjI3MTUwNjAwWjBtMQswCQYDVQQGEwJE
RTEcMBoGA1UECBMTTm9yZHJoZWluLVdlc3RmYWxlbjEQMA4GA1UEBxMHTmV0cGhl
bjEbMBkGA1UEChMSTGFwSUQgU2VydmljZSBHbWJIMREwDwYDVQQDEwhsYXBpZC5k
ZTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABGjv5WwRe2H7xS7YF0B0qGXyA3o8
Ds/CxcdBK8QyWHLcrngw70mF/1c6bPkGssoOPKTtNqD+rq5W1w7TrXh21DqjggGC
MIIBfjASBgNVHRMBAf8ECDAGAQH/AgEAMB0GA1UdDgQWBBTlfcboYdSaKjeC0Y7N
5QflO0S6FzAOBgNVHQ8BAf8EBAMCAQYwWQYDVR0RBFIwUIIIbGFwaWQuZGWCC2xh
cGlkZGV2LmRlggxsYXBpZHRlc3QuZGWCCioubGFwaWQuZGWCDSoubGFwaWRkZXYu
ZGWCDioubGFwaWR0ZXN0LmRlMCUGA1UdEgQeMByCCGxhcGlkLmRlhhBodHRwczov
L2xhcGlkLmRlMIG2BgNVHR8Ega4wgaswU6BRoE+GTWh0dHA6Ly9tZWRpYS5sYXBp
ZC5kZS9zaGFyZS9lbnR3aWNrbHVuZy9jZXJ0aWZpY2F0ZXMvY2FfY2Ffcl9kZV9s
YXBpZF8wMDAuY3JsMFSgUqBQhk5odHRwczovL21lZGlhLmxhcGlkLmRlL3NoYXJl
L2VudHdpY2tsdW5nL2NlcnRpZmljYXRlcy9jYV9jYV9yX2RlX2xhcGlkXzAwMC5j
cmwwCgYIKoZIzj0EAwIDRwAwRAIgUrY+CTWdCIQRFD2Zmm/aUGV8SavZ2VltmdwK
zl7B9gcCICAougCYFMfxe4kSjIOcMfV/u+cG3wrF5HzHSQx2qK15
-----END CERTIFICATE-----
`,
    url: 'https://lapid.de',
    logoUri: 'https://www.lapid.de/wp-content/uploads/2022/03/LapID-Logo_RBG_400px.png',
    demo: true,
  },
] satisfies Array<TrustedX509Entity>

export const trustedX509Certificates = trustedX509Entities.map((e) => e.certificate)

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

export const eudiTrustList: TrustList = {
  entityId: 'EU',
  organizationName: 'European Union',
  logoUri: require('../assets/eu.png'),
  demo: true,
  trustList: [
    {
      entityId: 'germany',
      organizationName: 'German Government',
      logoUri: require('../assets/germany.png'),
      demo: true,
      trustedRelyingPartyRegistrars: [
        {
          entityId: 'funke-wallet.de',
          logoUri: 'https://funke.animo.id/assets/verifiers/bunde.png',
          organizationName: 'Funke Registrar',
          demo: true,
        },
      ],
    },
  ],
}

const BASE_URL = 'https://funke.animo.id/oid4vp'

export const trustedEntityIds = [
  `${BASE_URL}/0193687b-0c27-7b82-a686-ff857dc6bbb3`,
  `${BASE_URL}/0193687f-20d8-720a-9139-ed939ba510fa`,
  `${BASE_URL}/019368ed-3787-7669-b7f4-8c012238e90d`,
  `${BASE_URL}/01936907-56a3-7007-a61f-44bff8b5d175`,
  `${BASE_URL}/01936903-8879-733f-8eaf-6f2fa862099c`,
] satisfies [string, ...string[]]
