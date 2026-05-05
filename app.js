/**
 * Design Monk Work Log - Dashboard App
 * Fetches work-log.json from GitHub raw URL
 */

const REPO_OWNER = 'aouwalitshikkha';
const REPO_NAME = 'design-monk-repo';
const BRANCH = 'main';
const DATA_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/work-log.json`;
const ATTACHMENT_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/attachments`;

function fmtHours(n) {
  return (n || 0).toFixed(2);
}

class WorkLogApp {
  constructor() {
    this.entries = [];
    this.filteredEntries = [];
    this.charts = {};
    this.calendarMonth = new Date().getMonth();
    this.calendarYear = new Date().getFullYear();
    this.selectedDate = null;
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupFilters();
    this.render();
  }

  async loadData() {
    try {
      const response = await fetch(DATA_URL + '?_=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to load data');
      const data = await response.json();
      this.entries = data.entries || [];
      this.filteredEntries = [...this.entries];
    } catch (e) {
      console.error('Error loading data:', e);
      document.getElementById('entries-list').innerHTML = `
        <div class="p-8 text-center text-red-500">
          <p>Could not load work-log.json</p>
          <p class="text-sm mt-2">Make sure the repo is public and the file exists.</p>
        </div>
      `;
    }
  }

  async refreshData() {
    const btn = document.getElementById('reload-btn');
    if (btn) btn.textContent = 'Loading...';
    await this.loadData();
    this.setupFilters();
    this.render();
    if (btn) btn.textContent = 'Reload';
  }

  setupFilters() {
    const categories = [...new Set(this.entries.map(e => e.category))].sort();
    const select = document.getElementById('filter-category');
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
  }

  applyFilters() {
    const category = document.getElementById('filter-category').value;
    const from = document.getElementById('filter-from').value;
    const to = document.getElementById('filter-to').value;
    const search = document.getElementById('filter-search').value.toLowerCase();

    this.filteredEntries = this.entries.filter(entry => {
      if (category && entry.category !== category) return false;
      if (from && entry.date < from) return false;
      if (to && entry.date > to) return false;
      if (search) {
        const inTasks = entry.tasks.some(t => t.toLowerCase().includes(search));
        const inNotes = (entry.notes || '').toLowerCase().includes(search);
        const inBlockers = (entry.blockers || '').toLowerCase().includes(search);
        if (!inTasks && !inNotes && !inBlockers) return false;
      }
      return true;
    });

    this.render();
  }

  clearFilters() {
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-from').value = '';
    document.getElementById('filter-to').value = '';
    document.getElementById('filter-search').value = '';
    this.filteredEntries = [...this.entries];
    this.render();
  }

  render() {
    this.renderStats();
    this.renderEntries();
    this.renderCharts();
    this.renderCalendar();
  }

  renderStats() {
    const totalHours = this.filteredEntries.reduce((sum, e) => sum + (e.hours || 0), 0);
    const categories = new Set(this.filteredEntries.map(e => e.category)).size;
    const avg = this.filteredEntries.length ? (totalHours / this.filteredEntries.length) : 0;

    document.getElementById('stat-entries').textContent = this.filteredEntries.length;
    document.getElementById('stat-hours').textContent = fmtHours(totalHours);
    document.getElementById('stat-categories').textContent = categories;
    document.getElementById('stat-avg').textContent = fmtHours(avg);
    document.getElementById('total-hours').textContent = fmtHours(totalHours);
  }

  renderEntries() {
    const container = document.getElementById('entries-list');
    document.getElementById('entry-count').textContent = `${this.filteredEntries.length} entries`;

    if (!this.filteredEntries.length) {
      container.innerHTML = '<div class="p-8 text-center text-gray-400">No entries found</div>';
      return;
    }

    const sorted = [...this.filteredEntries].sort((a, b) => b.date.localeCompare(a.date));
    const limited = sorted.slice(0, 10);

    container.innerHTML = limited.map(entry => `
        <div class="p-4 hover:bg-gray-50 transition-colors">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="font-bold text-lg">${entry.date}</span>
                <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${entry.category}</span>
                <span class="text-sm text-gray-500">${fmtHours(entry.hours)}h</span>
              </div>
              <ul class="list-disc list-inside text-sm text-gray-700 mb-2 space-y-0.5">
                ${entry.tasks.map(t => `<li>${t}</li>`).join('')}
              </ul>
              ${entry.blockers && entry.blockers !== 'None' ? `<div class="text-sm text-orange-600 mb-1"><strong>Blockers:</strong> ${entry.blockers}</div>` : ''}
              ${entry.notes ? `<div class="text-sm text-gray-500 italic">${entry.notes}</div>` : ''}
              ${entry.attachments && entry.attachments.length ? `<div class="mt-2 flex gap-2 flex-wrap">${entry.attachments.map(a => `<a href="${ATTACHMENT_URL}/${a.split('/').pop()}" target="_blank" class="text-xs bg-gray-100 hover:bg-blue-50 text-blue-700 px-2 py-1 rounded border">${a.split('/').pop()}</a>`).join('')}</div>` : ''}
            </div>
          </div>
        </div>
      `).join('');
  }

  renderCharts() {
    // Category Chart
    const categoryData = {};
    this.filteredEntries.forEach(e => {
      categoryData[e.category] = (categoryData[e.category] || 0) + (e.hours || 0);
    });

    const catCtx = document.getElementById('category-chart');
    if (this.charts.category) this.charts.category.destroy();
    this.charts.category = new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categoryData),
        datasets: [{
          data: Object.values(categoryData),
          backgroundColor: [
            '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
            '#ef4444', '#06b6d4', '#84cc16', '#f97316'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });

    // Timeline Chart
    const sorted = [...this.filteredEntries].sort((a, b) => a.date.localeCompare(b.date));
    const timelineData = {};
    sorted.forEach(e => {
      timelineData[e.date] = (timelineData[e.date] || 0) + (e.hours || 0);
    });

    const timeCtx = document.getElementById('timeline-chart');
    if (this.charts.timeline) this.charts.timeline.destroy();
    this.charts.timeline = new Chart(timeCtx, {
      type: 'bar',
      data: {
        labels: Object.keys(timelineData),
        datasets: [{
          label: 'Hours',
          data: Object.values(timelineData),
          backgroundColor: '#3b82f6',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  generateReport(type) {
    let from, to, title;
    const today = new Date();

    if (type === 'weekly') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      from = monday.toISOString().split('T')[0];
      to = new Date().toISOString().split('T')[0];
      title = `Weekly Report (${from} to ${to})`;
    } else if (type === 'monthly') {
      const y = today.getFullYear();
      const m = today.getMonth() + 1;
      from = `${y}-${String(m).padStart(2, '0')}-01`;
      to = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;
      title = `Monthly Report - ${y}-${String(m).padStart(2, '0')}`;
    } else {
      from = document.getElementById('filter-from').value || this.entries[0]?.date;
      to = document.getElementById('filter-to').value || new Date().toISOString().split('T')[0];
      title = `Custom Report (${from} to ${to})`;
    }

    const reportEntries = this.entries.filter(e => e.date >= from && e.date <= to);
    const totalHours = reportEntries.reduce((s, e) => s + (e.hours || 0), 0);

    // Category breakdown
    const catBreakdown = {};
    reportEntries.forEach(e => {
      catBreakdown[e.category] = (catBreakdown[e.category] || 0) + (e.hours || 0);
    });

    const catRows = Object.entries(catBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, hrs]) => `<tr><td class="border px-3 py-1">${cat}</td><td class="border px-3 py-1 text-right">${fmtHours(hrs)}h</td></tr>`)
      .join('');

    // Day-by-day
    const dayRows = reportEntries
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(e => `
        <tr>
          <td class="border px-3 py-1">${e.date}</td>
          <td class="border px-3 py-1">${e.category}</td>
          <td class="border px-3 py-1 text-right">${fmtHours(e.hours)}h</td>
          <td class="border px-3 py-1">${e.tasks.join(', ')}</td>
        </tr>
      `).join('');

    const html = `
      <div id="pdf-report">
        <h3 class="text-xl font-bold mb-4">${title}</h3>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="bg-white p-3 rounded shadow">
            <div class="text-sm text-gray-500">Total Hours</div>
            <div class="text-2xl font-bold">${fmtHours(totalHours)}</div>
          </div>
          <div class="bg-white p-3 rounded shadow">
            <div class="text-sm text-gray-500">Total Entries</div>
            <div class="text-2xl font-bold">${reportEntries.length}</div>
          </div>
        </div>
        <h4 class="font-bold mb-2">Category Breakdown</h4>
        <table class="w-full text-sm mb-4">
          <thead><tr class="bg-gray-200"><th class="border px-3 py-1 text-left">Category</th><th class="border px-3 py-1 text-right">Hours</th></tr></thead>
          <tbody>${catRows}</tbody>
        </table>
        <h4 class="font-bold mb-2">Day-by-Day Log</h4>
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-200">
              <th class="border px-3 py-1 text-left">Date</th>
              <th class="border px-3 py-1 text-left">Category</th>
              <th class="border px-3 py-1 text-right">Hours</th>
              <th class="border px-3 py-1 text-left">Tasks</th>
            </tr>
          </thead>
          <tbody>${dayRows}</tbody>
        </table>
      </div>
    `;

    document.getElementById('report-content').innerHTML = html;
    document.getElementById('report-container').classList.remove('hidden');
    document.getElementById('report-container').scrollIntoView({ behavior: 'smooth' });
  }

  exportExcel() {
    const data = this.filteredEntries.map(e => ({
      Date: e.date,
      Hours: e.hours,
      Category: e.category,
      Tasks: e.tasks.join('; '),
      Blockers: e.blockers,
      Notes: e.notes
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Work Log');
    XLSX.writeFile(wb, `design-monk-work-log-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  exportPDF() {
    const element = document.getElementById('pdf-report');
    if (!element) {
      alert('Please generate a report first (Weekly/Monthly/Custom)');
      return;
    }

    const opt = {
      margin: 0.5,
      filename: `design-monk-report-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  }

  renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const label = document.getElementById('calendar-label');
    if (!grid) return;

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    label.textContent = `${monthNames[this.calendarMonth]} ${this.calendarYear}`;

    const entryDates = new Set(this.entries.map(e => e.date));

    const firstDay = new Date(this.calendarYear, this.calendarMonth, 1).getDay();
    const daysInMonth = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();

    const dayHeaders = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d =>
      `<div class="text-xs font-semibold text-gray-500 py-1">${d}</div>`
    ).join('');

    let daysHtml = '';
    for (let i = 0; i < firstDay; i++) {
      daysHtml += '<div></div>';
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${this.calendarYear}-${String(this.calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasEntry = entryDates.has(dateStr);
      const isSelected = this.selectedDate === dateStr;
      const today = new Date();
      const isToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}` === dateStr;

      let cls = 'rounded py-1 cursor-pointer transition-colors text-xs relative';
      if (isSelected) cls += ' bg-orange-400 text-white font-bold';
      else if (hasEntry) cls += ' bg-blue-100 hover:bg-blue-200';
      else cls += ' hover:bg-gray-100';
      if (isToday && !isSelected) cls += ' ring-1 ring-inset ring-gray-400';

      const dot = hasEntry ? '<span class="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500"></span>' : '';

      daysHtml += `<div class="${cls}" onclick="app.onDateClick('${dateStr}')">${d}${dot}</div>`;
    }

    grid.innerHTML = dayHeaders + daysHtml;
  }

  navigateCalendar(direction) {
    this.calendarMonth += direction;
    if (this.calendarMonth < 0) { this.calendarMonth = 11; this.calendarYear--; }
    if (this.calendarMonth > 11) { this.calendarMonth = 0; this.calendarYear++; }
    this.renderCalendar();
  }

  onDateClick(dateStr) {
    if (this.selectedDate === dateStr) {
      this.selectedDate = null;
      document.getElementById('filter-from').value = '';
      document.getElementById('filter-to').value = '';
      this.filteredEntries = [...this.entries];
    } else {
      this.selectedDate = dateStr;
      document.getElementById('filter-from').value = dateStr;
      document.getElementById('filter-to').value = dateStr;
      this.filteredEntries = this.entries.filter(e => e.date === dateStr);
    }
    this.renderStats();
    this.renderEntries();
    this.renderCharts();
    this.renderCalendar();
  }
}

const app = new WorkLogApp();
