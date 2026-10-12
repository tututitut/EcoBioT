// =============================================================================
// EcoBioT Smart Composter - Production-Grade SaaS Monitoring Dashboard
// INOTECH 2026 - Universitas Sebelas Maret (UNS) Kampus Madiun
// =============================================================================

// --- 1. SIDEBAR INTERACTIVITY & PERSISTENCE ---
let isSidebarCollapsed = false;

function initSidebarState() {
    const savedState = localStorage.getItem('ecobiot_sidebar_collapsed');
    if (savedState === 'true') {
        setSidebarCollapsed(true, false);
    }
}

function toggleSidebar() {
    setSidebarCollapsed(!isSidebarCollapsed, true);
}

function setSidebarCollapsed(collapsed, savePreference = true) {
    isSidebarCollapsed = collapsed;
    const sidebar = document.getElementById('mainSidebar');
    const iconClose = document.getElementById('iconPanelClose');
    const iconOpen = document.getElementById('iconPanelOpen');

    if (!sidebar) return;

    if (collapsed) {
        sidebar.classList.add('sidebar-collapsed');
        if (iconClose) iconClose.classList.add('hidden');
        if (iconOpen) iconOpen.classList.remove('hidden');
    } else {
        sidebar.classList.remove('sidebar-collapsed');
        if (iconClose) iconClose.classList.remove('hidden');
        if (iconOpen) iconOpen.classList.add('hidden');
    }

    if (savePreference) {
        localStorage.setItem('ecobiot_sidebar_collapsed', collapsed ? 'true' : 'false');
    }

    // Trigger chart resize after layout transition finishes
    setTimeout(() => {
        if (sensorChart) sensorChart.resize();
        if (trendsChart) trendsChart.resize();
    }, 320);
}

function toggleMobileSidebar(open) {
    const sidebar = document.getElementById('mainSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!sidebar || !overlay) return;

    if (open) {
        sidebar.classList.remove('-translate-x-full');
        overlay.classList.remove('hidden');
    } else {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('hidden');
    }
}

// Close mobile drawer on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        toggleMobileSidebar(false);
    }
});

// --- 2. CLIENT-SIDE ROUTER & PAGE SWITCHING ---
let currentActivePage = 'dashboard';

const pageConfig = {
    dashboard: {
        breadcrumb: 'Dashboard',
        title: 'Dashboard Pengawasan Komposter',
        subtitle: 'Sistem Otomasi Berbasis IoT & Protokol Komunikasi MQTT'
    },
    status: {
        breadcrumb: 'Composter Status',
        title: 'Status & Subsistem Komposter',
        subtitle: 'Kondisi Reaktor Fisik, Siklus Dekomposisi & Monitoring Aktuator'
    },
    trends: {
        breadcrumb: 'Data Trends',
        title: 'Analisis Tren & Data Historis',
        subtitle: 'Visualisasi Fluktuasi Sensor, Kurva Termofilik & Ekspor Telemetri'
    },
    notifications: {
        breadcrumb: 'Notifications',
        title: 'Pusat Notifikasi & Alarm Sistem',
        subtitle: 'Riwayat Peringatan Ambang Batas Sensor & Algoritma Keselamatan IoT'
    },
    about: {
        breadcrumb: 'About',
        title: 'Tentang EcoBioT & Tim Inovasi',
        subtitle: 'INOTECH 2026 – Universitas Sebelas Maret (UNS) Kampus Madiun'
    }
};

function switchPage(pageId) {
    if (!pageConfig[pageId]) return;
    currentActivePage = pageId;

    // Close mobile sidebar if open
    toggleMobileSidebar(false);

    // Update Topbar Title & Breadcrumb
    const headerTitle = document.getElementById('headerTitle');
    const breadcrumbPage = document.getElementById('breadcrumbPage');
    if (headerTitle) headerTitle.innerText = pageConfig[pageId].title;
    if (breadcrumbPage) breadcrumbPage.innerText = pageConfig[pageId].breadcrumb;

    // Update Active Navigation Item Styling
    const navButtons = document.querySelectorAll('#sidebarNav .nav-item');
    navButtons.forEach(btn => {
        const btnPage = btn.getAttribute('data-page');
        if (btnPage === pageId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Toggle Section Display
    const sections = document.querySelectorAll('.page-section');
    sections.forEach(sec => sec.classList.add('hidden'));

    const targetSection = document.getElementById(`section-${pageId}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // Resize or lazy-initialize charts
    if (pageId === 'dashboard' && sensorChart) {
        setTimeout(() => sensorChart.resize(), 100);
    } else if (pageId === 'trends') {
        setTimeout(() => {
            if (!trendsChart) {
                initTrendsChart();
            } else {
                trendsChart.resize();
            }
        }, 100);
    }
}

// Initialize navigation listeners
document.addEventListener('DOMContentLoaded', () => {
    initSidebarState();

    const navButtons = document.querySelectorAll('#sidebarNav .nav-item');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            if (page) switchPage(page);
        });
    });

    // Populate initial historical telemetry table
    populateTelemetryTable(datasets24h);
});

// --- 3. DASHBOARD REAL-TIME SENSOR CHART ---
const ctxDashboard = document.getElementById('sensorChart').getContext('2d');
const sensorChart = new Chart(ctxDashboard, {
    type: 'line',
    data: {
        labels: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '13:30', 'Sekarang'],
        datasets: [
            {
                label: 'Suhu Kompos (°C)',
                data: [36, 39, 42, 44, 45, 47, 48, 48],
                borderColor: '#0F8B8D',
                backgroundColor: 'rgba(15, 139, 141, 0.10)',
                tension: 0.35,
                fill: true,
                borderWidth: 2.5,
                pointRadius: 3.5,
                pointHoverRadius: 6,
                pointBackgroundColor: '#0F8B8D'
            },
            {
                label: 'Kelembaban Media (%)',
                data: [64, 63, 63, 62, 61, 62, 62, 62],
                borderColor: '#2EB5B8',
                backgroundColor: 'rgba(46, 181, 184, 0.05)',
                tension: 0.35,
                borderWidth: 2,
                borderDash: [4, 4],
                fill: false,
                pointRadius: 3.5,
                pointHoverRadius: 6,
                pointBackgroundColor: '#2EB5B8'
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
                align: 'end',
                labels: {
                    boxWidth: 12,
                    boxHeight: 12,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    color: '#64777B',
                    font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '500' }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(24, 59, 61, 0.94)',
                padding: 12,
                cornerRadius: 10,
                titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '700' },
                bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '500' },
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1
            }
        },
        scales: {
            y: {
                min: 20,
                max: 70,
                ticks: {
                    stepSize: 10,
                    color: '#8E9EA1',
                    font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                    callback: (val) => val + '° / %'
                },
                grid: {
                    color: 'rgba(24, 59, 61, 0.06)'
                }
            },
            x: {
                ticks: {
                    color: '#8E9EA1',
                    font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 }
                },
                grid: {
                    display: false
                }
            }
        }
    }
});

// --- 4. DATA TRENDS & ANALYTICS SECTION ---
let trendsChart = null;
let currentRange = '24h';

const datasets24h = {
    labels: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', 'Sekarang'],
    suhu: [42, 43, 44, 44, 45, 46, 48, 48.5, 49, 48.2, 48.0, 48.0],
    kelembaban: [65, 65, 64, 64, 63, 62, 62, 61, 61, 62, 62, 62],
    ph: [6.3, 6.3, 6.4, 6.4, 6.5, 6.5, 6.5, 6.6, 6.6, 6.5, 6.5, 6.5],
    metana: [1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.8, 1.9, 1.8, 1.8, 1.8]
};

const datasets7d = {
    labels: ['Hari 1 (05/10)', 'Hari 2 (06/10)', 'Hari 3 (07/10)', 'Hari 4 (08/10)', 'Hari 5 (09/10)', 'Hari 6 (10/10)', 'Hari 7 (11/10)'],
    suhu: [28.5, 34.0, 41.2, 45.6, 47.8, 48.4, 48.0],
    kelembaban: [68.0, 66.5, 65.0, 63.5, 62.8, 62.0, 62.0],
    ph: [6.0, 6.1, 6.2, 6.4, 6.5, 6.5, 6.5],
    metana: [0.8, 1.1, 1.4, 1.6, 1.7, 1.8, 1.8]
};

const datasets30d = {
    labels: ['H-1 (Mulai)', 'H-4 (Termofilik)', 'H-8 (Hari Ini)', 'H-12 (Puncak)', 'H-16 (Pendinginan)', 'H-21 (Panen)'],
    suhu: [27.0, 42.5, 48.0, 52.0, 38.0, 29.0],
    kelembaban: [70.0, 65.0, 62.0, 58.0, 55.0, 50.0],
    ph: [5.8, 6.2, 6.5, 6.8, 7.1, 7.2],
    metana: [0.5, 1.4, 1.8, 2.2, 1.1, 0.4]
};

function initTrendsChart() {
    const canvasTrends = document.getElementById('trendsChart');
    if (!canvasTrends) return;
    const ctxTrends = canvasTrends.getContext('2d');

    trendsChart = new Chart(ctxTrends, {
        type: 'line',
        data: {
            labels: datasets24h.labels,
            datasets: [
                {
                    label: 'Suhu (°C)',
                    data: datasets24h.suhu,
                    borderColor: '#0F8B8D',
                    backgroundColor: 'rgba(15, 139, 141, 0.08)',
                    yAxisID: 'ySuhu',
                    tension: 0.35,
                    borderWidth: 2.5,
                    fill: false,
                    pointRadius: 4,
                    pointBackgroundColor: '#0F8B8D'
                },
                {
                    label: 'Kelembaban (%)',
                    data: datasets24h.kelembaban,
                    borderColor: '#2EB5B8',
                    backgroundColor: 'transparent',
                    yAxisID: 'yHum',
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 4,
                    pointBackgroundColor: '#2EB5B8'
                },
                {
                    label: 'pH Media (x10)',
                    data: datasets24h.ph.map(v => v * 10),
                    borderColor: '#8B5CF6',
                    backgroundColor: 'transparent',
                    yAxisID: 'yHum',
                    borderDash: [5, 5],
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#8B5CF6'
                },
                {
                    label: 'Metana CH₄ (ppm)',
                    data: datasets24h.metana,
                    borderColor: '#D97706',
                    backgroundColor: 'transparent',
                    yAxisID: 'yCh4',
                    tension: 0.35,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointBackgroundColor: '#D97706'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        boxWidth: 10,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        color: '#64777B',
                        font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '500' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(24, 59, 61, 0.94)',
                    padding: 12,
                    cornerRadius: 10,
                    titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '700' },
                    bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '500' },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            let value = context.parsed.y;
                            if (label.includes('pH')) {
                                return `pH Media: ${(value / 10).toFixed(1)}`;
                            }
                            return `${label}: ${value}`;
                        }
                    }
                }
            },
            scales: {
                ySuhu: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'Suhu (°C)', color: '#0F8B8D', font: { family: "'Plus Jakarta Sans', sans-serif", size: 10, weight: '600' } },
                    min: 20,
                    max: 65,
                    ticks: { stepSize: 10, color: '#8E9EA1' },
                    grid: { color: 'rgba(24, 59, 61, 0.05)' }
                },
                yHum: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Kelembaban (%) / pH x10', color: '#2EB5B8', font: { family: "'Plus Jakarta Sans', sans-serif", size: 10, weight: '600' } },
                    min: 40,
                    max: 80,
                    ticks: { color: '#8E9EA1' },
                    grid: { drawOnChartArea: false }
                },
                yCh4: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: 'Metana (ppm)', color: '#D97706', font: { family: "'Plus Jakarta Sans', sans-serif", size: 10, weight: '600' } },
                    min: 0,
                    max: 5,
                    ticks: { color: '#8E9EA1' },
                    grid: { drawOnChartArea: false }
                },
                x: {
                    ticks: { color: '#8E9EA1', font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } },
                    grid: { color: 'rgba(24, 59, 61, 0.04)' }
                }
            }
        }
    });
}

function changeTimeRange(range) {
    currentRange = range;
    const btn24h = document.getElementById('btnRange24h');
    const btn7d = document.getElementById('btnRange7d');
    const btn30d = document.getElementById('btnRange30d');

    const activeClasses = 'px-3.5 py-1.5 rounded-lg bg-[#0F8B8D] text-white shadow-xs font-bold transition';
    const inactiveClasses = 'px-3.5 py-1.5 rounded-lg text-[#64777B] hover:text-[#183B3D] transition';

    btn24h.className = range === '24h' ? activeClasses : inactiveClasses;
    btn7d.className = range === '7d' ? activeClasses : inactiveClasses;
    btn30d.className = range === '30d' ? activeClasses : inactiveClasses;

    let targetData = datasets24h;
    if (range === '7d') targetData = datasets7d;
    if (range === '30d') targetData = datasets30d;

    if (trendsChart) {
        trendsChart.data.labels = targetData.labels;
        trendsChart.data.datasets[0].data = targetData.suhu;
        trendsChart.data.datasets[1].data = targetData.kelembaban;
        trendsChart.data.datasets[2].data = targetData.ph.map(v => v * 10);
        trendsChart.data.datasets[3].data = targetData.metana;
        trendsChart.update();
    }

    populateTelemetryTable(targetData);
}

function populateTelemetryTable(data) {
    const tbody = document.getElementById('telemetryTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    for (let i = data.labels.length - 1; i >= 0; i--) {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-white/80 transition';

        const suhu = data.suhu[i];
        const hum = data.kelembaban[i];
        const ph = data.ph[i];
        const ch4 = data.metana[i];

        let statusAerasi = 'Blower Aktif (75%)';
        let kondisiBadge = '<span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">Optimal</span>';

        if (suhu < 40) {
            statusAerasi = 'Blower Minimal (30%)';
            kondisiBadge = '<span class="px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-semibold text-[10px]">Mesofilik</span>';
        }

        tr.innerHTML = `
            <td class="px-4 py-3 font-semibold text-[#183B3D] font-mono">${data.labels[i]}</td>
            <td class="px-4 py-3 font-bold text-[#0F8B8D]">${suhu}°C</td>
            <td class="px-4 py-3 text-cyan-700 font-medium">${hum}%</td>
            <td class="px-4 py-3">${ph}</td>
            <td class="px-4 py-3 text-amber-600 font-medium">${ch4} ppm</td>
            <td class="px-4 py-3 text-[#64777B]">${statusAerasi}</td>
            <td class="px-4 py-3">${kondisiBadge}</td>
        `;
        tbody.appendChild(tr);
    }
}

function exportDataCSV() {
    let targetData = datasets24h;
    if (currentRange === '7d') targetData = datasets7d;
    if (currentRange === '30d') targetData = datasets30d;

    let csvContent = "data:text/csv;charset=utf-8,Timestamp,Suhu_C,Kelembaban_Persen,pH_Media,Metana_CH4_ppm,Status_Aerasi,Kondisi\n";

    for (let i = 0; i < targetData.labels.length; i++) {
        const row = [
            `"${targetData.labels[i]}"`,
            targetData.suhu[i],
            targetData.kelembaban[i],
            targetData.ph[i],
            targetData.metana[i],
            '"Blower Aktif"',
            '"Optimal"'
        ].join(",");
        csvContent += row + "\n";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ecobiot_telemetri_${currentRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    addLog(`Ekspor data CSV berhasil diunduh (${currentRange})`, 'green', now);
}

// --- 5. NOTIFICATIONS CENTER ---
function filterNotifications(filterType) {
    const tabs = document.querySelectorAll('#notifFilterTabs button');
    tabs.forEach(btn => {
        btn.className = 'px-3.5 py-1.5 rounded-lg text-[#64777B] hover:text-[#183B3D] transition';
    });

    const activeTab = document.getElementById(`btnNotif${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`);
    if (activeTab) {
        activeTab.className = 'px-3.5 py-1.5 rounded-lg bg-[#0F8B8D] text-white font-bold transition';
    }

    const cards = document.querySelectorAll('#notificationsList .notif-card');
    cards.forEach(card => {
        const cardType = card.getAttribute('data-type');
        if (filterType === 'all' || cardType === filterType) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
}

function markNotificationAsRead(id) {
    const card = document.querySelector(`.notif-card[data-notif-id="${id}"]`);
    if (!card) return;

    card.setAttribute('data-unread', 'false');
    card.classList.add('opacity-75');

    // Remove unread badge
    const badge = card.querySelector('.badge-unread');
    if (badge) badge.remove();

    // Replace action button with text
    const btn = card.querySelector('.btn-mark-read');
    if (btn) {
        const span = document.createElement('span');
        span.className = 'text-[11px] text-[#8E9EA1] italic';
        span.innerText = 'Sudah dibaca';
        btn.replaceWith(span);
    }

    updateUnreadCount();
}

function markAllNotificationsAsRead() {
    const unreadCards = document.querySelectorAll('#notificationsList .notif-card[data-unread="true"]');
    unreadCards.forEach(card => {
        const id = card.getAttribute('data-notif-id');
        markNotificationAsRead(id);
    });

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    addLog('Semua notifikasi sistem ditandai sudah dibaca', 'teal', now);
}

function updateUnreadCount() {
    const unreadCards = document.querySelectorAll('#notificationsList .notif-card[data-unread="true"]');
    const count = unreadCards.length;

    const navBadge = document.getElementById('navNotifBadge');
    const headerDot = document.getElementById('headerNotifDot');
    const counterPill = document.getElementById('unreadCounterPill');

    if (navBadge) {
        if (count > 0) {
            navBadge.innerText = count;
            navBadge.classList.remove('hidden');
        } else {
            navBadge.classList.add('hidden');
        }
    }

    if (headerDot) {
        if (count > 0) {
            headerDot.classList.remove('hidden');
        } else {
            headerDot.classList.add('hidden');
        }
    }

    if (counterPill) {
        counterPill.innerText = count > 0 ? `${count} Baru` : '0 Baru';
        if (count === 0) {
            counterPill.className = 'px-2.5 py-0.5 bg-gray-100 text-[#64777B] font-bold text-xs rounded-full';
        }
    }
}

// --- 6. OVERRIDE CONTROL & ACTIVITY LOGS ---
function toggleManualMode(checkbox) {
    const controls = document.getElementById('manualControls');
    const badgeMode = document.getElementById('badgeMode');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (checkbox.checked) {
        controls.classList.remove('opacity-50', 'pointer-events-none');
        badgeMode.innerText = 'MANUAL (OVERRIDE)';
        badgeMode.className = 'text-amber-600 font-bold';
        addLog('Mode Manual (Override) diaktifkan via Web', 'orange', now);
    } else {
        controls.classList.add('opacity-50', 'pointer-events-none');
        badgeMode.innerText = 'AUTO-PILOT';
        badgeMode.className = 'text-[#0F8B8D] font-bold';
        addLog('Mode Auto-Pilot dikembalikan ke sistem', 'teal', now);
    }
}

function kirimPerintah(alat, aksi) {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let labelAlat = alat.toUpperCase();
    if (alat === 'valve') labelAlat = 'SOLENOID VALVE POC';
    if (alat === 'blower') labelAlat = 'BLOWER AERASI';

    const pesan = `Perintah MQTT: ${labelAlat} -> ${aksi}`;
    alert(`[Simulasi MQTT Terkirim]\n${pesan}\nTopik: innotech/ecobiot/control`);
    addLog(`Perintah Terkirim: ${labelAlat} di-${aksi}`, 'green', now);
}

function clearActivityLogs() {
    const logContainer = document.getElementById('logContainer');
    if (logContainer) {
        logContainer.innerHTML = '<div class="p-3 text-[#8E9EA1] italic text-[11px] text-center">Log aktivitas dibersihkan.</div>';
    }
}

function addLog(text, color, time) {
    const logContainer = document.getElementById('logContainer');
    if (!logContainer) return;

    let borderClass = 'border-[#0F8B8D] bg-teal-50/70 text-teal-900';
    let iconSvg = `<svg class="w-3.5 h-3.5 text-[#0F8B8D] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`;

    if (color === 'orange') {
        borderClass = 'border-amber-500 bg-amber-50/70 text-amber-900';
        iconSvg = `<svg class="w-3.5 h-3.5 text-amber-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`;
    } else if (color === 'green') {
        borderClass = 'border-emerald-500 bg-emerald-50/70 text-emerald-900';
        iconSvg = `<svg class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
    }

    const newLog = document.createElement('div');
    newLog.className = `p-2.5 border-l-2 ${borderClass} rounded-lg text-xs transition flex items-start gap-2`;
    newLog.innerHTML = `
        ${iconSvg}
        <div class="flex-1">
            <div class="font-medium">${text}</div>
            <span class="text-[10px] text-[#64777B] block mt-0.5">Baru saja (${time})</span>
        </div>
    `;

    logContainer.prepend(newLog);
}