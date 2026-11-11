// src/services/exportService.js

// ─── Single-table export ───
export function exportToCSV(filename, rows) {
  if (!rows || rows.length === 0) {
    alert('No data to export');
    return;
  }
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(header => {
        let cell = row[header] === null || row[header] === undefined ? '' : row[header];
        cell = String(cell).replace(/"/g, '""');
        return `"${cell}"`;
      }).join(',')
    )
  ].join('\n');

  triggerDownload(csvContent, filename);
}

// ─── Multi-section export (one file, multiple labeled tables) ───
export function exportMultipleToCSV(filename, sections) {
  if (!sections || sections.length === 0) {
    alert('No data to export');
    return;
  }

  let csvContent = '';

  sections.forEach((section, index) => {
    if (!section.rows || section.rows.length === 0) return;

    // Blank line between sections (except before the first)
    if (index > 0) csvContent += '\n\n';

    // Section title row
    csvContent += `"${section.title}"\n`;

    // Header row
    const headers = Object.keys(section.rows[0]);
    csvContent += headers.map(h => `"${h}"`).join(',') + '\n';

    // Data rows
    section.rows.forEach(row => {
      csvContent += headers.map(header => {
        let cell = row[header] === null || row[header] === undefined ? '' : row[header];
        cell = String(cell).replace(/"/g, '""');
        return `"${cell}"`;
      }).join(',') + '\n';
    });
  });

  triggerDownload(csvContent, filename);
}

// ─── Shared download trigger ───
function triggerDownload(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}