// ==================== BUYER DEVELOPMENT & SPREADSHEET ENGINE ====================
let buyersData = [];
let currentBuyerSheet = 'ALL';
let currentBuyerCountry = 'ALL';
let currentBuyerStatus = 'ALL';
let currentBuyerSize = 'ALL';
let currentBuyerQuery = '';
let currentBuyerSortCol = 'no';
let currentBuyerSortDir = 'asc';
let buyerCurrentPage = 1;
let buyerPageSize = 100;
let selectedBuyerIds = new Set();

let importedBuyerWorkbook = null;
let candidateImportBuyers = [];

function initBuyerData() {
  try {
    const saved = localStorage.getItem('adeline_buyers_master_db');
    if (saved) {
      buyersData = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load saved buyers:', e);
  }

  if (!buyersData || buyersData.length === 0) {
    if (typeof BUYER_MASTER_DATA !== 'undefined' && Array.isArray(BUYER_MASTER_DATA)) {
      buyersData = JSON.parse(JSON.stringify(BUYER_MASTER_DATA));
      saveBuyerData();
    }
  }

  updateBuyerKPICards();
  populateBuyerCountryDropdown();
  updateBuyerSheetTabs();
  renderBuyerSpreadsheet();
}

function saveBuyerData() {
  try {
    localStorage.setItem('adeline_buyers_master_db', JSON.stringify(buyersData));
  } catch (e) {
    console.error('Failed to save buyers data:', e);
  }
}

function updateBuyerKPICards() {
  if (!buyersData) return;
  const total = buyersData.length;
  let active = 0;
  let interested = 0;
  const countries = new Set();

  buyersData.forEach(b => {
    const st = (b.status || '').toLowerCase();
    const est = (b.emailStatus || '').toLowerCase();
    if (st.includes('buyer') || st.includes('active') || est.includes('active')) {
      active++;
    } else if (st.includes('interested') || st.includes('potential') || est.includes('responded')) {
      interested++;
    }
    const c = b.countryKor || b.countryEng;
    if (c) countries.add(c.trim());
  });

  const elTot = document.getElementById('kpiBuyerTotal');
  const elAct = document.getElementById('kpiBuyerActive');
  const elInt = document.getElementById('kpiBuyerInterested');
  const elCnt = document.getElementById('kpiBuyerCountries');
  const elBadge = document.getElementById('badge-buyer-count');

  if (elTot) elTot.innerText = total.toLocaleString();
  if (elAct) elAct.innerText = active.toLocaleString();
  if (elInt) elInt.innerText = interested.toLocaleString();
  if (elCnt) elCnt.innerText = `${countries.size}+개국`;
  if (elBadge) elBadge.innerText = total.toLocaleString();
}

function populateBuyerCountryDropdown() {
  const sel = document.getElementById('buyerCountryFilter');
  if (!sel || !buyersData) return;

  const countryCounts = {};
  buyersData.forEach(b => {
    const c = b.countryKor || b.countryEng || '기타';
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  });

  const sortedCountries = Object.keys(countryCounts).sort((a, b) => countryCounts[b] - countryCounts[a]);

  let html = '<option value="ALL">전체 국가 (All)</option>';
  sortedCountries.forEach(c => {
    html += `<option value="${c}">${c} (${countryCounts[c]})</option>`;
  });
  sel.innerHTML = html;
  sel.value = currentBuyerCountry;
}

function updateBuyerSheetTabs() {
  const container = document.getElementById('buyerSheetTabs');
  if (!container || !buyersData) return;

  const sheetCounts = { ALL: buyersData.length };
  buyersData.forEach(b => {
    const s = b.sheet || 'Master DB';
    sheetCounts[s] = (sheetCounts[s] || 0) + 1;
  });

  // Standard sheet priority list
  const priority = ['ALL', 'Master DB', 'Dasique', 'Rovectin', 'Tfit', 'Fair 2025'];
  Object.keys(sheetCounts).forEach(s => {
    if (!priority.includes(s)) priority.push(s);
  });

  container.innerHTML = priority.filter(s => sheetCounts[s] !== undefined).map(s => {
    const isActive = currentBuyerSheet === s;
    const activeClass = isActive ? 'active border-emerald-600 text-emerald-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800 font-bold';
    let iconName = 'layers';
    if (s === 'Master DB') iconName = 'database';
    else if (s === 'Dasique') iconName = 'sparkles';
    else if (s === 'Rovectin') iconName = 'shield-check';
    else if (s === 'Tfit') iconName = 'zap';
    else if (s === 'Fair 2025') iconName = 'award';
    else if (s !== 'ALL') iconName = 'folder';

    return `
      <button type="button" onclick="filterBuyerBySheet('${s}')" id="tabBuyerSheet_${s}" class="buyer-sheet-tab px-3.5 py-2 text-xs border-b-2 flex items-center space-x-1.5 transition shrink-0 ${activeClass}">
        <i data-lucide="${iconName}" class="w-3.5 h-3.5"></i>
        <span>${s === 'ALL' ? '전체 통합 (ALL)' : s}</span>
        <span class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'} font-mono">${sheetCounts[s]}</span>
      </button>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function filterBuyerBySheet(sheetKey) {
  currentBuyerSheet = sheetKey;
  buyerCurrentPage = 1;

  document.querySelectorAll('.buyer-sheet-tab').forEach(tab => {
    tab.classList.remove('active', 'border-emerald-600', 'text-emerald-600', 'font-black');
    tab.classList.add('border-transparent', 'text-slate-500', 'font-bold');
  });

  const btn = document.getElementById(`tabBuyerSheet_${sheetKey}`);
  if (btn) {
    btn.classList.add('active', 'border-emerald-600', 'text-emerald-600', 'font-black');
    btn.classList.remove('border-transparent', 'text-slate-500');
  }

  renderBuyerSpreadsheet();
}

function handleBuyerFilterChange() {
  const cSel = document.getElementById('buyerCountryFilter');
  const sSel = document.getElementById('buyerStatusFilter');
  const zSel = document.getElementById('buyerSizeFilter');
  const qInput = document.getElementById('buyerSearchInput');

  if (cSel) currentBuyerCountry = cSel.value;
  if (sSel) currentBuyerStatus = sSel.value;
  if (zSel) currentBuyerSize = zSel.value;
  if (qInput) currentBuyerQuery = qInput.value.trim().toLowerCase();

  buyerCurrentPage = 1;
  renderBuyerSpreadsheet();
}

function clearBuyerFilters() {
  currentBuyerCountry = 'ALL';
  currentBuyerStatus = 'ALL';
  currentBuyerSize = 'ALL';
  currentBuyerQuery = '';

  const cSel = document.getElementById('buyerCountryFilter');
  const sSel = document.getElementById('buyerStatusFilter');
  const zSel = document.getElementById('buyerSizeFilter');
  const qInput = document.getElementById('buyerSearchInput');

  if (cSel) cSel.value = 'ALL';
  if (sSel) sSel.value = 'ALL';
  if (zSel) zSel.value = 'ALL';
  if (qInput) qInput.value = '';

  buyerCurrentPage = 1;
  renderBuyerSpreadsheet();
}

function sortBuyer(col) {
  if (currentBuyerSortCol === col) {
    currentBuyerSortDir = currentBuyerSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    currentBuyerSortCol = col;
    currentBuyerSortDir = 'asc';
  }
  renderBuyerSpreadsheet();
}

function setBuyerPageSize(size) {
  buyerPageSize = size === 'ALL' ? 999999 : parseInt(size, 10);
  buyerCurrentPage = 1;
  renderBuyerSpreadsheet();
}

function changeBuyerPage(delta) {
  buyerCurrentPage += delta;
  renderBuyerSpreadsheet();
}

function getFilteredBuyersData() {
  if (!buyersData || buyersData.length === 0) return [];

  return buyersData.filter(b => {
    // Sheet filter
    if (currentBuyerSheet !== 'ALL' && b.sheet !== currentBuyerSheet) {
      return false;
    }
    // Country filter
    if (currentBuyerCountry !== 'ALL') {
      const c = b.countryKor || b.countryEng || '';
      if (c !== currentBuyerCountry) return false;
    }
    // Status filter
    if (currentBuyerStatus !== 'ALL') {
      const st = (b.status || '').toLowerCase();
      const est = (b.emailStatus || '').toLowerCase();
      const target = currentBuyerStatus.toLowerCase();
      if (!st.includes(target) && !est.includes(target)) return false;
    }
    // Company Size filter
    if (currentBuyerSize !== 'ALL') {
      if ((b.companySize || '').toLowerCase() !== currentBuyerSize.toLowerCase()) return false;
    }
    // Search query
    if (currentBuyerQuery) {
      const q = currentBuyerQuery;
      const comp = (b.company || '').toLowerCase();
      const cKor = (b.countryKor || '').toLowerCase();
      const cEng = (b.countryEng || '').toLowerCase();
      const pic = (b.pic || '').toLowerCase();
      const email = (b.email || '').toLowerCase();
      const info = (b.info || '').toLowerCase();
      const brands = (b.targetBrands || '').toLowerCase();
      if (!comp.includes(q) && !cKor.includes(q) && !cEng.includes(q) && !pic.includes(q) && !email.includes(q) && !info.includes(q) && !brands.includes(q)) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => {
    // Newly added rows float to the top
    if (a._isNew && !b._isNew) return -1;
    if (!a._isNew && b._isNew) return 1;
    if (a._isNew && b._isNew) {
      return (b.createdAt || 0) - (a.createdAt || 0);
    }

    let valA = a[currentBuyerSortCol] || '';
    let valB = b[currentBuyerSortCol] || '';
    if (currentBuyerSortCol === 'no') {
      const numA = parseInt((a.id || '').replace(/\D/g, '') || '0', 10);
      const numB = parseInt((b.id || '').replace(/\D/g, '') || '0', 10);
      return currentBuyerSortDir === 'asc' ? numA - numB : numB - numA;
    }
    valA = valA.toString().toLowerCase();
    valB = valB.toString().toLowerCase();
    if (valA < valB) return currentBuyerSortDir === 'asc' ? -1 : 1;
    if (valA > valB) return currentBuyerSortDir === 'asc' ? 1 : -1;
    return 0;
  });
}

function renderBuyerSpreadsheet() {
  const tbody = document.getElementById('buyerSpreadsheetBody');
  if (!tbody) return;

  const filtered = getFilteredBuyersData();
  const totalCount = buyersData.length;
  const filteredCount = filtered.length;

  const countEl = document.getElementById('buyerFilteredCount');
  const totalEl = document.getElementById('buyerTotalCount');
  if (countEl) countEl.innerText = filteredCount.toLocaleString();
  if (totalEl) totalEl.innerText = totalCount.toLocaleString();

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredCount / buyerPageSize));
  if (buyerCurrentPage > totalPages) buyerCurrentPage = totalPages;
  if (buyerCurrentPage < 1) buyerCurrentPage = 1;

  const startIdx = (buyerCurrentPage - 1) * buyerPageSize;
  const endIdx = Math.min(startIdx + buyerPageSize, filteredCount);
  const pageItems = filtered.slice(startIdx, endIdx);

  // Update pagination DOM
  const curPageEl = document.getElementById('buyerCurrentPage');
  const totPageEl = document.getElementById('buyerTotalPages');
  const itemsCountEl = document.getElementById('buyerPageItemsCount');
  const prevBtn = document.getElementById('btnBuyerPrevPage');
  const nextBtn = document.getElementById('btnBuyerNextPage');

  if (curPageEl) curPageEl.innerText = buyerCurrentPage;
  if (totPageEl) totPageEl.innerText = totalPages;
  if (itemsCountEl) itemsCountEl.innerText = `${startIdx + 1 > filteredCount ? 0 : startIdx + 1} - ${endIdx}`;
  if (prevBtn) prevBtn.disabled = buyerCurrentPage <= 1;
  if (nextBtn) nextBtn.disabled = buyerCurrentPage >= totalPages;

  if (filteredCount === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="14" class="py-12 text-center text-slate-400">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
          <p class="text-xs">조건에 부합하는 바이어 데이터가 없습니다.</p>
        </td>
      </tr>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  tbody.innerHTML = pageItems.map((b, idx) => {
    const globalIdx = startIdx + idx + 1;
    const isChecked = selectedBuyerIds.has(b.id);

    // Status styling
    let statusClass = 'bg-slate-100 text-slate-700 border-slate-200';
    const st = (b.status || '').toLowerCase();
    if (st.includes('buyer') || st.includes('확정') || st.includes('active')) {
      statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-black';
    } else if (st.includes('interested') || st.includes('관심')) {
      statusClass = 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
    } else if (st.includes('potential') || st.includes('검토')) {
      statusClass = 'bg-purple-50 text-purple-700 border-purple-200 font-medium';
    } else if (st.includes('on hold') || st.includes('보류')) {
      statusClass = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (st.includes('lost')) {
      statusClass = 'bg-rose-50 text-rose-700 border-rose-200';
    }

    return `
      <tr id="buyer_row_${b.id}" class="hover:bg-emerald-50/30 transition group border-b border-slate-200">
        <!-- Checkbox -->
        <td class="py-2 px-2.5 text-center border-r border-slate-200">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleBuyerCheckbox('${b.id}', this.checked)" class="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer">
        </td>

        <!-- No -->
        <td class="py-2 px-2 text-center font-mono text-slate-400 text-xs border-r border-slate-200 select-none whitespace-nowrap">
          <span>${globalIdx}</span>
          ${b._isNew ? '<span class="ml-1 px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500 text-white font-mono animate-pulse">NEW</span>' : ''}
        </td>

        <!-- Sheet Badge -->
        <td class="py-2 px-2.5 text-xs whitespace-nowrap border-r border-slate-200">
          <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
            ${b.sheet || 'Master'}
          </span>
        </td>

        <!-- Country (Inline Editable) -->
        <td ondblclick="makeBuyerCellEditable(this, '${b.id}', 'countryKor')" class="py-2 px-3 text-xs whitespace-nowrap border-r border-slate-200 cursor-text hover:bg-yellow-50/60 transition" title="더블클릭하여 수정">
          <span class="font-bold text-slate-800">${b.countryKor || b.countryEng || '-'}</span>
          ${b.countryEng && b.countryEng !== b.countryKor ? `<span class="text-[10px] text-slate-400 block font-mono">${b.countryEng}</span>` : ''}
        </td>

        <!-- Company (Inline Editable) -->
        <td ondblclick="makeBuyerCellEditable(this, '${b.id}', 'company')" class="py-2 px-3 font-black text-slate-900 text-xs border-r border-slate-200 cursor-text hover:bg-yellow-50/60 transition" title="더블클릭하여 수정">
          <span class="text-indigo-950">${b.company || '-'}</span>
        </td>

        <!-- PIC (Inline Editable) -->
        <td ondblclick="makeBuyerCellEditable(this, '${b.id}', 'pic')" class="py-2 px-3 font-medium text-slate-700 text-xs border-r border-slate-200 cursor-text hover:bg-yellow-50/60 transition" title="더블클릭하여 수정">
          ${b.pic || '-'}
        </td>

        <!-- Email (Inline Editable + Clickable Mailto) -->
        <td ondblclick="makeBuyerCellEditable(this, '${b.id}', 'email')" class="py-2 px-3 font-mono text-[11px] border-r border-slate-200 cursor-text hover:bg-yellow-50/60 transition max-w-[220px]" title="더블클릭하여 수정">
          ${b.email ? `
            <a href="mailto:${b.email.split(',')[0].trim()}" class="text-blue-600 hover:text-blue-800 underline flex items-center space-x-1" onclick="event.stopPropagation()">
              <i data-lucide="mail" class="w-3 h-3 shrink-0 text-slate-400"></i>
              <span class="truncate">${b.email}</span>
            </a>
          ` : '<span class="text-slate-300">-</span>'}
        </td>

        <!-- Status (Inline Editable Select) -->
        <td ondblclick="makeBuyerCellEditable(this, '${b.id}', 'status', 'select-status')" class="py-2 px-2.5 text-center text-xs border-r border-slate-200 cursor-pointer hover:bg-yellow-50/60 transition" title="더블클릭하여 상태 변경">
          <span class="inline-block px-2 py-0.5 rounded-full text-[10px] border ${statusClass}">
            ${b.status || 'Potential'}
          </span>
        </td>

        <!-- Business Profile (Inline Editable) -->
        <td ondblclick="makeBuyerCellEditable(this, '${b.id}', 'bizProfile')" class="py-2 px-3 text-xs text-slate-600 border-r border-slate-200 cursor-text hover:bg-yellow-50/60 transition" title="더블클릭하여 수정">
          ${b.bizProfile || '-'}
        </td>

        <!-- Company Size (Inline Editable Select) -->
        <td ondblclick="makeBuyerCellEditable(this, '${b.id}', 'companySize', 'select-size')" class="py-2 px-2 text-center font-bold text-xs border-r border-slate-200 cursor-pointer hover:bg-yellow-50/60 transition" title="더블클릭하여 수정">
          <span class="text-[11px] ${b.companySize === 'Big' ? 'text-purple-700 font-black' : b.companySize === 'Mid' ? 'text-blue-700' : 'text-slate-500'}">
            ${b.companySize || 'Mid'}
          </span>
        </td>

        <!-- Target Brands (Inline Editable) -->
        <td ondblclick="makeBuyerCellEditable(this, '${b.id}', 'targetBrands')" class="py-2 px-3 text-xs font-semibold text-slate-800 border-r border-slate-200 cursor-text hover:bg-yellow-50/60 transition" title="더블클릭하여 수정">
          ${b.targetBrands || '-'}
        </td>

        <!-- Web link -->
        <td class="py-2 px-2 text-center text-xs border-r border-slate-200">
          ${b.website ? `
            <a href="${b.website.startsWith('http') ? b.website : 'https://' + b.website}" target="_blank" rel="noopener noreferrer" class="p-1 rounded inline-flex text-indigo-600 hover:bg-indigo-50" title="바이어사 웹사이트 방문">
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
            </a>
          ` : '<span class="text-slate-300">-</span>'}
        </td>

        <!-- Company Info & Notes (Inline Editable) -->
        <td ondblclick="makeBuyerCellEditable(this, '${b.id}', 'info', 'textarea')" class="py-2 px-3 text-xs text-slate-600 border-r border-slate-200 cursor-text hover:bg-yellow-50/60 transition min-w-[240px]" title="더블클릭하여 미팅 노트 수정">
          <div class="line-clamp-2 hover:line-clamp-none transition text-[11px] leading-snug">
            ${(b.info || '-').replace(/\n/g, ' ')}
          </div>
        </td>

        <!-- Action Delete -->
        <td class="py-2 px-2 text-center text-xs">
          <button type="button" onclick="deleteBuyer('${b.id}')" class="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition" title="바이어 삭제">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function makeBuyerCellEditable(tdElement, buyerId, field, inputType = 'text') {
  if (tdElement.querySelector('input') || tdElement.querySelector('select') || tdElement.querySelector('textarea')) {
    return; // Already in edit mode
  }

  const b = buyersData.find(item => item.id === buyerId);
  if (!b) return;

  const currentVal = b[field] || '';
  const originalHTML = tdElement.innerHTML;

  let inputEl;

  if (inputType === 'select-status') {
    const statuses = ['Buyer', 'Potential', 'Interested', 'Pending', 'On Hold', 'Active', 'Lost'];
    inputEl = document.createElement('select');
    inputEl.className = 'w-full text-xs font-bold p-1 border-2 border-emerald-500 rounded bg-white shadow-sm focus:outline-none';
    statuses.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.innerText = s;
      if (s.toLowerCase() === currentVal.toLowerCase()) opt.selected = true;
      inputEl.appendChild(opt);
    });
  } else if (inputType === 'select-size') {
    const sizes = ['Big', 'Mid', 'Small'];
    inputEl = document.createElement('select');
    inputEl.className = 'w-full text-xs font-bold p-1 border-2 border-emerald-500 rounded bg-white shadow-sm focus:outline-none';
    sizes.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.innerText = s;
      if (s.toLowerCase() === currentVal.toLowerCase()) opt.selected = true;
      inputEl.appendChild(opt);
    });
  } else if (inputType === 'textarea') {
    inputEl = document.createElement('textarea');
    inputEl.rows = 2;
    inputEl.value = currentVal;
    inputEl.className = 'w-full text-xs p-1 border-2 border-emerald-500 rounded bg-white shadow-sm focus:outline-none';
  } else {
    inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.value = currentVal;
    inputEl.className = 'w-full text-xs p-1 border-2 border-emerald-500 rounded bg-white shadow-sm focus:outline-none font-medium';
  }

  tdElement.innerHTML = '';
  tdElement.appendChild(inputEl);
  inputEl.focus();
  if (inputEl.select) inputEl.select();

  const commitEdit = () => {
    const newVal = inputEl.value.trim();
    b[field] = newVal;
    saveBuyerData();

    // Flash feedback
    tdElement.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-50');
    setTimeout(() => {
      tdElement.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-50');
    }, 1200);

    renderBuyerSpreadsheet();
    updateBuyerKPICards();
  };

  const cancelEdit = () => {
    tdElement.innerHTML = originalHTML;
    if (window.lucide) lucide.createIcons();
  };

  inputEl.addEventListener('blur', commitEdit);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && inputType !== 'textarea') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  });
}

function addNewBuyerRow() {
  const nextNum = buyersData.length + 1;
  const newId = `BYR-${String(nextNum).padStart(4, '0')}`;
  const targetSheet = currentBuyerSheet === 'ALL' ? 'Master DB' : currentBuyerSheet;

  const newBuyer = {
    id: newId,
    sheet: targetSheet,
    company: '신규 바이어사',
    countryEng: '',
    countryKor: '글로벌/한국',
    pic: '바이어 담당자',
    email: '',
    website: '',
    info: '신규 바이어 발굴 등록',
    emailStatus: 'Pending',
    status: 'Potential',
    bizProfile: 'Wholesaler/Retailer',
    companySize: 'Mid',
    adelinePic: '해외영업팀',
    targetBrands: 'K-Beauty'
  };

  buyersData.unshift(newBuyer);
  saveBuyerData();
  updateBuyerKPICards();
  populateBuyerCountryDropdown();
  updateBuyerSheetTabs();

  buyerCurrentPage = 1;
  renderBuyerSpreadsheet();

  const firstRow = document.getElementById(`buyer_row_${newId}`);
  if (firstRow) {
    firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const compCell = firstRow.querySelectorAll('td')[4];
    if (compCell) makeBuyerCellEditable(compCell, newId, 'company');
  }
}

function deleteBuyer(id) {
  const b = buyersData.find(item => item.id === id);
  const name = b ? b.company : '해당 바이어';
  if (!confirm(`[${name}] 바이어를 삭제하시겠습니까?`)) return;

  buyersData = buyersData.filter(item => item.id !== id);
  selectedBuyerIds.delete(id);
  saveBuyerData();
  updateBuyerKPICards();
  populateBuyerCountryDropdown();
  updateBuyerSheetTabs();
  renderBuyerSpreadsheet();
}

function toggleBuyerCheckbox(id, isChecked) {
  if (isChecked) {
    selectedBuyerIds.add(id);
  } else {
    selectedBuyerIds.delete(id);
  }
}

function toggleAllBuyerCheckboxes(masterCheckbox) {
  const isChecked = masterCheckbox.checked;
  const filtered = getFilteredBuyersData();
  filtered.forEach(b => {
    if (isChecked) selectedBuyerIds.add(b.id);
    else selectedBuyerIds.delete(b.id);
  });
  renderBuyerSpreadsheet();
}

function deleteSelectedBuyers() {
  if (selectedBuyerIds.size === 0) {
    alert('삭제할 바이어를 체크박스로 선택해 주세요.');
    return;
  }
  if (!confirm(`선택한 [${selectedBuyerIds.size}개] 바이어를 일괄 삭제하시겠습니까?`)) return;

  buyersData = buyersData.filter(item => !selectedBuyerIds.has(item.id));
  selectedBuyerIds.clear();
  const chkAll = document.getElementById('chkBuyerSelectAll');
  if (chkAll) chkAll.checked = false;

  saveBuyerData();
  updateBuyerKPICards();
  populateBuyerCountryDropdown();
  updateBuyerSheetTabs();
  renderBuyerSpreadsheet();
}

function exportBuyersToExcel() {
  if (typeof XLSX === 'undefined') {
    alert('SheetJS (XLSX) 라이브러리를 로드할 수 없습니다.');
    return;
  }

  const filtered = getFilteredBuyersData();
  const dataToExport = filtered.map((b, idx) => ({
    'No': idx + 1,
    '시트구분': b.sheet,
    '국가(한글)': b.countryKor,
    '국가(영문)': b.countryEng,
    '바이어사명': b.company,
    '담당자(PIC)': b.pic,
    '이메일': b.email,
    '상태(Status)': b.status,
    '이메일상태': b.emailStatus,
    '업태(Profile)': b.bizProfile,
    '기업규모': b.companySize,
    '관심브랜드': b.targetBrands,
    '웹사이트': b.website,
    '기업정보/미팅노트': b.info,
    '아델라인담당자': b.adelinePic
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Buyers_Export');

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Buyer_Development_Export_${currentBuyerSheet}_${dateStr}.xlsx`);
  alert(`[${dataToExport.length}개] 바이어 목록 엑셀 파일 다운로드가 시작되었습니다.`);
}

// ==================== EXCEL BATCH IMPORT MODAL ENGINE ====================
function openBuyerImportModal() {
  const modal = document.getElementById('buyerImportModal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }
  const fileInput = document.getElementById('buyerExcelFileInput');
  if (fileInput) fileInput.value = '';
  const previewBox = document.getElementById('buyerImportPreviewContainer');
  if (previewBox) previewBox.classList.add('hidden');
  const btnBatch = document.getElementById('btnExecuteBatchInsert');
  if (btnBatch) btnBatch.disabled = true;

  if (window.lucide) lucide.createIcons();
}

function closeBuyerImportModal() {
  const modal = document.getElementById('buyerImportModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
}

function handleBuyerExcelUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    alert('SheetJS (XLSX) 라이브러리가 로드되지 않았습니다.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      importedBuyerWorkbook = XLSX.read(data, { type: 'array' });

      document.getElementById('buyerImportFileName').innerText = file.name;
      const sheetSelect = document.getElementById('buyerImportSheetSelect');
      sheetSelect.innerHTML = importedBuyerWorkbook.SheetNames.map(s => `
        <option value="${s}">${s}</option>
      `).join('');

      document.getElementById('buyerImportPreviewContainer').classList.remove('hidden');
      onBuyerImportSheetChange();
    } catch (err) {
      alert('엑셀 파일 파싱 중 오류가 발생했습니다: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function onBuyerImportSheetChange() {
  if (!importedBuyerWorkbook) return;
  const sheetSelect = document.getElementById('buyerImportSheetSelect');
  const sheetName = sheetSelect.value;
  const worksheet = importedBuyerWorkbook.Sheets[sheetName];
  if (!worksheet) return;

  document.getElementById('buyerImportCustomSheetName').value = sheetName;

  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  candidateImportBuyers = [];
  let invalidCount = 0;

  // Detect header row index
  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(10, rawRows.length); r++) {
    const row = rawRows[r] || [];
    const rowStr = row.map(v => String(v).toLowerCase()).join(' ');
    if (rowStr.includes('company') || rowStr.includes('바이어') || rowStr.includes('국가') || rowStr.includes('country')) {
      headerRowIdx = r;
      break;
    }
  }

  const header = (rawRows[headerRowIdx] || []).map(v => String(v || '').trim());
  let colCompany = -1;
  let colCountry = -1;
  let colPic = -1;
  let colEmail = -1;
  let colStatus = -1;
  let colInfo = -1;
  let colBrands = -1;

  header.forEach((h, idx) => {
    const lh = h.toLowerCase();
    if (lh.includes('company') || lh.includes('바이어사') || lh.includes('회사명') || lh.includes('바이어명')) colCompany = idx;
    else if (lh.includes('country') || lh.includes('국가')) colCountry = idx;
    else if (lh.includes('pic') || lh.includes('담당자')) colPic = idx;
    else if (lh.includes('email') || lh.includes('이메일') || lh.includes('메일')) colEmail = idx;
    else if (lh.includes('status') || lh.includes('상태') || lh.includes('진행')) colStatus = idx;
    else if (lh.includes('info') || lh.includes('내용') || lh.includes('노트') || lh.includes('비고') || lh.includes('특징')) colInfo = idx;
    else if (lh.includes('brand') || lh.includes('브랜드') || lh.includes('품목')) colBrands = idx;
  });

  // Fallbacks if not detected by header name
  if (colCompany === -1) colCompany = 5;
  if (colCountry === -1) colCountry = 4;
  if (colPic === -1) colPic = 6;
  if (colEmail === -1) colEmail = 7;
  if (colStatus === -1) colStatus = 11;
  if (colInfo === -1) colInfo = 9;

  for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const comp = String(row[colCompany] || '').trim();
    if (!comp || comp === 'None' || comp === 'Company' || comp === '링크' || comp === '예)') {
      invalidCount++;
      continue;
    }

    const country = String(row[colCountry] || '').trim();
    const pic = String(row[colPic] || '').trim();
    const email = String(row[colEmail] || '').trim();
    const status = String(row[colStatus] || '').trim();
    const info = String(row[colInfo] || '').trim();
    const brands = colBrands !== -1 ? String(row[colBrands] || '').trim() : '';

    candidateImportBuyers.push({
      company: comp,
      countryKor: country || '글로벌',
      countryEng: country || '',
      pic: pic || '',
      email: email.replace('\n', ', '),
      status: status || 'Potential',
      info: info || '',
      targetBrands: brands || 'K-Beauty',
      sheet: sheetName
    });
  }

  // Update UI stats
  document.getElementById('buyerImportValidCount').innerText = candidateImportBuyers.length;
  document.getElementById('buyerImportInvalidCount').innerText = invalidCount;
  document.getElementById('buyerImportTotalParsed').innerText = rawRows.length;

  // Preview first 5 rows
  const tbody = document.getElementById('buyerImportPreviewTbody');
  const previewSample = candidateImportBuyers.slice(0, 5);
  tbody.innerHTML = previewSample.map(c => `
    <tr>
      <td class="py-1 px-2 font-bold text-slate-900">${c.company}</td>
      <td class="py-1 px-2">${c.countryKor}</td>
      <td class="py-1 px-2">${c.pic || '-'}</td>
      <td class="py-1 px-2 font-mono text-[10px]">${c.email || '-'}</td>
      <td class="py-1 px-2 font-bold text-emerald-600">${c.status}</td>
    </tr>
  `).join('');

  const btnBatch = document.getElementById('btnExecuteBatchInsert');
  btnBatch.disabled = candidateImportBuyers.length === 0;
}

function executeBuyerBatchInsert() {
  if (!candidateImportBuyers || candidateImportBuyers.length === 0) {
    alert('등록할 유효한 바이어 데이터가 없습니다.');
    return;
  }

  const customSheetName = document.getElementById('buyerImportCustomSheetName').value.trim() || 'Imported';
  let insertCount = 0;

  candidateImportBuyers.forEach(c => {
    const nextNum = buyersData.length + 1;
    buyersData.push({
      id: `BYR-${String(nextNum).padStart(4, '0')}`,
      sheet: customSheetName,
      company: c.company,
      countryKor: c.countryKor,
      countryEng: c.countryEng,
      pic: c.pic,
      email: c.email,
      website: '',
      info: c.info,
      emailStatus: 'Pending',
      status: c.status || 'Potential',
      bizProfile: 'Wholesaler/Retailer',
      companySize: 'Mid',
      adelinePic: '해외영업팀',
      targetBrands: c.targetBrands
    });
    insertCount++;
  });

  saveBuyerData();
  updateBuyerKPICards();
  populateBuyerCountryDropdown();
  updateBuyerSheetTabs();

  closeBuyerImportModal();
  filterBuyerBySheet(customSheetName);

  alert(`성공: [${insertCount}개] 바이어 데이터가 시스템 DB에 성공적으로 일괄 등록되었습니다!`);
}
