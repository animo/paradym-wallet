import type { TrustedDidEntity, TrustedOpenId4VciEntity, TrustedX509Entity, TrustList } from '@paradym/wallet-sdk'
import ExpoConstants from 'expo-constants'

export const mediatorDid = ExpoConstants.expoConfig?.extra?.mediatorDid
export const appScheme = ExpoConstants.expoConfig?.scheme as string
export const allowedRedirectBaseUrls = ExpoConstants.expoConfig?.extra?.allowedRedirectBaseUrls as string[] | undefined

export const EASYPID_WALLET_PID_PIN_KEY_ID = 'EASYPID_WALLET_PID_PIN_KEY_ID_NO_BIOMETRICS'
export const EASYPID_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID = 'EASYPID_WALLET_INSTANCE_LONG_TERM_AES_KEY_ID'

export const walletClient = {
  clientId: appScheme,
  // Take first redirect if available
  redirectUri: allowedRedirectBaseUrls?.[0] ?? `${appScheme}:///wallet/redirect`,
}

export const trustedX509Entities = [
  {
    entityId: 'eudi-payments.animo.id',
    certificate:
      'MIIB4DCCAYWgAwIBAgIQXXMM3GvTV+Y205WOFDjYVTAKBggqhkjOPQQDAjAdMQ4wDAYDVQQDEwVBbmltbzELMAkGA1UEBhMCTkwwHhcNMjUwMTE2MjIyMTE5WhcNMjkwMTE2MjIyMTE5WjAdMQ4wDAYDVQQDEwVBbmltbzELMAkGA1UEBhMCTkwwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARZA0ip3d/WTVVsgPpOUQZa3MYHlIk2yYdHoN4+6d7RnBcbwbqbvq17mJyWmFkCAmETaJfP/GmJccsAWJuYS3OOo4GmMIGjMB0GA1UdDgQWBBTBXOGIQn1/MK2b2tkDV/3Gmj9bbjAOBgNVHQ8BAf8EBAMCAQYwKQYDVR0SBCIwIIYeaHR0cHM6Ly9ldWRpLXBheW1lbnRzLmFuaW1vLmlkMBIGA1UdEwEB/wQIMAYBAf8CAQAwMwYDVR0fBCwwKjAooCagJIYiaHR0cHM6Ly9ldWRpLXBheW1lbnRzLmFuaW1vLmlkL2NybDAKBggqhkjOPQQDAgNJADBGAiEAzg+RsYs3gF+QUm3D0StEQt/4FE5rgB/qy2EB8X8kBQMCIQDMCRiQFLHpKuDxEfSnAxVGJ3Tp9CPDfV6wJwla+jLC2w==',
    name: 'Animo Payments Playground',
    logoUri: 'https://eudi-payments.animo.id/assets/verifiers/animo/verifier.jpg',
    url: 'https://eudi-payments.animo.id',
    demo: true,
  },
  {
    entityId: 'playground.animo.id',
    certificate:
      'MIIB2zCCAYCgAwIBAgIRALanVqNUK4dgPlUmlAasZ24wCgYIKoZIzj0EAwIwHTEOMAwGA1UEAxMFQW5pbW8xCzAJBgNVBAYTAk5MMB4XDTI0MTEyODE2MjgzMFoXDTI4MTEyODE2MjgzMFowHTEOMAwGA1UEAxMFQW5pbW8xCzAJBgNVBAYTAk5MMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEwDpb2uNodErbJfEWteLF6pGiqaxNfF9rFyttjJy+No0gmzn4wkgYqvGtcX5W4blXT1PQubGml5QUmpm5d41zd6OBoDCBnTAdBgNVHQ4EFgQUVC5XW1PTYNo6yWnkJGgvBVCtWZUwDgYDVR0PAQH/BAQDAgEGMCYGA1UdEgQfMB2GG2h0dHBzOi8vcGxheWdyb3VuZC5hbmltby5pZDASBgNVHRMBAf8ECDAGAQH/AgEAMDAGA1UdHwQpMCcwJaAjoCGGH2h0dHBzOi8vcGxheWdyb3VuZC5hbmltby5pZC9jcmwwCgYIKoZIzj0EAwIDSQAwRgIhAJvXTWWteCIeZPbzn+Y++Lpf4eFTmxP2M5o4phGsLuZcAiEAuiL89d9a2CQbQo8dzNpnV+P9JrUnKRQuP5ZZ9VJcoJI=',
    name: 'Animo Playground',
    logoUri: 'https://playground.animo.id/assets/verifiers/animo/verifier.jpg',
    url: 'https://playground.animo.id',
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
  {
    name: 'Animo Playground',
    url: 'https://playground.animo.id',
    certificate:
      'MIIB2zCCAYCgAwIBAgIRALanVqNUK4dgPlUmlAasZ24wCgYIKoZIzj0EAwIwHTEOMAwGA1UEAxMFQW5pbW8xCzAJBgNVBAYTAk5MMB4XDTI0MTEyODE2MjgzMFoXDTI4MTEyODE2MjgzMFowHTEOMAwGA1UEAxMFQW5pbW8xCzAJBgNVBAYTAk5MMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEwDpb2uNodErbJfEWteLF6pGiqaxNfF9rFyttjJy+No0gmzn4wkgYqvGtcX5W4blXT1PQubGml5QUmpm5d41zd6OBoDCBnTAdBgNVHQ4EFgQUVC5XW1PTYNo6yWnkJGgvBVCtWZUwDgYDVR0PAQH/BAQDAgEGMCYGA1UdEgQfMB2GG2h0dHBzOi8vcGxheWdyb3VuZC5hbmltby5pZDASBgNVHRMBAf8ECDAGAQH/AgEAMDAGA1UdHwQpMCcwJaAjoCGGH2h0dHBzOi8vcGxheWdyb3VuZC5hbmltby5pZC9jcmwwCgYIKoZIzj0EAwIDSQAwRgIhAJvXTWWteCIeZPbzn+Y++Lpf4eFTmxP2M5o4phGsLuZcAiEAuiL89d9a2CQbQo8dzNpnV+P9JrUnKRQuP5ZZ9VJcoJI=',
    logoUri: 'https://playground.animo.id/logo.svg',
    entityId: 'playground.animo.id',
    demo: true,
  },
  {
    name: 'Paradym Playground',
    url: 'https://playground.paradym.id',
    certificate:
      'MIICMzCCAdmgAwIBAgIQUIrWwRRwpN1wZkJ3kddlkTAKBggqhkjOPQQDAjAqMRswGQYDVQQDExJQYXJhZHltIFBsYXlncm91bmQxCzAJBgNVBAYTAk5MMB4XDTI2MDYwMzEwMjMwNVoXDTMxMDYwMzEwMjMwNVowKjEbMBkGA1UEAxMSUGFyYWR5bSBQbGF5Z3JvdW5kMQswCQYDVQQGEwJOTDBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABFLppN8WJtE5sYI8xjfV5y0wmPP+ZZANpbxsQIDjBm72/N2Z4XrzEesuR4mPqdJ/yzrPx3plR7jg1oUO8YGx3wOjgeAwgd0wHQYDVR0OBBYEFJGF8RBTTXxJM8R1X0MyDdmf0srGMA4GA1UdDwEB/wQEAwIBBjAoBgNVHRIEITAfhh1odHRwczovL3BsYXlncm91bmQucGFyYWR5bS5pZDASBgNVHRMBAf8ECDAGAQH/AgEAMG4GA1UdHwRnMGUwY6BhoF+GXWh0dHBzOi8vbWV0YWRhdGEucGFyYWR5bS5pZC9jZXJ0aWZpY2F0ZS1yZXZvY2F0aW9uLWxpc3RzL2ZlM2VlNzA0LTFmOTQtNDA4Yi1iMTMzLWYxZGRhNzI3N2E3ZTAKBggqhkjOPQQDAgNIADBFAiEA6D8eadYijkuOVFyxCfcoWFpLDtL6SrizvRC1qt+SjnYCICqjTVpmspHVTIhG6yDbEezgX5MGe+B+azfy5JFl5f+B',
    logoUri: 'https://playground.paradym.id/logo.png',
    entityId: 'playground.paradym.id',
    demo: true,
  },
  {
    entityId: 'stormcatch.com',
    name: 'Stormcatch',
    certificate: `-----BEGIN CERTIFICATE-----
MIICsjCCAlmgAwIBAgIUL+lLx4KJ8HYhebBukcvgtMhS0FQwCgYIKoZIzj0EAwIw
OzEXMBUGA1UEAwwOR2xvYmFsIFJvb3QgQ0ExEzARBgNVBAoMClN0b3JtY2F0Y2gx
CzAJBgNVBAYTAk5MMB4XDTI2MTAyMDA5MjgzNloXDTMxMTAxOTA5MjgzNlowPzEb
MBkGA1UEAwwSQ3JlZGVudGlhbCBSb290IENBMRMwEQYDVQQKDApTdG9ybWNhdGNo
MQswCQYDVQQGEwJOTDBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABOrJi/KVbG6T
J3L0hNZcD27Xr3HF1eZ2ySwMERP37jFusavpuTjqiLxbZQQJvVjEXHRiR2z/2eHA
QVKJrBW8xSmjggE1MIIBMTASBgNVHRMBAf8ECDAGAQH/AgEAMA4GA1UdDwEB/wQE
AwIBBjAdBgNVHQ4EFgQUYej2IMrC/b6lf1o9/jd+j5JhM60wHwYDVR0jBBgwFoAU
pREKjKuIZgQqV5CcLCgDAGt9yIwwGAYDVR0gBBEwDzANBgsrBgEEAYH9WQEABDA6
BgNVHR8EMzAxMC+gLaArhilodHRwOi8vcGtpLnN0b3JtY2F0Y2gubG9jYWwvL2Ny
bC9yb290LmNybDB1BggrBgEFBQcBAQRpMGcwLgYIKwYBBQUHMAGGImh0dHA6Ly9w
a2kuc3Rvcm1jYXRjaC5sb2NhbC8vb2NzcC8wNQYIKwYBBQUHMAKGKWh0dHA6Ly9w
a2kuc3Rvcm1jYXRjaC5sb2NhbC8vYWlhL3Jvb3QuZGVyMAoGCCqGSM49BAMCA0cA
MEQCIFYmjy3kAWEaPsLu5TG6Kr8B7E0NOHU+9v6LfEw93tOqAiBpXEKnQPcLvZ7s
IXEEiTahju1+SB5KLhzx9IZruyJpCw==
-----END CERTIFICATE-----`,
    url: 'https://stormcatch.com',
    logoUri: 'https://assets.stormcatch.dev/logo/v1/stormcatch-icon-wordmark-v1-512.png',
    demo: true,
  },
] satisfies Array<TrustedX509Entity>

export const trustedDidEntities = [
  {
    entityId: 'did:web:metadata.dev.paradym.id:41708c95-743b-48d1-b4d5-23547f67e192',
    did: 'did:web:metadata.dev.paradym.id:41708c95-743b-48d1-b4d5-23547f67e192',
    logoUri: 'https://hva.animo.id/images/logo-hva-klein.png',
    name: 'Hogeschool van Amsterdam',
    url: 'https://hva.nl',
    demo: true,
  },
  {
    entityId: 'did:web:metadata.paradym.id:f976c06e-da46-4b79-bc6e-bfda07c97f91',
    did: 'did:web:metadata.paradym.id:f976c06e-da46-4b79-bc6e-bfda07c97f91',
    logoUri: 'https://hva.animo.id/images/logo-hva-klein.png',
    name: 'Hogeschool van Amsterdam',
    url: 'https://hva.nl',
    demo: false,
  },
  {
    entityId: 'did:web:metadata.paradym.id:2ea1c471-af99-4d3a-b07c-57e29abf8cea',
    did: 'did:web:metadata.paradym.id:2ea1c471-af99-4d3a-b07c-57e29abf8cea',
    logoUri: 'https://legoland.animo.id/images/university-logo.png',
    name: 'Legoland University',
    url: 'https://legoland.animo.id',
    demo: true,
  },
] satisfies Array<TrustedDidEntity>

export const trustedOpenId4VciIssuerEntities = [
  {
    entityId: 'https://agent.dev.paradym.id/oid4vci/43700792-bc9f-4b8c-be2f-59a227d7a6cb',
    issuer: 'https://agent.dev.paradym.id/oid4vci/43700792-bc9f-4b8c-be2f-59a227d7a6cb',
    logoUri: 'https://hva.animo.id/images/logo-hva-klein.png',
    name: 'Hogeschool van Amsterdam',
    url: 'https://hva.nl',
    demo: true,
  },
  {
    entityId: 'https://agent.paradym.id/oid4vci/655913d0-e655-4b3f-9335-a8af00922270',
    issuer: 'https://agent.paradym.id/oid4vci/655913d0-e655-4b3f-9335-a8af00922270',
    logoUri: 'https://hva.animo.id/images/logo-hva-klein.png',
    name: 'Hogeschool van Amsterdam',
    url: 'https://hva.nl',
    demo: false,
  },
  {
    entityId: 'https://issuer.dev.eduid.nl/eduid',
    issuer: 'https://issuer.dev.eduid.nl/eduid',
    logoUri: 'https://static.dev.eduid.nl/images/eduid_credential_logo.png',
    name: 'eduID',
    url: 'https://dev.eduid.nl',
    demo: true,
  },
  {
    entityId: 'https://issuer.eduid.nl/eduid',
    issuer: 'https://issuer.eduid.nl/eduid',
    logoUri: 'https://static.eduid.nl/images/eduid_credential_logo.png',
    name: 'eduID',
    url: 'https://eduid.nl',
    demo: false,
  },
  {
    entityId: 'https://playground.paradym.id',
    issuer: 'https://agent.paradym.id/oid4vci/63010627-501b-43ec-a250-9a968ecf48fe',
    logoUri: 'https://playground.paradym.id/logo.png',
    name: 'Paradym Playground',
    url: 'https://playground.paradym.id',
    demo: true,
  },
  {
    entityId: 'https://stormcatch.com',
    issuer: 'https://agent.paradym.id/oid4vci/d57f3334-51aa-4b8d-abad-46174e544824',
    logoUri: 'https://assets.stormcatch.dev/logo/v1/stormcatch-icon-wordmark-v1-512.png',
    name: 'Stormcatch',
    url: 'https://stormcatch.com',
    demo: true,
  },
] satisfies Array<TrustedOpenId4VciEntity>

// https://github.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework/blob/main/docs/annexes/annex-3/annex-3.01-pid-rulebook.md#221-eu-wide-attestation-type-and-namespace-for-pid
export const pidSchemes = {
  sdJwtVcVcts: ['urn:eudi:pid:1'],
  msoMdocDoctypes: ['eu.europa.ec.eudi.pid.1'],
}

export const mdlSchemes = {
  mdlMdocDoctypes: ['org.iso.18013.5.1.mDL'],
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
