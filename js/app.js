
    /* APPLICATION STATE */
    let catalogList = [
      { id: "main_grocery", name: "Main Grocery" },
      { id: "veggies", name: "Vegetables & Fruits" },
      { id: "meat_seafood", name: "Meat & Seafood" }
    ];
    let activeCatalogId = "main_grocery";
    let unitsList = [...DEFAULT_UNITS];
    let catalog = [];
    let cart = {}; // { itemId: { qty, unit } }
    let orderHistory = [];
    let companyName = "4TH STREET DINING HALL - SALT LAKE (GROCERY)";
    window.getAppState = () => ({
      catalog,
      catalogList,
      unitsList,
      cart,
      orderHistory,
      companyName
    });

    /* INIT */
    window.addEventListener('DOMContentLoaded', () => {
      lucide.createIcons();
      document.getElementById('reqDate').valueAsDate = new Date();
      loadState();
      checkAuth();
      renderCatalogTabs();
      renderSubcategoryPills();
      renderCatalog();
      updateCartUI();
    });

    /* LOCAL STORAGE STATE ENGINE */
    function loadState() {
      // Company Name
      const storedName = localStorage.getItem('company_name');
      if (storedName) companyName = storedName;
      document.getElementById('headerCompanyName').textContent = companyName;
      document.getElementById('authTitleDisplay').textContent = companyName;
      document.getElementById('companyNameInput').value = companyName;

      // Custom Units
      const storedUnits = localStorage.getItem('grocery_units');
      if (storedUnits) {
        try { unitsList = JSON.parse(storedUnits); } catch (e) { unitsList = [...DEFAULT_UNITS]; }
      }

      // Catalogs List
      const storedCatalogList = localStorage.getItem('grocery_catalogs_list');
      if (storedCatalogList) {
        try { catalogList = JSON.parse(storedCatalogList); } catch (e) {}
      }

      // Active Catalog ID
      const storedActiveCat = localStorage.getItem('grocery_active_catalog');
      if (storedActiveCat && catalogList.some(c => c.id === storedActiveCat)) {
        activeCatalogId = storedActiveCat;
      } else {
        activeCatalogId = catalogList[0]?.id || "main_grocery";
      }

      // Catalog Items Data (Default to 135 Items if clean slate)
      const storedCatalog = localStorage.getItem('grocery_catalog_items_v2');
      if (storedCatalog) {
        try { catalog = JSON.parse(storedCatalog); } catch (e) { catalog = [...RAW_135_ITEMS]; }
      } else {
        catalog = [...RAW_135_ITEMS];
      }

      // Cart
      const storedCart = localStorage.getItem('grocery_cart');
      if (storedCart) {
        try { cart = JSON.parse(storedCart); } catch (e) { cart = {}; }
      }

      // Order History
      const storedHistory = localStorage.getItem('grocery_order_history');
      if (storedHistory) {
        try { orderHistory = JSON.parse(storedHistory); } catch (e) { orderHistory = []; }
      }
    }

    function saveCatalogState() {
      localStorage.setItem('grocery_catalog_items_v2', JSON.stringify(catalog));
      persistAppState();
    }

    function saveUnitsState() {
      localStorage.setItem('grocery_units', JSON.stringify(unitsList));
      persistAppState();
    }

    function saveCatalogsListState() {
      localStorage.setItem('grocery_catalogs_list', JSON.stringify(catalogList));
      localStorage.setItem('grocery_active_catalog', activeCatalogId);
      persistAppState();
    }

    function saveCartState() {
      localStorage.setItem('grocery_cart', JSON.stringify(cart));
      persistAppState();
    }

    function saveHistoryState() {
      localStorage.setItem('grocery_order_history', JSON.stringify(orderHistory));
      persistAppState();
    }

    /* AUTHENTICATION & LICENSE CHECK */
    function checkAuth() {
      const authData = localStorage.getItem('app_auth_token');
      const authOverlay = document.getElementById('authOverlay');
      
      if (authData) {
        try {
          const { token, timestamp } = JSON.parse(authData);
          const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
          const now = Date.now();
          const elapsed = now - timestamp;

          if (VALID_TOKENS.includes(token) && elapsed < ninetyDaysInMs) {
            authOverlay.classList.add('hidden');
            
            const expDate = new Date(timestamp + ninetyDaysInMs);
            const actDate = new Date(timestamp);
            const daysLeft = Math.ceil((ninetyDaysInMs - elapsed) / (1000 * 60 * 60 * 24));

            document.getElementById('tokenExpiryStatus').textContent = `License Active (${daysLeft}d left)`;
            document.getElementById('tokenActivatedDate').textContent = actDate.toLocaleDateString();
            document.getElementById('tokenExpiryDate').textContent = expDate.toLocaleDateString();
            document.getElementById('tokenDaysRemaining').textContent = `${daysLeft} Days`;
            return;
          }
        } catch (e) {}
      }

      localStorage.removeItem('app_auth_token');
      authOverlay.classList.remove('hidden');
    }

    function handleTokenSubmit(e) {
      e.preventDefault();
      const input = document.getElementById('tokenInput').value.trim().toUpperCase();
      const errBox = document.getElementById('authError');

      if (VALID_TOKENS.includes(input)) {
        const authPayload = {
          token: input,
          timestamp: Date.now()
        };
        localStorage.setItem('app_auth_token', JSON.stringify(authPayload));
        errBox.classList.add('hidden');
        document.getElementById('tokenInput').value = '';
        checkAuth();
      } else {
        errBox.classList.remove('hidden');
      }
    }

    function revokeToken() {
      if (confirm('Lock application and require a passcode re-entry?')) {
        localStorage.removeItem('app_auth_token');
        checkAuth();
      }
    }

    /* DARK MODE */
    function toggleDarkMode() {
      document.documentElement.classList.toggle('dark');
    }

    /* REQUISITIONER NAME DROPDOWN & READYMADE CHIPS */
    function handleReqNameSelect(val) {
      const customInput = document.getElementById('reqNameCustom');
      if (val === 'CUSTOM') {
        customInput.classList.remove('hidden');
        customInput.focus();
      } else {
        customInput.classList.add('hidden');
      }
    }

    function getRequisitionerName() {
      const sel = document.getElementById('reqNameSelect').value;
      if (sel === 'CUSTOM') {
        return document.getElementById('reqNameCustom').value.trim() || 'Custom Staff';
      }
      return sel;
    }

    function appendNotePreset(presetText) {
      const notesInput = document.getElementById('reqNotes');
      if (notesInput.value.trim() === '') {
        notesInput.value = presetText;
      } else {
        notesInput.value += ` | ${presetText}`;
      }
    }

    /* CUSTOM UNIT MANAGEMENT */
    function populateUnitDropdowns() {
      const selects = ['editItemUnit', 'addUnit'];
      selects.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const currentVal = sel.value;
        sel.innerHTML = unitsList.map(u => `<option value="${u}">${u}</option>`).join('');
        if (unitsList.includes(currentVal)) sel.value = currentVal;
      });
    }

    function promptAddCustomUnit(targetSelectId) {
      const customUnit = prompt('Enter new measurement unit name (e.g. bottle, tin, crate, jar, bucket, pt, cut):');
      if (customUnit) {
        const trimmed = customUnit.trim().toLowerCase();
        if (trimmed && !unitsList.includes(trimmed)) {
          unitsList.push(trimmed);
          saveUnitsState();
          populateUnitDropdowns();
          const targetSelect = document.getElementById(targetSelectId);
          if (targetSelect) targetSelect.value = trimmed;
        }
      }
    }

    /* MULTI-CATALOG TABS & MANAGEMENT */
    function renderCatalogTabs() {
      const container = document.getElementById('catalogTabsContainer');
      container.innerHTML = catalogList.map(cat => {
        const isActive = cat.id === activeCatalogId;
        const count = catalog.filter(i => (i.catalogId || "main_grocery") === cat.id).length;
        return `
          <button 
            onclick="switchCatalog('${cat.id}')" 
            class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border whitespace-nowrap ${
              isActive 
                ? 'bg-brand-600 text-white border-brand-600 shadow-sm' 
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }"
          >
            <span>${cat.name}</span>
            <span class="px-1.5 py-0.2 text-[10px] rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}">${count}</span>
          </button>
        `;
      }).join('');

      const selects = ['editItemCatalog', 'addCatalog'];
      selects.forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
          sel.innerHTML = catalogList.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
      });
    }

    function switchCatalog(catId) {
      activeCatalogId = catId;
      saveCatalogsListState();
      renderCatalogTabs();
      renderSubcategoryPills();
      renderCatalog();
    }

    function renderSubcategoryPills() {
      const container = document.getElementById('subCategoryPillsContainer');
      if (!container) return;
      const categories = [...new Set(catalog
        .filter(item => (item.catalogId || 'main_grocery') === activeCatalogId)
        .map(item => item.category || 'General'))].sort();
      container.innerHTML = ['ALL', ...categories].map(category => {
        const label = category === 'ALL' ? 'All Subcategories' : category;
        return `<button type="button" onclick="selectSubcategory('${category.replace(/'/g, "\\'")}')" class="subcategory-pill px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-900/30">${label}</button>`;
      }).join('');
    }

    function selectSubcategory(category) {
      document.getElementById('categoryFilter').value = category;
      renderCatalog();
    }

    function openCatalogModal() {
      renderCatalogManagerList();
      document.getElementById('catalogModal').classList.remove('hidden');
      document.getElementById('catalogModal').classList.add('flex');
    }

    function closeCatalogModal() {
      document.getElementById('catalogModal').classList.add('hidden');
      document.getElementById('catalogModal').classList.remove('flex');
    }

    function renderCatalogManagerList() {
      const container = document.getElementById('catalogManagerList');
      container.innerHTML = catalogList.map(cat => `
        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-xs">
          <span class="font-bold text-slate-800 dark:text-white">${cat.name}</span>
          ${catalogList.length > 1 ? `
            <button onclick="deleteCatalog('${cat.id}')" class="text-red-500 hover:text-red-700 p-1">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          ` : '<span class="text-[10px] text-slate-400">Default</span>'}
        </div>
      `).join('');
      lucide.createIcons();
    }

    function handleCreateCatalog() {
      const input = document.getElementById('newCatalogName');
      const name = input.value.trim();
      if (name) {
        const id = 'cat_' + Date.now();
        catalogList.push({ id, name });
        input.value = '';
        saveCatalogsListState();
        renderCatalogTabs();
        renderCatalogManagerList();
      }
    }

    function deleteCatalog(catId) {
      if (confirm('Delete this catalog? Items in this catalog will move to Main Grocery.')) {
        catalog.forEach(item => {
          if (item.catalogId === catId) item.catalogId = "main_grocery";
        });
        catalogList = catalogList.filter(c => c.id !== catId);
        if (activeCatalogId === catId) activeCatalogId = "main_grocery";
        
        saveCatalogState();
        saveCatalogsListState();
        renderCatalogTabs();
        renderCatalogManagerList();
        renderCatalog();
      }
    }

    /* RELIABLE IMAGE PLACEHOLDER & FALLBACK GENERATOR */
    function getItemCategorySvg(category, name) {
      let icon = 'package';
      if (category.includes('Meat') || category.includes('Poultry')) icon = 'drumstick';
      else if (category.includes('Fish') || category.includes('Seafood')) icon = 'fish';
      else if (category.includes('Vegetables') || category.includes('Greens')) icon = 'leaf';
      else if (category.includes('Fruits')) icon = 'apple';
      else if (category.includes('Dairy')) icon = 'milk';
      else if (category.includes('Grains') || category.includes('Rice')) icon = 'wheat';
      else if (category.includes('Spices')) icon = 'flame';

      const initial = name ? name.charAt(0).toUpperCase() : 'G';

      return `
        <div class="w-full h-full bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center p-2 text-slate-400 dark:text-slate-500">
          <i data-lucide="${icon}" class="w-8 h-8 mb-1"></i>
          <span class="text-[10px] font-bold tracking-wider text-slate-500 uppercase">${initial}</span>
        </div>
      `;
    }

    function handleImageError(imgEl, category, name) {
      applyImageFallback(imgEl, category, name);
    }

    async function searchImageForItem(target) {
      const queryId = target === 'edit' ? 'editImageSearch' : 'addImageSearch';
      const resultId = target === 'edit' ? 'editItemImageUrl' : 'addItemImageUrl';
      const statusId = target === 'edit' ? 'editImageSearchStatus' : 'addImageSearchStatus';
      const query = document.getElementById(queryId).value.trim();
      const status = document.getElementById(statusId);
      if (!query) {
        status.textContent = 'Enter a product name to search.';
        return;
      }
      status.textContent = 'Searching Google Images...';
      try {
        const result = await searchGoogleImage(query);
        document.getElementById(resultId).value = result.url;
        if (target === 'add' && !document.getElementById('addName').value.trim()) {
          document.getElementById('addName').value = query;
        }
        status.textContent = `Cached result selected: ${result.title}`;
      } catch (error) {
        status.textContent = error.message;
      }
    }

    /* RENDER CATALOG GRID */
    function renderCatalog() {
      populateUnitDropdowns();
      renderSubcategoryPills();
      const grid = document.getElementById('catalogGrid');
      const noResults = document.getElementById('noResults');
      const searchQuery = document.getElementById('searchInput').value.toLowerCase().trim();
      const category = document.getElementById('categoryFilter').value;

      const currentCatalogItems = catalog.filter(item => (item.catalogId || "main_grocery") === activeCatalogId);
      
      document.getElementById('totalItemsBadge').textContent = `${currentCatalogItems.length} Items in Tab`;

      const filtered = currentCatalogItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery) || item.id.toString() === searchQuery || `#${item.id}` === searchQuery;
        const matchesCategory = category === 'ALL' || item.category === category;
        return matchesSearch && matchesCategory;
      });

      if (filtered.length === 0) {
        grid.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
      }

      noResults.classList.add('hidden');

      grid.innerHTML = filtered.map(item => {
        const cartItem = cart[item.id] || { qty: 0, unit: item.unit };
        const inCart = cartItem.qty > 0;

        return `
          <div class="bg-white dark:bg-slate-800 rounded-2xl border ${inCart ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200 dark:border-slate-700'} shadow-sm hover:shadow-md transition flex flex-col overflow-hidden group">
            
            <!-- Image Container with Fallback -->
            <div class="relative h-28 sm:h-32 bg-slate-100 dark:bg-slate-700 overflow-hidden">
              ${item.img ? `
                <img 
                  src="${item.img}" 
                  alt="${item.name}" 
                  class="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  onerror="handleImageError(this, '${item.category || 'General'}', '${item.name.replace(/'/g, "\\'")}')"
                />
              ` : getItemCategorySvg(item.category || 'General', item.name)}
              
              <!-- CLEAR CATALOG ITEM CODE / ID BADGE -->
              <span class="absolute top-2 left-2 bg-slate-900/80 backdrop-blur text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg shadow">
                Item Code: #${item.id}
              </span>

              <!-- Edit Button -->
              <button onclick="openEditModal(${item.id})" class="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-slate-800/90 hover:bg-white text-slate-700 dark:text-slate-200 rounded-lg shadow transition opacity-80 hover:opacity-100" title="Edit Item">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
            </div>

            <!-- Item Details -->
            <div class="p-3 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h4 class="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  ${item.name}
                </h4>
                <p class="text-[10px] text-slate-400 mt-0.5 font-medium">${item.category || 'General'}</p>
              </div>

              <!-- Quantity Controls -->
              <div class="pt-1">
                <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-700/60 rounded-xl p-1 border border-slate-200 dark:border-slate-600">
                  <button 
                    onclick="updateQty(${item.id}, -1)" 
                    class="w-7 h-7 flex items-center justify-center bg-white dark:bg-slate-600 text-slate-700 dark:text-white rounded-lg shadow-sm hover:bg-slate-100 active:scale-95 transition font-bold"
                  >-</button>

                  <div class="flex items-center gap-1">
                    <input 
                      type="number" 
                      min="0" 
                      value="${cartItem.qty || 0}" 
                      onchange="setDirectQty(${item.id}, this.value)"
                      class="w-10 text-center bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                    />
                    <select 
                      onchange="setItemUnit(${item.id}, this.value)" 
                      class="bg-transparent text-[10px] font-semibold text-slate-500 dark:text-slate-300 focus:outline-none cursor-pointer"
                    >
                      ${unitsList.map(u => 
                        `<option value="${u}" ${cartItem.unit === u ? 'selected' : ''}>${u}</option>`
                      ).join('')}
                    </select>
                  </div>

                  <button 
                    onclick="updateQty(${item.id}, 1)" 
                    class="w-7 h-7 flex items-center justify-center bg-brand-600 text-white rounded-lg shadow-sm hover:bg-brand-700 active:scale-95 transition font-bold"
                  >+</button>
                </div>
              </div>

            </div>

          </div>
        `;
      }).join('');

      lucide.createIcons();
    }

    /* CART OPERATIONS */
    function updateQty(id, delta) {
      const item = catalog.find(i => i.id === id);
      if (!item) return;

      if (!cart[id]) {
        cart[id] = { qty: 0, unit: item.unit };
      }

      cart[id].qty = Math.max(0, (cart[id].qty || 0) + delta);
      if (cart[id].qty === 0) {
        delete cart[id];
      }

      saveCartState();
      renderCatalog();
      updateCartUI();
    }

    function setDirectQty(id, val) {
      const parsed = parseFloat(val) || 0;
      const item = catalog.find(i => i.id === id);
      if (!item) return;

      if (parsed <= 0) {
        delete cart[id];
      } else {
        if (!cart[id]) cart[id] = { qty: 0, unit: item.unit };
        cart[id].qty = parsed;
      }

      saveCartState();
      renderCatalog();
      updateCartUI();
    }

    function setItemUnit(id, newUnit) {
      if (cart[id]) {
        cart[id].unit = newUnit;
      }
      const item = catalog.find(i => i.id === id);
      if (item) item.unit = newUnit;

      saveCartState();
      saveCatalogState();
      updateCartUI();
    }

    function updateCartUI() {
      const cartKeys = Object.keys(cart).filter(k => cart[k].qty > 0);
      const totalCount = cartKeys.length;

      document.getElementById('cartBadgeCount').textContent = totalCount;
      document.getElementById('drawerCartCount').textContent = `${totalCount} items`;
      document.getElementById('cartTotalItemCount').textContent = totalCount;

      const container = document.getElementById('cartItemList');

      if (totalCount === 0) {
        container.innerHTML = `
          <div class="text-center py-12 text-slate-400">
            <i data-lucide="shopping-bag" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
            <p class="text-xs font-semibold">Requisition cart is currently empty</p>
            <p class="text-[10px] text-slate-400 mt-1">Select quantities from catalog above</p>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      container.innerHTML = cartKeys.map((key, index) => {
        const cItem = cart[key];
        const item = catalog.find(i => i.id === parseInt(key));
        if (!item) return '';

        return `
          <div class="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-xl border border-slate-200 dark:border-slate-600 flex flex-col gap-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-600 text-[10px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-300">
                  ${index + 1}
                </span>
                <div>
                  <h5 class="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">${item.name}</h5>
                  <p class="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">Item Code: #${item.id} • ${item.category}</p>
                </div>
              </div>
              <button onclick="updateQty(${item.id}, -${cItem.qty})" class="text-red-500 hover:text-red-700 p-1">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>

            <div class="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-600/60 pt-2">
              <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">Quantity Required:</span>
              <div class="flex items-center gap-1">
                <input 
                  type="number" 
                  min="1" 
                  value="${cItem.qty}" 
                  onchange="setDirectQty(${item.id}, this.value)"
                  class="w-12 text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md py-0.5 text-xs font-bold text-slate-900 dark:text-white"
                />
                <span class="text-xs font-bold text-brand-600 dark:text-brand-400">${cItem.unit}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      lucide.createIcons();
    }

    function toggleCartDrawer() {
      document.getElementById('cartDrawer').classList.toggle('translate-x-full');
    }

    function clearCart() {
      if (confirm('Clear all items from current requisition cart?')) {
        cart = {};
        saveCartState();
        renderCatalog();
        updateCartUI();
      }
    }

    /* ORDER HISTORY & MULTI-MODE SORTING LOGIC */
    function getSeasonFromDate(dateObj) {
      const month = dateObj.getMonth(); // 0-11
      if (month >= 2 && month <= 3) return 'Spring';
      if (month >= 4 && month <= 5) return 'Summer';
      if (month >= 6 && month <= 8) return 'Monsoon';
      if (month >= 9 && month <= 10) return 'Autumn';
      return 'Winter'; // 11, 0, 1
    }

    function saveCurrentOrderToHistory() {
      const cartKeys = Object.keys(cart).filter(k => cart[k].qty > 0);
      if (cartKeys.length === 0) {
        alert('Cannot save empty cart to history!');
        return;
      }

      const reqDateVal = document.getElementById('reqDate').value || new Date().toISOString().split('T')[0];
      const dateObj = new Date(reqDateVal);

      const newOrder = {
        id: 'ORD-' + Date.now(),
        date: reqDateVal,
        month: dateObj.getMonth(),
        year: dateObj.getFullYear(),
        season: getSeasonFromDate(dateObj),
        requisitioner: getRequisitionerName(),
        department: document.getElementById('reqDept').value,
        notes: document.getElementById('reqNotes').value || 'None',
        items: cartKeys.map(k => ({
          itemId: parseInt(k),
          name: catalog.find(i => i.id === parseInt(k))?.name || 'Item',
          qty: cart[k].qty,
          unit: cart[k].unit
        })),
        createdAt: new Date().toISOString()
      };

      orderHistory.unshift(newOrder);
      saveHistoryState();
      alert('Order successfully saved to local history!');
    }

    function openHistoryModal() {
      renderOrderHistory();
      document.getElementById('historyModal').classList.remove('hidden');
      document.getElementById('historyModal').classList.add('flex');
    }

    function closeHistoryModal() {
      document.getElementById('historyModal').classList.add('hidden');
      document.getElementById('historyModal').classList.remove('flex');
    }

    function renderOrderHistory() {
      const monthFilter = document.getElementById('historyMonthFilter').value;
      const yearFilter = document.getElementById('historyYearFilter').value;
      const seasonFilter = document.getElementById('historySeasonFilter').value;
      const container = document.getElementById('historyListContainer');

      const filtered = orderHistory.filter(ord => {
        const matchesMonth = monthFilter === 'ALL' || ord.month.toString() === monthFilter;
        const matchesYear = yearFilter === 'ALL' || ord.year.toString() === yearFilter;
        const matchesSeason = seasonFilter === 'ALL' || ord.season === seasonFilter;
        return matchesMonth && matchesYear && matchesSeason;
      });

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="text-center py-12 text-slate-400">
            <i data-lucide="history" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
            <p class="text-xs font-semibold">No order history matches selected filters.</p>
          </div>
        `;
        lucide.createIcons();
        return;
      }

      container.innerHTML = filtered.map(ord => `
        <div class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
          <div class="flex flex-wrap items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2 gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-xs text-slate-900 dark:text-white font-mono">${ord.id}</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                  ${ord.season} Season
                </span>
              </div>
              <p class="text-[10px] text-slate-400 mt-0.5">Date: ${ord.date} • By: ${ord.requisitioner} (${ord.department})</p>
            </div>
            
            <div class="flex items-center gap-1.5">
              <button onclick="loadOrderIntoCart('${ord.id}')" class="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1">
                <i data-lucide="rotate-ccw" class="w-3 h-3"></i> Re-Order
              </button>
              <button onclick="deleteOrderHistory('${ord.id}')" class="p-1 text-red-500 hover:text-red-700">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>

          <div class="space-y-1">
            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Line Items (${ord.items.length}):</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
              ${ord.items.map((it, idx) => `
                <div class="flex justify-between bg-slate-50 dark:bg-slate-700/50 px-2 py-1 rounded text-[11px]">
                  <span><strong>Sl ${idx+1}.</strong> #${it.itemId} ${it.name}</span>
                  <span class="font-bold text-brand-600 dark:text-brand-400">${it.qty} ${it.unit}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `).join('');

      lucide.createIcons();
    }

    function loadOrderIntoCart(orderId) {
      const order = orderHistory.find(o => o.id === orderId);
      if (!order) return;

      if (confirm(`Replace active cart with items from Order ${order.id}?`)) {
        cart = {};
        order.items.forEach(it => {
          cart[it.itemId] = { qty: it.qty, unit: it.unit };
        });

        saveCartState();
        renderCatalog();
        updateCartUI();
        closeHistoryModal();
        toggleCartDrawer();
      }
    }

    function deleteOrderHistory(orderId) {
      if (confirm('Delete this saved requisition from history?')) {
        orderHistory = orderHistory.filter(o => o.id !== orderId);
        saveHistoryState();
        renderOrderHistory();
      }
    }

    function clearAllHistory() {
      if (confirm('Clear all historical requisition orders?')) {
        orderHistory = [];
        saveHistoryState();
        renderOrderHistory();
      }
    }

    /* EDIT ITEM & LOCALSTORAGE IMAGE PERSISTENCE */
    function openEditModal(id) {
      const item = catalog.find(i => i.id === id);
      if (!item) return;

      populateUnitDropdowns();
      document.getElementById('editItemId').value = item.id;
      document.getElementById('editItemName').value = item.name;
      document.getElementById('editItemCatalog').value = item.catalogId || "main_grocery";
      document.getElementById('editItemUnit').value = item.unit;
      document.getElementById('editItemCategory').value = item.category || 'Vegetables & Fruits';
      document.getElementById('editItemImageUrl').value = item.img && !item.img.startsWith('data:') ? item.img : '';
      document.getElementById('editImageSearch').value = item.name;
      document.getElementById('editImageSearchStatus').textContent = '';
      
      document.getElementById('editModal').classList.remove('hidden');
      document.getElementById('editModal').classList.add('flex');
    }

    function closeEditModal() {
      document.getElementById('editModal').classList.add('hidden');
      document.getElementById('editModal').classList.remove('flex');
    }

    function saveItemEdit(e) {
      e.preventDefault();
      const id = parseInt(document.getElementById('editItemId').value);
      const name = document.getElementById('editItemName').value.trim();
      const catalogId = document.getElementById('editItemCatalog').value;
      const unit = document.getElementById('editItemUnit').value;
      const category = document.getElementById('editItemCategory').value;
      const fileInput = document.getElementById('editItemFile');
      const searchedImage = document.getElementById('editItemImageUrl').value.trim();

      const item = catalog.find(i => i.id === id);
      if (item) {
        item.name = name;
        item.catalogId = catalogId;
        item.unit = unit;
        item.category = category;
        if (searchedImage) item.img = searchedImage;

        if (fileInput.files && fileInput.files[0]) {
          const reader = new FileReader();
          reader.onload = function (evt) {
            item.img = evt.target.result; // Data Base64 stored locally
            saveCatalogState();
            renderCatalogTabs();
            renderCatalog();
            updateCartUI();
            closeEditModal();
          };
          reader.readAsDataURL(fileInput.files[0]);
        } else {
          saveCatalogState();
          renderCatalogTabs();
          renderCatalog();
          updateCartUI();
          closeEditModal();
        }
      }
    }

    function deleteCatalogItem() {
      const id = parseInt(document.getElementById('editItemId').value);
      if (confirm('Delete this item permanently from catalog?')) {
        catalog = catalog.filter(i => i.id !== id);
        delete cart[id];
        saveCatalogState();
        saveCartState();
        renderCatalogTabs();
        renderCatalog();
        updateCartUI();
        closeEditModal();
      }
    }

    /* ADD ITEM LOGIC */
    function openAddItemModal() {
      populateUnitDropdowns();
      document.getElementById('addCatalog').value = activeCatalogId;
      document.getElementById('addImageSearch').value = document.getElementById('addName').value;
      document.getElementById('addImageSearchStatus').textContent = '';
      document.getElementById('addItemImageUrl').value = '';
      document.getElementById('addItemModal').classList.remove('hidden');
      document.getElementById('addItemModal').classList.add('flex');
    }

    function closeAddItemModal() {
      document.getElementById('addItemModal').classList.add('hidden');
      document.getElementById('addItemModal').classList.remove('flex');
    }

    function handleAddNewItem(e) {
      e.preventDefault();
      const name = document.getElementById('addName').value.trim();
      const catalogId = document.getElementById('addCatalog').value;
      const unit = document.getElementById('addUnit').value;
      const category = document.getElementById('addCategory').value;
      const fileInput = document.getElementById('addFile');
      const searchedImage = document.getElementById('addItemImageUrl').value.trim();

      const nextId = catalog.length > 0 ? Math.max(...catalog.map(i => i.id)) + 1 : 1;

      const newItem = {
        id: nextId,
        catalogId: catalogId,
        name: name,
        unit: unit,
        category: category,
        img: searchedImage
      };

      if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (evt) {
          newItem.img = evt.target.result;
          catalog.push(newItem);
          saveCatalogState();
          renderCatalogTabs();
          renderCatalog();
          closeAddItemModal();
          document.getElementById('addItemForm').reset();
        };
        reader.readAsDataURL(fileInput.files[0]);
      } else {
        catalog.push(newItem);
        saveCatalogState();
        renderCatalogTabs();
        renderCatalog();
        closeAddItemModal();
        document.getElementById('addItemForm').reset();
      }
    }

    /* SETTINGS LOGIC */
    function openSettingsModal() {
      document.getElementById('companyNameInput').value = companyName;
      document.getElementById('googleImageApiKey').value = localStorage.getItem('google_image_api_key') || '';
      document.getElementById('googleImageSearchEngineId').value = localStorage.getItem('google_image_search_engine_id') || '';
      const githubConfig = getGitHubSyncConfig();
      document.getElementById('githubOwner').value = githubConfig.owner || '';
      document.getElementById('githubRepo').value = githubConfig.repo || '';
      document.getElementById('githubPath').value = githubConfig.path || 'data/catalog-state.json';
      document.getElementById('githubBranch').value = githubConfig.branch || 'main';
      document.getElementById('githubToken').value = githubConfig.token || '';
      const lastSync = localStorage.getItem('grocery_github_last_sync');
      document.getElementById('githubSyncStatus').textContent = lastSync ? `Last sync: ${new Date(lastSync).toLocaleString()}` : 'GitHub sync is not configured.';
      document.getElementById('settingsModal').classList.remove('hidden');
      document.getElementById('settingsModal').classList.add('flex');
    }

    function closeSettingsModal() {
      document.getElementById('settingsModal').classList.add('hidden');
      document.getElementById('settingsModal').classList.remove('flex');
    }

    function saveCompanySettings(e) {
      e.preventDefault();
      const newName = document.getElementById('companyNameInput').value.trim();
      if (newName) {
        companyName = newName;
        localStorage.setItem('company_name', companyName);
        document.getElementById('headerCompanyName').textContent = companyName;
        document.getElementById('authTitleDisplay').textContent = companyName;
      }
      localStorage.setItem('google_image_api_key', document.getElementById('googleImageApiKey').value.trim());
      localStorage.setItem('google_image_search_engine_id', document.getElementById('googleImageSearchEngineId').value.trim());
      setGitHubSyncConfig({
        owner: document.getElementById('githubOwner').value.trim(),
        repo: document.getElementById('githubRepo').value.trim(),
        path: document.getElementById('githubPath').value.trim(),
        branch: document.getElementById('githubBranch').value.trim() || 'main',
        token: document.getElementById('githubToken').value.trim()
      });
      persistAppState();
      closeSettingsModal();
    }

    function resetToDefaultCatalog() {
      if (confirm('Reset all catalogs & item configurations back to factory defaults (135 catalog items)?')) {
        catalog = [...RAW_135_ITEMS];
        unitsList = [...DEFAULT_UNITS];
        catalogList = [
          { id: "main_grocery", name: "Main Grocery" },
          { id: "veggies", name: "Vegetables & Fruits" },
          { id: "meat_seafood", name: "Meat & Seafood" }
        ];
        activeCatalogId = "main_grocery";

        saveCatalogState();
        saveUnitsState();
        saveCatalogsListState();
        renderCatalogTabs();
        renderCatalog();
        closeSettingsModal();
      }
    }

    /* CLEAR SL NO. VS ITEM CODE REQUISITION SLIP BUILDER */
    function buildRequisitionHTML() {
      const date = document.getElementById('reqDate').value || new Date().toISOString().split('T')[0];
      const name = getRequisitionerName();
      const dept = document.getElementById('reqDept').value || 'Kitchen';
      const notes = document.getElementById('reqNotes').value || 'None';

      const cartKeys = Object.keys(cart).filter(k => cart[k].qty > 0);

      const itemsRows = cartKeys.map((k, index) => {
        const cItem = cart[k];
        const item = catalog.find(i => i.id === parseInt(k));
        const catObj = catalogList.find(c => c.id === (item.catalogId || 'main_grocery'));
        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px; text-align: center; font-size: 11px; font-weight: bold; color: #475569;">${index + 1}</td>
            <td style="padding: 8px; text-align: center; font-size: 11px; font-weight: bold; color: #166534; font-family: monospace;">#${item.id}</td>
            <td style="padding: 8px; font-size: 12px; font-weight: bold; color: #0f172a;">${item.name}</td>
            <td style="padding: 8px; text-align: center; font-size: 11px; color: #64748b;">${catObj?.name || 'Grocery'}</td>
            <td style="padding: 8px; text-align: right; font-size: 13px; font-weight: bold; color: #15803d;">${cItem.qty} ${cItem.unit}</td>
          </tr>
        `;
      }).join('');

      return `
        <div style="background: #ffffff; padding: 24px; font-family: system-ui, -apple-system, sans-serif; color: #0f172a; max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px;">
          
          <div style="border-bottom: 2px solid #22c55e; padding-bottom: 12px; margin-bottom: 16px;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #166534; text-transform: uppercase;">${companyName}</h2>
            <p style="margin: 4px 0 0 0; font-size: 13px; font-weight: 600; color: #475569;">STORE & INVENTORY REQUISITION SLIP</p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #f8fafc; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 12px;">
            <div><strong>Requisition Date:</strong> ${date}</div>
            <div><strong>Requisitioner:</strong> ${name}</div>
            <div><strong>Department:</strong> ${dept}</div>
            <div><strong>Notes / Instructions:</strong> ${notes}</div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; font-size: 11px; color: #334155;">
                <th style="padding: 8px; text-align: center; width: 45px;">Sl. No.</th>
                <th style="padding: 8px; text-align: center; width: 70px;">Item Code</th>
                <th style="padding: 8px; text-align: left;">Item Description</th>
                <th style="padding: 8px; text-align: center;">Catalog</th>
                <th style="padding: 8px; text-align: right;">Quantity Required</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows || '<tr><td colspan="5" style="text-align:center; padding: 20px; color:#94a3b8;">No items in cart</td></tr>'}
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; margin-top: 24px;">
            <div>
              <p style="margin:0;">Generated via Kitchen Inventory Requisition System</p>
              <p style="margin:2px 0 0 0;">Total Selected Line Items: <strong>${cartKeys.length}</strong></p>
            </div>
            <div style="text-align: right;">
              <div style="border-bottom: 1px solid #94a3b8; width: 140px; margin-bottom: 4px; display: inline-block;"></div>
              <div>Authorized Signature</div>
            </div>
          </div>

        </div>
      `;
    }

    /* EXPORT OPERATIONS */
    function shareWhatsApp() {
      const cartKeys = Object.keys(cart).filter(k => cart[k].qty > 0);
      if (cartKeys.length === 0) {
        alert('Requisition cart is empty!');
        return;
      }

      const date = document.getElementById('reqDate').value || new Date().toISOString().split('T')[0];
      const name = getRequisitionerName();
      const dept = document.getElementById('reqDept').value || 'Kitchen';
      const notes = document.getElementById('reqNotes').value || 'None';

      let text = `🛒 *REQUISITION ORDER*\n`;
      text += `📍 *${companyName}*\n`;
      text += `📅 *Date:* ${date}\n`;
      text += `👤 *By:* ${name} (${dept})\n`;
      if (notes !== 'None') text += `📝 *Notes:* ${notes}\n`;
      text += `-----------------------------------\n`;

      cartKeys.forEach((k, idx) => {
        const item = catalog.find(i => i.id === parseInt(k));
        const cItem = cart[k];
        text += `Sl.${idx + 1} | Item Code: #${item.id} - *${item.name}* -> *${cItem.qty} ${cItem.unit}*\n`;
      });

      text += `-----------------------------------\n`;
      text += `📦 *Total Line Items:* ${cartKeys.length}\n`;

      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    }

    function triggerPrint() {
      const printSection = document.getElementById('print-section');
      printSection.innerHTML = buildRequisitionHTML();
      printSection.classList.remove('hidden');
      window.print();
      printSection.classList.add('hidden');
    }

    function downloadPNG() {
      const cartKeys = Object.keys(cart).filter(k => cart[k].qty > 0);
      if (cartKeys.length === 0) {
        alert('Requisition cart is empty!');
        return;
      }

      const printSection = document.getElementById('print-section');
      printSection.innerHTML = buildRequisitionHTML();
      printSection.classList.remove('hidden');

      html2canvas(printSection.firstElementChild, { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Requisition_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        printSection.classList.add('hidden');
      }).catch(() => {
        alert('Failed to render PNG.');
        printSection.classList.add('hidden');
      });
    }

    function downloadPDF() {
      const cartKeys = Object.keys(cart).filter(k => cart[k].qty > 0);
      if (cartKeys.length === 0) {
        alert('Requisition cart is empty!');
        return;
      }

      const printSection = document.getElementById('print-section');
      printSection.innerHTML = buildRequisitionHTML();
      printSection.classList.remove('hidden');

      html2canvas(printSection.firstElementChild, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Requisition_${new Date().toISOString().split('T')[0]}.pdf`);
        printSection.classList.add('hidden');
      }).catch(() => {
        alert('Failed to generate PDF.');
        printSection.classList.add('hidden');
      });
    }
