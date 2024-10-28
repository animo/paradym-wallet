// lets create some fake data

const DEFAULT_FUNKE_DOMAIN = 'funke.animo.id'

const FUNKE_ISSUER_DATA = {
  domain: DEFAULT_FUNKE_DOMAIN,
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

export const getOpenIdFedIssuerMetadata = (domain: string) => {
  if (domain === FUNKE_ISSUER_DATA.domain) {
    return FUNKE_ISSUER_DATA
  }

  return null
}
