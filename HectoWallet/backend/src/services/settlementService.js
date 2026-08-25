// Settlement stays mock-only per product decision — no real inter-company
// ledger exists yet, this is purely for the demo.
export function getSettlement() {
  return {
    period: '2026년 8월',
    summary: { txCount: 1284, netMoved: 486200, unsettled: 21400 },
    positions: [
      { company: '헥토그룹 (HTC 법인)', net: 48600 },
      { company: '헥토파이낸셜', net: -22900 },
      { company: '헥토이노베이션', net: 7200 },
      { company: '헥토헬스케어', net: -14300 },
      { company: '헥토데이터', net: 3100 },
      { company: '헥토미디어', net: -21700 },
    ],
    ledger: [
      { creditor: '헥토그룹', debtor: '헥토파이낸셜', flow: 'HFC → HTC', qty: 42000, sp: 42000, status: 'done' },
      { creditor: '헥토이노베이션', debtor: '헥토미디어', flow: 'HMC → HIC', qty: 8200, sp: 8200, status: 'done' },
      { creditor: '헥토그룹', debtor: '헥토헬스케어', flow: 'HHC → HTC', qty: 51000, sp: 51000, status: 'pending' },
      { creditor: '헥토데이터', debtor: '헥토미디어', flow: 'HMC → HDC', qty: 6400, sp: 6400, status: 'done' },
    ],
  }
}
