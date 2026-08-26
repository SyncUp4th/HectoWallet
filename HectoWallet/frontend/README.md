# HectoWallet — frontend

React + Vite SPA. No backend required to run — with `VITE_API_BASE_URL` unset,
`src/api/index.js` serves everything from `src/api/mock.js`.

```bash
npm install
npm run dev
```

## Connecting a real backend

Set `VITE_API_BASE_URL` (see `.env.example`) to the backend's origin, e.g.
`http://localhost:8080`. The app calls plain JSON REST endpoints — nothing
framework-specific — so a Spring Boot or a Node.js backend both work as long
as they implement this contract (`src/api/http.js`):

| Method | Path                    | Body                                      | Response |
|--------|-------------------------|--------------------------------------------|----------|
| GET    | `/api/wallet/assets`      | —                                          | `{ totalKrw, walletAddress, coins: [{ symbol, name, balance, address }] }` |
| GET    | `/api/swap/rates`         | —                                          | `{ base: "KRW", rates: [{ symbol, rate }] }` |
| POST   | `/api/swap/quote`         | `{ fromSymbol, toSymbol, fromAmount }`     | `{ toAmount, feeRate, priceImpact, minReceived, source }` |
| POST   | `/api/swap/execute`       | `{ fromSymbol, toSymbol, fromAmount }`     | `{ txHash, toAmount, hops, status, explorerUrl }` |
| GET    | `/api/transactions`       | query params (e.g. `page`)                 | `{ stats: {...}, items: [{ hash, type, fromCompany, toCompany, flow, status, time }] }` |
| GET    | `/api/settlement`         | `?period=2026-08`                          | `{ period, summary: {...}, positions: [{ company, net }], ledger: [{ creditor, debtor, flow, qty, krw, status }] }` |
| GET    | `/api/store/products`    | —                                          | `{ brand, currency, products: [{ id, name, description, priceHhpc }] }` |

Swap execution is real: `POST /api/swap/execute` runs the trade through
Uniswap V3 on Sepolia, signed by the backend's operator wallet, and returns a
tx hash the UI links to Etherscan. `src/lib/swap.js`'s `computeSwapQuote` is
now only the offline estimate — used by mock mode and as the fallback when a
live pool quote can't be fetched. The store's "구매하기" still reuses that math
client-side: if the HHPC balance can't cover a product, it auto-swaps the
shortfall from the first other coin with enough balance (`StorePage.jsx`).

All coin amounts are whole numbers — every HectoWallet coin is pegged 1:1 to
KRW, so a swap only moves by the pool fee, never by a market rate.
The `USDT` symbol is the real deployed contract standing in as the 1-KRW
reference asset (no separate KRW stablecoin was deployed for the demo) —
`src/constants/coins.js`'s `displaySymbol()` renders it as "KRWC" everywhere
in the UI instead of its on-chain ticker.

## Wallet connect (built, not currently wired up)

`src/wagmi.js` and `src/components/WalletConnectModal.jsx` implement wagmi-based
MetaMask/Coinbase Wallet/WalletConnect connection (set
`VITE_WALLETCONNECT_PROJECT_ID`, see `.env.example`, for the WalletConnect
connector — free at https://cloud.reown.com). No page currently renders it:
the swap flow moved to an in-app KRW-balance model instead of an
external-wallet DeFi flow. The infrastructure is left in place if a future
page needs it again.

## Routes

`/assets`, `/swap`, `/explorer`, `/store` share the mobile app shell (top
bar + bottom nav) in `App.jsx`. `/settlement` is a standalone desktop page
outside that shell — a back-office tool meant for a PC, not the phone-width
column the rest of the app uses.

## Self-check

`src/lib/swap.js` has the only non-trivial logic (swap fee/slippage math) in
the frontend. Verify it hasn't regressed:

```bash
npm run selfcheck
```
