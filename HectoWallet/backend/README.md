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
| `TOKEN_ADDRESS_*` (5 of these) | Per-coin balance reads | your deployed ERC20 contracts |
| `ETHERSCAN_API_KEY` | Real transaction history in the 거래내역 tab | etherscan.io/apis, free self-serve signup |
| `SWAP_CONTRACT_ADDRESS` + `src/chain/swapAbi.json` | Serves the swap contract's address/ABI at `/api/swap/contract-config` — currently unused by the frontend (swap is a local simulation now), kept for a future on-chain-swap page | your deployed swap contract |

`/api/store/products` is mock-only (`src/services/storeService.js`) — same
status as `/api/settlement`, no real inventory backing it.

This backend never holds a private key or signs anything — swap execution
happens in the user's own wallet (MetaMask etc.) against the contract this
API points it at. A treasury mnemonic would only be needed for a future
real "보내기" (send) endpoint, and even then belongs in an env var / secrets
manager, never in source — this repo is public.

## Deploying to Vercel

This is a separate Vercel project from the frontend — same GitHub repo, but
its own **Import** with **Root Directory** set to `HectoWallet/backend`.
`api/index.js` exports the Express app as a serverless function; `vercel.json`
rewrites every `/api/*` and `/health` request to it so Express's own router
still sees the full path. No framework preset needed — Vercel detects the
`/api` folder on its own.

1. vercel.com/new → Import `SyncUp4th/HectoWallet` again → Root Directory
   `HectoWallet/backend` → Deploy.
2. **Never upload `.env`.** Add the same keys from `.env.example` one at a
   time in that Vercel project's **Settings → Environment Variables** —
   Vercel injects them into `process.env` at runtime, same effect as `.env`
   locally, but not committed anywhere.
3. Once deployed you'll get a URL like `https://hectowallet-backend.vercel.app`.
   Set that as `VITE_API_BASE_URL` in the **frontend** Vercel project's
   Environment Variables (and redeploy the frontend) to point it at this
   backend instead of the built-in mock data.

## Self-check

The two pieces of non-trivial logic (swap fee math, Etherscan tx grouping):

```bash
npm run selfcheck
```
