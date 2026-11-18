// src/services/exportService.js
import ExcelJS from 'exceljs';
import { 
  houses, rooms, tenants, rentPayments, utilityCharges, expenses, reservations 
} from './localDB';

// ─── Single-table export (CSV) ───
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

  triggerDownloadCSV(csvContent, filename);
}

// ─── Multi-section export (CSV) ───
export function exportMultipleToCSV(filename, sections) {
  if (!sections || sections.length === 0) {
    alert('No data to export');
    return;
  }

  let csvContent = '';

  sections.forEach((section, index) => {
    if (!section.rows || section.rows.length === 0) return;

    if (index > 0) csvContent += '\n\n';
    csvContent += `"${section.title}"\n`;

    const headers = Object.keys(section.rows[0]);
    csvContent += headers.map(h => `"${h}"`).join(',') + '\n';

    section.rows.forEach(row => {
      csvContent += headers.map(header => {
        let cell = row[header] === null || row[header] === undefined ? '' : row[header];
        cell = String(cell).replace(/"/g, '""');
        return `"${cell}"`;
      }).join(',') + '\n';
    });
  });

  triggerDownloadCSV(csvContent, filename);
}

// ─── Styled Excel Export (The Simulation Dataset) ───
export async function exportSimulationDataset() {
  const house = houses.current();
  if (!house) return alert('No property found to export data for.');

  // Fetch all data
  const allRooms = rooms.list(house.id);
  const allTenants = tenants.list(house.id);
  const allRents = rentPayments.listForHouse(house.id);
  const allUtils = utilityCharges.listForHouse(house.id);
  const allExpenses = expenses.list(house.id);
  const allInquiries = reservations.list(house.id);

  const fmt = (num) => `₱${Number(num || 0).toLocaleString('en-PH')}`;

  // --- Calculate Data (Tables A-I) ---
  let totalBeds = 0, totalRent = 0;
  const tableA = allRooms.map(r => {
    const rentPerBed = Math.ceil(r.monthlyRate / r.bedCapacity);
    totalBeds += r.bedCapacity; totalRent += r.monthlyRate;
    return [r.roomNumber, r.gender || 'Mixed', r.bedCapacity, fmt(r.monthlyRate), fmt(rentPerBed)];
  });
  tableA.push(['Total', '—', totalBeds, fmt(totalRent), '—']);

  let totalOccupied = 0, totalVacant = 0;
  const tableB = allRooms.map(r => {
    const occupied = allTenants.filter(t => t.roomId === r.id && t.status === 'occupied').length;
    const vacant = Math.max(0, r.bedCapacity - occupied);
    const occRate = r.bedCapacity > 0 ? Math.round((occupied / r.bedCapacity) * 100) : 0;
    totalOccupied += occupied; totalVacant += vacant;
    return [r.roomNumber, occupied, vacant, `${occRate}%`];
  });
  const overallOcc = totalBeds > 0 ? ((totalOccupied / totalBeds) * 100).toFixed(1) : 0;
  tableB.push(['Total', totalOccupied, totalVacant, `${overallOcc}%`]);

  let totalBilled = 0, totalCollected = 0, totalUnpaid = 0;
  const tableC = allRooms.map(r => {
    const roomRents = allRents.filter(p => p.roomNumber === r.roomNumber);
    const billed = roomRents.reduce((s, p) => s + p.amountDue, 0);
    const collected = roomRents.reduce((s, p) => s + p.amountPaid, 0);
    const unpaid = billed - collected;
    totalBilled += billed; totalCollected += collected; totalUnpaid += unpaid;
    return [r.roomNumber, fmt(billed), fmt(collected), fmt(unpaid)];
  });
  tableC.push(['Total', fmt(totalBilled), fmt(totalCollected), fmt(totalUnpaid)]);

  const overdueList = allRents.filter(r => r.balance > 0);
  let dRentDue = 0, dPaid = 0, dOverdue = 0;
  const tableD = overdueList.map(r => {
    dRentDue += r.amountDue; dPaid += r.amountPaid; dOverdue += r.balance;
    return [r.tenantName, r.roomNumber, fmt(r.amountDue), fmt(r.amountPaid), fmt(r.balance)];
  });
  if (tableD.length === 0) tableD.push(['No overdue tenants', '', '', '', '']);
  tableD.push(['Total', '—', fmt(dRentDue), fmt(dPaid), fmt(dOverdue)]);

  let totalElec = 0, totalWater = 0, totalUtils = 0;
  const tableE = allRooms.map(r => {
    const roomUtils = allUtils.filter(u => u.roomNumber === r.roomNumber);
    const elec = roomUtils.filter(u => u.chargeType === 'electricity').reduce((s, u) => s + u.amountBilled, 0);
    const water = roomUtils.filter(u => u.chargeType === 'water').reduce((s, u) => s + u.amountBilled, 0);
    const total = elec + water;
    if (total === 0) return null;
    const occupants = allTenants.filter(t => t.roomId === r.id && t.status === 'occupied').length;
    totalElec += elec; totalWater += water; totalUtils += total;
    return [r.roomNumber, occupants, fmt(elec), fmt(water), fmt(total)];
  }).filter(Boolean);
  tableE.push(['Total', totalOccupied, fmt(totalElec), fmt(totalWater), fmt(totalUtils)]);

  let totalExp = 0;
  const tableF = allExpenses.map(e => {
    totalExp += e.amount;
    return [e.description, fmt(e.amount)];
  });
  tableF.push(['Total Expenses', fmt(totalExp)]);

  const maleInq = allInquiries.filter(i => i.preferredRoomType?.toLowerCase() === 'male');
  const femaleInq = allInquiries.filter(i => i.preferredRoomType?.toLowerCase() === 'female');
  const maleQual = maleInq.filter(i => i.status === 'qualified').length;
  const femaleQual = femaleInq.filter(i => i.status === 'qualified').length;
  const maleRooms = allRooms.filter(r => r.gender === 'male');
  const femaleRooms = allRooms.filter(r => r.gender === 'female');
  const maleAvail = maleRooms.reduce((s, r) => s + r.bedCapacity, 0) - allTenants.filter(t => t.status === 'occupied' && maleRooms.some(r => r.id === t.roomId)).length;
  const femaleAvail = femaleRooms.reduce((s, r) => s + r.bedCapacity, 0) - allTenants.filter(t => t.status === 'occupied' && femaleRooms.some(r => r.id === t.roomId)).length;
  const tableG = [
    ['Male', maleInq.length, maleQual, Math.max(0, maleAvail), Math.max(0, maleQual - maleAvail)],
    ['Female', femaleInq.length, femaleQual, Math.max(0, femaleAvail), Math.max(0, femaleQual - femaleAvail)],
    ['Total', allInquiries.length, maleQual + femaleQual, Math.max(0, maleAvail + femaleAvail), '—']
  ];

  const weeks = [
    { label: 'Week 1 (Nov 1-7)', total: 0, qualified: 0 },
    { label: 'Week 2 (Nov 8-14)', total: 0, qualified: 0 },
    { label: 'Week 3 (Nov 15-21)', total: 0, qualified: 0 },
    { label: 'Week 4 (Nov 22-30)', total: 0, qualified: 0 },
  ];
  allInquiries.forEach(inq => {
    const day = new Date(inq.createdAt).getDate();
    const idx = day > 21 ? 3 : day > 14 ? 2 : day > 7 ? 1 : 0;
    weeks[idx].total++;
    if (inq.status === 'qualified') weeks[idx].qualified++;
  });
  const tableH = weeks.map(w => [w.label, w.total, w.qualified]);
  tableH.push(['Total', allInquiries.length, maleQual + femaleQual]);

  const totalColl = totalCollected + totalUtils;
  const netCash = totalColl - totalExp;
  const uncollected = totalUnpaid + (totalUtils - allUtils.filter(u => u.status === 'paid').reduce((s, u) => s + u.amountBilled, 0));
  const rentRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(2) : 0;
  const utilRate = totalUtils > 0 ? ((allUtils.filter(u => u.status === 'paid').reduce((s, u) => s + u.amountBilled, 0) / totalUtils) * 100).toFixed(2) : 0;

  const tableI = [
    ['Occupancy Rate', `${overallOcc}% (${totalOccupied}/${totalBeds} beds)`],
    ['Rent Collection Rate', `${rentRate}% (${fmt(totalCollected)} / ${fmt(totalBilled)})`],
    ['Utility Collection Rate', `${utilRate}%`],
    ['Overdue Tenants', overdueList.length],
    ['Total Uncollected Bills', fmt(uncollected)],
    ['Net Cash Flow', `${fmt(netCash)} (${fmt(totalColl)} collections - ${fmt(totalExp)} expenses)`],
  ];

  // ─── BUILD EXCEL WORKBOOK WITH STYLING ───
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Simulation Dataset');

  // Colors
  const purpleFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4C1D95' } }; // Dark purple
  const lightPurpleFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } }; // Light purple
  const whiteFont = { color: { argb: 'FFFFFFFF' }, bold: true };
  const purpleFont = { color: { argb: 'FF4C1D95' }, bold: true };

  // Helper to add a table
  const addTable = (title, headers, rows) => {
    // 1. Title Row
    const titleRow = worksheet.addRow([title]);
    titleRow.getCell(1).fill = purpleFill;
    titleRow.getCell(1).font = whiteFont;
    // Merge cells for the title to look nice
    worksheet.mergeCells(`A${titleRow.number}:E${titleRow.number}`);

    // 2. Header Row
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.fill = lightPurpleFill;
      cell.font = purpleFont;
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // 3. Data Rows
    rows.forEach(rowData => {
      const row = worksheet.addRow(rowData);
      const isTotal = rowData[0] === 'Total' || rowData[0] === 'Total Expenses';
      
      row.eachCell((cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        if (isTotal) {
          cell.font = { bold: true, color: { argb: 'FF4C1D95' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } }; // Very light purple for totals
        }
      });
    });

    // 4. Empty row
    worksheet.addRow([]);
  };

  // Title block
  const mainTitle = worksheet.addRow(['NearBai Simulation Dataset']);
  mainTitle.font = { size: 16, bold: true, color: { argb: 'FF4C1D95' } };
  worksheet.mergeCells(`A${mainTitle.number}:E${mainTitle.number}`);

  const subTitle = worksheet.addRow(['Boarding House Management | November 2026 (1-Month Data)']);
  subTitle.font = { italic: true, color: { argb: 'FF666666' } };
  worksheet.mergeCells(`A${subTitle.number}:E${subTitle.number}`);
  worksheet.addRow([]);

  // Add all 9 tables
  addTable('A. Room Configuration', ['Room', 'Type', 'Beds', 'Room Rent', 'Rent per Bed'], tableA);
  addTable('B. Occupancy Data', ['Room', 'Occupied', 'Vacant', 'Occupancy'], tableB);
  addTable('C. Rent Payment Summary', ['Room', 'Billed', 'Collected', 'Unpaid'], tableC);
  addTable('D. Overdue Tenants', ['Tenant', 'Room', 'Rent Due', 'Paid', 'Overdue'], tableD);
  addTable('E. Utility Charges', ['Room', 'Tenants', 'Electricity', 'Water', 'Total'], tableE);
  addTable('F. Operating Expenses', ['Expense', 'Amount'], tableF);
  addTable('G. Inquiry Summary', ['Room Pref', 'Total Inq', 'Qualified', 'Avail Beds', 'Demand Gap'], tableG);
  addTable('H. Weekly Inquiry Trend', ['Week', 'Total Inq', 'Qualified'], tableH);
  addTable('I. Key Results', ['Metric', 'Value'], tableI);

  // Set column widths
  worksheet.columns = [
    { width: 25 }, // Column A
    { width: 18 }, // Column B
    { width: 15 }, // Column C
    { width: 20 }, // Column D
    { width: 20 }, // Column E
  ];

  // Generate and download the file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'NearBai_Simulation_Dataset_Nov2026.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Shared CSV download trigger ───
function triggerDownloadCSV(content, filename) {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}