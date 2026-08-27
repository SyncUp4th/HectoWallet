import { publicClient } from '../chain/publicClient.js'
import { ERC20_ABI } from '../chain/erc20Abi.js'
import { COINS } from '../constants/coins.js'
import { getTokenAddress, getOperatorAddress } from '../config.js'
import { tokenDecimals } from './swapService.js'
import { log, logError } from '../lib/logger.js'

// Each coin reports its own token contract as `address`. The wallet those
// balances belong to is the same for every coin, so repeating it per card said
// nothing — it's returned once as `walletAddress` instead.
export async function getAssets() {
  const operator = getOperatorAddress()

  const coins = await Promise.all(
    COINS.map(async (coin) => {
      const address = getTokenAddress(coin.symbol)
      if (!operator || !address) {
        return { symbol: coin.symbol, name: coin.name, balance: 0, address, configured: false }
      }
      try {
        log('rpc', `balanceOf request`, { symbol: coin.symbol, tokenAddress: address, operator })
        const [raw, decimals] = await Promise.all([
          publicClient.readContract({ address, abi: ERC20_ABI, functionName: 'balanceOf', args: [operator] }),
          tokenDecimals(address),
        ])
        const balance = Number(raw / 10n ** BigInt(decimals))
        log('rpc', `balanceOf response`, { symbol: coin.symbol, balance })
        return { symbol: coin.symbol, name: coin.name, balance, address, configured: true }
      } catch (err) {
        logError('rpc', `balanceOf failed for ${coin.symbol}`, err)
        return { symbol: coin.symbol, name: coin.name, balance: 0, address, configured: true, error: err.shortMessage ?? err.message }
      }
    }),
  )

  const totalKrw = coins.reduce((sum, c) => sum + c.balance, 0)
  return { totalKrw, coins, walletAddress: operator }
}
