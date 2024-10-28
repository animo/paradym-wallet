// lets create some fake data

const DEFAULT_FUNKE_HOST = 'funke.animo.id'

const FUNKE_ISSUER_DATA = {
  host: DEFAULT_FUNKE_HOST,
  did: 'did:web:funke',
  display: {
    name: 'Animo',
    logo: {
      url: 'https://i.imgur.com/5kxpKzA.png',
      altText: 'Animo Solutions logo',
    },
  },
  approvals: [
    {
      id: '7c82e94d-d650-4230-9586-cc5e0bec1d88',
      name: 'Dutch Gov eID list',
      ownedBy: {
        did: 'did:web:dutch.gov',
        display: {
          name: 'Dutch Gov',
          logo: {
            url: 'https://i.imgur.com/lqfQV5g.png',
            altText: 'Dutch Gov logo',
          },
          isGovernment: true,
        },
      },
    },
    {
      id: '1e5b0c77-891f-4db6-b5b0-b174e7b38d30',
      name: 'Registered Businesses',
      ownedBy: {
        did: 'did:web:registered.businesses',
        display: {
          name: 'Registered Businesses',
          logo: {
            url: 'https://i.imgur.com/eoXTZS5.jpeg',
            altText: 'Registered Businesses logo',
          },
        },
      },
    },
  ],
  certifications: ['eIDAS compliant', 'ISO/IEC 27001'],
}

export type TempOpenIdFedApproval = (typeof FUNKE_ISSUER_DATA.approvals)[number]

const DEFAULT_PARADYM_HOST = 'agent.paradym.id'

const PARADYM_ISSUER_DATA = {
  host: DEFAULT_PARADYM_HOST,
  did: 'did:web:paradym',
  display: {
    name: 'Paradym',
    logo: {
      url: 'https://paradym.id/favicon/apple-touch-icon.png',
      altText: 'Paradym logo',
    },
  },
  approvals: [],
  certifications: [],
}

export const getOpenIdFedIssuerMetadata = (host: string) => {
  if (host === FUNKE_ISSUER_DATA.host) {
    return FUNKE_ISSUER_DATA
  }

  if (host === PARADYM_ISSUER_DATA.host) {
    return PARADYM_ISSUER_DATA
  }

  return null
}
