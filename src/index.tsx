export { getChainConfig } from "@web3auth/base";
export { getOpenloginAdapterConfig } from "./configs/openloginAdapterConfig";
export { getWeb3AuthConfig } from "./configs/web3AuthConfig";
import ZeroDevWeb3AuthWithModal, { ExtendedWeb3AuthWithModal, ExtendedWeb3AuthWithModalInitOptions } from "./ZeroDevWeb3AuthWithModal";
import ZeroDevWeb3Auth, { ExtendedWeb3Auth, ExtendedWeb3AuthInitOptions, LoginProvider } from "./ZeroDevWeb3Auth";
export {
    ZeroDevWeb3Auth,
    type ExtendedWeb3Auth,
    type ExtendedWeb3AuthInitOptions,
    type LoginProvider
}

export {
    ZeroDevWeb3AuthWithModal,
    type ExtendedWeb3AuthWithModal,
    type ExtendedWeb3AuthWithModalInitOptions,
}