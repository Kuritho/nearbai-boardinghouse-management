// src/services/seedData.js
// Populates the NearBai system with massive demo data across Mindanao.

import { ensureSeeded, getRoomImage } from './localDB';

const KEYS = {
  USERS: 'nb_users',
  HOUSES: 'nb_houses',
  ROOMS: 'nb_rooms',
  TENANTS: 'nb_tenants',
  RENT_PAYMENTS: 'nb_rent_payments',
  UTILITY_CHARGES: 'nb_utility_charges',
  EXPENSES: 'nb_expenses',
  CURRENT_HOUSE: 'nb_current_house',
  RESERVATIONS: 'nb_reservations',
  ANNOUNCEMENTS: 'nb_announcements',
  BOOKINGS: 'nb_bookings',
  FAVORITES: 'nb_favorites',
};

const FIRST_NAMES = [
  'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Lucia', 'Miguel', 'Sofia',
  'Mark', 'Jane', 'Ryan', 'Grace', 'Paolo', 'Mika', 'Daniel', 'Angela', 'Rafael', 'Camille',
  'Alex', 'Chloe', 'James', 'Patricia', 'Liam', 'Isabella', 'Gabriel', 'Bianca', 'Nico', 'Nicole',
  'Kenneth', 'Trisha', 'Jomar', 'Kim', 'Aldrin', 'Shara', 'Renz', 'Alyssa', 'Jayson', 'Diana',
  'Karl', 'Mariel', 'Jayson', 'Rhea', 'Bryan', 'Ivy', 'Joshua', 'Kate', 'Matthew', 'Yna',
  'Andres', 'Gabriela', 'Emilio', 'Apolinario', 'Melchora', 'Lapu-Lapu', 'Josefa', 'Marcelo'
];

const LAST_NAMES = [
  'Dela Cruz', 'Santos', 'Reyes', 'Cruz', 'Bautista', 'Garcia', 'Mendoza', 'Torres', 'Ramos', 'Villanueva',
  'Aquino', 'Domingo', 'Navarro', 'Rivera', 'Rosales', 'Pascual', 'Aguilar', 'Castillo', 'Flores', 'Gonzales',
  'Lopez', 'Perez', 'Tan', 'Lim', 'Sy', 'Ong', 'Chua', 'Uy', 'Co', 'Go',
  'Bacani', 'Salazar', 'Marquez', 'Aguirre', 'Panganiban', 'Dimaculangan', 'Espiritu', 'Manalo', 'Villamor', 'Cabrera',
  'Bonifacio', 'Silang', 'Luna', 'Mabini', 'Del Pilar', 'Jacinto', 'Quezon', 'Osmena', 'Roxas', 'Magsaysay'
];

// 10 major cities in Mindanao, 2 branches per city = 20 branches.
// Zamboanga removed. Kidapawan now has 2 branches.
const MINDANAO_BRANCHES = [
  // Davao City
  { name: 'Davao Main (Bajada)', address: '123 J.P. Laurel Ave, Bajada, Davao City', city: 'Davao City' },
  { name: 'Davao Annex (Matina)', address: '456 McArthur Highway, Matina, Davao City', city: 'Davao City' },
  
  // Cagayan de Oro
  { name: 'CDO Main (Divisoria)', address: '789 Corrales Ave, Divisoria, Cagayan de Oro', city: 'Cagayan de Oro' },
  { name: 'CDO Annex (Carmen)', address: '12 Velez St, Carmen, Cagayan de Oro', city: 'Cagayan de Oro' },
  
  // General Santos
  { name: 'GenSan Main (Pioneer)', address: '45 Pioneer Ave, General Santos City', city: 'General Santos' },
  { name: 'GenSan Annex (Lagao)', address: '88 Santiago Blvd, Lagao, General Santos City', city: 'General Santos' },
  
  // Butuan City
  { name: 'Butuan Main (Libertad)', address: '67 J.C. Aquino Ave, Libertad, Butuan City', city: 'Butuan City' },
  { name: 'Butuan Annex (Baan)', address: '33 Baan Km 3, Butuan City', city: 'Butuan City' },
  
  // Iligan City
  { name: 'Iligan Main (Poblacion)', address: '99 Quezon Ave, Poblacion, Iligan City', city: 'Iligan City' },
  { name: 'Iligan Annex (Tibanga)', address: '44 Tibanga Highway, Iligan City', city: 'Iligan City' },
  
  // Cotabato City
  { name: 'Cotabato Main (Sinsuat)', address: '12 Sinsuat Ave, Cotabato City', city: 'Cotabato City' },
  { name: 'Cotabato Annex (Rosary)', address: '56 Rosary Heights, Cotabato City', city: 'Cotabato City' },
  
  // Surigao City
  { name: 'Surigao Main (Borromeo)', address: '78 Borromeo St, Surigao City', city: 'Surigao City' },
  { name: 'Surigao Annex (Luna)', address: '23 Luna St, Surigao City', city: 'Surigao City' },
  
  // Kidapawan City (2 branches)
  { name: 'Kidapawan Main (Poblacion)', address: '34 Quezon Blvd, Poblacion, Kidapawan City', city: 'Kidapawan City' },
  { name: 'Kidapawan Annex (Magsaysay)', address: '89 Magsaysay St, Kidapawan City', city: 'Kidapawan City' },
  
  // Tagum City
  { name: 'Tagum Main (Rizal)', address: '12 Rizal St, Tagum City', city: 'Tagum City' },
  { name: 'Tagum Annex (Mabini)', address: '55 Mabini St, Tagum City', city: 'Tagum City' },
  
  // Digos City (Added to replace Zamboanga's 2 branches)
  { name: 'Digos Main (Rizal Ave)', address: '56 Rizal Ave, Digos City', city: 'Digos City' },
  { name: 'Digos Annex (Mabini Ext)', address: '78 Mabini Ext, Digos City', city: 'Digos City' },
];

const ANNOUNCEMENTS = [
  { title: 'Water interruption on Saturday', body: 'Scheduled maintenance on Nov 23, 8am–12nn. Please store water.', priority: 'important' },
  { title: 'Monthly rent due reminder', body: 'Rent is due every 5th of the month. Late payments incur a ₱200 penalty.', priority: 'normal' },
  { title: 'New CCTV installed', body: 'Security cameras have been installed at all entrances for your safety.', priority: 'normal' },
  { title: 'Fire drill this Friday', body: 'Mandatory fire drill at 3pm. Please cooperate.', priority: 'urgent' },
];

const EXPENSES = [
  { description: 'Repaired leaking roof', category: 'repair', amount: 3500 },
  { description: 'Monthly water bill (building total)', category: 'utilities', amount: 2800 },
  { description: 'Caretaker salary', category: 'salary', amount: 8000 },
  { description: 'Bought new bedsheets (5 sets)', category: 'supplies', amount: 1750 },
  { description: 'Real property tax Q4', category: 'tax', amount: 12500 },
  { description: 'Replaced broken faucet', category: 'repair', amount: 480 },
  { description: 'WiFi monthly subscription', category: 'utilities', amount: 1699 },
  { description: 'Repainted hallway', category: 'repair', amount: 2200 },
];

// Helpers
const read = (k, f = []) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : f;
  } catch { return f; }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randPhone = () => `09${randInt(10, 99)}${randInt(1000000, 9999999)}`;
const randEmail = (first, last, idx) => `${first.toLowerCase()}.${last.toLowerCase()}${idx}@example.com`;

function randomDateWithinPastYears(yearsBack = 2) {
  const now = new Date();
  const past = new Date();
  past.setFullYear(now.getFullYear() - yearsBack);
  const ts = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(ts);
}

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

export function seedDemoData() {
  ensureSeeded();
  const users = read(KEYS.USERS);
  const admin = users.find(u => u.role === 'admin');
  if (!admin) throw new Error('Admin account not found');

  // 1. Create 20 branches in Mindanao
  const housesArr = MINDANAO_BRANCHES.map(b => ({
    id: uid(),
    name: b.name,
    address: b.address,
    city: b.city,
    contactNumber: randPhone(),
    imageUrl: '',
    createdAt: new Date().toISOString(),
  }));
  write(KEYS.HOUSES, housesArr);
  write(KEYS.CURRENT_HOUSE, housesArr[0].id);

  // 2. Create rooms per branch (30-40 rooms per branch)
  const allRooms = [];
  housesArr.forEach((house) => {
    const roomCount = randInt(30, 40); 
    for (let i = 1; i <= roomCount; i++) {
      const isFemale = Math.random() > 0.5;
      const roomId = uid();
      allRooms.push({
        id: roomId,
        houseId: house.id,
        roomNumber: `${100 + i}`, 
        bedCapacity: randInt(4, 8), 
        monthlyRate: randInt(3, 8) * 1000, 
        gender: isFemale ? 'female' : 'male',
        notes: Math.random() > 0.7 ? 'Air-conditioned' : '',
        imageUrl: getRoomImage(roomId),
        createdAt: new Date().toISOString(),
      });
    }
  });
  write(KEYS.ROOMS, allRooms);

  // 3. Create tenants (~7,000+)
  const allTenants = [];
  const newUsers = [];
  let globalTenantCounter = 1;

  for (const room of allRooms) {
    // Fill 60-90% of the room capacity
    const fillCount = randInt(Math.ceil(room.bedCapacity * 0.6), room.bedCapacity); 
    
    for (let i = 0; i < fillCount; i++) {
      const first = rand(FIRST_NAMES);
      const last = rand(LAST_NAMES);
      const fullName = `${first} ${last}`;
      const email = randEmail(first, last, globalTenantCounter);
      const phone = randPhone();
      const moveIn = randomDateWithinPastYears(1.5);
      const id = uid();

      const tenant = {
        id,
        name: fullName,
        email,
        password: 'Tenant123!',
        role: 'tenant',
        houseIds: [room.houseId],
        phone,
        emergencyContact: `${rand(FIRST_NAMES)} ${rand(LAST_NAMES)} — ${randPhone()}`,
        roomId: room.id,
        moveInDate: formatDate(moveIn),
        status: 'occupied',
        createdAt: moveIn.toISOString(),
      };
      newUsers.push(tenant);
      allTenants.push({
        id,
        name: fullName,
        email,
        phone,
        emergencyContact: tenant.emergencyContact,
        roomId: room.id,
        moveInDate: tenant.moveInDate,
        status: 'occupied',
        createdAt: tenant.createdAt,
      });
      globalTenantCounter++;
    }
  }
  write(KEYS.USERS, [...users, ...newUsers]);
  write(KEYS.TENANTS, allTenants);

  // 4. Generate rent payments (1 month history to save space)
  const allRents = [];
  const now = new Date();
  allTenants.forEach((t) => {
    const room = allRooms.find(r => r.id === t.roomId);
    const roommates = allTenants.filter(x => x.roomId === t.roomId).length;
    const perTenant = Math.ceil(room.monthlyRate / roommates);
    const moveIn = new Date(t.moveInDate);
    const billingDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (billingDate >= moveIn) {
      const dueDate = new Date(billingDate.getFullYear(), billingDate.getMonth(), moveIn.getDate());
      const roll = Math.random();
      let amountPaid = 0;
      let paidAt = null;
      let method = null;
      
      if (roll < 0.6) { amountPaid = perTenant; paidAt = new Date(billingDate).toISOString(); method = ['cash', 'gcash', 'bank'][randInt(0, 2)]; }
      else if (roll < 0.8) { amountPaid = Math.ceil(perTenant / 2); paidAt = new Date(billingDate).toISOString(); method = 'cash'; }

      allRents.push({
        id: uid(),
        tenantId: t.id,
        billingMonth: billingDate.toLocaleString('en-PH', { month: 'long', year: 'numeric' }),
        dueDate: formatDate(dueDate),
        amountDue: perTenant,
        amountPaid,
        paymentMethod: method,
        orNumber: amountPaid > 0 ? `OR-${randInt(100000, 999999)}` : '',
        notes: '',
        createdAt: billingDate.toISOString(),
        paidAt,
      });
    }
  });
  write(KEYS.RENT_PAYMENTS, allRents);

  // 5. Generate utility charges (1 month history)
  const allUtils = [];
  allTenants.forEach((t) => {
    const roommates = allTenants.filter(x => x.roomId === t.roomId).length;
    const billingDate = new Date(now.getFullYear(), now.getMonth(), 1);
    
    if (billingDate >= new Date(t.moveInDate)) {
      allUtils.push({
        id: uid(),
        tenantId: t.id,
        chargeType: 'electricity',
        amountBilled: Math.ceil(randInt(800, 3000) / roommates),
        billingPeriod: billingDate.toLocaleString('en-PH', { month: 'long', year: 'numeric' }),
        status: Math.random() > 0.4 ? 'paid' : 'unpaid',
        notes: '',
        createdAt: billingDate.toISOString(),
      });
      allUtils.push({
        id: uid(),
        tenantId: t.id,
        chargeType: 'water',
        amountBilled: Math.ceil(randInt(200, 600) / roommates),
        billingPeriod: billingDate.toLocaleString('en-PH', { month: 'long', year: 'numeric' }),
        status: Math.random() > 0.4 ? 'paid' : 'unpaid',
        notes: '',
        createdAt: billingDate.toISOString(),
      });
    }
  });
  write(KEYS.UTILITY_CHARGES, allUtils);

  // 6. Generate expenses (4 per branch)
  const allExpenses = [];
  housesArr.forEach((h) => {
    EXPENSES.slice(0, 4).forEach((e) => {
      const d = randomDateWithinPastYears(0.5);
      allExpenses.push({
        id: uid(),
        houseId: h.id,
        description: e.description,
        category: e.category,
        amount: e.amount,
        dateLogged: formatDate(d),
        createdAt: d.toISOString(),
      });
    });
  });
  write(KEYS.EXPENSES, allExpenses);

  // 7. Generate announcements (2 per branch)
  const allAnnouncements = [];
  housesArr.forEach((h) => {
    ANNOUNCEMENTS.slice(0, 2).forEach((a) => {
      const d = randomDateWithinPastYears(0.3);
      allAnnouncements.push({
        id: uid(),
        houseId: h.id,
        title: a.title,
        body: a.body,
        priority: a.priority,
        createdAt: d.toISOString(),
      });
    });
  });
  write(KEYS.ANNOUNCEMENTS, allAnnouncements);

  // 8. Generate pending reservations (1 per branch)
  const allReservations = [];
  housesArr.forEach((h) => {
    const houseRooms = allRooms.filter(r => r.houseId === h.id);
    const room = rand(houseRooms);
    if (!room) return;

    const first = rand(FIRST_NAMES);
    const last = rand(LAST_NAMES);
    const d = randomDateWithinPastYears(0.1);
    allReservations.push({
      id: uid(),
      reference: 'NBR-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
      houseId: h.id,
      roomId: room.id,
      fullName: `${first} ${last}`,
      phone: randPhone(),
      email: `${first.toLowerCase()}.${last.toLowerCase()}@gmail.com`,
      moveInDate: formatDate(new Date(Date.now() + randInt(1, 30) * 86400000)),
      notes: 'Looking for a quiet place near the university.',
      status: 'pending',
      createdAt: d.toISOString(),
    });
  });
  write(KEYS.RESERVATIONS, allReservations);

  write(KEYS.BOOKINGS, []);
  write(KEYS.FAVORITES, []);

  return {
    branches: housesArr.length,
    rooms: allRooms.length,
    tenants: allTenants.length,
    rentRecords: allRents.length,
    utilityRecords: allUtils.length,
    expenses: allExpenses.length,
    announcements: allAnnouncements.length,
    reservations: allReservations.length,
  };
}

export function wipeAllData() {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  localStorage.removeItem('nb_session');
  localStorage.removeItem('nb_settings');
}