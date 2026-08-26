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
| `OPERATOR_PRIVATE_KEY` | Signing swaps, and the wallet address the app shows (derived from the key) | generated for this app — see `.env.example` |
| `TOKEN_ADDRESS_*` (5 of these) | Per-coin balance reads and swap routing | your deployed ERC20 contracts |
| `ETHERSCAN_API_KEY` | Real transaction history in the 거래내역 tab | etherscan.io/apis, free self-serve signup |

`/api/store/products` is mock-only (`src/services/storeService.js`) — same
status as `/api/settlement`, no real inventory backing it.

## Two wallets, two roles

- **Issuer EOA** — minted the tokens and seeded the Uniswap pools. Its key is
  *not* used by this backend and must never be stored in this repo.
- **Operator EOA** — this app's own wallet. `OPERATOR_PRIVATE_KEY` signs its
  swaps, and `getOperatorAddress()` derives the address from that same key so
  the two can't drift apart. Fund it with Sepolia ETH for gas plus the tokens
  it should hold.

## Swap execution

Swaps run against the real Uniswap V3 deployment on Sepolia — no custom
contract. Only `X-USDT` pools exist (all at the 0.01% fee tier), so USDT is
the routing hub: `USDT ↔ X` swaps direct, and `X ↔ Y` hops through USDT
(`HFPC → USDT → HIPC`). Addresses and the fee tier are constants in
`src/chain/uniswap.js`; `POST /api/swap/quote` reads the live pool price via
QuoterV2 and `POST /api/swap/execute` approves the router once, then calls
`exactInput` with a 0.50% slippage floor.

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
