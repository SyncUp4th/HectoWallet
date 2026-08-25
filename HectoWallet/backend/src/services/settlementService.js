// Settlement stays mock-only per product decision — no real inter-company
// ledger exists yet, this is purely for the demo.
export function getSettlement() {
  return {
    period: '2026년 8월',
    summary: { txCount: 428, netMoved: 43700, unsettled: 14300 },
    positions: [
      { company: '헥토이노베이션', net: 37200 },
      { company: '헥토파이낸셜', net: -22900 },
      { company: '헥토헬스케어', net: -14300 },
    ],
    ledger: [
      { creditor: '헥토이노베이션', debtor: '헥토파이낸셜', flow: 'HFPC → HIPC', qty: 22900, sp: 22900, status: 'done' },
      { creditor: '헥토이노베이션', debtor: '헥토헬스케어', flow: 'HHPC → HIPC', qty: 14300, sp: 14300, status: 'pending' },
      { creditor: '헥토파이낸셜', debtor: '헥토헬스케어', flow: 'HHPC → HFPC', qty: 6500, sp: 6500, status: 'done' },
    ],
  }
}
