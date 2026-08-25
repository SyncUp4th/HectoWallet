import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'

// EIP-6963 auto-discovery (wagmi default) picks up MetaMask, Binance Wallet,
// and most other extensions through injected() without naming them one by
// one. WalletConnect (for Binance/Coinbase mobile app QR-connect, etc.) only
// activates once VITE_WALLETCONNECT_PROJECT_ID is set — free at
// https://cloud.reown.com — so this never crashes without one.
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    coinbaseWallet({ appName: 'HectoWallet' }),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [sepolia.id]: http(),
  },
})
