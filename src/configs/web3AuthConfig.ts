import { getChainConfig } from './chainConfig.js'
import { Web3AuthNoModalOptions } from "@web3auth/no-modal";
import { CHAIN_ID_TO_NODE, ZERODEV_CLIENT_ID } from '../constants.js';

export const getWeb3AuthConfig = (chainId?: keyof typeof CHAIN_ID_TO_NODE, web3authOptions?: Partial<Web3AuthNoModalOptions>) => {
    return {
        uiConfig: {
            defaultLanguage: "en", // en, de, ja, ko, zh, es, fr, pt, nl
            primaryButton: 'socialLogin'
        },
        chainConfig: chainId ? getChainConfig(chainId) : {
            chainNamespace: 'eip155',
        },
        clientId: ZERODEV_CLIENT_ID,
        enableLogging: false,
        ...(web3authOptions ?? {})
    } as Web3AuthNoModalOptions
}