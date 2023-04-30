import { Web3AuthNoModal } from "@web3auth/no-modal";
import { ADAPTER_EVENTS, ADAPTER_STATUS, CHAIN_NAMESPACES, CONNECTED_EVENT_DATA, SafeEventEmitterProvider, UserInfo, WALLET_ADAPTERS, log } from "@web3auth/base";
import { OpenloginAdapter, OpenloginAdapterOptions } from "@web3auth/openlogin-adapter";
import { getOpenloginAdapterConfig } from "./configs/openloginAdapterConfig";
import { getProjectsConfiguration } from '@zerodevapp/sdk'
import { getWeb3AuthConfig } from "./configs/web3AuthConfig";
import { ChainId } from "./types";
import { ProjectConfiguration } from "@zerodevapp/sdk/dist/src/types";

export type LoginProvider = 'google' | 'facebook' | 'discord' | 'twitch' | 'twitter' | 'github' | 'jwt' | 'auth0'

export type ExtendedWeb3AuthInitOptions = {
    onConnect?: (userInfo: Partial<UserInfo>) => Promise<void> | void,
    adapterSettings?: OpenloginAdapterOptions['adapterSettings']
}

export type ExtendedWeb3Auth = Web3AuthNoModal & {
    connect: (loginProvider: LoginProvider, extra?: {jwt?: string}) => Promise<SafeEventEmitterProvider> | null,
    init: (options: ExtendedWeb3AuthInitOptions) => Promise<void>
    initModal: (options: ExtendedWeb3AuthInitOptions) => Promise<void>
};
type ZeroDevWeb3Auth = new (projectIds: string[], chainid?: ChainId) => ExtendedWeb3Auth

const getAuth0Data = (items: ProjectConfiguration['authenticationProviders']) => {
    const item = items?.find((item) => item.provider === "auth0");
    return item ? { verifier: item.verifierId, clientId: item.config.auth0ClientId, domain: item.config.auth0Url  } : {};
};

const getJWTData = (items: ProjectConfiguration['authenticationProviders']) => {
    const item = items?.find((item) => item.provider === "jwt");
    return item ? { verifier: item.verifierId, jwtField: item.config.jwtField } : {};
};


const proxyHandler = {
    instance: null as Web3AuthNoModal | null,
    construct(target: typeof Web3AuthNoModal, [projectIds, chainId]: ConstructorParameters<ZeroDevWeb3Auth>): Web3AuthNoModal {
        if (!this.instance) {
            const instance: Web3AuthNoModal = Reflect.construct(target, [getWeb3AuthConfig(chainId)]);
            let initiated: Promise<void> | boolean = false
            let authenticationProviders: ProjectConfiguration['authenticationProviders']

            this.instance = new Proxy(instance, {
                get(target, property, receiver) {
                    if (property === "init") {
                        if (initiated) {
                            return async function (this: Web3AuthNoModal, options?: ExtendedWeb3AuthInitOptions) {
                                if (options?.onConnect) {
                                    instance.on(ADAPTER_EVENTS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
                                        instance.getUserInfo().then(options.onConnect)
                                    });
                                }
                            }
                        }
                        initiated = true
                        return async function (this: Web3AuthNoModal, options?: ExtendedWeb3AuthInitOptions) {
                            const data = (await getProjectsConfiguration(projectIds))
                            authenticationProviders = data.authenticationProviders
                            const openLoginAdapterSettings = getOpenloginAdapterConfig({
                                signature: data.signature,
                                jwt: getJWTData(authenticationProviders),
                                auth0: getAuth0Data(authenticationProviders),
                                adapterSettings: options?.adapterSettings
                            })
                            const openLoginAdapter = new OpenloginAdapter(openLoginAdapterSettings)
                            instance.configureAdapter(openLoginAdapter)
                            if (options?.onConnect) {
                                instance.on(ADAPTER_EVENTS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
                                    instance.getUserInfo().then(options.onConnect)
                                });
                            }
                            if (instance.status === ADAPTER_STATUS.NOT_READY) {
                                initiated = Reflect.get(target ,property).apply(this)
                                //     modalConfig: {
                                //         [WALLET_ADAPTERS.OPENLOGIN]: {
                                //             label: "openlogin",
                                //             loginMethods: {
                                //                 ...(HIDDEN_LOGIN_METHODS.reduce((hiddenLoginLoginConfig, hiddenLoginMethod) => ({...hiddenLoginLoginConfig, [hiddenLoginMethod]: {typeOfLogin: hiddenLoginMethod, showOnModal: false}}), {}))
                                //             },
                                //         }

                                //     }
                                // }]);
                            }
                        }
                    }
                    if (property === "connect") {
                        return async function (this: Web3AuthNoModal, loginProvider: LoginProvider, extra?: {jwt: string} ) {
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
                                const jwtOptions: {[key: string]: any} = {}
                                if (loginProvider === 'jwt') {
                                    jwtOptions['extraLoginOptions'] = {
                                        verifierIdField: getJWTData(authenticationProviders).jwtField,
                                        id_token: extra?.jwt,
                                    }
                                }
                                if (loginProvider === 'auth0') {
                                    jwtOptions['extraLoginOptions'] = {
                                        verifierIdField: "name",
                                        domain: getAuth0Data(authenticationProviders).domain,
                                    }
                                }
                                return Reflect.get(target, "connectTo").apply(this, [WALLET_ADAPTERS.OPENLOGIN, {
                                    loginProvider,
                                    ...jwtOptions
                                }]);
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

const ZeroDevWeb3Auth = new Proxy(Web3AuthNoModal, proxyHandler) as unknown as ZeroDevWeb3Auth;

export default ZeroDevWeb3Auth