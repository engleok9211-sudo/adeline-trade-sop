// ==================== BRAND & PARTNER PIPELINE 2026 (SPREADSHEET & CARDS) ====================
let pipelineBrands = [];
let currentCountryFilter = 'ALL';
let currentCategoryFilter = 'ALL';
let currentStatusFilter = 'ALL';
let currentSearchQuery = '';
let currentSortCol = 'no';
let currentSortDir = 'asc';
let currentBrandViewMode = 'spreadsheet';

function initPipelineData() {
  try {
    const saved = localStorage.getItem('adeline_pipeline_master_brands');
    if (saved) {
      pipelineBrands = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load saved pipeline brands:', e);
  }

  if (!pipelineBrands || pipelineBrands.length === 0) {
    if (typeof PIPELINE_MASTER_DATA !== 'undefined' && Array.isArray(PIPELINE_MASTER_DATA)) {
      pipelineBrands = JSON.parse(JSON.stringify(PIPELINE_MASTER_DATA));
      savePipelineData();
    }
  }

  // Also ensure standard 'brands' array has items for order dropdowns
  syncBrandsWithPipeline();
}

function savePipelineData() {
  try {
    localStorage.setItem('adeline_pipeline_master_brands', JSON.stringify(pipelineBrands));
  } catch (e) {
    console.error('Failed to save pipeline brands:', e);
  }
}

function syncBrandsWithPipeline() {
  if (typeof brands === 'undefined') window.brands = [];
  if (pipelineBrands && pipelineBrands.length > 0) {
    brands = pipelineBrands.map(p => ({
      id: p.id,
      brandName: p.brandKor || p.brandEng,
      brandNameEng: p.brandEng,
      companyName: `${p.brandKor || p.brandEng} 주식회사`,
      manager: p.pic || '담당자',
      email: p.email ? p.email.split(',')[0].trim() : 'contact@adeline.com',
      phone: '02-1234-5678',
      businessType: `${p.category} 도소매 및 무역`,
      bankName: '신한은행',
      accountNumber: '140-014-561058',
      accountHolder: '아델라인그룹(주)',
      status: p.status && p.status.includes('완료') ? '계약완료' : '검토중',
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

function clearPipelineFilters() {
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
      const pic = (b.pic || '').toLowerCase();
      const em = (b.email || '').toLowerCase();
      const excl = (b.exclusiveCountries || '').toLowerCase();
      if (!kor.includes(q) && !eng.includes(q) && !cat.includes(q) && !pic.includes(q) && !em.includes(q) && !excl.includes(q)) {
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
  const countEl = document.getElementById('pipelineFilterCount');
  const totalEl = document.getElementById('pipelineTotalCount');
  if (countEl) countEl.innerText = filtered.length;
  if (totalEl) totalEl.innerText = pipelineBrands.length;

  // Update country tab badges
  const countryCounts = {
    ALL: pipelineBrands.length,
    'Southern Africa': 0,
    kindlife: 0,
    China: 0,
    Italy: 0,
    Japan: 0,
    Finland: 0
  };
  pipelineBrands.forEach(b => {
    if (countryCounts[b.country] !== undefined) {
      countryCounts[b.country]++;
    }
  });
  Object.keys(countryCounts).forEach(k => {
    const badge = document.getElementById(`badgeCount_${k}`);
    if (badge) badge.innerText = countryCounts[k];
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="15" class="py-12 text-center text-slate-400">
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
    if (b.category === '스킨케어') catBg = 'bg-sky-50 text-sky-700 border-sky-200';
    else if (b.category === '메이크업') catBg = 'bg-pink-50 text-pink-700 border-pink-200';
    else if (b.category === '헤어케어') catBg = 'bg-amber-50 text-amber-700 border-amber-200';

    return `
      <tr class="hover:bg-indigo-50/40 transition group">
        <td class="py-2.5 px-3 text-center font-mono text-slate-400 text-xs">${idx + 1}</td>
        
        <!-- Country -->
        <td class="py-2.5 px-3 text-xs whitespace-nowrap">
          <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
            <span class="mr-1">${b.countryFlag || '🌐'}</span>
            <span>${b.countryName || b.country}</span>
          </span>
        </td>

        <!-- Category -->
        <td class="py-2.5 px-3 text-xs whitespace-nowrap">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold border ${catBg}">
            ${b.category}
          </span>
        </td>

        <!-- Brand (KOR) -->
        <td class="py-2.5 px-3 font-black text-slate-900 whitespace-nowrap text-xs">${b.brandKor || '-'}</td>

        <!-- Brand (ENG) -->
        <td class="py-2.5 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap text-xs">${b.brandEng || '-'}</td>

        <!-- Status -->
        <td class="py-2.5 px-3 text-xs">
          <div class="inline-block p-1.5 rounded-lg border text-[10px] font-semibold leading-relaxed ${statusBg}">
            ${(b.status || '-').replace(/\n/g, '<br>')}
          </div>
        </td>

        <!-- Supply Type -->
        <td class="py-2.5 px-3 text-center text-xs whitespace-nowrap">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
            ${b.supply || '유통'}
          </span>
        </td>

        <!-- Brand URL -->
        <td class="py-2.5 px-3 text-center text-xs">
          ${b.brandUrl ? `
            <a href="${b.brandUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex p-1 rounded hover:bg-slate-200 text-indigo-600 transition" title="브랜드 공식몰 바로가기">
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
            </a>
          ` : '<span class="text-slate-300">-</span>'}
        </td>

        <!-- Oliveyoung URL -->
        <td class="py-2.5 px-3 text-center text-xs">
          ${b.oliveyoungUrl ? `
            <a href="${b.oliveyoungUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex p-1 rounded hover:bg-emerald-100 text-emerald-600 transition" title="올리브영 브랜드관 바로가기">
              <i data-lucide="shopping-bag" class="w-3.5 h-3.5"></i>
            </a>
          ` : '<span class="text-slate-300">-</span>'}
        </td>

        <!-- Insta URL -->
        <td class="py-2.5 px-3 text-center text-xs">
          ${b.instaUrl ? `
            <a href="${b.instaUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex p-1 rounded hover:bg-pink-100 text-pink-600 transition" title="공식 인스타그램 바로가기">
              <i data-lucide="instagram" class="w-3.5 h-3.5"></i>
            </a>
          ` : '<span class="text-slate-300">-</span>'}
        </td>

        <!-- GDrive URL -->
        <td class="py-2.5 px-3 text-center text-xs">
          ${b.gdriveUrl ? `
            <a href="${b.gdriveUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200 transition" title="구글 드라이브 폴더 열기">
              <i data-lucide="folder-open" class="w-3 h-3"></i>
              <span>드라이브</span>
            </a>
          ` : '<span class="text-slate-300">-</span>'}
        </td>

        <!-- PIC / Contact -->
        <td class="py-2.5 px-3 font-medium text-slate-700 truncate max-w-[140px] text-xs" title="${b.pic}">${b.pic || '-'}</td>

        <!-- Email -->
        <td class="py-2.5 px-3 font-mono text-[10px] text-slate-600 text-xs">
          ${b.email ? `
            <a href="mailto:${b.email.split(',')[0].trim()}" class="hover:text-indigo-600 underline flex items-center space-x-1" title="${b.email}">
              <i data-lucide="mail" class="w-3 h-3 text-slate-400"></i>
              <span class="truncate max-w-[150px]">${b.email}</span>
            </a>
          ` : '-'}
        </td>

        <!-- Proposal Date -->
        <td class="py-2.5 px-3 font-mono text-[10px] text-slate-500 whitespace-nowrap text-xs">${b.proposalDate || '-'}</td>

        <!-- Exclusive / Channel Restrictions -->
        <td class="py-2.5 px-3 text-xs">
          <div class="line-clamp-2 hover:line-clamp-none transition cursor-default text-[11px] text-slate-600 leading-snug" title="${b.exclusiveCountries}">
            ${(b.exclusiveCountries || '-').replace(/\n/g, ' / ')}
          </div>
        </td>

        <!-- Action Edit -->
        <td class="py-2.5 px-2.5 text-center text-xs">
          <button onclick="editPipelineBrand('${b.id}')" class="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition" title="상세 수정">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
          </button>
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
          <div class="flex items-center space-x-1.5">
            <span class="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">#${b.no}</span>
            <span class="text-[10px] font-bold text-slate-500">${b.countryFlag || '🌐'} ${b.countryName || b.country}</span>
          </div>
          <h3 class="text-sm font-black text-slate-900 mt-1">${b.brandKor || b.brandEng}</h3>
          <p class="text-[11px] text-slate-400 font-mono">${b.category} | ${b.brandEng || ''}</p>
        </div>
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
          ${b.status ? b.status.split('\n')[0] : '진행중'}
        </span>
      </div>

      <div class="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-600">
        <div class="flex items-center space-x-2">
          <i data-lucide="user" class="w-3 h-3 text-slate-400"></i>
          <span class="truncate font-medium">${b.pic || '담당자 미등록'}</span>
        </div>
        <div class="flex items-center space-x-2">
          <i data-lucide="mail" class="w-3 h-3 text-slate-400"></i>
          <span class="truncate font-mono text-[11px]">${b.email || '-'}</span>
        </div>
        ${b.exclusiveCountries ? `
        <div class="text-[11px] text-slate-500 bg-slate-50 p-2 rounded">
          <span class="font-bold text-slate-700">독점/제한: </span>
          <span class="line-clamp-2">${b.exclusiveCountries}</span>
        </div>` : ''}
      </div>

      <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div class="flex items-center space-x-2">
          ${b.brandUrl ? `<a href="${b.brandUrl}" target="_blank" class="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold">공식몰</a>` : ''}
          ${b.oliveyoungUrl ? `<a href="${b.oliveyoungUrl}" target="_blank" class="text-emerald-600 hover:text-emerald-800 text-[11px] font-bold">올리브영</a>` : ''}
          ${b.instaUrl ? `<a href="${b.instaUrl}" target="_blank" class="text-pink-600 hover:text-pink-800 text-[11px] font-bold">인스타</a>` : ''}
          ${b.gdriveUrl ? `<a href="${b.gdriveUrl}" target="_blank" class="text-amber-600 hover:text-amber-800 text-[11px] font-bold">드라이브</a>` : ''}
        </div>
        <button onclick="editPipelineBrand('${b.id}')" class="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded transition">
          수정
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

  const dataToExport = getFilteredPipelineData().map((b, idx) => ({
    'No': idx + 1,
    '국가': b.countryName || b.country,
    'Catogory': b.category,
    'Brand(KOR)': b.brandKor,
    'Brand(ENG)': b.brandEng,
    'Status': b.status,
    '공급방식': b.supply,
    '브랜드 URL': b.brandUrl,
    '올리브영 URL': b.oliveyoungUrl,
    '인스타그램 URL': b.instaUrl,
    '구글드라이브 폴더': b.gdriveUrl,
    'PIC/담당자': b.pic,
    '메일(POC)': b.email,
    '제안날짜': b.proposalDate,
    '독점 체결 국가': b.exclusiveCountries,
    'RA(해외인허가)': b.cpnp
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Brand_Pipeline_2026');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Brand_Partner_Pipeline_Export_${currentCountryFilter}_${dateStr}.xlsx`);
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
