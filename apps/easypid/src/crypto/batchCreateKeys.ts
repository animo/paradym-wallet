import { Agent, utils } from "@credo-ts/core";
import { WalletServiceProviderClient } from "./WalletServiceProviderClient";
import { WSP_URL } from "@easypid/agent/initialize";

export const batchCreateKeys = (agent: Agent) => async (count: number) => {
  const wsp = new WalletServiceProviderClient(WSP_URL, agent)
  const publicKeys = await wsp.batchGenerateKeyPair(new Array(count).map(() => utils.uuid()))

  return publicKeys
}
