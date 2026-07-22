import { createBaseConfig } from './base.app.config'
import { version } from './package.json'

const mediatorDids = {
  development: 'did:web:mediator.dev.paradym.id',
  preview: 'did:web:mediator.paradym.id',
  production: 'did:web:mediator.paradym.id',
}

const config = createBaseConfig({
  name: 'Paradym Wallet',
  scheme: 'id.animo.paradym',
  icon: './assets/paradym/icon.png',
  // NOTE: android requires paths referenced directly in code
  // to only contain _ a-Z 0-9, so we use _ for all files
  adaptiveIcon: './assets/paradym/adaptive_icon.png',
  splash: './assets/paradym/splash.png',
  splashIcon: './assets/paradym/splash_icon.png',
  slug: 'paradym-wallet',
  version,
  bundleId: 'id.paradym.wallet',
  additionalInvitationSchemes: ['didcomm'],
  associatedDomains: ['paradym.id', 'dev.paradym.id', 'paradymwallet.app'],
  projectId: 'b5f457fa-bcab-4c6e-8092-8cdf1239027a',
  assets: ['./assets/paradym/icon.png'],
  extraConfig: {
    mediatorDid: mediatorDids[process.env.APP_VARIANT || 'production'],
    // paradymwallet.app is fallback domain, to allow for better universal linking if both Paradym and Paradym Wallet are used (both on paradym.id)
    allowedRedirectBaseUrls: ['https://paradym.id/invitation/redirect', 'https://paradymwallet.app/oauth2/redirect'],
  },
})

export default () => config
