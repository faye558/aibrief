import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | AI Brief",
  description: "AI Brief의 개인정보처리방침입니다.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12">
        <h1 className="text-2xl font-black text-gray-900 mb-2">개인정보처리방침</h1>
        <p className="text-sm text-gray-400 mb-8">최종 업데이트: 2026년 6월 20일</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">1. 개인정보 수집 및 이용 목적</h2>
            <p>
              AI Brief(이하 &quot;서비스&quot;)는 별도의 회원가입 없이 이용 가능한 뉴스 큐레이션 서비스입니다.
              서비스 이용 과정에서 아래와 같은 정보가 수집될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">2. 수집하는 개인정보 항목</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>자동 수집 정보: IP 주소, 쿠키, 방문 일시, 서비스 이용 기록, 브라우저 정보</li>
              <li>광고 서비스(Google AdSense)를 통해 쿠키 기반 관심사 데이터가 수집될 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">3. 개인정보 보유 및 이용 기간</h2>
            <p>
              수집된 개인정보는 서비스 이용 목적이 달성된 후 지체 없이 파기합니다.
              단, 관련 법령에 따라 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">4. 광고 서비스 (Google AdSense)</h2>
            <p>
              본 서비스는 Google AdSense를 통해 광고를 게재합니다. Google은 쿠키를 사용하여
              이용자의 관심사에 맞는 광고를 표시할 수 있습니다. 이용자는{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 underline"
              >
                Google 광고 설정
              </a>
              에서 맞춤 광고를 비활성화할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">5. 쿠키(Cookie) 사용</h2>
            <p>
              서비스는 이용자 경험 개선 및 광고 최적화를 위해 쿠키를 사용합니다.
              브라우저 설정에서 쿠키 저장을 거부할 수 있으나, 일부 서비스 기능이 제한될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">6. 개인정보의 제3자 제공</h2>
            <p>
              서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
              다만, 법령에 따른 요청이 있는 경우 예외로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">7. 개인정보 보호책임자</h2>
            <p>
              개인정보 처리와 관련한 불만 및 피해구제 등의 문의는 아래로 연락해 주시기 바랍니다.
            </p>
            <div className="mt-2 bg-gray-50 rounded-lg p-4">
              <p>이메일: <span className="text-brand-600">admin@aibrief.kr</span></p>
            </div>
          </section>

          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">8. 방침 변경</h2>
            <p>
              개인정보처리방침은 법령 및 서비스 변경에 따라 수정될 수 있습니다.
              변경 시 서비스 상단 공지 또는 본 페이지를 통해 안내합니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
