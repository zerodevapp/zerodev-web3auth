export { getChainConfig } from "@web3auth/base";
export { getOpenloginAdapterConfig } from "./configs/openloginAdapterConfig.js";
export { getWeb3AuthConfig } from "./configs/web3AuthConfig.js";
export * from './types.js'
import ZeroDevWeb3AuthWithModal from "./ZeroDevWeb3AuthWithModal.js";
import ZeroDevWeb3Auth from "./ZeroDevWeb3Auth.js";
export type { LoginProvider } from "./ZeroDevWeb3Auth.js";
export { getProjectsConfiguration } from "./utilities.js";
export {
    ZeroDevWeb3Auth,
    ZeroDevWeb3AuthWithModal,
}