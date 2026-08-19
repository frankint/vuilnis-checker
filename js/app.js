/**
 * Spaarnelanden Afval & Container Checker
 * Standalone Client-Side Application with Terminal Raw Data Stream Simulation
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const form = document.getElementById('search-form');
  const postcodeInput = document.getElementById('postcode');
  const houseNumberInput = document.getElementById('house_number');
  const containerRegInput = document.getElementById('sRegistrationNumber');
  const copyUrlBtn = document.getElementById('copy-url-btn');
  const currentUrlBadge = document.getElementById('current-url-badge');

  const loadingState = document.getElementById('loading-state');
  const errorAlert = document.getElementById('error-alert');
  const errorMessage = document.getElementById('error-message');
  const dashboardContent = document.getElementById('dashboard-content');

  // Waste Schedule Elements
  const firstHeroBox = document.getElementById('hero-first');
  const firstHeroName = document.getElementById('first-hero-name');
  const firstHeroDate = document.getElementById('first-hero-date');
  const firstHeroBadge = document.getElementById('first-hero-badge');

  const nextHeroBox = document.getElementById('hero-next');
  const nextHeroName = document.getElementById('next-hero-name');
  const nextHeroDate = document.getElementById('next-hero-date');
  const nextHeroBadge = document.getElementById('next-hero-badge');

  const allStreamsList = document.getElementById('all-streams-list');

  // Container Status Elements
  const gaugeFill = document.getElementById('gauge-fill');
  const gaugePercent = document.getElementById('gauge-percentage');
  const containerRegVal = document.getElementById('meta-reg-number');
  const containerProdVal = document.getElementById('meta-product');
  const containerKindVal = document.getElementById('meta-kind');
  const containerFillStatusVal = document.getElementById('meta-fill-status');
  const containerLastEmptiedVal = document.getElementById('meta-last-emptied');
  const containerDistrictVal = document.getElementById('meta-district');
  const containerCityDistrictVal = document.getElementById('meta-city-district');
  const containerIdVal = document.getElementById('meta-id');
  const containerCoordsVal = document.getElementById('meta-coords');

  const pillEmptiedToday = document.getElementById('pill-emptied-today');
  const pillOutOfUse = document.getElementById('pill-out-of-use');
  const pillSkipped = document.getElementById('pill-skipped');

  const daysScheduleBox = document.getElementById('days-schedule-icons');
  const mapLinkBtn = document.getElementById('map-link-btn');

  const jsonToggleBtn = document.getElementById('toggle-json-btn');
  const jsonContainer = document.getElementById('raw-json-container');
  const rawJsonPre = document.getElementById('raw-json');

  // Terminal Window Elements
  const terminalBody = document.getElementById('terminal-body');
  const termReplayBtn = document.getElementById('term-replay-btn');
  const termCopyBtn = document.getElementById('term-copy-btn');
  const termClearBtn = document.getElementById('term-clear-btn');

  let currentRawContainerData = null;
  let currentRawScheduleData = null;
  let termAnimationTimeouts = [];

  // Parse URL Parameters
  const params = getUrlParams();
  
  // Set initial input values from URL or defaults
  postcodeInput.value = params.postcode || '2012WT';
  houseNumberInput.value = params.house_number || '1';
  containerRegInput.value = params.sRegistrationNumber || '121387';

  updateUrlDisplay();

  // Initial load
  loadData();

  // Event Listeners
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    updateUrlParams();
    loadData();
  });

  copyUrlBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      const originalText = copyUrlBtn.innerHTML;
      copyUrlBtn.innerHTML = '✓ Gekopieerd!';
      setTimeout(() => {
        copyUrlBtn.innerHTML = originalText;
      }, 2000);
    }).catch(err => {
      console.error('Kopiëren mislukt:', err);
    });
  });

  jsonToggleBtn.addEventListener('click', () => {
    const isHidden = jsonContainer.classList.toggle('hidden');
    jsonToggleBtn.innerHTML = isHidden ? '🔍 Bekijk ruwe JSON data' : '▲ Verberg ruwe JSON data';
  });

  // Terminal Controls
  termReplayBtn.addEventListener('click', () => {
    replayTerminalStream();
  });

  termClearBtn.addEventListener('click', () => {
    clearTerminalTimeouts();
    terminalBody.innerHTML = '<div class="term-line"><span class="term-prompt">spaarnelanden@system:~$</span> <span class="blinking-cursor"></span></div>';
  });

  termCopyBtn.addEventListener('click', () => {
    const text = terminalBody.innerText;
    navigator.clipboard.writeText(text).then(() => {
      const orig = termCopyBtn.textContent;
      termCopyBtn.textContent = '✓ Gekopieerd!';
      setTimeout(() => termCopyBtn.textContent = orig, 1500);
    });
  });

  // Main Data Loader
  async function loadData() {
    showLoading();
    hideError();
    clearTerminalTimeouts();

    const pc = postcodeInput.value.trim();
    const hn = houseNumberInput.value.trim();
    const regNum = containerRegInput.value.trim();

    initTerminalLog(pc, hn, regNum);

    try {
      // Execute both fetches concurrently
      const [scheduleResult, containerResult] = await Promise.allSettled([
        fetchWasteSchedule(pc, hn),
        fetchContainerStatus(regNum)
      ]);

      let errors = [];

      if (scheduleResult.status === 'fulfilled') {
        currentRawScheduleData = scheduleResult.value;
        renderWasteSchedule(scheduleResult.value);
        logTerminalEvent('SUCCESS', `Afvalkalender opgehaald: ${scheduleResult.value.allStreams.length} afvalstromen verwerkt.`);
      } else {
        errors.push(`Afvalkalender: ${scheduleResult.reason.message}`);
        logTerminalEvent('ERROR', `Afvalkalender fout: ${scheduleResult.reason.message}`);
      }

      if (containerResult.status === 'fulfilled') {
        currentRawContainerData = containerResult.value;
        renderContainerStatus(containerResult.value);
        logTerminalEvent('SUCCESS', `Container ${regNum} gevonden (Vullingsgraad: ${containerResult.value.dFillingDegree}%).`);
      } else {
        errors.push(`Container status: ${containerResult.reason.message}`);
        logTerminalEvent('ERROR', `Container status fout: ${containerResult.reason.message}`);
      }

      hideLoading();

      if (errors.length > 0) {
        showError(errors.join('<br>'));
      }
      
      dashboardContent.classList.remove('hidden');

      // Start streaming raw data in the terminal simulation window
      streamRawDataToTerminal(currentRawContainerData, currentRawScheduleData);

    } catch (err) {
      hideLoading();
      showError(err.message || 'Er is een onverwachte fout opgetreden.');
      logTerminalEvent('ERROR', err.message);
    }
  }

  // Helper: Extract URL Params
  function getUrlParams() {
    const searchParams = new URLSearchParams(window.location.search);
    const result = {};

    for (const [key, value] of searchParams.entries()) {
      const k = key.toLowerCase();
      if (k === 'postcode' || k === 'postalcode' || k === 'pc') {
        result.postcode = value;
      } else if (k === 'house_number' || k === 'housenumber' || k === 'huisnummer' || k === 'house_num' || k === 'hn') {
        result.house_number = value;
      } else if (k === 'sregistrationnumber' || k === 'registrationnumber' || k === 'container' || k === 'containerid') {
        result.sRegistrationNumber = value;
      }
    }
    return result;
  }

  function updateUrlParams() {
    const pc = postcodeInput.value.trim();
    const hn = houseNumberInput.value.trim();
    const regNum = containerRegInput.value.trim();

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('postcode', pc);
    newUrl.searchParams.set('house_number', hn);
    newUrl.searchParams.set('sRegistrationNumber', regNum);

    window.history.pushState({}, '', newUrl);
    updateUrlDisplay();
  }

  function updateUrlDisplay() {
    currentUrlBadge.textContent = window.location.search || `?postcode=${postcodeInput.value}&house_number=${houseNumberInput.value}&sRegistrationNumber=${containerRegInput.value}`;
  }

  // --- FUNCTION 1: Spaarnelanden Afvalwijzer Schedule ---
  async function fetchWasteSchedule(postcode, houseNumber) {
    const baseUrl = 'https://afvalwijzer.spaarnelanden.nl';

    logTerminalEvent('HTTP', `GET ${baseUrl}/adressen/${postcode}:${houseNumber}`);

    const addressEndpoint = `${baseUrl}/adressen/${encodeURIComponent(postcode.trim().toUpperCase())}:${encodeURIComponent(houseNumber)}`;
    
    let addressRes;
    try {
      addressRes = await fetch(addressEndpoint);
    } catch (e) {
      throw new Error(`Netwerkfout bij ophalen adres (${addressEndpoint}).`);
    }

    if (!addressRes.ok) {
      throw new Error(`Geen adres gevonden voor ${postcode} ${houseNumber} (Status ${addressRes.status})`);
    }

    const addressData = await addressRes.json();
    if (!addressData || addressData.length === 0) {
      throw new Error(`Geen adres gevonden voor ${postcode} ${houseNumber}`);
    }

    const bagid = addressData[0].bagid;
    logTerminalEvent('INFO', `BAG ID vastgesteld: ${bagid}`);

    // Haal afvalstromen op
    const streamsEndpoint = `${baseUrl}/rest/adressen/${bagid}/afvalstromen`;
    logTerminalEvent('HTTP', `GET ${streamsEndpoint}`);

    const streamsRes = await fetch(streamsEndpoint);
    if (!streamsRes.ok) {
      throw new Error(`Kon afvalstromen niet ophalen voor BAG ID ${bagid}`);
    }

    const streamsData = await streamsRes.json();

    const targetNames = {
      "Gft en etensresten": "Groenbak",
      "Duocontainer pbd/papier": "Grijze bak"
    };

    const targetCollected = [];
    const allCollected = [];

    for (const item of streamsData) {
      const title = item.title || '';
      const ophaaldatumStr = item.ophaaldatum;

      if (ophaaldatumStr) {
        const dateObj = parseWasteDate(ophaaldatumStr);
        const streamData = {
          name: targetNames[title] || title,
          original_title: title,
          date: dateObj,
          icon_data: item.icon_data,
          is_target: title in targetNames
        };

        allCollected.push(streamData);

        if (title in targetNames) {
          targetCollected.push(streamData);
        }
      }
    }

    targetCollected.sort((a, b) => a.date - b.date);
    allCollected.sort((a, b) => a.date - b.date);

    return {
      bagid: bagid,
      targets: targetCollected,
      allStreams: allCollected,
      rawStreams: streamsData
    };
  }

  function renderWasteSchedule(schedule) {
    const { targets, allStreams } = schedule;

    if (targets.length > 0) {
      const first = targets[0];
      const isGroen = first.name === 'Groenbak';
      
      firstHeroBox.className = `schedule-hero ${isGroen ? 'groenbak' : 'grijzebak'}`;
      firstHeroName.textContent = first.name;
      firstHeroDate.innerHTML = `${formatDateDutch(first.date)}`;
      firstHeroBadge.textContent = formatDaysUntil(first.date);
      firstHeroBox.classList.remove('hidden');

      if (targets.length > 1) {
        const next = targets[1];
        const isNextGroen = next.name === 'Groenbak';

        nextHeroBox.className = `schedule-hero ${isNextGroen ? 'groenbak' : 'grijzebak'}`;
        nextHeroName.textContent = next.name;
        nextHeroDate.innerHTML = `${formatDateDutch(next.date)}`;
        nextHeroBadge.textContent = formatDaysUntil(next.date);
        nextHeroBox.classList.remove('hidden');
      } else {
        nextHeroBox.classList.add('hidden');
      }
    } else {
      firstHeroBox.className = 'schedule-hero';
      firstHeroName.textContent = 'Geen ophaaldata';
      firstHeroDate.textContent = 'Geen ophaaldata gevonden voor Groenbak of Grijze bak.';
      firstHeroBadge.textContent = '-';
      nextHeroBox.classList.add('hidden');
    }

    allStreamsList.innerHTML = '';
    if (allStreams.length === 0) {
      allStreamsList.innerHTML = '<div class="stream-item">Geen actieve ophaaldata beschikbaar.</div>';
    } else {
      allStreams.forEach(item => {
        const div = document.createElement('div');
        div.className = 'stream-item';

        const iconHtml = item.icon_data 
          ? `<img src="${item.icon_data}" class="stream-icon-img" alt="${item.name}">`
          : `🗑️`;

        div.innerHTML = `
          <div class="stream-info">
            <div class="stream-icon-wrapper">${iconHtml}</div>
            <div>
              <div class="stream-title">${escapeHtml(item.name)}</div>
              <div class="stream-date-formatted">${formatDateDutch(item.date)}</div>
            </div>
          </div>
          <div class="stream-days-badge">${formatDaysUntil(item.date)}</div>
        `;
        allStreamsList.appendChild(div);
      });
    }
  }

  // --- FUNCTION 2: Spaarnelanden Container Status (CORS Proxy Chain) ---
  async function fetchContainerStatus(sRegistrationNumber) {
    // List of CORS proxies to try in order (ensures standalone operation without local Python server!)
    const urlsToTry = [
      'https://proxy.cors.sh/https://inzameling.spaarnelanden.nl/', // High reliability public CORS proxy
      '/api/inzameling', // Local Python server proxy if running
      'https://corsproxy.org/?https://inzameling.spaarnelanden.nl/',
      'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://inzameling.spaarnelanden.nl/'),
      'https://inzameling.spaarnelanden.nl/' // Direct fetch fallback
    ];

    let html = null;
    let lastErr = null;
    let successfulProxy = null;

    for (const url of urlsToTry) {
      logTerminalEvent('HTTP', `Trying container fetch via: ${url.length > 60 ? url.substring(0, 57) + '...' : url}`);
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const text = await res.text();
        if (text && text.includes('oContainerModel')) {
          html = text;
          successfulProxy = url;
          logTerminalEvent('INFO', `Succesvol antwoord ontvangen via ${url.split('/')[2] || 'local'}`);
          break;
        }
      } catch (e) {
        lastErr = e;
      }
    }

    if (!html) {
      throw new Error(`Kon containergegevens niet ophalen via CORS proxies. ${lastErr ? lastErr.message : ''}`);
    }

    const match = html.match(/var\s+oContainerModel\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) {
      throw new Error('var oContainerModel niet gevonden in HTML response van inzameling.spaarnelanden.nl');
    }

    let containers;
    try {
      containers = JSON.parse(match[1]);
      logTerminalEvent('INFO', `oContainerModel ontleed: totaal ${containers.length} containers in dataset.`);
    } catch (e) {
      throw new Error('Fout bij verwerken container JSON model');
    }

    const container = containers.find(item => String(item.sRegistrationNumber) === String(sRegistrationNumber));
    if (!container) {
      throw new Error(`Container met registratienummer "${sRegistrationNumber}" niet gevonden in het systeem.`);
    }

    return container;
  }

  function renderContainerStatus(container) {
    rawJsonPre.textContent = JSON.stringify(container, null, 2);

    const fillDegree = container.dFillingDegree !== undefined ? Math.round(container.dFillingDegree) : 0;
    
    // Animate Gauge Meter
    gaugePercent.textContent = `${fillDegree}%`;
    const circumference = 2 * Math.PI * 70;
    const strokeDashoffset = circumference - (fillDegree / 100) * circumference;
    gaugeFill.style.strokeDasharray = `${circumference} ${circumference}`;
    gaugeFill.style.strokeDashoffset = strokeDashoffset;

    if (fillDegree < 50) {
      gaugeFill.style.stroke = '#2e7d32';
    } else if (fillDegree < 80) {
      gaugeFill.style.stroke = '#f57c00';
    } else {
      gaugeFill.style.stroke = '#d32f2f';
    }

    setPill(pillEmptiedToday, container.bIsEmptiedToday, 'Vandaag geleegd', 'Niet vandaag geleegd');
    setPill(pillOutOfUse, container.bIsOutOfUse, 'Buiten gebruik', 'In gebruik', true);
    setPill(pillSkipped, container.bIsSkipped, 'Overgeslagen', 'Niet overgeslagen', true);

    containerRegVal.textContent = container.sRegistrationNumber || '-';
    containerProdVal.textContent = container.sProductName || '-';
    containerKindVal.textContent = container.sContainerKindName || '-';
    containerFillStatusVal.textContent = container.iFillingDegreeStatus !== undefined ? container.iFillingDegreeStatus : '-';
    containerLastEmptiedVal.textContent = container.sDateLastEmptied || '-';
    containerDistrictVal.textContent = container.iDistrictId !== undefined ? container.iDistrictId : '-';
    containerCityDistrictVal.textContent = container.iCityDistrictId !== undefined ? container.iCityDistrictId : '-';
    containerIdVal.textContent = container.iId || '-';

    if (container.dLatitude && container.dLongitude) {
      const lat = container.dLatitude.toFixed(5);
      const lng = container.dLongitude.toFixed(5);
      containerCoordsVal.textContent = `${lat}, ${lng}`;
      mapLinkBtn.href = `https://www.google.com/maps/search/?api=1&query=${container.dLatitude},${container.dLongitude}`;
      mapLinkBtn.classList.remove('hidden');
    } else {
      containerCoordsVal.textContent = '-';
      mapLinkBtn.classList.add('hidden');
    }

    if (container.sDefaultDays) {
      let daysHtml = container.sDefaultDays.replace(/src=['"]\/Images\//g, "src='https://inzameling.spaarnelanden.nl/Images/");
      daysScheduleBox.innerHTML = daysHtml;
    } else {
      daysScheduleBox.innerHTML = '<span class="meta-value">Geen schema beschikbaar</span>';
    }
  }

  function setPill(el, condition, positiveText, negativeText, isWarningIfTrue = false) {
    if (condition) {
      el.className = `status-pill ${isWarningIfTrue ? 'warning' : 'active'}`;
      el.textContent = `✓ ${positiveText}`;
    } else {
      el.className = 'status-pill inactive';
      el.textContent = `• ${negativeText}`;
    }
  }

  // --- 💻 TERMINAL SIMULATION ENGINE ---
  function clearTerminalTimeouts() {
    termAnimationTimeouts.forEach(t => clearTimeout(t));
    termAnimationTimeouts = [];
  }

  function initTerminalLog(postcode, houseNumber, containerReg) {
    clearTerminalTimeouts();
    const now = new Date().toLocaleTimeString();
    terminalBody.innerHTML = `
      <div class="term-line"><span class="term-time">[${now}]</span> <span class="term-prompt">spaarnelanden@system:~$</span> <span class="term-text-cmd">fetch-waste-data --postcode ${escapeHtml(postcode)} --house ${escapeHtml(houseNumber)} --container ${escapeHtml(containerReg)}</span></div>
      <div class="term-line"><span class="term-time">[${now}]</span> <span class="term-text-info">[INIT] Initializing Spaarnelanden network tasks...</span></div>
    `;
    scrollTerminalToBottom();
  }

  function logTerminalEvent(type, message) {
    const now = new Date().toLocaleTimeString();
    let typeClass = 'term-text-info';
    if (type === 'SUCCESS') typeClass = 'term-text-success';
    if (type === 'ERROR') typeClass = 'term-text-error';
    if (type === 'WARN') typeClass = 'term-text-warn';

    const line = document.createElement('div');
    line.className = 'term-line';
    line.innerHTML = `<span class="term-time">[${now}]</span> <span class="${typeClass}">[${type}] ${escapeHtml(message)}</span>`;
    
    terminalBody.appendChild(line);
    scrollTerminalToBottom();
  }

  function streamRawDataToTerminal(containerData, scheduleData) {
    if (!containerData && !scheduleData) return;

    let delay = 100;
    const appendLine = (htmlContent) => {
      const t = setTimeout(() => {
        const line = document.createElement('div');
        line.className = 'term-line';
        line.innerHTML = htmlContent;
        
        // Remove existing blinking cursor
        const existingCursor = terminalBody.querySelector('.blinking-cursor');
        if (existingCursor) existingCursor.remove();

        terminalBody.appendChild(line);
        scrollTerminalToBottom();
      }, delay);
      termAnimationTimeouts.push(t);
      delay += 80;
    };

    appendLine(`<span class="term-text-dim">--- START RAW DATA STREAM ---</span>`);

    if (containerData) {
      appendLine(`<span class="term-text-info">[CONTAINER DATA METRICS]</span>`);
      
      const keys = Object.keys(containerData);
      keys.forEach((key, idx) => {
        const val = containerData[key];
        let valFormatted = '';

        if (typeof val === 'object' && val !== null) {
          valFormatted = `<span class="term-text-val">${escapeHtml(JSON.stringify(val))}</span>`;
        } else if (typeof val === 'number') {
          valFormatted = `<span class="term-text-num">${val}</span>`;
        } else if (typeof val === 'boolean') {
          valFormatted = `<span class="term-text-warn">${val}</span>`;
        } else {
          valFormatted = `<span class="term-text-val">"${escapeHtml(String(val))}"</span>`;
        }

        const isLast = idx === keys.length - 1;
        appendLine(`  <span class="term-text-key">"${key}"</span>: ${valFormatted}${isLast ? '' : ','}`);
      });
    }

    if (scheduleData && scheduleData.targets) {
      appendLine(`<span class="term-text-info">[TARGET AFVALSTROMEN RESULTS]</span>`);
      scheduleData.targets.forEach((item) => {
        appendLine(`  • <span class="term-text-key">${escapeHtml(item.name)}</span> (${escapeHtml(item.original_title)}): <span class="term-text-val">${formatDateDutch(item.date)}</span> (<span class="term-text-num">${formatDaysUntil(item.date)}</span>)`);
      });
    }

    // Add trailing command prompt with blinking cursor
    const finalT = setTimeout(() => {
      const finalLine = document.createElement('div');
      finalLine.className = 'term-line';
      finalLine.innerHTML = `<span class="term-prompt">spaarnelanden@system:~$</span> <span class="term-text-dim">stream complete.</span> <span class="blinking-cursor"></span>`;
      terminalBody.appendChild(finalLine);
      scrollTerminalToBottom();
    }, delay + 100);
    termAnimationTimeouts.push(finalT);
  }

  function replayTerminalStream() {
    clearTerminalTimeouts();
    const pc = postcodeInput.value.trim();
    const hn = houseNumberInput.value.trim();
    const regNum = containerRegInput.value.trim();

    initTerminalLog(pc, hn, regNum);
    if (currentRawContainerData || currentRawScheduleData) {
      streamRawDataToTerminal(currentRawContainerData, currentRawScheduleData);
    } else {
      logTerminalEvent('WARN', 'Geen ruwe data beschikbaar om af te spelen. Voer eerst een zoekopdracht uit.');
    }
  }

  function scrollTerminalToBottom() {
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  // Utility Functions
  function parseWasteDate(dateStr) {
    const cleanDate = dateStr.split('T')[0];
    const [y, m, d] = cleanDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function formatDaysUntil(targetDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = target - today;
    const days = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (days === 0) return 'vandaag';
    if (days === 1) return 'morgen';
    if (days < 0) return `${Math.abs(days)} ${Math.abs(days) === 1 ? 'dag' : 'dagen'} geleden`;
    return `over ${days} dagen`;
  }

  function formatDateDutch(dateObj) {
    return new Intl.DateTimeFormat('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(dateObj);
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str);
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[m]);
  }

  function showLoading() {
    loadingState.classList.remove('hidden');
    dashboardContent.classList.add('hidden');
  }

  function hideLoading() {
    loadingState.classList.add('hidden');
  }

  function showError(msg) {
    errorMessage.innerHTML = msg;
    errorAlert.classList.remove('hidden');
  }

  function hideError() {
    errorAlert.classList.add('hidden');
    errorMessage.innerHTML = '';
  }
});
