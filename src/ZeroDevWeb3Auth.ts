import { Web3AuthNoModal } from "@web3auth/no-modal";
import { OpenloginAdapter, OpenloginAdapterOptions } from "@web3auth/openlogin-adapter";
import { getOpenloginAdapterConfig } from "./configs/openloginAdapterConfig.js";
import { getWeb3AuthConfig } from "./configs/web3AuthConfig.js";
import { ZeroDevWeb3AuthInitOptions, ProjectConfiguration, ChainId, ZeroDevWeb3AuthOptions, ZeroDevWeb3AuthEvents } from "./types.js";
import { ZERODEV_CLIENT_ID } from "./constants.js";
import { getProjectsConfiguration, isMobileDevice } from "./utilities.js";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { getChainConfig } from "./configs/chainConfig.js";

export type LoginProvider = 'google' | 'facebook' | 'discord' | 'twitch' | 'twitter' | 'github' | 'jwt' | 'auth0'

const getAuth0Data = (items: ProjectConfiguration['authenticationProviders']) => {
    const item = items?.find((item) => item.provider === "auth0");
    return item ? { verifier: item.verifierId, clientId: item.config.auth0ClientId, domain: item.config.auth0Url  } : {};
};

const getJWTData = (items: ProjectConfiguration['authenticationProviders']) => {
    const item = items?.find((item) => item.provider === "jwt");
    return item ? { verifier: item.verifierId, jwtField: item.config.jwtField } : {};
};

class ZeroDevWeb3Auth extends Web3AuthNoModal {
    static zeroDevWeb3Auth: ZeroDevWeb3Auth
    eventHandlers: {[event in ZeroDevWeb3AuthEvents]: {[loginProvider: string]: () => void}} = {onConnect: {}}
    initiated: boolean | Promise<void> = false
    zeroDevOptions: ZeroDevWeb3AuthOptions = {}
    projectIds: string[] = []
    chainId?: ChainId
    authenticationProviders: ProjectConfiguration['authenticationProviders'] = []

    constructor(projectIds: string[], chainId?: ChainId, zeroDevOptions?: ZeroDevWeb3AuthOptions) {
        if (ZeroDevWeb3Auth.zeroDevWeb3Auth) return ZeroDevWeb3Auth.zeroDevWeb3Auth
        super(getWeb3AuthConfig(chainId, zeroDevOptions?.web3authOptions))
        this.chainId = chainId
        this.projectIds = projectIds
        this.zeroDevOptions = zeroDevOptions ?? {}
        this.eventHandlers = {
            onConnect: {},
        }
    }

    async initialize(initOptions: ZeroDevWeb3AuthInitOptions, loginProvider: LoginProvider) {
        if (this.initiated) {
            if (initOptions?.onConnect) {
                if (this.eventHandlers.onConnect[loginProvider]) {
                    this.removeListener('connected', this.eventHandlers.onConnect[loginProvider])
                }
                this.eventHandlers.onConnect[loginProvider] = () => {
                    this.getUserInfo().then(initOptions.onConnect)
                }
                this.on('connected', this.eventHandlers.onConnect[loginProvider]);
            }
        } else {
            this.initiated = true
            let openLoginAdapterSettings: OpenloginAdapterOptions['adapterSettings'] = {
                    uxMode: isMobileDevice() ? 'redirect' : 'popup',
                    whiteLabel: {
                        appName: "ZeroDev",
                    },
                    ...(this.zeroDevOptions?.adapterSettings ?? {})
            }
            if (!this.zeroDevOptions?.web3authOptions?.clientId || this.zeroDevOptions.web3authOptions.clientId === ZERODEV_CLIENT_ID) {
                const data = (await getProjectsConfiguration(this.projectIds))
                this.authenticationProviders = data.authenticationProviders
                openLoginAdapterSettings = getOpenloginAdapterConfig({
                    signature: this.zeroDevOptions?.web3authOptions?.clientId ? undefined : data.newSignature,
                    jwt: getJWTData(this.authenticationProviders),
                    auth0: getAuth0Data(this.authenticationProviders),
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
                this.initiated = this.init()
            }
        }
    }

    async login(loginProvider: LoginProvider, extra?: {jwt: string} ) {
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
            const jwtOptions: {[key: string]: any} = {}
            if (loginProvider === 'jwt') {
                jwtOptions['extraLoginOptions'] = {
                    verifierIdField: getJWTData(this.authenticationProviders).jwtField,
                    id_token: extra?.jwt,
                }
            }
            if (loginProvider === 'auth0') {
                jwtOptions['extraLoginOptions'] = {
                    verifierIdField: "name",
                    domain: getAuth0Data(this.authenticationProviders).domain,
                }
            }
            return this.connectTo('openlogin', {
                loginProvider,
                ...jwtOptions

            })
        }
        return this.provider
    }

}

export default ZeroDevWeb3Auth