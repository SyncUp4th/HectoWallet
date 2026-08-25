// Store is mock-only, same as settlement. Desimone (드시모네) is priced in
// HHPC since it's a Hecto Healthcare-affiliated brand for this demo.
export function getStoreProducts() {
  return {
    brand: '드시모네',
    currency: 'HHPC',
    products: [
      { id: 'dsm-01', name: '드시모네 오리지널 유산균', description: '이탈리아 정통 유산균 De Simone Formulation', priceHhpc: 15000 },
      { id: 'dsm-02', name: '드시모네 키즈 유산균', description: '어린이용 저용량 포뮬러', priceHhpc: 18000 },
      { id: 'dsm-03', name: '드시모네 멀티비타민', description: '유산균과 함께 먹는 종합비타민', priceHhpc: 12000 },
      { id: 'dsm-04', name: '드시모네 콜라겐 스틱', description: '저분자 콜라겐 + 유산균 스틱', priceHhpc: 22000 },
    ],
  }
}
