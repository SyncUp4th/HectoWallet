import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

// http(undefined) falls back to viem's built-in public Sepolia RPC —
// works out of the box, just lower-throughput than a dedicated key.
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL || undefined),
})
