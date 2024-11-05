import { mdocDataTransfer } from '@animo-id/expo-mdoc-data-transfer'
import { Key, KeyType, TypedArrayEncoder, getJwkFromKey } from '@credo-ts/core'
import { getMdocContext } from '@credo-ts/core/build/modules/mdoc/MdocContext'
import { deviceKeyPair } from '@easypid/storage/pidPin'
import type { EasyPIDAppAgent } from '@package/agent'
import { DeviceRequest, DeviceResponse, MDoc, type MdocContext, parseIssuerSigned } from '@protokoll/mdoc-client'

type ShareDeviceResponseOptions = {
  sessionTranscript: Uint8Array
  deviceRequest: Uint8Array
  agent: EasyPIDAppAgent
}

export const shareDeviceResponse = async (options: ShareDeviceResponseOptions) => {
  const mdocs = await options.agent.mdoc.getAll()
  const issuerSignedDocuments = mdocs.map((mdoc) => {
    const docType = mdoc.getTag('DocType') as string
    return parseIssuerSigned(TypedArrayEncoder.fromBase64(mdoc.base64Url), docType)
  })

  const mdoc = new MDoc(issuerSignedDocuments)

  const mdocContext = getMdocContext(options.agent.context) as unknown as {
    cose: MdocContext['cose']
    crypto: MdocContext['crypto']
  }

  const mdt = mdocDataTransfer.instance()

  const key = Key.fromPublicKey(deviceKeyPair.publicKey(), KeyType.P256)
  const devicePublicKey = getJwkFromKey(key)

  const deviceRequest = DeviceRequest.parse(options.deviceRequest)

  const deviceResponse = await DeviceResponse.from(mdoc)
    .usingSessionTranscriptBytes(options.sessionTranscript)
    .usingDeviceRequest(deviceRequest)
    .authenticateWithSignature(devicePublicKey, 'ES256')
    .sign(mdocContext)

  await mdt.sendDeviceResponse(deviceResponse.encode())
}
