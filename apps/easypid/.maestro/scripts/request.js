const PARADYM_CONFIG = {
  projectId: 'cmipr5x5x00l6s6018op8cbci',
  issuance: {
    'mdl-mdoc': {
      templateId: 'cmiyfjvp50031s601ihl1epyf',
      attributes: {
        'org.iso.18013.5.1': {
          sex: 123,
          height: 123,
          weight: 123,
          portrait: 'Base64 encoded string',
          birth_date: '2025-12-09',
          eye_colour: 'String value',
          given_name: 'String value',
          issue_date: '2025-12-09',
          age_over_16: true,
          age_over_18: true,
          age_over_21: true,
          age_over_25: true,
          age_over_65: true,
          birth_place: 'String value',
          expiry_date: '2025-12-09',
          family_name: 'String value',
          hair_colour: 'String value',
          nationality: 'String value',
          age_in_years: 123,
          resident_city: 'String value',
          age_birth_year: 123,
          resident_state: 'String value',
          document_number: 'String value',
          issuing_country: 'String value',
          resident_address: 'String value',
          resident_country: 'String value',
          issuing_authority: 'String value',
          driving_privileges: [
            {
              codes: [
                {
                  code: 'String value',
                  sign: 'String value',
                  value: 'String value',
                },
              ],
              issue_date: '2025-12-09',
              expiry_date: '2025-12-09',
              vehicle_category_code: 'String value',
            },
          ],
          issuing_jurisdiction: 'String value',
          resident_postal_code: 'String value',
          signature_usual_mark: 'Base64 encoded string',
          administrative_number: 'String value',
          portrait_capture_date: '2025-12-09',
          un_distinguishing_sign: 'String value',
          biometric_template_face: 'Base64 encoded string',
          biometric_template_iris: 'Base64 encoded string',
          biometric_template_finger: 'Base64 encoded string',
          given_name_national_character: 'String value',
          family_name_national_character: 'String value',
          biometric_template_signature_sign: 'Base64 encoded string',
        },
      },
    },
    // NOTE: should be updated to actual msisdn
    'msisdn-sd-jwt': {
      templateId: 'cmiyewqbz0030s601doszw1f3',
      attributes: {
        sex: 2,
        email: 'emma.vandenberg@gmail.com',
        address: {
          region: 'Noord-Holland',
          country: 'NL',
          locality: 'Amsterdam',
          formatted: 'Prinsengracht 263, 1016 GV Amsterdam, Noord-Holland, NL',
          postal_code: '1016 GV',
          house_number: '263',
          street_address: 'Prinsengracht',
        },
        picture: '',
        birthdate: '1995-03-15',
        given_name: 'Emma Charlotte',
        family_name: 'van der Berg',
        age_in_years: 30,
        phone_number: '0031612345678',
        trust_anchor: 'NL_GOV',
        nationalities: ['NL'],
        age_birth_year: 1995,
        date_of_expiry: '2033-08-20',
        place_of_birth: {
          region: 'Noord-Holland',
          country: 'NL',
          locality: 'Amsterdam',
        },
        document_number: 'NL987654321',
        issuing_country: 'NL',
        birth_given_name: 'Emma Charlotte',
        date_of_issuance: '2023-08-20',
        age_equal_or_over: {
          12: true,
          14: true,
          16: true,
          18: true,
          21: true,
          65: false,
        },
        birth_family_name: 'van der Berg',
        issuing_authority: 'NL',
        issuing_jurisdiction: 'NL',
        personal_administrative_number: 'ADM2023080012345',
      },
    },

    'arf-pid-sd-jwt': {
      templateId: 'cmiyewqbz0030s601doszw1f3',
      attributes: {
        sex: 2,
        email: 'emma.vandenberg@gmail.com',
        address: {
          region: 'Noord-Holland',
          country: 'NL',
          locality: 'Amsterdam',
          formatted: 'Prinsengracht 263, 1016 GV Amsterdam, Noord-Holland, NL',
          postal_code: '1016 GV',
          house_number: '263',
          street_address: 'Prinsengracht',
        },
        picture: '',
        birthdate: '1995-03-15',
        given_name: 'Emma Charlotte',
        family_name: 'van der Berg',
        age_in_years: 30,
        phone_number: '0031612345678',
        trust_anchor: 'NL_GOV',
        nationalities: ['NL'],
        age_birth_year: 1995,
        date_of_expiry: '2033-08-20',
        place_of_birth: {
          region: 'Noord-Holland',
          country: 'NL',
          locality: 'Amsterdam',
        },
        document_number: 'NL987654321',
        issuing_country: 'NL',
        birth_given_name: 'Emma Charlotte',
        date_of_issuance: '2023-08-20',
        age_equal_or_over: {
          12: true,
          14: true,
          16: true,
          18: true,
          21: true,
          65: false,
        },
        birth_family_name: 'van der Berg',
        issuing_authority: 'NL',
        issuing_jurisdiction: 'NL',
        personal_administrative_number: 'ADM2023080012345',
      },
    },
    'membership-card-anoncreds': {
      templateId: 'cmj1our71002hs601mp97qnvf',
      attributes: {
        last_name: 'String value',
        first_name: 'String value',
        member_since: 123,
        date_of_birth: 19990101,
      },
    },

    'birth-certificate-anoncreds': {
      templateId: 'cmj1oyjez002us601dzzi19s8',
      attributes: {
        last_name: 'String value',
        first_name: 'String value',
        nationality: 'String value',
        date_of_birth: 19990101,
        place_of_birth: 'String value',
      },
    },
  },
  verification: {
    'mdl-mdoc': { presentationTemplateId: 'cmiyfo40z0032s601thh9lqju' },
    'arf-pid-sd-jwt': { presentationTemplateId: 'cmiyfopx40033s601guy5q89e' },
    'birth-certificate-and-membership-card-anoncreds': {
      presentationTemplateId: 'cmj1p0eo7002ys601ro814a6t',
    },
  },
}

const PLAYGROUND_CONFIG = {
  issuance: {
    'mdl-mdoc': {
      credentialSupportedId: 'mdl-mdoc',
    },
    'arf-pid-sd-jwt': {
      credentialSupportedId: 'government-arf-18-pid-sd-jwt',
    },
    'msisdn-sd-jwt': {
      credentialSupportedId: 'msisdn-sd-jwt',
    },
    'certificate-of-residence-sd-jwt': {
      credentialSupportedId: 'certificate-of-residence-sd-jwt',
    },
  },
  verification: {
    'mdl-mdoc': {
      presentationDefinitionId: '019368ed-3787-7669-b7f4-8c012238e90d__0',
    },
    'arf-pid-sd-jwt': {
      presentationDefinitionId: '8caaebcc-d48c-471b-86b0-a534e15c4774__1',
    },
  },
}

function request() {
  const actionRaw = ACTION

  let action
  try {
    action = JSON.parse(actionRaw)
  } catch {
    throw new Error(`Invalid ACTION JSON: ${actionRaw}`)
  }

  const issuerBackend = ISSUER_BACKEND
  if (!issuerBackend) {
    throw new Error('ISSUER_BACKEND not set')
  }

  let result

  if (issuerBackend === 'paradym') {
    result = callParadymBackend(action)
  } else if (issuerBackend === 'playground') {
    result = callPlaygroundBackend(action)
  } else {
    throw new Error(`Unknown ISSUER_BACKEND: ${scriptPath}`)
  }

  if (!result || !result.deeplink) {
    throw new Error('Backend script did not return deeplink')
  }

  output.deeplink = result.deeplink
  if (result.userPin) output.userPin = result.userPin
  if (result.loginCode) output.loginCode = result.loginCode

  return result
}

output.request = request()

function callParadymBackend(action) {
  const baseUrl = PARADYM_REQUEST_URL || 'https://api.paradym.id'
  const projectId = PARADYM_CONFIG.projectId
  const { flow, requestType } = action

  let url
  let body
  let parser

  // ---------- ISSUANCE / createOffer ----------
  if (action.action === 'createOffer') {
    const issuanceConfig = PARADYM_CONFIG.issuance[requestType]

    if (!issuanceConfig) {
      throw new Error(`No Paradym issuance config found for requestType: ${requestType}`)
    }

    const templateId = issuanceConfig.templateId
    const attributes = issuanceConfig.attributes

    url = `${baseUrl}/v1/projects/${projectId}/${flow}/issuance/offer`

    if (flow === 'didcomm') {
      body = JSON.stringify({
        didcommInvitation: {
          createConnection: true,
          did: 'did:web',
        },
        credential: {
          credentialTemplateId: templateId,
          attributes,
        },
      })

      parser = parseParadymDidcommOfferResponse
    } else if (flow === 'openid4vc') {
      body = JSON.stringify({
        credentials: [
          {
            credentialTemplateId: templateId,
            attributes,
          },
        ],
      })

      parser = parseParadymOpenid4vcOfferResponse
    } else {
      throw new Error(`Unsupported flow for createOffer: ${flow}`)
    }
  }

  // ---------- VERIFICATION / createVerification ----------
  if (action.action === 'createVerification') {
    const verificationConfig = PARADYM_CONFIG.verification[requestType]

    if (!verificationConfig) {
      throw new Error(`No Paradym verification config found for requestType: ${requestType}`)
    }

    const presentationTemplateId = verificationConfig.presentationTemplateId

    if (flow === 'didcomm') {
      url = `${baseUrl}/v1/projects/${projectId}/${flow}/verification/request`

      body = JSON.stringify({
        didcommInvitation: {
          createConnection: true,
          did: 'did:web',
        },
        presentationTemplateId,
      })

      parser = parseParadymDidcommVerificationResponse
    } else {
      url = `${baseUrl}/v1/projects/${projectId}/${flow}/verification/request`

      body = JSON.stringify({
        presentationTemplateId,
      })

      parser = parseParadymVerificationResponse
    }
  }

  if (!url || !body || !parser) {
    throw new Error(`Unsupported action: ${action.action}`)
  }

  const response = http.post(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': MAESTRO_PARADYM_API_KEY,
    },
    body,
  })

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Paradym error: ${response.status} ${response.body || ''}`)
  }

  const data = json(response.body)

  if (!data) {
    throw new Error('Empty response from Paradym backend')
  }

  return parser(data)
}

function parseParadymOpenid4vcOfferResponse(data) {
  const offerUri = data.offerUri
  if (!offerUri) {
    throw new Error('offerUri missing in Paradym response')
  }

  let credentialOfferUri = null
  let openidDeeplink = null

  try {
    const match = offerUri.match(/[?&]credential_offer_uri=([^&]+)/)

    if (!match || !match[1]) {
      throw new Error('credential_offer_uri missing in offerUri')
    }

    credentialOfferUri = decodeURIComponent(match[1])

    openidDeeplink = `openid-credential-offer://?credential_offer_uri=${encodeURIComponent(credentialOfferUri)}`
  } catch (e) {
    throw new Error(`Could not create the deeplink: ${e.message}`)
  }

  const deeplink = openidDeeplink

  return {
    type: 'offer',
    id: data.id,
    deeplink,
  }
}

function parseParadymDidcommOfferResponse(data) {
  if (!data || !data.didcommInvitation) {
    throw new Error('didcommInvitation missing in Paradym didcomm response')
  }

  const invitationUrl = data.didcommInvitation.invitationUri

  if (!invitationUrl) {
    throw new Error('invitationUri missing in didcommInvitation')
  }

  const deeplink = `didcomm://?oobUrl=${encodeURIComponent(invitationUrl)}`

  return {
    type: 'offer',
    exchange: 'didcomm',
    deeplink,
  }
}

function parseParadymDidcommVerificationResponse(data) {
  if (!data || !data.didcommInvitation) {
    throw new Error('didcommInvitation missing in Paradym didcomm verification response')
  }

  const invitation = data.didcommInvitation
  const invitationUrl = invitation.invitationUri

  if (!invitationUrl) {
    throw new Error('invitationUri missing in didcommInvitation')
  }

  const deeplink = `didcomm://?oobUrl=${encodeURIComponent(invitationUrl)}`

  return {
    type: 'verification',
    exchange: 'didcomm',
    deeplink,
  }
}

function parseParadymVerificationResponse(data) {
  if (!data) {
    throw new Error('Empty response from verification request')
  }

  const directUri = data.authorizationRequestUri

  if (!directUri) {
    throw new Error('authorizationRequestUri / authorizationRequestQrUri missing in Paradym verification response')
  }

  const requestUriMatch = directUri.match(/[?&]request_uri=([^&]+)/)
  const clientIdMatch = directUri.match(/[?&]client_id=([^&]+)/)
  const clientIdSchemeMatch = directUri.match(/[?&]client_id_scheme=([^&]+)/)

  const requestUri = requestUriMatch ? decodeURIComponent(requestUriMatch[1]) : null
  const clientId = clientIdMatch ? decodeURIComponent(clientIdMatch[1]) : null
  const clientIdScheme = clientIdSchemeMatch ? decodeURIComponent(clientIdSchemeMatch[1]) : null

  if (!requestUri) {
    throw new Error('request_uri missing in authorizationRequestUri')
  }

  let deeplink = `openid4vp://?request_uri=${encodeURIComponent(requestUri)}`

  if (clientId) {
    deeplink += `&client_id=${encodeURIComponent(clientId)}`
  }

  if (clientIdScheme) {
    deeplink += `&client_id_scheme=${encodeURIComponent(clientIdScheme)}`
  }

  return {
    type: 'verification',
    deeplink,
  }
}

function callPlaygroundBackend(action) {
  const baseUrl = PLAYGROUND_URL || 'https://playground.animo.id/api/'

  let request

  if (action.action === 'createOffer') {
    request = buildOfferRequest(baseUrl, action)
  } else if (action.action === 'createVerification') {
    request = buildVerificationRequest(baseUrl, action)
  } else {
    throw new Error(`Unsupported action: ${action.action}`)
  }

  const response = http.post(request.url, {
    headers: { 'Content-Type': 'application/json' },
    body: request.body,
  })

  const data = json(response.body)

  if (action.action === 'createOffer') {
    return parseOfferResponse(data)
  }

  return parseVerificationResponse(data)
}

function buildOfferRequest(baseUrl, action) {
  const { requestType, authorization } = action

  const issuanceConfig = PLAYGROUND_CONFIG.issuance[requestType]
  if (!issuanceConfig) {
    throw new Error(`No Playground issuance config found for requestType: ${requestType}`)
  }

  const credentialSupportedId = issuanceConfig.credentialSupportedId

  return {
    url: `${baseUrl}offers/create`,
    body: JSON.stringify({
      credentialSupportedIds: [credentialSupportedId],
      authorization: authorization,
      deferBy: 'none',
      requireDpop: false,
      requireWalletAttestation: false,
      requireKeyAttestation: false,
    }),
  }
}

function buildVerificationRequest(baseUrl, action) {
  const { requestType, requestSignerType } = action

  const verificationConfig = PLAYGROUND_CONFIG.verification[requestType]
  if (!verificationConfig) {
    throw new Error(`No Playground verification config found for requestType: ${requestType}`)
  }

  const presentationDefinitionId = verificationConfig.presentationDefinitionId

  return {
    url: `${baseUrl}requests/create`,
    body: JSON.stringify({
      presentationDefinitionId,
      requestScheme: 'openid4vp://',
      responseMode: 'direct_post.jwt',
      requestSignerType: requestSignerType,
      transactionAuthorizationType: 'none',
      version: 'v1',
      queryLanguage: 'dcql',
    }),
  }
}

function parseOfferResponse(data) {
  if (!data.issuanceSession) throw new Error(`issuanceSession missing${JSON.stringify(data)}`)

  const session = data.issuanceSession
  const uri = session.credentialOfferUri || session.credential_offer_uri
  if (!uri) throw new Error('credentialOfferUri missing')

  const deeplink = `openid-credential-offer://?credential_offer_uri=${encodeURIComponent(uri)}`

  return {
    type: 'offer',
    deeplink,
    userPin: session.userPin || null,
    loginCode: session.authorization?.issuerState || null,
  }
}

function parseVerificationResponse(data) {
  if (!data) throw new Error('Empty verification response')

  const directUri = data.authorizationRequestUri || data.authorization_request_uri

  if (directUri) {
    return {
      type: 'verification',
      deeplink: directUri,
    }
  }

  const aro = data.authorizationRequestObject || data.authorization_request_object

  if (!aro) {
    throw new Error('authorizationRequestUri and authorizationRequestObject missing')
  }

  const clientId = aro.client_id
  const requestUri = aro.request_uri

  if (!clientId || !requestUri) {
    throw new Error('client_id or request_uri missing in authorizationRequestObject')
  }

  const scheme = 'openid4vp://'
  const verificationDeeplink = `${scheme}?client_id=${encodeURIComponent(clientId)}&request_uri=${encodeURIComponent(requestUri)}`

  return {
    type: 'verification',
    deeplink: verificationDeeplink,
  }
}
