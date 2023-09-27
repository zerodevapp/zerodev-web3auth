import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter, OpenloginAdapterOptions } from "@web3auth/openlogin-adapter";
import { getOpenloginAdapterConfig } from "./configs/openloginAdapterConfig.js";
import { getWeb3AuthConfig } from "./configs/web3AuthConfig.js";
import { HIDDEN_LOGIN_METHODS, ZERODEV_CLIENT_ID } from "./constants.js";
import { getProjectsConfiguration, isMobileDevice } from "./utilities.js";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { getChainConfig } from "./configs/chainConfig.js";
import { ChainId, ZeroDevWeb3AuthEvents, ZeroDevWeb3AuthInitOptions, ZeroDevWeb3AuthOptions } from "./types.js";


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
                this.on('connected', () => {
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
                const { signature, newSignature } = (await getProjectsConfiguration(this.projectIds))
                openLoginAdapterSettings = getOpenloginAdapterConfig({
                    signature: this.zeroDevOptions?.web3authOptions?.clientId ? undefined : newSignature,
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
                this.on('connected', () => {
                    this.getUserInfo().then(initOptions.onConnect)
                });
            }
            if (this.status === 'not_ready') {
                this.initiated = this.initModal({
                    modalConfig: {
                        ['openlogin']: {
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
            this.walletAdapters['openlogin'].status = 'ready'
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