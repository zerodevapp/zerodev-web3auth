import { CHAIN_NAMESPACES } from "@web3auth/base";
import { CHAIN_ID_TO_INFURA_NAME, INFURA_ID } from "../constants";


export const getChainConfig = (chainId: keyof typeof CHAIN_ID_TO_INFURA_NAME) => ({
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: `0x${chainId?.toString(16)}`,
  rpcTarget: `https://${CHAIN_ID_TO_INFURA_NAME[chainId]}.infura.io/v3/${INFURA_ID}`,
})