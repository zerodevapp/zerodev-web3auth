import { getChainConfig } from './chainConfig'
import { Web3AuthNoModalOptions } from "@web3auth/no-modal";
import { CHAIN_ID_TO_INFURA_NAME } from '../constants';
import { CHAIN_NAMESPACES } from '@web3auth/base';

export const getWeb3AuthConfig = (chainId?: keyof typeof CHAIN_ID_TO_INFURA_NAME) => {
    return {
        chainConfig: chainId ? getChainConfig(chainId) : {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
        },
        clientId: process.env.REACT_APP_ZEROKIT_WEB3AUTH_CLIENT_ID ?? 'BEjNZMt6TPboj3TfHM06MP8Yxz7cKQX6eK3KZzVhrIMi7jALcZHxJv5o3fDLM7EL4QfPlf2AV_qe155vyR3QxiU',
        enableLogging: false,
    } as Web3AuthNoModalOptions
}