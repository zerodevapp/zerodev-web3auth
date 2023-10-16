import { Web3AuthNoModal, Web3AuthNoModalOptions } from "@web3auth/no-modal";
import { CHAIN_ID_TO_NODE } from "./constants";
import { OpenloginAdapterOptions } from "@web3auth/openlogin-adapter";
import { LoginProvider } from "./ZeroDevWeb3Auth";
import { SafeEventEmitterProvider, UserInfo } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";

export type ChainId = keyof typeof CHAIN_ID_TO_NODE

export type ZeroDevWeb3AuthOptions = {
    web3authOptions?: Partial<Web3AuthNoModalOptions>,
    adapterSettings?: Partial<OpenloginAdapterOptions['adapterSettings']>
}

export type ZeroDevWeb3AuthInitOptions = {
    onConnect?: (userInfo: Partial<UserInfo>) => Promise<void> | void,
}

export type ZeroDevWeb3AuthEvents = 'onConnect'