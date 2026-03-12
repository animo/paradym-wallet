import type { TrustedX509Entity, TrustList } from '@package/agent'
import ExpoConstants from 'expo-constants'
import { isParadymWallet } from './hooks/useFeatureFlag'

export const mediatorDid = ExpoConstants.expoConfig?.extra?.mediatorDid
export const appScheme = ExpoConstants.expoConfig?.scheme as string
export const redirectBaseUrl = ExpoConstants.expoConfig?.extra?.redirectBaseUrl as string | undefined

export const EASYPID_WALLET_PID_PIN_KEY_ID = 'EASYPID_WALLET_PID_PIN_KEY_ID_NO_BIOMETRICS'
export const EASYPID_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID = 'EASYPID_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID'

export const walletClient = {
  // For easypid we don't want to update yet, as it will break integration with the playground
  clientId: isParadymWallet() ? appScheme : 'wallet',
  redirectUri: redirectBaseUrl ?? `${appScheme}:///wallet/redirect`,
}

export const trustedX509Entities = [
  {
    entityId: 'za.pid-issuer.gov.za',
    name: 'ZA Root CA Interim',
    certificate: `-----BEGIN CERTIFICATE-----
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
XHnG6mbbwOJSV4dWvIIcfFDFzk7q
-----END CERTIFICATE-----`,
    url: 'https://za.pid-issuer.gov.za',
    logoUri: 'https://creds-app.didx.co.za/assets/issuers/bdr/issuer.png',
    demo: true,
  },
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
    entityId: 'vodafone.com',
    name: 'Vodafone',
    certificate:
      'MIIBlzCCAT2gAwIBAgIJAITl3Hy6AsSiMAoGCCqGSM49BAMCMDQxMjAwBgNVBAMMKXN0YWdpbmdyZWYuZGUtc3NpLmlkLmF3cy5jcHMudm9kYWZvbmUuY29tMB4XDTI1MDIxMzA5MjQ0NloXDTI3MDIwMzA5MjQ0NlowNDEyMDAGA1UEAwwpc3RhZ2luZ3JlZi5kZS1zc2kuaWQuYXdzLmNwcy52b2RhZm9uZS5jb20wWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQZfGLORj1J0/GrpzX+pGBgsYklNphDdifn8Ibtn1Tda+YFsB5crY1BNENUNCWm8bFajvyo+Lwa9H/UkaSDNwXxozgwNjA0BgNVHREELTArgilzdGFnaW5ncmVmLmRlLXNzaS5pZC5hd3MuY3BzLnZvZGFmb25lLmNvbTAKBggqhkjOPQQDAgNIADBFAiB6lIaJ9JI3ct13vVeDshB5bOycP2Ujhd5gRU7Aok9aOQIhALgux4FW+s8nmdNGLmeyKDzu9FACNCuu1F+xu31ytB72',
    url: 'https://vodafone.de',
    logoUri: 'https://www.vodafone.de/media/img/icons/mid-render/New_VF_Icon_RGB_RED.svg',
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
  {
    entityId: 'netlight.com',
    name: 'Netlight',
    certificate: `-----BEGIN CERTIFICATE-----
MIIB8jCCAZmgAwIBAgIUVLA1pyMxWyZ6sSGLzX6XQ8mFbf4wCgYIKoZIzj0EAwIw
EjEQMA4GA1UEAxMHUm9vdCBDQTAeFw0yNTEwMDIwNzAzMjNaFw0yOTEwMDEwNzAz
NTNaMBIxEDAOBgNVBAMTB1Jvb3QgQ0EwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNC
AASox/z833PVTEsJNEGxgJ+fPghQppOezMNuS/xDOMQiGORexX3LV4sVfHEo0t8X
WDbw4/NbfI1W9/tNwJ9vU+v0o4HMMIHJMA4GA1UdDwEB/wQEAwIBBjAPBgNVHRMB
Af8EBTADAQH/MB0GA1UdDgQWBBTrb/aSv4fp6IQpIhIesfNDIB16ezAfBgNVHSME
GDAWgBTrb/aSv4fp6IQpIhIesfNDIB16ezA3BggrBgEFBQcBAQQrMCkwJwYIKwYB
BQUHMAKGG2h0dHA6Ly92YXVsdDo4MjAwL3YxL3BraS9jYTAtBgNVHR8EJjAkMCKg
IKAehhxodHRwOi8vdmF1bHQ6ODIwMC92MS9wa2kvY3JsMAoGCCqGSM49BAMCA0cA
MEQCIBYeAXvlQGRvBGPyKriyokhlzhSfmGX3KLWNcfTuj7hDAiBXKKKmD6a1qESO
SSEvZdjQ1YFEB9fdwof5kkokEEz2qw==
-----END CERTIFICATE-----`,
    url: 'https://www.netlight.com/',
    logoUri:
      'https://media.licdn.com/dms/image/v2/D4D0BAQHZ2gM5cWHJxQ/company-logo_200_200/company-logo_200_200/0/1708350843808/netlight_consulting_logo?e=1762992000&v=beta&t=2Qpgj26VRA_7AOWGvzQL7_xvyQ2c1Ic8auzAce6lVS8',
    demo: true,
  },
] satisfies Array<TrustedX509Entity>

export const trustedX509Certificates = trustedX509Entities.map((e) => e.certificate)

// https://gitlab.opencode.de/bmi/eudi-wallet/eidas-2.0-architekturkonzept/-/blob/main/architecture-proposal.md#pid-contents
const sdJwtVcVcts = [
  'https://demo.pid-issuer.bundesdruckerei.de/credentials/pid/1.0',
  'https://example.bmi.bund.de/credential/pid/1.0',
]

const arfSdJwtVcVcts = ['eu.europa.ec.eudi.pid.1', 'urn:eu.europa.ec.eudi:pid:1', 'urn:eudi:pid:1']

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
