// ==================== BRAND & PARTNER PIPELINE 2026 (SPREADSHEET & CARDS) ====================
let pipelineBrands = [];
let currentCountryFilter = 'ALL';
let currentCategoryFilter = 'ALL';
let currentStatusFilter = 'ALL';
let currentSearchQuery = '';
let currentSortCol = 'no';
let currentSortDir = 'asc';
let currentBrandViewMode = 'spreadsheet';

// 엑셀 'Brand & Partner Pipeline 2026.xlsx' 숨김 속성 동기화 상태 플래그
// 기본값: false (엑셀의 숨김 시트 5개는 보이지 않도록 함, 불필요 6개 열은 영구 삭제 완료)
let showExcelHidden = false;

const EXCEL_VISIBLE_SHEETS = ['Southern Africa'];
const EXCEL_HIDDEN_SHEETS = ['kindlife', 'China', 'Italy', 'Japan', 'Finland'];

function initPipelineData() {
  try {
    // 구버전 로컬스토리지 캐시 강제 무효화 및 완전 삭제
    localStorage.removeItem('adeline_pipeline_master_brands');
    localStorage.removeItem('adeline_pipeline_master_brands_v2');
    localStorage.removeItem('adeline_pipeline_master_brands_v3');
    localStorage.removeItem('adeline_pipeline_master_brands_v4');

    const saved = localStorage.getItem('adeline_pipeline_master_brands_v5');
    if (saved) {
      pipelineBrands = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load saved pipeline brands:', e);
  }

  // 데이터가 없거나 15개 최신 브랜드와 불일치할 경우 PIPELINE_MASTER_DATA로부터 강제 초기화
  if (!pipelineBrands || pipelineBrands.length === 0 || !pipelineBrands.some(b => b.brandEng === "d'Alba")) {
    if (typeof PIPELINE_MASTER_DATA !== 'undefined' && Array.isArray(PIPELINE_MASTER_DATA)) {
      pipelineBrands = JSON.parse(JSON.stringify(PIPELINE_MASTER_DATA));
    }
  }

  // 엑셀 시트 숨김 상태(sheetState, isSheetHidden) 메타데이터 보장 및 불필요 열 필드 정리
  if (pipelineBrands && pipelineBrands.length > 0) {
    pipelineBrands.forEach((b, idx) => {
      b.no = idx + 1;
      const isVisible = EXCEL_VISIBLE_SHEETS.includes(b.country);
      b.isSheetHidden = !isVisible;
      b.sheetState = isVisible ? 'visible' : 'hidden';

      // 삭제 열(브랜드 URL, 올리브영, Insta, PIC) 제거 보장 (Supply는 엑셀에 존재하므로 유지)
      delete b.brandUrl;
      delete b.oliveyoungUrl;
      delete b.instaUrl;
      delete b.pic;
      delete b.rpMarketingUrl;
    });
    savePipelineData();
  }

  // UI 상태 갱신
  updateExcelHiddenUI();

  // 브랜드 동기화
  syncBrandsWithPipeline();
}

function savePipelineData() {
  try {
    localStorage.setItem('adeline_pipeline_master_brands_v5', JSON.stringify(pipelineBrands));
  } catch (e) {
    console.error('Failed to save pipeline brands:', e);
  }
}

// 엑셀 숨김 항목 토글 함수
function toggleExcelHidden() {
  showExcelHidden = !showExcelHidden;
  
  // 숨김 상태로 돌아갔는데 현재 선택된 국가가 숨겨진 국가라면 ALL로 리셋
  if (!showExcelHidden && EXCEL_HIDDEN_SHEETS.includes(currentCountryFilter)) {
    currentCountryFilter = 'ALL';
    document.querySelectorAll('.pipeline-tab').forEach(tab => {
      tab.classList.remove('active', 'border-indigo-600', 'text-indigo-600');
      tab.classList.add('border-transparent', 'text-slate-500');
    });
    const allTab = document.querySelector(".pipeline-tab[onclick*=\"'ALL'\"]");
    if (allTab) {
      allTab.classList.add('active', 'border-indigo-600', 'text-indigo-600');
      allTab.classList.remove('border-transparent', 'text-slate-500');
    }
  }

  updateExcelHiddenUI();

  if (currentBrandViewMode === 'spreadsheet') {
    renderPipelineSpreadsheet();
  } else {
    renderPipelineCards();
  }

  syncBrandsWithPipeline();
}

// 엑셀 숨김 속성에 따른 UI 갱신 (버튼, 뱃지, 탭 숨김/표시)
function updateExcelHiddenUI() {
  const btn = document.getElementById('btnToggleExcelHidden');
  const icon = document.getElementById('iconExcelHidden');
  const label = document.getElementById('labelExcelHidden');
  const badge = document.getElementById('badgeExcelHiddenStatus');

  if (btn && label) {
    if (showExcelHidden) {
      btn.className = 'inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-indigo-300 bg-indigo-50 text-indigo-700 shadow-2xs transition cursor-pointer hover:bg-indigo-100';
      label.innerText = '엑셀 숨김: 표시 중 (전체 43건)';
      if (icon) icon.setAttribute('data-lucide', 'eye');
    } else {
      btn.className = 'inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 shadow-2xs transition cursor-pointer hover:bg-slate-50';
      label.innerText = '엑셀 숨김: 비표시 (Southern Africa 13건)';
      if (icon) icon.setAttribute('data-lucide', 'eye-off');
    }
  }

  if (badge) {
    if (showExcelHidden) {
      badge.className = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200';
      badge.innerHTML = '📂 엑셀 숨김 시트(5개) 포함 표시 모드 (전체 43건)';
    } else {
      badge.className = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200';
      badge.innerHTML = '🔒 엑셀 숨김 시트 5개(30건) 제외 모드 (13건 표시)';
    }
  }

  // 숨겨진 시트 탭 표시 / 숨김
  document.querySelectorAll('.excel-hidden-sheet').forEach(el => {
    if (showExcelHidden) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  // 통계 및 뱃지 카운트 계산
  const visibleData = pipelineBrands.filter(b => showExcelHidden || !b.isSheetHidden);
  const totalCount = visibleData.length;
  const completedCount = visibleData.filter(b => (b.status || '').includes('완료') || (b.status || '').includes('컨펌') || (b.status || '').includes('입점')).length;
  const progressCount = totalCount - completedCount;

  const tabCountAll = document.getElementById('tabCount-ALL');
  if (tabCountAll) tabCountAll.innerText = totalCount;

  const statTotal = document.getElementById('statTotalBrands');
  if (statTotal) statTotal.innerText = totalCount;

  const statComp = document.getElementById('statCompletedBrands');
  if (statComp) statComp.innerText = completedCount;

  const statProg = document.getElementById('statProgressBrands');
  if (statProg) statProg.innerText = progressCount;

  const badgeHeader = document.getElementById('badge-brand-count');
  if (badgeHeader) badgeHeader.innerText = totalCount;

  const statDashboard = document.getElementById('stat-brands-total');
  if (statDashboard) statDashboard.innerText = totalCount;

  if (window.lucide) lucide.createIcons();
}

function syncBrandsWithPipeline() {
  if (typeof brands === 'undefined') window.brands = [];
  
  // 엑셀 숨김 항목 비표시 모드일 경우 visible 시트(Southern Africa) 데이터만 오더/견적 대상 브랜드로 동기화
  const targetBrands = showExcelHidden 
    ? pipelineBrands 
    : pipelineBrands.filter(p => !p.isSheetHidden);

  if (targetBrands && targetBrands.length > 0) {
    brands = targetBrands.map(p => ({
      id: p.id,
      brandName: p.brandKor || p.brandEng,
      brandNameEng: p.brandEng,
      companyName: `${p.brandKor || p.brandEng} 주식회사`,
      manager: p.pic || '해외영업팀',
      email: p.email ? p.email.split(',')[0].trim() : 'contact@adeline.com',
      phone: '02-1234-5678',
      businessType: `${p.category} 도소매 및 수출`,
      bankName: '기업은행',
      accountNumber: '241-098231-01-018',
      accountHolder: '아델라인글로벌',
      status: p.status && (p.status.includes('완료') || p.status.includes('체결')) ? '계약완료' : '진행중',
      supply: p.supply || '유통',
      country: p.countryName || p.country
    }));
  }
}

function setBrandViewMode(mode) {
  currentBrandViewMode = mode;
  const sheetView = document.getElementById('pipelineSpreadsheetView');
  const cardsView = document.getElementById('pipelineCardsView');
  const btnSheet = document.getElementById('btnViewSpreadsheet');
  const btnCards = document.getElementById('btnViewCards');

  if (mode === 'spreadsheet') {
    if (sheetView) sheetView.classList.remove('hidden');
    if (cardsView) cardsView.classList.add('hidden');
    if (btnSheet) {
      btnSheet.className = 'px-3 py-1.5 rounded-lg bg-white shadow-2xs text-indigo-600 flex items-center space-x-1.5 transition font-bold';
    }
    if (btnCards) {
      btnCards.className = 'px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 flex items-center space-x-1.5 transition font-normal';
    }
    renderPipelineSpreadsheet();
  } else {
    if (sheetView) sheetView.classList.add('hidden');
    if (cardsView) cardsView.classList.remove('hidden');
    if (btnCards) {
      btnCards.className = 'px-3 py-1.5 rounded-lg bg-white shadow-2xs text-indigo-600 flex items-center space-x-1.5 transition font-bold';
    }
    if (btnSheet) {
      btnSheet.className = 'px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 flex items-center space-x-1.5 transition font-normal';
    }
    renderPipelineCards();
  }
  if (window.lucide) lucide.createIcons();
}

function filterPipelineByCountry(countryKey) {
  currentCountryFilter = countryKey;

  // Update tabs active styling
  document.querySelectorAll('.pipeline-tab').forEach(tab => {
    tab.classList.remove('active', 'border-indigo-600', 'text-indigo-600');
    tab.classList.add('border-transparent', 'text-slate-500');
  });

  const btn = document.getElementById(`tabCountry_${countryKey}`);
  if (btn) {
    btn.classList.add('active', 'border-indigo-600', 'text-indigo-600');
    btn.classList.remove('border-transparent', 'text-slate-500');
  }

  if (currentBrandViewMode === 'spreadsheet') {
    renderPipelineSpreadsheet();
  } else {
    renderPipelineCards();
  }
}

function handlePipelineFilterChange() {
  const catEl = document.getElementById('pipelineCategoryFilter');
  const statEl = document.getElementById('pipelineStatusFilter');
  const searchEl = document.getElementById('pipelineSearchInput');

  if (catEl) currentCategoryFilter = catEl.value;
  if (statEl) currentStatusFilter = statEl.value;
  if (searchEl) currentSearchQuery = searchEl.value.trim().toLowerCase();

  if (currentBrandViewMode === 'spreadsheet') {
    renderPipelineSpreadsheet();
  } else {
    renderPipelineCards();
  }
}

function resetPipelineFilters() {
  currentCategoryFilter = 'ALL';
  currentStatusFilter = 'ALL';
  currentSearchQuery = '';

  const catEl = document.getElementById('pipelineCategoryFilter');
  const statEl = document.getElementById('pipelineStatusFilter');
  const searchEl = document.getElementById('pipelineSearchInput');
  if (catEl) catEl.value = 'ALL';
  if (statEl) statEl.value = 'ALL';
  if (searchEl) searchEl.value = '';

  if (currentBrandViewMode === 'spreadsheet') {
    renderPipelineSpreadsheet();
  } else {
    renderPipelineCards();
  }
}

function sortPipeline(col) {
  if (currentSortCol === col) {
    currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortCol = col;
    currentSortDir = 'asc';
  }
  if (currentBrandViewMode === 'spreadsheet') {
    renderPipelineSpreadsheet();
  } else {
    renderPipelineCards();
  }
}

function getFilteredPipelineData() {
  if (!pipelineBrands || pipelineBrands.length === 0) {
    return [];
  }

  return pipelineBrands.filter(b => {
    // 엑셀 숨김 시트 필터: showExcelHidden이 false이면 숨겨진 시트는 완전히 보이지 않음
    if (!showExcelHidden && b.isSheetHidden) {
      return false;
    }

    // Country filter
    if (currentCountryFilter !== 'ALL' && b.country !== currentCountryFilter) {
      return false;
    }
    // Category filter
    if (currentCategoryFilter !== 'ALL' && !b.category.toLowerCase().includes(currentCategoryFilter.toLowerCase())) {
      return false;
    }
    // Status filter
    if (currentStatusFilter !== 'ALL') {
      const st = (b.status || '').toLowerCase();
      if (!st.includes(currentStatusFilter.toLowerCase())) return false;
    }
    // Search query
    if (currentSearchQuery) {
      const q = currentSearchQuery;
      const kor = (b.brandKor || '').toLowerCase();
      const eng = (b.brandEng || '').toLowerCase();
      const cat = (b.category || '').toLowerCase();
      const em = (b.email || '').toLowerCase();
      const excl = (b.exclusiveCountries || '').toLowerCase();
      if (!kor.includes(q) && !eng.includes(q) && !cat.includes(q) && !em.includes(q) && !excl.includes(q)) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => {
    let valA = a[currentSortCol] || '';
    let valB = b[currentSortCol] || '';
    if (typeof valA === 'number' && typeof valB === 'number') {
      return currentSortDir === 'asc' ? valA - valB : valB - valA;
    }
    valA = valA.toString().toLowerCase();
    valB = valB.toString().toLowerCase();
    if (valA < valB) return currentSortDir === 'asc' ? -1 : 1;
    if (valA > valB) return currentSortDir === 'asc' ? 1 : -1;
    return 0;
  });
}

function renderPipelineSpreadsheet() {
  const tbody = document.getElementById('pipelineSpreadsheetBody');
  if (!tbody) return;

  const filtered = getFilteredPipelineData();
  const countEl = document.getElementById('pipelineFilteredCount');
  if (countEl) countEl.innerText = filtered.length;

  // 숨김 상태에 따른 UI 뱃지/탭 표시 제어
  updateExcelHiddenUI();

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12" class="py-12 text-center text-slate-400">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
          <p class="text-xs">조건에 해당하는 브랜드 파이프라인 데이터가 없습니다.</p>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  tbody.innerHTML = filtered.map((b, idx) => {
    // Status badge style
    let statusBg = 'bg-slate-100 text-slate-700 border-slate-200';
    const st = b.status || '';
    if (st.includes('체결 완료') || st.includes('컨펌') || st.includes('입점 확정') || st.includes('진행 완료')) {
      statusBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (st.includes('진행 중') || st.includes('컨택 중') || st.includes('제안')) {
      statusBg = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (st.includes('드랍') || st.includes('보류') || st.includes('입점불가')) {
      statusBg = 'bg-rose-50 text-rose-700 border-rose-200';
    }

    // Category badge color
    let catBg = 'bg-purple-50 text-purple-700 border-purple-200';
    if (b.category === '스킨케어' || b.category === 'Skincare') catBg = 'bg-sky-50 text-sky-700 border-sky-200';
    else if (b.category === '메이크업' || b.category === 'Make up') catBg = 'bg-pink-50 text-pink-700 border-pink-200';

    return `
      <tr class="divide-x divide-slate-100 hover:bg-indigo-50/40 transition group">
        <!-- 1. No. -->
        <td class="py-2.5 px-2 text-center font-mono text-slate-400 text-xs">${idx + 1}</td>

        <!-- 2. Business -->
        <td class="py-2.5 px-2 text-center text-xs text-slate-600 whitespace-nowrap">${b.business || '브랜드사'}</td>

        <!-- 3. Catogory -->
        <td class="py-2.5 px-2 text-center text-xs whitespace-nowrap">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${catBg}">
            ${b.category}
          </span>
        </td>

        <!-- 4. 회사/브랜드명(ENG) -->
        <td class="py-2.5 px-3 text-xs font-bold text-slate-900 truncate" title="${b.brandFullName || '-'}">
          <span class="text-indigo-950 font-black">${b.brandFullName || '-'}</span>
        </td>

        <!-- 5. Status(현황) -->
        <td class="py-2.5 px-3 text-xs">
          ${b.status ? `
            <div class="inline-block p-1.5 rounded-lg border text-[10px] font-semibold leading-relaxed ${statusBg}">
              ${b.status.replace(/\n/g, '<br>')}
            </div>
          ` : '<span class="text-slate-300">-</span>'}
        </td>

        <!-- 6. RA(해외인허가) -->
        <td class="py-2.5 px-2 text-center text-xs">
          ${b.ra ? `<span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">${b.ra}</span>` : '<span class="text-slate-300">-</span>'}
        </td>

        <!-- 7. Supply -->
        <td class="py-2.5 px-2 text-center text-xs font-medium text-slate-700 whitespace-nowrap">
          ${b.supply ? `<span class="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">${b.supply.replace(/\n/g, ' ')}</span>` : '<span class="text-slate-300">-</span>'}
        </td>

        <!-- 8. POC -->
        <td class="py-2.5 px-3 text-xs font-mono text-slate-600 text-[11px] leading-relaxed" title="${b.poc || '-'}">
          ${b.poc ? b.poc.replace(/\n/g, '<br>') : '<span class="text-slate-300">-</span>'}
        </td>

        <!-- 9. 메일링 -->
        <td class="py-2.5 px-2 text-center font-mono text-slate-500 whitespace-nowrap text-xs">${b.mailingDate || '-'}</td>

        <!-- 10. 구글 드라이브 -->
        <td class="py-2.5 px-2 text-center text-xs whitespace-nowrap">
          ${b.gdriveUrl ? `
            <a href="${b.gdriveUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200 transition" title="${b.gdriveName || '구글 드라이브'}">
              <i data-lucide="folder" class="w-3.5 h-3.5"></i>
              <span>열기</span>
            </a>
          ` : (b.gdriveName ? `<span class="text-[11px] text-slate-600">${b.gdriveName}</span>` : '<span class="text-slate-300">-</span>')}
        </td>

        <!-- 11. RP/마케팅 자료 -->
        <td class="py-2.5 px-2 text-center text-xs whitespace-nowrap">
          ${b.rpUrl ? `
            <a href="${b.rpUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 transition" title="${b.rpName || '마케팅 자료'}">
              <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
              <span>자료</span>
            </a>
          ` : (b.rpName ? `<span class="text-[11px] text-slate-600">${b.rpName}</span>` : '<span class="text-slate-300">-</span>')}
        </td>

        <!-- 12. 독점 체결 국가 -->
        <td class="py-2.5 px-3 text-xs text-slate-600 leading-relaxed text-[11px]">
          ${b.exclusiveCountries ? b.exclusiveCountries.replace(/\n/g, '<br>') : '<span class="text-slate-300">-</span>'}
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function renderPipelineCards() {
  const grid = document.getElementById('brandsListGrid');
  if (!grid) return;

  const filtered = getFilteredPipelineData();
  const countEl = document.getElementById('pipelineFilteredCount');
  if (countEl) countEl.innerText = filtered.length;

  updateExcelHiddenUI();

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-slate-400">
        <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
        <p class="text-xs">조건에 해당하는 브랜드 파이프라인 데이터가 없습니다.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  grid.innerHTML = filtered.map(b => `
    <div class="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition space-y-3">
      <div class="flex items-start justify-between">
        <div>
          <span class="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">#${b.no}</span>
          <h3 class="text-sm font-black text-slate-900 mt-1">${b.brandKor || b.brandEng}</h3>
          <p class="text-[11px] text-slate-400 font-mono">${b.category} | ${b.brandEng || ''}</p>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
          ${b.status ? b.status.split('\n')[0] : '진행중'}
        </span>
      </div>

      <div class="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
        <div class="flex justify-between">
          <span class="text-slate-400">제안 날짜</span>
          <span class="font-medium font-mono text-[11px]">${b.proposalDate || '-'}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-400">메일 (POC)</span>
          <span class="font-medium font-mono text-[11px] truncate max-w-[180px]">${b.email ? b.email.split(',')[0].trim() : '-'}</span>
        </div>
        ${b.exclusiveCountries ? `
          <div class="pt-1 text-[11px] text-amber-700 font-medium">
            <span>독점제한: </span><span>${b.exclusiveCountries.split('\n')[0]}</span>
          </div>
        ` : ''}
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-slate-100">
        <div class="flex items-center space-x-2">
          ${b.gdriveUrl ? `
            <a href="${b.gdriveUrl}" target="_blank" rel="noopener noreferrer" class="p-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700" title="구글 드라이브">
              <i data-lucide="folder" class="w-3.5 h-3.5"></i>
            </a>
          ` : ''}
        </div>
        <button onclick="editPipelineBrand('${b.id}')" class="px-2.5 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition">
          상세 관리
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function renderPipelineView() {
  if (currentBrandViewMode === 'spreadsheet') {
    renderPipelineSpreadsheet();
  } else {
    renderPipelineCards();
  }
}

function exportPipelineToExcel() {
  if (typeof XLSX === 'undefined') {
    alert('SheetJS (XLSX) 라이브러리를 로드할 수 없습니다.');
    return;
  }

  const exportData = getFilteredPipelineData();
  const dataToExport = exportData.map((b, idx) => ({
    'No': idx + 1,
    'Catogory': b.category,
    'Brand(KOR)': b.brandKor,
    'Brand(ENG)': b.brandEng,
    'Status': b.status,
    '구글드라이브 폴더': b.gdriveUrl,
    '메일(POC)': b.email,
    '제안날짜': b.proposalDate,
    '독점 체결 국가': b.exclusiveCountries,
    'RA(해외인허가)': b.cpnp
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Brand_Pipeline_2026');

  const dateStr = new Date().toISOString().slice(0, 10);
  const modeStr = showExcelHidden ? 'All_With_Hidden' : 'Visible_Only';
  XLSX.writeFile(workbook, `Brand_Partner_Pipeline_${modeStr}_${currentCountryFilter}_${dateStr}.xlsx`);
  alert(`[${dataToExport.length}개] 브랜드 파이프라인 엑셀 파일 다운로드가 시작되었습니다.`);
}

function editPipelineBrand(id) {
  const b = pipelineBrands.find(item => item.id === id);
  if (!b) return;

  openNewBrandModal();
  const titleEl = document.getElementById('brandModalTitle');
  if (titleEl) titleEl.innerText = `파이프라인 브랜드 수정 [${b.brandKor || b.brandEng}]`;
  if (document.getElementById('brandEditId')) document.getElementById('brandEditId').value = b.id;
  if (document.getElementById('brandFormName')) document.getElementById('brandFormName').value = b.brandKor || b.brandEng;
  if (document.getElementById('brandFormCompany')) document.getElementById('brandFormCompany').value = `${b.brandKor || b.brandEng} 주식회사`;
  if (document.getElementById('brandFormManager')) document.getElementById('brandFormManager').value = b.pic || '';
  if (document.getElementById('brandFormEmail')) document.getElementById('brandFormEmail').value = b.email ? b.email.split(',')[0].trim() : '';
  if (document.getElementById('brandFormAddress')) document.getElementById('brandFormAddress').value = b.exclusiveCountries || '';
}

// Global alias for compatibility
window.renderBrandList = function() {
  renderPipelineView();
};
