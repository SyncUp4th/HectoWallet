# HectoWallet — backend

Node.js + Express. Implements the REST contract the frontend already expects
(see `../frontend/README.md`), backed by real Sepolia on-chain reads and the
Etherscan V2 API instead of mock data.

```bash
npm install
cp .env.example .env   # then fill in what you have
npm run dev
```

Every external dependency degrades gracefully when unconfigured — the app
never crashes for a missing key, it just reports `configured: false` (or a
coin with `balance: 0`) so the frontend can show a "not wired up yet" state.

## What each `.env` value unlocks

| Variable | Unlocks | Get it from |
|---|---|---|
| `SEPOLIA_RPC_URL` | Reliable on-chain balance reads (falls back to a public RPC without it) | infura.io / alchemy.com, free tier |
| `TREASURY_ADDRESS` | Which wallet's balances/history to show — this is a public address, not a secret | your own treasury wallet |
| `TOKEN_ADDRESS_*` (8 of these) | Per-coin balance reads | your deployed ERC20 contracts |
| `ETHERSCAN_API_KEY` | Real transaction history in the explorer tab | etherscan.io/apis, free self-serve signup |
| `SWAP_CONTRACT_ADDRESS` + `src/chain/swapAbi.json` | Serves the swap contract's address/ABI to the frontend at `/api/swap/contract-config` so the connected browser wallet can call it directly | your deployed swap contract |

This backend never holds a private key or signs anything — swap execution
happens in the user's own wallet (MetaMask etc.) against the contract this
API points it at. A treasury mnemonic would only be needed for a future
real "보내기" (send) endpoint, and even then belongs in an env var / secrets
manager, never in source — this repo is public.

## Self-check

The two pieces of non-trivial logic (swap fee math, Etherscan tx grouping):

```bash
npm run selfcheck
```
