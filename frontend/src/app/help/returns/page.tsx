'use client';

export default function ReturnsPage() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 md:p-8 prose prose-sm max-w-none">
        <h2 className="text-lg font-bold text-gray-800 mb-6">반품/교환 안내</h2>

        <section className="mb-8">
          <h3 className="font-bold text-gray-800 mb-3">반품/교환 가능 기간</h3>
          <p className="text-gray-600">
            상품 수령일로부터 <strong>7일 이내</strong> (단, 상품의 내용이 표시·광고와 다르거나 계약 내용과 다르게 이행된 경우에는 수령일로부터 3개월 이내)
          </p>
        </section>

        <section className="mb-8">
          <h3 className="font-bold text-gray-800 mb-3">반품/교환 가능 조건</h3>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            <li>미개봉·미사용 상태인 경우</li>
            <li>고객 단순 변심: 왕복 배송비 고객 부담</li>
            <li>판매자 귀책(파손·불량·오배송): 반품 배송비 판매자 부담</li>
          </ul>
        </section>

        <section className="mb-8">
          <h3 className="font-bold text-gray-800 mb-3">신청 방법</h3>
          <ol className="list-decimal pl-5 space-y-2 text-gray-600">
            <li>고객센터(1588-0000) 또는 1:1 문의로 반품/교환 의사를 전달해 주세요.</li>
            <li>안내에 따라 상품을 지정된 주소로 발송해 주세요.</li>
            <li>수령 및 검수 후 환불 또는 교환 배송이 진행됩니다.</li>
          </ol>
        </section>

        <section>
          <h3 className="font-bold text-gray-800 mb-3">환불 안내</h3>
          <p className="text-gray-600">
            카드 결제 건은 승인 취소 후 카드사에 따라 3~7일 내 환불됩니다. 계좌 환불의 경우 입금 안내 후 1~3 영업일 내 처리됩니다.
          </p>
        </section>
      </div>
    </div>
  );
}
