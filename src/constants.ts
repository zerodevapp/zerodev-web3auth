export const HIDDEN_LOGIN_METHODS = [
  'reddit', 
  'apple', 
  'line', 
  'kakao', 
  'linkedin', 
  'weibo', 
  'wechat', 
  'email_passwordless'
]

export const BACKEND_URL = process.env.REACT_APP_ZERODEV_BACKEND_URL ?? 'https://backend-vikp.onrender.com'

export const INFURA_API_KEY = 'f36f7f706a58477884ce6fe89165666c'

export const CHAIN_ID_TO_NODE: { [key: number]: string} = {
  1: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
  5: `https://goerli.infura.io/v3/${INFURA_API_KEY}`,
  11155111:
    "https://fittest-ultra-aura.ethereum-sepolia.quiknode.pro/3893d01b1dd411fdfa9b6dd372dd2b4f69fcf1ea/",
  137: `https://polygon-mainnet.infura.io/v3/${INFURA_API_KEY}`,
  80001: `https://polygon-mumbai.infura.io/v3/${INFURA_API_KEY}`,
  10: `https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`,
  420: `https://optimism-goerli.infura.io/v3/${INFURA_API_KEY}`,
  42161: `https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}`,
  // 42161: 'https://evocative-stylish-dinghy.arbitrum-mainnet.discover.quiknode.pro/80b526d14fa9fd9a8b0db1e65554acaf00c6a1ab/',
  421613: `https://arbitrum-goerli.infura.io/v3/${INFURA_API_KEY}`,
  43114: `https://avalanche-mainnet.infura.io/v3/${INFURA_API_KEY}`,
  43113: `https://avalanche-fuji.infura.io/v3/${INFURA_API_KEY}`,
  1313161554: `https://aurora-mainnet.infura.io/v3/${INFURA_API_KEY}`,
  1313161555: `https://aurora-testnet.infura.io/v3/${INFURA_API_KEY}`,
  56: "https://neat-greatest-layer.bsc.quiknode.pro/9405a499ceee314e5f2f68c9d47518d3537fce6a/",
  8453: "https://twilight-red-tree.base-mainnet.quiknode.pro/dc6eb27bf0f917df215922488dd97f4de7d9b08e/",
  84531:
    "https://icy-long-mountain.base-goerli.quiknode.pro/5b80d93e97cc9412a63c10a30841869abbef9596/",
  100: "https://thrilling-fluent-film.xdai.quiknode.pro/305955cffb9868cdd95b5e3dc9775f20678ad9ac/",
  10200: "https://nd-810-853-201.p2pify.com/e828b09f0d43591de96c297b3f36fffd",
  59144: `https://linea-mainnet.infura.io/v3/${INFURA_API_KEY}`,
  204: 'opBnb', // TODO: get rpc url
  59140: `https://linea-goerli.infura.io/v3/${INFURA_API_KEY}`,
  5611: 'opBnb-testnet', // TODO: get rpc url
}
export const ZERODEV_CLIENT_ID = process.env.REACT_APP_ZEROKIT_WEB3AUTH_CLIENT_ID ?? 'BEjNZMt6TPboj3TfHM06MP8Yxz7cKQX6eK3KZzVhrIMi7jALcZHxJv5o3fDLM7EL4QfPlf2AV_qe155vyR3QxiU'