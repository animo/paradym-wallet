import { mdlSchemes } from '@easypid/constants'
import { setCredentialCategoryMetadata, storeCredential } from '@package/agent'

type StoreCredentialParams = Parameters<typeof storeCredential>

export async function storeCredentialWithCategoryMetadata(...args: StoreCredentialParams) {
  const [agent, receivedRecord] = args

  const isMdl =
    (receivedRecord.type === 'SdJwtVcRecord' &&
      mdlSchemes.mdlJwtVcVcts.includes(receivedRecord.credential.payload.vct as string)) ||
    (receivedRecord.type === 'MdocRecord' && mdlSchemes.mdlMdocDoctypes.includes(receivedRecord.credential.docType))

  if (isMdl) {
    setCredentialCategoryMetadata(receivedRecord, {
      credentialCategory: 'DE-MDL',
      displayPriority: receivedRecord.type === 'SdJwtVcRecord',
    })
  }

  await storeCredential(agent, receivedRecord)
}
