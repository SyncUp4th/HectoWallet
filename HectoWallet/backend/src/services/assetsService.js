import { publicClient } from '../chain/publicClient.js'
import { ERC20_ABI } from '../chain/erc20Abi.js'
import { COINS } from '../constants/coins.js'
import { getTokenAddress, getTreasuryAddress } from '../config.js'
import { log, logError } from '../lib/logger.js'

export async function getAssets() {
  const treasury = getTreasuryAddress()

  const coins = await Promise.all(
    COINS.map(async (coin) => {
      const address = getTokenAddress(coin.symbol)
      if (!treasury || !address) {
        return { symbol: coin.symbol, name: coin.name, balance: 0, address: treasury, configured: false }
      }
      try {
        log('rpc', `balanceOf request`, { symbol: coin.symbol, tokenAddress: address, treasury })
        const [raw, decimals] = await Promise.all([
          publicClient.readContract({ address, abi: ERC20_ABI, functionName: 'balanceOf', args: [treasury] }),
          publicClient.readContract({ address, abi: ERC20_ABI, functionName: 'decimals' }),
        ])
        const balance = Number(raw / 10n ** BigInt(decimals))
        log('rpc', `balanceOf response`, { symbol: coin.symbol, balance })
        return { symbol: coin.symbol, name: coin.name, balance, address: treasury, configured: true }
      } catch (err) {
        logError('rpc', `balanceOf failed for ${coin.symbol}`, err)
        return { symbol: coin.symbol, name: coin.name, balance: 0, address: treasury, configured: true, error: err.shortMessage ?? err.message }
      }
    }),
  )

  const totalKrw = coins.reduce((sum, c) => sum + c.balance, 0)
  return { totalKrw, coins }
}
