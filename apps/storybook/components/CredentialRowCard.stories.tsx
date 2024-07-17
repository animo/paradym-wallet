import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'

// TODO: split app functionality from app components
import { CredentialRowCard } from '@package/app/src/components/CredentialRowCard'
import { TableContainer } from '@package/ui'

const meta = {
  title: 'CredentialRowCard',
  component: CredentialRowCard,
  args: {
    name: 'Person Identity',
    issuer: 'Rijksdienst voor Identiteitsgegevens',
    bgColor: '#2f66ad',
    hideBorder: false,
  },
  decorators: [
    (Story) => (
      <TableContainer>
        <Story />
      </TableContainer>
    ),
  ],
} satisfies Meta<typeof CredentialRowCard>

export default meta

type Story = StoryObj<typeof meta>

export const Basic: Story = {}
