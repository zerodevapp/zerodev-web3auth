import { Web3Auth } from "@web3auth/modal";
import { ADAPTER_EVENTS, ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, SafeEventEmitterProvider, UserInfo, WALLET_ADAPTERS, log } from "@web3auth/base";
import { OpenloginAdapter, OpenloginAdapterOptions } from "@web3auth/openlogin-adapter";
import { getOpenloginAdapterConfig } from "./configs/openloginAdapterConfig";
import { getProjectsConfiguration } from '@zerodevapp/sdk'
import { getWeb3AuthConfig } from "./configs/web3AuthConfig";
import { ChainId } from "./types";
import { HIDDEN_LOGIN_METHODS } from "./constants";

export type ExtendedWeb3AuthWithModalInitOptions = {
    onConnect?: (userInfo: Partial<UserInfo>) => Promise<void> | void,
    adapterSettings?: OpenloginAdapterOptions['adapterSettings']
}

export type ExtendedWeb3AuthWithModal = Web3Auth & {
    connect: () => Promise<SafeEventEmitterProvider> | null,
    init: (options: ExtendedWeb3AuthWithModalInitOptions) => Promise<void>
    initModal: (options: ExtendedWeb3AuthWithModalInitOptions) => Promise<void>
};
type ZeroDevWeb3AuthWithModal = new (projectIds: string[], chainid?: ChainId) => ExtendedWeb3AuthWithModal


const proxyHandler = {
    instance: null as Web3Auth | null,
    construct(target: typeof Web3Auth, [projectIds, chainId]: ConstructorParameters<ZeroDevWeb3AuthWithModal>): Web3Auth {
        if (!this.instance) {
            const instance: Web3Auth = Reflect.construct(target, [getWeb3AuthConfig(chainId)]);
            let initiated: Promise<void> | boolean = false

            this.instance = new Proxy(instance, {
                get(target, property, receiver) {
                    if (property === "init") {
                        if (initiated) {
                            return async function (this: Web3Auth, options?: ExtendedWeb3AuthWithModalInitOptions) {
                                if (options?.onConnect) {
                                    instance.on(ADAPTER_EVENTS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
                                        instance.getUserInfo().then(options.onConnect)
                                    });
                                }
                            }
                        }
                        initiated = true
                        return async function (this: Web3Auth, options?: ExtendedWeb3AuthWithModalInitOptions) {
                            const openLoginAdapterSettings = getOpenloginAdapterConfig({
                                adapterSettings: options?.adapterSettings

                            })
                            if (openLoginAdapterSettings.adapterSettings) {
                                const { signature } = (await getProjectsConfiguration(projectIds))
                                if (signature) {
                                    openLoginAdapterSettings.adapterSettings.originData = {
                                        [window.location.origin]: signature
                                    }
                                }
                            }
                            const openLoginAdapter = new OpenloginAdapter(openLoginAdapterSettings)
                            instance.configureAdapter(openLoginAdapter)
                            if (options?.onConnect) {
                                instance.on(ADAPTER_EVENTS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
                                    instance.getUserInfo().then(options.onConnect)
                                });
                            }
                            if (instance.status === ADAPTER_STATUS.NOT_READY) {
                                initiated = Reflect.get(target, 'initModal').apply(this, [{
                                    modalConfig: {
                                        [WALLET_ADAPTERS.OPENLOGIN]: {
                                            label: "openlogin",
                                            loginMethods: {
                                                ...(HIDDEN_LOGIN_METHODS.reduce((hiddenLoginLoginConfig, hiddenLoginMethod) => ({...hiddenLoginLoginConfig, [hiddenLoginMethod]: {typeOfLogin: hiddenLoginMethod, showOnModal: false}}), {}))
                                            },
                                        }

                                    }
                                }]);
                            }
                        }
                    }
                    if (property === "connect") {
                        return async function (this: Web3Auth) {
                            if (instance.status === 'connecting') {
                                instance.status = 'ready'
                                instance.walletAdapters[WALLET_ADAPTERS.OPENLOGIN].status = 'ready'
                            }
                            // Checks 5 times in a period of a second if initiated changed
                            for (let i = 1; i <= 5; i++) {
                                if (initiated instanceof Promise) {
                                    await initiated
                                    break;
                                }
                                await new Promise((resolve) => setTimeout(resolve, 5000 / 5));
                            }
                            if (instance.status !== 'connected') {
                                return Reflect.get(target, property).apply(this);
                            }
                            return instance.provider
                        }
                    }
                    return Reflect.get(target, property);
                },
            });
        }
        return this.instance;
    },
};

const ZeroDevWeb3AuthWithModal = new Proxy(Web3Auth, proxyHandler) as unknown as ZeroDevWeb3AuthWithModal;

export default ZeroDevWeb3AuthWithModal