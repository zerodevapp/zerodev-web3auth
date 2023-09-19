import { Web3Auth } from "@web3auth/modal";
import { ADAPTER_EVENTS, ADAPTER_STATUS, CONNECTED_EVENT_DATA, WALLET_ADAPTERS  } from "@web3auth/base";
import { OpenloginAdapter, OpenloginAdapterOptions } from "@web3auth/openlogin-adapter";
import { getOpenloginAdapterConfig } from "./configs/openloginAdapterConfig";
import { getWeb3AuthConfig } from "./configs/web3AuthConfig";
import { HIDDEN_LOGIN_METHODS, ZERODEV_CLIENT_ID } from "./constants";
import { getProjectsConfiguration, isMobileDevice } from "./utilities";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { getChainConfig } from "./configs/chainConfig";
import { ChainId, ZeroDevWeb3AuthEvents, ZeroDevWeb3AuthInitOptions, ZeroDevWeb3AuthOptions } from "./types";


class ZeroDevWeb3AuthWithModal extends Web3Auth {
    static zeroDevWeb3AuthWithModal: ZeroDevWeb3AuthWithModal
    eventHandlers: {[event in ZeroDevWeb3AuthEvents]: {[loginProvider: string]: () => void}} = {onConnect: {}}
    initiated: boolean | Promise<void> = false
    zeroDevOptions: ZeroDevWeb3AuthOptions = {}
    projectIds: string[] = []
    chainId?: ChainId

    constructor(projectIds: string[], chainId?: ChainId, zeroDevOptions?: ZeroDevWeb3AuthOptions) {
        if (ZeroDevWeb3AuthWithModal.zeroDevWeb3AuthWithModal) return ZeroDevWeb3AuthWithModal.zeroDevWeb3AuthWithModal
        super(getWeb3AuthConfig(chainId, zeroDevOptions?.web3authOptions))
        this.chainId = chainId
        this.projectIds = projectIds
        this.zeroDevOptions = zeroDevOptions ?? {}
        this.eventHandlers = {
            onConnect: {},
        }
    }

    async initialize(initOptions: ZeroDevWeb3AuthInitOptions) {
        if (this.initiated) {
            if (initOptions?.onConnect) {
                this.on(ADAPTER_EVENTS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
                    this.getUserInfo().then(initOptions.onConnect)
                });
            }
        } else {
            this.initiated = true
            let openLoginAdapterSettings: OpenloginAdapterOptions['adapterSettings'] = {
                    uxMode: isMobileDevice() ? 'redirect' : 'popup',
                    whiteLabel: {
                        appName: "ZeroDev",
                        defaultLanguage: 'en'
                    },
                    ...(this.zeroDevOptions?.adapterSettings ?? {})
            }
            if (!this.zeroDevOptions?.web3authOptions?.clientId || this.zeroDevOptions.web3authOptions.clientId === ZERODEV_CLIENT_ID) {
                const { signature } = (await getProjectsConfiguration(this.projectIds))
                openLoginAdapterSettings = getOpenloginAdapterConfig({
                    signature: this.zeroDevOptions?.web3authOptions?.clientId ? undefined : signature,
                    adapterSettings: openLoginAdapterSettings
                })
            }
            if (!this.chainId) {
                this.chainId = (await getProjectsConfiguration(this.projectIds)).projects[0].chainId
            }
            const openLoginAdapter = new OpenloginAdapter({
                adapterSettings: openLoginAdapterSettings,
                privateKeyProvider: new EthereumPrivateKeyProvider({ 
                    config: { 
                        //@ts-expect-error
                        chainConfig: getChainConfig(this.chainId!) 
                    } 
                })
            })
            this.configureAdapter(openLoginAdapter)
            if (initOptions?.onConnect) {
                this.on(ADAPTER_EVENTS.CONNECTED, (data: CONNECTED_EVENT_DATA) => {
                    this.getUserInfo().then(initOptions.onConnect)
                });
            }
            if (this.status === ADAPTER_STATUS.NOT_READY) {
                this.initiated = this.initModal({
                    modalConfig: {
                        [WALLET_ADAPTERS.OPENLOGIN]: {
                            label: "openlogin",
                            loginMethods: {
                                ...(HIDDEN_LOGIN_METHODS.reduce((hiddenLoginLoginConfig, hiddenLoginMethod) => ({...hiddenLoginLoginConfig, [hiddenLoginMethod]: {typeOfLogin: hiddenLoginMethod, showOnModal: false}}), {}))
                            },
                        }

                    }
                });
            }
        }
    }

    async login() {
        if (this.status === 'connecting') {
            this.status = 'ready'
            this.walletAdapters[WALLET_ADAPTERS.OPENLOGIN].status = 'ready'
        }
        // Checks 5 times in a period of a second if initiated changed
        for (let i = 1; i <= 5; i++) {
            if (this.initiated instanceof Promise) {
                await this.initiated
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 5000 / 5));
        }
        if (this.status !== 'connected') {
            return this.connect()
        }
        return this.provider

    }
}

export default ZeroDevWeb3AuthWithModal