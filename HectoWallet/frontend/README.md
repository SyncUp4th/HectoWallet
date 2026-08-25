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
| GET    | `/api/wallet/assets`      | —                                          | `{ totalSp, coins: [{ symbol, name, balance, address }] }` |
| GET    | `/api/swap/rates`         | —                                          | `{ base: "SP", rates: [{ symbol, rate }] }` |
| POST   | `/api/swap/quote`         | `{ fromSymbol, toSymbol, fromAmount }`     | `{ toAmount, feeRate, priceImpact, minReceived }` |
| GET    | `/api/swap/contract-config` | —                                        | `{ address, abi, chainId, configured }` |
| GET    | `/api/transactions`       | query params (e.g. `page`)                 | `{ stats: {...}, items: [{ hash, type, fromCompany, toCompany, flow, status, time }] }` |
| GET    | `/api/settlement`         | `?period=2026-08`                          | `{ period, summary: {...}, positions: [{ company, net }], ledger: [{ creditor, debtor, flow, qty, sp, status }] }` |

There is no swap-execution endpoint — the connected browser wallet (MetaMask,
Coinbase Wallet, WalletConnect) signs and sends the swap transaction directly
to the contract at `/api/swap/contract-config`. The backend never holds a
signing key for that flow.

All coin amounts are whole numbers — every HectoWallet coin is pegged 1:1 to
SP (`src/lib/swap.js`), so a swap only moves by the fee, never by a market rate.

## Wallet connect

Set `VITE_WALLETCONNECT_PROJECT_ID` (see `.env.example`) to enable the
WalletConnect connector (mobile QR-connect, Binance Wallet app, etc.) — free
at https://cloud.reown.com. MetaMask, Coinbase Wallet extension, and other
EIP-6963 wallets are auto-detected without any key.

## Self-check

`src/lib/swap.js` has the only non-trivial logic (swap fee/slippage math) in
the frontend. Verify it hasn't regressed:

```bash
npm run selfcheck
```
