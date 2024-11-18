import { mdocDataTransfer } from '@animo-id/expo-mdoc-data-transfer'
import { TypedArrayEncoder } from '@credo-ts/core'
import { getMdocContext } from '@credo-ts/core/build/modules/mdoc/MdocContext'
import type { EasyPIDAppAgent } from '@package/agent'
import {
  COSEKey,
  DeviceRequest,
  DeviceResponse,
  MDoc,
  type MdocContext,
  parseIssuerSigned,
} from '@protokoll/mdoc-client'

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

  const mso = mdoc.documents[0].issuerSigned.issuerAuth.decodedPayload
  const deviceKeyInfo = mso.deviceKeyInfo
  if (!deviceKeyInfo?.deviceKey) {
    throw new Error('Device key info is missing')
  }

  const publicDeviceJwk = COSEKey.import(deviceKeyInfo.deviceKey).toJWK()

  const deviceRequest = DeviceRequest.parse(options.deviceRequest)

  const deviceResponse = await DeviceResponse.from(mdoc)
    .usingSessionTranscriptBytes(new Uint8Array(options.sessionTranscript))
    .usingDeviceRequest(deviceRequest)
    .authenticateWithSignature(publicDeviceJwk, 'ES256')
    .sign(mdocContext)

  await mdt.sendDeviceResponse(deviceResponse.encode())
}
