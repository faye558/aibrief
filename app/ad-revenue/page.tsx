"use client";

import { useEffect } from "react";
import "./ad-revenue.css";
import SimpleNav from "@/components/SimpleNav";

export default function AdRevenuePage() {
  useEffect(() => {
    let zones = [
      { id: 1, name: "우측 상단 배너", platform: "pc", pv: 100000, ctr: 0.45, cpc: 250 },
      { id: 2, name: "본문 내 배너", platform: "pc", pv: 100000, ctr: 0.30, cpc: 250 },
      { id: 3, name: "상단 배너", platform: "mobile", pv: 100000, ctr: 0.40, cpc: 250 },
      { id: 4, name: "본문 내 배너", platform: "mobile", pv: 100000, ctr: 0.50, cpc: 250 },
      { id: 5, name: "전면광고(인터스티셜)", platform: "app", pv: 100000, ctr: 1.20, cpc: 300 },
      { id: 6, name: "네이티브 광고", platform: "app", pv: 100000, ctr: 0.80, cpc: 300 },
    ];
    let nextId = 7;
    let refPlatform = "pc";
    let currentChannel = "pc";

    const PLATFORM_LABEL: Record<string, string> = { pc: "PC웹", mobile: "모바일웹", app: "앱" };

    const won = (n: number) => Math.round(n).toLocaleString("ko-KR") + "원";
    const pct = (n: number) => Math.round(n * 100) / 100 + "%";

    // Rough, publicly-known ballpark ranges — not official published rates.
    // Position CTR ranges reflect general industry patterns per platform (banner
    // blindness on sidebars/bottom, higher engagement for in-content/native and
    // interruptive formats, and generally elevated CTR/CPC on in-app inventory).
    const REF_CTR_BY_PLATFORM: Record<string, { key: string; match: (n: string) => boolean; range: [number, number] }[]> = {
      pc: [
        { key: "상단 띠배너", match: (n) => n.includes("띠배너") || (n.includes("상단") && !n.includes("우측")), range: [0.2, 0.8] },
        { key: "우측 사이드 배너", match: (n) => n.includes("우측") || n.includes("사이드"), range: [0.1, 0.4] },
        { key: "본문 내 배너", match: (n) => n.includes("본문"), range: [0.3, 0.8] },
        { key: "하단 배너", match: (n) => n.includes("하단") && !n.includes("토스트"), range: [0.1, 0.3] },
        { key: "팝업 / 모달", match: (n) => n.includes("팝업") || n.includes("모달") || n.includes("토스트"), range: [0.3, 1.0] },
      ],
      mobile: [
        { key: "상단 배너", match: (n) => n.includes("상단"), range: [0.2, 0.6] },
        { key: "본문 내 배너", match: (n) => n.includes("본문"), range: [0.3, 0.7] },
        { key: "하단 고정 배너", match: (n) => n.includes("하단"), range: [0.3, 0.6] },
        { key: "인터스티셜(전면)", match: (n) => n.includes("인터스티셜") || n.includes("전면"), range: [0.5, 1.2] },
        { key: "팝업 / 모달", match: (n) => n.includes("팝업") || n.includes("모달") || n.includes("토스트"), range: [0.3, 0.9] },
      ],
      app: [
        { key: "전면광고(인터스티셜)", match: (n) => n.includes("전면") || n.includes("인터스티셜"), range: [0.8, 2.0] },
        { key: "네이티브 광고", match: (n) => n.includes("네이티브"), range: [0.5, 1.5] },
        { key: "오프닝 광고(스플래시)", match: (n) => n.includes("오프닝") || n.includes("스플래시"), range: [0.3, 0.8] },
        { key: "배너(하단 고정)", match: (n) => n.includes("배너") || n.includes("하단"), range: [0.3, 0.7] },
      ],
    };

    const REF_CPC_BY_PLATFORM: Record<string, { label: string; range: [number, number] }[]> = {
      pc: [
        { label: "구글 애드센스 (매체가 실제 받는 평균 CPC)", range: [50, 300] },
        { label: "카카오 애드핏 / 네이버 애드포스트", range: [30, 150] },
      ],
      mobile: [
        { label: "구글 애드센스 (매체가 실제 받는 평균 CPC)", range: [50, 300] },
        { label: "카카오 애드핏 / 네이버 애드포스트", range: [30, 150] },
      ],
      app: [
        { label: "인앱 광고 네트워크 (AdMob 등, 매체가 실제 받는 평균)", range: [300, 800] },
      ],
    };

    function findCtrRef(name: string, platform: string) {
      const n = (name || "").toLowerCase();
      const list = REF_CTR_BY_PLATFORM[platform] || REF_CTR_BY_PLATFORM.pc;
      for (const r of list) {
        if (r.match(n)) return r;
      }
      return null;
    }

    function renderRefTables() {
      const ctrList = REF_CTR_BY_PLATFORM[refPlatform];
      const cpcList = REF_CPC_BY_PLATFORM[refPlatform];
      const ctrTable = document.getElementById("refCtrTable");
      const cpcTable = document.getElementById("refCpcTable");
      if (ctrTable) {
        ctrTable.innerHTML = ctrList
          .map((r) => `<tr><td>${r.key}</td><td class="num">${r.range[0]}% ~ ${r.range[1]}%</td></tr>`)
          .join("");
      }
      if (cpcTable) {
        cpcTable.innerHTML = cpcList
          .map(
            (r) =>
              `<tr><td>${r.label}</td><td class="num">${r.range[0].toLocaleString("ko-KR")} ~ ${r.range[1].toLocaleString("ko-KR")}원</td></tr>`
          )
          .join("");
      }
    }

    function handleRefTabsClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const btn = target.closest("button");
      if (!btn) return;
      refPlatform = btn.dataset.platform || "pc";
      document.querySelectorAll("#refTabs button").forEach((b) => b.classList.toggle("active", b === btn));
      renderRefTables();
    }

    const rsRateEl = document.getElementById("rsRate") as HTMLInputElement;

    function computeZone(z: (typeof zones)[number]) {
      const clicks = z.pv * (z.ctr / 100);
      const gross = clicks * z.cpc;
      return { ...z, clicks, gross };
    }

    function getGlobalSettings() {
      const rsRate = parseFloat(rsRateEl.value) || 0;
      return { rsRate };
    }

    function updateOutputs() {
      const { rsRate } = getGlobalSettings();

      // Everything on screen — hero, stats, waterfall, table — is scoped to the
      // currently selected channel, matching the input list. No more mixing a
      // filtered list with an unfiltered total.
      const channelZones = zones.filter((z) => z.platform === currentChannel);
      const computed = channelZones.map(computeZone);
      const totalPV = computed.reduce((s, z) => s + z.pv, 0);
      const totalClicks = computed.reduce((s, z) => s + z.clicks, 0);
      const totalGross = computed.reduce((s, z) => s + z.gross, 0);
      const avgCTR = totalPV > 0 ? (totalClicks / totalPV) * 100 : 0;

      const net = totalGross * (rsRate / 100);

      document.getElementById("heroNet")!.textContent = won(net);
      document.getElementById("heroChannelLabel")!.textContent = PLATFORM_LABEL[currentChannel];

      document.getElementById("statRow")!.innerHTML = `
        <div class="stat"><div class="stat-label">지면 수</div><div class="stat-value">${computed.length}개</div></div>
        <div class="stat"><div class="stat-label">총 PV</div><div class="stat-value">${Math.round(totalPV).toLocaleString("ko-KR")}</div></div>
        <div class="stat"><div class="stat-label">총 클릭수</div><div class="stat-value">${Math.round(totalClicks).toLocaleString("ko-KR")}</div></div>
        <div class="stat"><div class="stat-label">평균 CTR</div><div class="stat-value">${pct(avgCTR)}</div></div>
      `;

      // Waterfall — fixed 3-stage: gross → network share deducted → net
      const maxVal = Math.max(totalGross, 1);
      const deductNetwork = totalGross - net;
      const stages = [
        { label: "총 CPC 매출", value: totalGross, bottom: 0, height: totalGross, type: "total" },
        { label: `네트워크 몫 (${pct(100 - rsRate)})`, value: -deductNetwork, bottom: net, height: deductNetwork, type: "deduct" },
        { label: "예상 순수익", value: net, bottom: 0, height: net, type: "final" },
      ];
      const guideRatios = [(net / maxVal) * 100];

      const wfCols = document.getElementById("wfCols")!;
      wfCols.innerHTML = stages
        .map((s) => {
          const bottomPct = Math.max(0, Math.min(100, (s.bottom / maxVal) * 100));
          const heightPct = Math.max(0.5, Math.min(100, (s.height / maxVal) * 100));
          const valueLabel = s.value < 0 ? `-${won(Math.abs(s.value))}` : won(s.value);
          const valueColor = s.type === "deduct" ? "var(--amber)" : s.type === "final" ? "var(--mint)" : "var(--paper)";
          return `
            <div class="wf-col">
              <div class="wf-value" style="color:${valueColor}">${valueLabel}</div>
              <div class="wf-track">
                <div class="wf-bar ${s.type}" style="bottom:${bottomPct}%; height:${heightPct}%;"></div>
              </div>
              <div class="wf-label">${s.label}</div>
            </div>
          `;
        })
        .join("");

      document.getElementById("wfGuides")!.innerHTML = guideRatios
        .map((r) => `<div class="wf-guide" style="bottom:${r}%"></div>`)
        .join("");

      // All-channels grand total — shown as a small separate line, never mixed into the main number above
      const allComputed = zones.map(computeZone);
      const grandGross = allComputed.reduce((s, z) => s + z.gross, 0);
      const grandNet = grandGross * (rsRate / 100);
      document.getElementById("grandTotalLine")!.textContent =
        `참고 — PC웹+모바일웹+앱 전체 채널 합계 예상 순수익: ${won(grandNet)}`;

      // Live benchmark hints per zone (updates without rebuilding the input list, so typing focus is preserved)
      zones.forEach((z) => {
        const ctrHintEl = document.getElementById(`ctrHint-${z.id}`);
        if (ctrHintEl) {
          const ref = findCtrRef(z.name, z.platform);
          ctrHintEl.textContent = ref ? `참고 ${ref.range[0]}~${ref.range[1]}%` : "";
        }
        const cpcHintEl = document.getElementById(`cpcHint-${z.id}`);
        if (cpcHintEl) {
          const cpcRef = REF_CPC_BY_PLATFORM[z.platform][0];
          cpcHintEl.textContent = `참고 ${cpcRef.range[0]}~${cpcRef.range[1]}원`;
        }
      });

      // Zone table — filtered to the currently selected channel, with delete buttons and a totals row
      document.getElementById("tableChannelLabel")!.textContent = PLATFORM_LABEL[currentChannel];
      const tableZones = computed;

      if (tableZones.length === 0) {
        document.getElementById("zoneTableBody")!.innerHTML =
          `<tr><td colspan="8" style="text-align:center; color:var(--dim);">이 채널에 등록된 지면이 없어요.</td></tr>`;
        document.getElementById("zoneTableFoot")!.innerHTML = "";
        document.getElementById("zoneTableFootNet")!.innerHTML = "";
      } else {
        document.getElementById("zoneTableBody")!.innerHTML = tableZones
          .map(
            (z) => `
          <tr>
            <td>${z.name}</td>
            <td>${PLATFORM_LABEL[z.platform]}</td>
            <td class="num">${Math.round(z.pv).toLocaleString("ko-KR")}</td>
            <td class="num">${pct(z.ctr)}</td>
            <td class="num">${won(z.cpc)}</td>
            <td class="num">${Math.round(z.clicks).toLocaleString("ko-KR")}</td>
            <td class="num">${won(z.gross)}</td>
            <td class="table-del">
              <button class="table-del-btn" data-id="${z.id}" title="삭제">✕</button>
            </td>
          </tr>
        `
          )
          .join("");

        const tPV = tableZones.reduce((s, z) => s + z.pv, 0);
        const tClicks = tableZones.reduce((s, z) => s + z.clicks, 0);
        const tGross = tableZones.reduce((s, z) => s + z.gross, 0);
        const tCTR = tPV > 0 ? (tClicks / tPV) * 100 : 0;
        document.getElementById("zoneTableFoot")!.innerHTML = `
          <td>합계 (CPC 매출)</td>
          <td></td>
          <td class="num">${Math.round(tPV).toLocaleString("ko-KR")}</td>
          <td class="num">${pct(tCTR)}</td>
          <td class="num">—</td>
          <td class="num">${Math.round(tClicks).toLocaleString("ko-KR")}</td>
          <td class="num">${won(tGross)}</td>
          <td></td>
        `;
        const tNet = tGross * (rsRate / 100);
        document.getElementById("zoneTableFootNet")!.innerHTML = `
          <td>예상 순수익 (RS 반영, 운영자 몫)</td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td class="num">${won(tNet)}</td>
          <td></td>
        `;

        document.querySelectorAll(".table-del-btn").forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const id = parseInt((e.currentTarget as HTMLElement).dataset.id || "0");
            if (zones.length <= 1) return;
            zones = zones.filter((z) => z.id !== id);
            render();
          });
        });
      }
    }

    function renderZoneInputs() {
      const list = document.getElementById("zoneList")!;
      const visibleZones = zones.filter((z) => z.platform === currentChannel);

      if (visibleZones.length === 0) {
        list.innerHTML = `<div class="zone-empty">이 채널에 등록된 지면이 아직 없어요. 아래 "+ 지면 추가"로 만들어보세요.</div>`;
        return;
      }

      list.innerHTML = visibleZones
        .map(
          (z) => `
        <div class="zone-row" data-id="${z.id}">
          <div class="zone-row-top">
            <input class="zone-name-input" data-field="name" value="${z.name}" list="zoneNameList-${z.platform}">
            <button class="zone-del" data-id="${z.id}" title="삭제" ${zones.length <= 1 ? 'disabled style="opacity:0.3"' : ""}>✕</button>
          </div>
          <div class="zone-fields">
            <div class="field-mini">
              <label>PV</label>
              <input type="text" inputmode="numeric" data-field="pv" value="${z.pv.toLocaleString('ko-KR')}">
            </div>
            <div class="field-mini">
              <label>CTR %</label>
              <input type="number" data-field="ctr" value="${z.ctr}" min="0" step="0.01">
              <span class="field-hint" id="ctrHint-${z.id}"></span>
            </div>
            <div class="field-mini">
              <label>CPC 원</label>
              <input type="number" data-field="cpc" value="${z.cpc}" min="0" step="10">
              <span class="field-hint" id="cpcHint-${z.id}"></span>
            </div>
          </div>
        </div>
      `
        )
        .join("");

      list.querySelectorAll(".zone-row").forEach((row) => {
        const id = parseInt((row as HTMLElement).dataset.id || "0");
        row.querySelectorAll(".zone-fields input, .zone-name-input").forEach((input) => {
          input.addEventListener("input", (e) => {
            const target = e.target as HTMLInputElement;
            const field = target.dataset.field!;
            const zone = zones.find((z) => z.id === id);
            if (!zone) return;
            if (field === "name") {
              zone.name = target.value;
            } else if (field === "pv") {
              const raw = target.value.replace(/,/g, "");
              zone.pv = parseFloat(raw) || 0;
            } else {
              (zone as any)[field] = parseFloat(target.value) || 0;
            }
            updateOutputs();
          });
          input.addEventListener("blur", (e) => {
            const target = e.target as HTMLInputElement;
            if (target.dataset.field === "pv") {
              const zone = zones.find((z) => z.id === id);
              if (zone) target.value = zone.pv.toLocaleString("ko-KR");
            }
          });
          if ((input as HTMLInputElement).dataset.field === "pv") {
            input.addEventListener("keydown", (e) => {
              const ke = e as KeyboardEvent;
              const zone = zones.find((z) => z.id === id);
              if (!zone) return;
              const step = ke.shiftKey ? 100000 : 10000;
              if (ke.key === "ArrowUp") { ke.preventDefault(); zone.pv = Math.max(0, zone.pv + step); (e.target as HTMLInputElement).value = zone.pv.toLocaleString("ko-KR"); updateOutputs(); }
              if (ke.key === "ArrowDown") { ke.preventDefault(); zone.pv = Math.max(0, zone.pv - step); (e.target as HTMLInputElement).value = zone.pv.toLocaleString("ko-KR"); updateOutputs(); }
            });
            input.addEventListener("wheel", (e) => {
              const we = e as WheelEvent;
              if (document.activeElement !== input) return;
              we.preventDefault();
              const zone = zones.find((z) => z.id === id);
              if (!zone) return;
              const step = we.shiftKey ? 100000 : 10000;
              zone.pv = Math.max(0, zone.pv + (we.deltaY < 0 ? step : -step));
              (e.target as HTMLInputElement).value = zone.pv.toLocaleString("ko-KR");
              updateOutputs();
            }, { passive: false });
          }
        });
      });
      list.querySelectorAll(".zone-del").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const id = parseInt((e.target as HTMLElement).dataset.id || "0");
          if (zones.length <= 1) return;
          zones = zones.filter((z) => z.id !== id);
          render();
        });
      });
    }

    function render() {
      renderZoneInputs();
      updateOutputs();
    }

    function handleAddZoneClick() {
      const defaultCpc = currentChannel === "app" ? 300 : 250;
      zones.push({ id: nextId++, name: `지면 ${zones.length + 1}`, platform: currentChannel, pv: 100000, ctr: 0.4, cpc: defaultCpc });
      render();
    }

    function handleChannelTabsClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const btn = target.closest("button");
      if (!btn) return;
      currentChannel = (btn as HTMLElement).dataset.channel || "pc";
      document.querySelectorAll("#channelTabs button").forEach((b) => b.classList.toggle("active", b === btn));
      render();
    }

    function handleRsRateInput() {
      updateOutputs();
    }

    const refTabsEl = document.getElementById("refTabs")!;
    const addZoneBtnEl = document.getElementById("addZoneBtn")!;
    const channelTabsEl = document.getElementById("channelTabs")!;

    refTabsEl.addEventListener("click", handleRefTabsClick as EventListener);
    addZoneBtnEl.addEventListener("click", handleAddZoneClick);
    channelTabsEl.addEventListener("click", handleChannelTabsClick as EventListener);
    rsRateEl.addEventListener("input", handleRsRateInput);

    renderRefTables();
    render();

    return () => {
      refTabsEl.removeEventListener("click", handleRefTabsClick as EventListener);
      addZoneBtnEl.removeEventListener("click", handleAddZoneClick);
      channelTabsEl.removeEventListener("click", handleChannelTabsClick as EventListener);
      rsRateEl.removeEventListener("input", handleRsRateInput);
    };
  }, []);

  return (
    <div className="ad-revenue-page" id="adRevenuePageRoot">
      <SimpleNav />
      <div className="app">

        <div className="hero">
          <span className="eyebrow">Ad Revenue Simulator</span>
          <h1>광고 배너 매출 시뮬레이터</h1>
          <p className="sub">지면별 플랫폼·PV·CTR·CPC를 입력하면, RS 비율을 반영한 순매출을 바로 계산합니다.</p>
        </div>

        <div className="grid">
          <section className="panel input-panel">
            <h2 className="panel-title">채널</h2>
            <div className="channel-tabs" id="channelTabs">
              <button data-channel="pc" className="active">PC웹</button>
              <button data-channel="mobile">모바일웹</button>
              <button data-channel="app">앱</button>
            </div>

            <h2 className="panel-title">지면 설정</h2>
            <div id="zoneList" />
            <button className="btn-add" id="addZoneBtn">+ 지면 추가</button>
            <datalist id="zoneNameList-pc">
              <option value="우측 상단 배너" />
              <option value="우측 중단 배너" />
              <option value="본문 내 배너" />
              <option value="하단 배너" />
              <option value="상단 띠배너" />
              <option value="팝업 / 모달" />
            </datalist>
            <datalist id="zoneNameList-mobile">
              <option value="상단 배너" />
              <option value="본문 내 배너" />
              <option value="하단 고정 배너" />
              <option value="인터스티셜(전면)" />
              <option value="팝업 / 모달" />
            </datalist>
            <datalist id="zoneNameList-app">
              <option value="전면광고(인터스티셜)" />
              <option value="네이티브 광고" />
              <option value="배너(하단 고정)" />
              <option value="오프닝 광고(스플래시)" />
            </datalist>

            <hr className="divider-line" />

            <h2 className="panel-title">매출 조건</h2>
            <div className="field">
              <label>
                광고 매출 중 내가 가져가는 비율 <span className="unit">(RS, %)</span>
              </label>
              <input type="number" id="rsRate" defaultValue={60} min={0} max={100} step={1} />
            </div>
          </section>

          <section className="panel output-panel">
            <div className="hero-number">
              <div className="hero-label">
                예상 순수익 — 사이트 운영자 몫 (RS 반영, <span id="heroChannelLabel">PC웹</span>)
              </div>
              <div className="hero-value" id="heroNet">0원</div>
            </div>

            <div className="stat-row" id="statRow" />

            <div className="waterfall-wrap">
              <div className="waterfall">
                <div className="wf-guides" id="wfGuides" />
                <div className="wf-cols" id="wfCols" />
              </div>
            </div>
            <p className="grand-total-line" id="grandTotalLine" />
          </section>
        </div>

        <section className="panel table-panel">
          <h2 className="panel-title">지면별 상세 — <span id="tableChannelLabel">PC웹</span></h2>
          <table>
            <thead>
              <tr>
                <th>지면</th>
                <th>채널</th>
                <th className="num">PV</th>
                <th className="num">CTR</th>
                <th className="num">CPC</th>
                <th className="num">클릭수</th>
                <th className="num">CPC 매출</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="zoneTableBody" />
            <tfoot>
              <tr id="zoneTableFoot"></tr>
              <tr id="zoneTableFootNet"></tr>
            </tfoot>
          </table>
        </section>

        <section className="panel ref-panel">
          <h2 className="panel-title">참고 데이터 — 예상 클릭율 및 예상단가</h2>
          <div className="ref-tabs" id="refTabs">
            <button data-platform="pc" className="active">PC웹</button>
            <button data-platform="mobile">모바일웹</button>
            <button data-platform="app">앱</button>
          </div>
          <div className="ref-grid">
            <div>
              <table className="ref-table">
                <thead>
                  <tr><th>지면 유형</th><th className="num">참고 CTR</th></tr>
                </thead>
                <tbody id="refCtrTable" />
              </table>
            </div>
            <div>
              <table className="ref-table">
                <thead>
                  <tr><th>광고 네트워크</th><th className="num">참고 CPC</th></tr>
                </thead>
                <tbody id="refCpcTable" />
              </table>
            </div>
          </div>
          <div className="ref-note">
            이 수치는 공식 발표 단가가 아니라 업계에 알려진 대략적인 범위예요. 상황에 따라 조금씩 가감해서 참고용으로만 활용하세요.
          </div>
        </section>

        <p className="caption">* RS 비율은 가정치입니다. 실측 데이터로 교체해서 사용하세요.</p>
      </div>
    </div>
  );
}
