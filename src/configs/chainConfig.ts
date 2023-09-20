import { CHAIN_ID_TO_NODE } from "../constants.js";


export const getChainConfig = (chainId: keyof typeof CHAIN_ID_TO_NODE) => ({
  chainNamespace: 'eip155',
  chainId: `0x${chainId?.toString(16)}`,
  rpcTarget: CHAIN_ID_TO_NODE[chainId],
})