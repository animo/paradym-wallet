import { type Key, KeyType, getJwkFromKey } from "@credo-ts/core";
import type { FullAppAgent } from "@package/agent";
import {
  createPinDerivedEphKeyPop,
  deriveKeypairFromPin,
} from "../crypto/bPrime";

/**
 *
 * Start point of the flow described in {@link  https://gitlab.opencode.de/bmi/eudi-wallet/eidas-2.0-architekturkonzept/-/blob/main/flows/PID-AuthenticatedChannel-cloud.md#pid-seed-credential-issuance-1 | Architecture Proposal 2.1 - B'}
 *
 * This flow starts after the eID flow is finished. The authorization code in the input is received from the eID flow
 *
 */
export const receivePidViaAuthenticatedChannel = async ({
  agent,
  deviceKey,
  eIdFlowCallback,
  requestUri,
  pinSetup,
  clientId,
  redirectUri,
}: {
  agent: FullAppAgent;
  /**
   *
   * @todo Can we just have a static ID for the device key or do we just pass in an instance like so?
   *
   */
  deviceKey: Key;
  /**
   *
   * @todo Does this need input?
   *
   */
  eIdFlowCallback: () => Promise<{ authorizationCode: string }>;
  pinSetup: () => Promise<Array<number>>;
  requestUri: string;
  redirectUri: string;
  clientId: string;
}) => {
  const resolvedCredentialOffer =
    await agent.modules.openId4VcHolder.resolveCredentialOffer(requestUri);

  const uniqueScopes = Array.from(
    new Set(
      resolvedCredentialOffer.offeredCredentials
        .map((o) => o.scope)
        .filter((s): s is string => s !== undefined)
    )
  );

  const resolvedAuthorizationRequest =
    await agent.modules.openId4VcHolder.resolveIssuanceAuthorizationRequest(
      resolvedCredentialOffer,
      {
        scope: uniqueScopes,
        redirectUri: redirectUri,
        clientId: clientId,
      }
    );

  const { authorizationCode } = await eIdFlowCallback();

  // TODO: when passing the `code: authorizationCode` in here we also have to input the `resolveAuthorizationRequest`, how can we do that?
  const { accessToken, cNonce } =
    // @ts-expect-error: how do we get the resolveAuthorizationRequest?
    await agent.modules.openId4VcHolder.requestToken({
      code: authorizationCode,
      resolvedCredentialOffer,
    });

  if (!cNonce) {
    throw new Error(
      "cNonce must be returned from the token request. Maybe an invalid (non-compatible) token request was used"
    );
  }

  const newPin = await pinSetup();

  const pinDerivedEph = await deriveKeypairFromPin(agent.context, newPin);

  // TODO: how do we get the audience?
  const pinDerivedEphKeyPop = await createPinDerivedEphKeyPop(agent, {
    aud: "https://example.org",
    pinDerivedEph,
    deviceKey,
    cNonce,
  });

  const credentialAndNotifications =
    await agent.modules.openId4VcHolder.requestCredentials({
      customFormat: "seed_credential",
      additionalCredentialRequestPayloadClaims: {
        pin_derived_eph_key_pop: pinDerivedEphKeyPop,
      },
      additionalProofOfPossessionPayloadClaims: {
        pin_derived_eph_pub: getJwkFromKey(pinDerivedEph).toJson(),
      },
      cNonce,
      accessToken,
      resolvedCredentialOffer,
      credentialBindingResolver: async ({ keyType, supportsJwk }) => {
        if (!supportsJwk) {
          throw Error("Issuer does not support JWK");
        }

        if (keyType !== KeyType.P256) {
          throw new Error(
            `invalid key type used '${keyType}' and only  ${KeyType.P256} is allowed.`
          );
        }
        return {
          method: "jwk",
          jwk: getJwkFromKey(deviceKey),
        };
      },
    });

  const credentials = credentialAndNotifications.map(
    ({ credential }) => credential
  );

  return credentials;
};
