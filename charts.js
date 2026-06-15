let mainChart = null;
let measurementsChart = null;

// --- MAIN STATS CHART ---
function renderStatsChart(type, data, labels, label) {
  const ctx = document.getElementById('main-chart');
  if (!ctx) return;

  if (mainChart) {
    mainChart.destroy();
    mainChart = null;
  }

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const textColor = isDark ? '#a0a0b0' : '#636e72';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const primaryColor = '#e94560';

  const datasets = [];

  if (type === 'weight-chart') {
    datasets.push({
      label: label || t('weight'),
      data: data.map(d => d.maxWeight || 0),
      borderColor: primaryColor,
      backgroundColor: primaryColor + '20',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: primaryColor,
      borderWidth: 2
    });
  } else if (type === 'volume-chart') {
    datasets.push({
      label: label || t('volume'),
      data: data.map(d => d.volume || 0),
      borderColor: '#2ecc71',
      backgroundColor: '#2ecc7120',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#2ecc71',
      borderWidth: 2
    });
  }

  mainChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: textColor, font: { size: 12 } }
        },
        tooltip: {
          backgroundColor: isDark ? '#16213e' : '#fff',
          titleColor: textColor,
          bodyColor: isDark ? '#f0f0f0' : '#2d3436',
          borderColor: isDark ? '#2a2a4a' : '#dfe6e9',
          borderWidth: 1,
          padding: 10,
          displayColors: false
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 10 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 10 } },
          beginAtZero: true
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

// --- MEASUREMENTS CHART ---
function renderMeasurementsChart(measurements) {
  const ctx = document.getElementById('measurements-chart');
  if (!ctx) return;

  if (measurementsChart) {
    measurementsChart.destroy();
    measurementsChart = null;
  }

  if (!measurements || measurements.length === 0) return;

  const sorted = [...measurements].sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(m => m.date);

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const textColor = isDark ? '#a0a0b0' : '#636e72';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  const datasets = [];
  const colors = ['#e94560', '#2ecc71', '#3498db', '#f1c40f', '#9b59b6', '#1abc9c'];
  const fields = ['chest', 'bicepsRight', 'bicepsLeft', 'thighRight', 'thighLeft', 'waist'];
  const fieldLabels = [t('chest'), t('biceps_right'), t('biceps_left'), t('thigh_right'), t('thigh_left'), t('waist')];

  fields.forEach((field, i) => {
    const data = sorted.map(m => parseFloat(m[field]) || null);
    if (data.some(v => v !== null)) {
      datasets.push({
        label: fieldLabels[i],
        data: data,
        borderColor: colors[i],
        backgroundColor: colors[i] + '15',
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        spanGaps: true
      });
    }
  });

  if (datasets.length === 0) return;

  measurementsChart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: { color: textColor, font: { size: 10 }, boxWidth: 10 }
        },
        tooltip: {
          backgroundColor: isDark ? '#16213e' : '#fff',
          titleColor: textColor,
          bodyColor: isDark ? '#f0f0f0' : '#2d3436',
          borderColor: isDark ? '#2a2a4a' : '#dfe6e9',
          borderWidth: 1,
          padding: 8,
          displayColors: true
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 9 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 9 } },
          beginAtZero: false
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

// --- STATS SUMMARY (LEPSZY KOMUNIKAT) ---
function renderStatsSummary(data, type) {
  const container = document.getElementById('stats-summary');
  if (!container) return;

  container.innerHTML = '';

  if (!data || data.length === 0) {
    container.innerHTML = '<div class="stat-box" style="grid-column: span 2;"><div class="stat-value">-</div><div class="stat-label">' + t('no_data') + '</div><div class="stat-label" style="font-size:0.7rem;">' + t('perform_workout_to_see_stats') + '</div></div>';
    return;
  }

  if (type === 'weight-chart') {
    const weights = data.map(d => d.maxWeight || 0).filter(w => w > 0);
    const max = Math.max(...weights);
    const avg = weights.length > 0 ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : 0;
    const pr = max;
    const count = data.length;

    container.innerHTML = `
      <div class="stat-box"><div class="stat-value">${pr} kg</div><div class="stat-label">${t('pr')}</div></div>
      <div class="stat-box"><div class="stat-value">${avg} kg</div><div class="stat-label">${t('avg_weight')}</div></div>
      <div class="stat-box"><div class="stat-value">${count}</div><div class="stat-label">${t('workouts_count')}</div></div>
      <div class="stat-box"><div class="stat-value">${max} kg</div><div class="stat-label">${t('max_weight')}</div></div>
    `;
  } else if (type === 'volume-chart') {
    const volumes = data.map(d => d.volume || 0).filter(v => v > 0);
    const total = volumes.reduce((a, b) => a + b, 0);
    const max = Math.max(...volumes, 0);
    const avg = volumes.length > 0 ? (total / volumes.length).toFixed(0) : 0;

    container.innerHTML = `
      <div class="stat-box"><div class="stat-value">${total.toLocaleString()}</div><div class="stat-label">${t('total_volume')}</div></div>
      <div class="stat-box"><div class="stat-value">${max.toLocaleString()}</div><div class="stat-label">${t('max_weight')}</div></div>
      <div class="stat-box"><div class="stat-value">${avg}</div><div class="stat-label">${t('avg_weight')}</div></div>
      <div class="stat-box"><div class="stat-value">${volumes.length}</div><div class="stat-label">${t('workouts_count')}</div></div>
    `;
  }
}

function updateChartTheme() {
  if (mainChart) {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#a0a0b0' : '#636e72';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    mainChart.options.scales.x.ticks.color = textColor;
    mainChart.options.scales.y.ticks.color = textColor;
    mainChart.options.scales.x.grid.color = gridColor;
    mainChart.options.scales.y.grid.color = gridColor;
    mainChart.options.plugins.legend.labels.color = textColor;
    mainChart.update();
  }

  if (measurementsChart) {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#a0a0b0' : '#636e72';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    measurementsChart.options.scales.x.ticks.color = textColor;
    measurementsChart.options.scales.y.ticks.color = textColor;
    measurementsChart.options.scales.x.grid.color = gridColor;
    measurementsChart.options.scales.y.grid.color = gridColor;
    measurementsChart.options.plugins.legend.labels.color = textColor;
    measurementsChart.update();
  }
}
