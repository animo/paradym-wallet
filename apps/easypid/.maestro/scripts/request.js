// Generiek in de action en ddan per back-end mappen naar of de template id of de naam die in de playground wotdt gebruikt.

function request() {
  const actionRaw = ACTION;

  let action;
  try {
    action = JSON.parse(actionRaw);
  } catch (e) {
    throw new Error("Invalid ACTION JSON: " + actionRaw);
  }

  const scriptPath = WALLET_RELYING_PARTY_SCRIPT;
  if (!scriptPath) {
    throw new Error("WALLET_RELYING_PARTY_SCRIPT not set");
  }

  let result;

  if (scriptPath.includes("paradym")) {
    result = callParadymBackend(action);
  } else if (scriptPath.includes("playground")) {
    console.log("playground called")
    result = callPlaygroundBackend(action);
  } else {
    throw new Error("Unknown WALLET_RELYING_PARTY_SCRIPT: " + scriptPath);
  }

  if (!result || !result.deeplink) {
    throw new Error("Backend script did not return deeplink");
  }

  output.deeplink = result.deeplink;
  if (result.userPin) output.userPin = result.userPin;
  if (result.loginCode) output.loginCode = result.loginCode;

  return result;
}

output.request = request();

function callParadymBackend(action) {
  const baseUrl = PARADYM_REQUEST_URL || "https://api.paradym.id";
  const projectId = "cmipr5x5x00l6s6018op8cbci";
  const flow = action.flow;

  let url;
  let body;
  let parser

  if (action.action === "createOffer") {
    url = `${baseUrl}/v1/projects/${projectId}/${flow}/issuance/offer`;

    if (flow === "didcomm") {
      body = JSON.stringify({
        didcommInvitation: {
          createConnection: true,
          did: "did:web",
        },
        credential: {
          credentialTemplateId: "cmiwwctqy00bos601zfwzl8lp",
          attributes: { name: "Niels" },
        },
      });

      parser = parseParadymDidcommOfferResponse;
    } else if (flow === "openid4vc") {
      body = JSON.stringify({
        credentials: [
          {
            credentialTemplateId: "cmiripaap0026s601f95yqz79",
            attributes: { name: "Niels" },
          },
        ],
      });

      parser = parseParadymOfferResponse;
    } else {
      throw new Error(`Unsupported flow for createOffer: ${flow}`);
    }
  }


  if (action.action === "createVerification") {
    if (flow === "didcomm") {
      url = `${baseUrl}/v1/projects/${projectId}/didcomm/verification/request`;
      console.log(url)

      body = JSON.stringify({
        didcommInvitation: {
          createConnection: true,
          did: "did:web",
        },
        presentationTemplateId: "cmiu7ae2j009es601f9bxw7xk", // hardcoded
      });

      parser = parseParadymDidcommVerificationResponse;
    } else {      url = `${baseUrl}/v1/projects/${projectId}/${flow}/verification/request`;

      body = JSON.stringify({
        presentationTemplateId: "cmiropet7005os601nhd8w0ur",
      });

      parser = parseParadymVerificationResponse;
    }
  }

  if (!url || !body || !parser) {
    throw new Error("Unsupported action: " + action.action);
  }

  const response = http.post(url, {
    headers: {
      "Content-Type": "application/json",
      "x-access-token": PARADYM_API_KEY,
    },
    body,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Paradym error: ${response.status} ${response.body || ""}`);
  }

  const data = json(response.body);

  if (!data) {
    throw new Error("Empty response from Paradym backend");
  }

  return parser(data);
}



function parseParadymOpenid4vcOfferResponse(data) {
  const offerQrUri = data.offerUri
  if (!offerQrUri) {
    throw new Error("offerQrUri missing in Paradym response");
  }

  let credentialOfferUri = null;
  let openidDeeplink = null;

  try {
    const match = offerQrUri.match(/[?&]credential_offer_uri=([^&]+)/);

    if (!match || !match[1]) {
      throw new Error("credential_offer_uri missing in offerQrUri");
    }

    credentialOfferUri = decodeURIComponent(match[1]);

    openidDeeplink =
      "openid-credential-offer://?credential_offer_uri=" +
      encodeURIComponent(credentialOfferUri);

  } catch (e) {
    throw new Error("Could not create the deeplink: " + e.message);
  }


  const deeplink = openidDeeplink
  console.log("deeplink", deeplink)

  return {
    type: "offer",
    id: data.id,
    deeplink
  };
}

function parseParadymDidcommOfferResponse(data) {
  if (!data || !data.didcommInvitation) {
    throw new Error("didcommInvitation missing in Paradym didcomm response");
  }

  const invitationUrl = data.didcommInvitation.invitationUri;
  console.log(invitationUrl)

  if (!invitationUrl) {
    throw new Error("invitationUri missing in didcommInvitation");
  }

  const deeplink =
    "didcomm://?oobUrl=" + encodeURIComponent(invitationUrl);
  
  console.log(deeplink)

  return {
    type: "offer",
    exchange: "didcomm",
    deeplink,
  };
}

function parseParadymDidcommVerificationResponse(data) {
  if (!data || !data.didcommInvitation) {
    throw new Error("didcommInvitation missing in Paradym didcomm verification response");
  }

  const invitation = data.didcommInvitation;
  const invitationUrl = invitation.invitationUri;

  if (!invitationUrl) {
    throw new Error("invitationUri missing in didcommInvitation");
  }

  const deeplink =
    "didcomm://?oobUrl=" + encodeURIComponent(invitationUrl);

  return {
    type: "verification",
    exchange: "didcomm",
    deeplink,
  };
}


function parseParadymVerificationResponse(data) {
  if (!data) {
    throw new Error("Empty response from verification request");
  }

  const directUri =
    data.authorizationRequestUri

  if (!directUri) {
    throw new Error(
      "authorizationRequestUri / authorizationRequestQrUri missing in Paradym verification response"
    );
  }

  const requestUriMatch = directUri.match(/[?&]request_uri=([^&]+)/);
  const clientIdMatch = directUri.match(/[?&]client_id=([^&]+)/);
  const clientIdSchemeMatch = directUri.match(/[?&]client_id_scheme=([^&]+)/);

  const requestUri = requestUriMatch ? decodeURIComponent(requestUriMatch[1]) : null;
  const clientId = clientIdMatch ? decodeURIComponent(clientIdMatch[1]) : null;
  const clientIdScheme = clientIdSchemeMatch
    ? decodeURIComponent(clientIdSchemeMatch[1])
    : null;

  if (!requestUri) {
    throw new Error("request_uri missing in authorizationRequestUri");
  }

  let deeplink = "openid4vp://?request_uri=" + encodeURIComponent(requestUri);

  if (clientId) {
    deeplink += "&client_id=" + encodeURIComponent(clientId);
  }

  if (clientIdScheme) {
    deeplink += "&client_id_scheme=" + encodeURIComponent(clientIdScheme);
  }

  return {
    type: "verification",
    deeplink
  };
}


function callPlaygroundBackend(action) {
  const baseUrl = PLAYGROUND_URL || "https://playground.animo.id/api/";

  let request;

  if (action.action === "createOffer") {
    request = buildOfferRequest(baseUrl, action);
  } else if (action.action === "createVerification") {
    request = buildVerificationRequest(baseUrl, action);
  } else {
    throw new Error("Unsupported action: " + action.action);
  }

  const response = http.post(request.url, {
    headers: { "Content-Type": "application/json" },
    body: request.body,
  });

  const data = json(response.body);
  console.log(data)

  if (action.action === "createOffer") {
    return parseOfferResponse(data);
  }

  return parseVerificationResponse(data);
}


function buildOfferRequest(baseUrl, action) {
  return {
    url: baseUrl + "offers/create",
    body: JSON.stringify({
      credentialSupportedIds: [action.credential],
      authorization: action.authorization,
    }),
  };
}

function buildVerificationRequest(baseUrl) {
  return {
    url: baseUrl + "requests/create",
    body: JSON.stringify({
      presentationDefinitionId: "019368ed-3787-7669-b7f4-8c012238e90d__0",
      requestScheme: "openid4vp://",
      responseMode: "direct_post.jwt",
      requestSignerType: action.requestSignerType,
      transactionAuthorizationType: "none",
      version: action.version,
      queryLanguage: "dcql",
    }),
  };
}

function parseOfferResponse(data) {
  if (!data.issuanceSession) throw new Error("issuanceSession missing");

  const session = data.issuanceSession;
  const uri = session.credentialOfferUri || session.credential_offer_uri;
  if (!uri) throw new Error("credentialOfferUri missing");

  const deeplink =
    "openid-credential-offer://?credential_offer_uri=" +
    encodeURIComponent(uri);

  return {
    type: "offer",
    deeplink,
    userPin: session.userPin || null,
    loginCode: session.authorization?.issuerState || null,
  };
}

function parseVerificationResponse(data) {
  if (!data) throw new Error("Empty verification response");

  const directUri =
    data.authorizationRequestUri || data.authorization_request_uri;

  if (directUri) {
    return {
      type: "verification",
      deeplink: directUri,
    };
  }

  const aro =
    data.authorizationRequestObject || data.authorization_request_object;

  if (!aro) {
    throw new Error(
      "authorizationRequestUri and authorizationRequestObject missing"
    );
  }

  const clientId = aro.client_id;
  const requestUri = aro.request_uri;

  if (!clientId || !requestUri) {
    throw new Error("client_id or request_uri missing in authorizationRequestObject");
  }

  const scheme = "openid4vp://";
  const verificationDeeplink =
    scheme +
    "?client_id=" +
    encodeURIComponent(clientId) +
    "&request_uri=" +
    encodeURIComponent(requestUri);

  return {
    type: "verification",
    deeplink: verificationDeeplink,
  };
}
