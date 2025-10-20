import { type Agent, Kms } from '@credo-ts/core'
import type { OpenId4VciRequestTokenResponse } from '@credo-ts/openid4vc'
import { getCredentialDisplayWithDefaults, getCredentialForDisplayId, getOpenId4VcCredentialDisplay } from '../display'
import { receiveDeferredCredentialFromOpenId4VciOffer } from '../invitation'
import { logger } from '../logger'
import {
  type DeferredCredential,
  deleteDeferredCredential,
  storeCredential,
  storeReceivedActivity,
  updateDeferredCredential,
} from '../storage'
import { extractOpenId4VcCredentialMetadata } from './displayMetadata'

export async function fetchAndProcessDeferredCredentials(agent: Agent, deferredCredentials: DeferredCredential[]) {
  await Promise.allSettled(
    deferredCredentials.map((deferredCredential) => fetchAndProcessDeferredCredential(agent, deferredCredential))
  )
}

export async function fetchAndProcessDeferredCredential(agent: Agent, deferredCredential: DeferredCredential) {
  const { issuerMetadata, clientId, response: deferredCredentialResponse } = deferredCredential

  try {
    let accessToken: OpenId4VciRequestTokenResponse = {
      ...deferredCredential.accessToken,
      dpop: deferredCredential.accessToken.dpop
        ? {
            ...deferredCredential.accessToken.dpop,
            jwk: Kms.PublicJwk.fromUnknown(deferredCredential.accessToken.dpop.jwk),
          }
        : undefined,
    }

    const accessTokenExpiresAt = accessToken.accessTokenResponse.expires_in
      ? new Date(deferredCredential.createdAt).getTime() + accessToken.accessTokenResponse.expires_in * 1000
      : undefined

    // Determine whether or not to use the refresh token to get a new access token.
    if (accessToken.refreshToken && (!accessTokenExpiresAt || accessTokenExpiresAt < Date.now())) {
      agent.config.logger.debug('Refreshing access token for deferred credential', {
        deferredCredentialId: deferredCredential.id,
      })

      accessToken = await agent.modules.openid4vc.holder.refreshToken({
        issuerMetadata,
        clientId,
        refreshToken: accessToken.refreshToken,
        authorizationServer: accessToken.authorizationServer,
        dpop: accessToken.dpop,
      })
    }

    // Fetch the credentials from the deferred credential endpoint
    const { credentials, deferredCredentials } = await receiveDeferredCredentialFromOpenId4VciOffer({
      accessToken,
      issuerMetadata,
      agent,
      deferredCredentialResponse,
    })

    if (deferredCredentials.length && credentials.length) {
      throw new Error('Received both immediate and deferred credentials in OpenID4VCI response')
    }

    if (credentials.length) {
      for (const { credential } of credentials) {
        await storeCredential(agent, credential)
      }

      const { issuer: issuerDisplay } = getCredentialDisplayWithDefaults(
        getOpenId4VcCredentialDisplay(
          extractOpenId4VcCredentialMetadata(credentials[0].credentialConfiguration, {
            display: issuerMetadata.credentialIssuer?.display,
            id: issuerMetadata.credentialIssuer?.credential_issuer,
          })
        )
      )

      await storeReceivedActivity(agent, {
        // FIXME: Should probably be the `iss`, but then we can't show it before we retrieved
        // the credential. Signed issuer metadata is the solution.
        entityId: issuerMetadata?.credentialIssuer.credential_issuer,
        host: issuerDisplay.domain,
        name: issuerDisplay.name,
        logo: issuerDisplay.logo,
        backgroundColor: '#ffffff', // Default to a white background for now
        deferredCredentials: [],
        credentialIds: credentials.map(({ credential }) => getCredentialForDisplayId(credential)),
      })

      await deleteDeferredCredential(agent, deferredCredential.id)
    } else {
      await updateDeferredCredential(agent, {
        id: deferredCredential.id,
        lastCheckedAt: new Date().toISOString(),
        // Update access token with a new one if we got a new refresh token.
        // Otherwise, keep the existing one.
        accessToken: accessToken.refreshToken
          ? {
              ...accessToken,
              dpop: accessToken.dpop
                ? {
                    ...accessToken.dpop,
                    jwk: accessToken.dpop.jwk.toJson(),
                  }
                : undefined,
            }
          : deferredCredential.accessToken,
      })
    }
  } catch (error) {
    logger.error('Failed to fetch deferred credentials', { error })

    try {
      await updateDeferredCredential(agent, {
        id: deferredCredential.id,
        lastErroredAt: new Date().toISOString(),
      })
    } catch (error) {
      logger.error('Failed to update deferred credential', { error })
    }
  }
}
