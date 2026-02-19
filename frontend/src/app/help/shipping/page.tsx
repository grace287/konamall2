'use client';

export default function ShippingPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 md:p-8 prose prose-sm max-w-none">
        <h2 className="text-lg font-bold text-gray-800 mb-6">배송 안내</h2>

        <section className="mb-8">
          <h3 className="font-bold text-gray-800 mb-3">배송 기간</h3>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>국내 재고 상품: 주문 결제 완료 후 1~3일</li>
            <li>해외 직구 상품: 결제 완료 후 7~21일 (상품·지역에 따라 상이)</li>
            <li>상품 상세페이지에 예상 배송일이 표시됩니다.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h3 className="font-bold text-gray-800 mb-3">배송비</h3>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>30,000원 이상 구매 시 <strong>무료배송</strong></li>
            <li>30,000원 미만 구매 시 배송비 3,000원 (도서·산간 추가 비용 발생 시 별도 안내)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h3 className="font-bold text-gray-800 mb-3">배송 조회</h3>
          <p className="text-gray-600">
            마이페이지 &gt; 주문내역에서 해당 주문의 [배송조회]를 클릭하시면 택배사 추적 페이지로 이동합니다.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-gray-800 mb-3">배송 지연 시</h3>
          <p className="text-gray-600">
            천재지변·통관 지연 등으로 배송이 지연될 수 있으며, 이 경우 SMS 또는 이메일로 안내해 드립니다.
            문의 사항은 고객센터(1588-0000) 또는 1:1 문의를 이용해 주세요.
          </p>
        </section>
      </div>
    </div>
  );
}
