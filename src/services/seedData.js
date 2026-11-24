// src/services/seedData.js
// Populates the NearBai system with the exact demo data for November 2026

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

const read = (k, f = []) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : f;
  } catch {
    return f;
  }
};

const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Helper to generate dates in November 2026
const getDateInNov2026 = (day, hour = 10) => {
  return new Date(2026, 10, day, hour, 0, 0).toISOString(); // Month 10 is November
};

// Helper to generate a random PH phone number
const generatePhone = () => {
  const prefixes = ['0905', '0906', '0915', '0916', '0917', '0918', '0927', '0935', '0936', '0945', '0956', '0961', '0975', '0995'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 9000000) + 1000000; // 7-digit number
  return `${prefix}${suffix}`;
};

// Helper to shuffle an array (Fisher-Yates)
const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Helper to get a random integer between min and max (inclusive)
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export function seedDemoData() {
  ensureSeeded();
  const users = read(KEYS.USERS);
  const admin = users.find((u) => u.role === 'admin');
  if (!admin) throw new Error('Admin account not found');

  // ─── 1. Create the Branch ───
  const houseId = uid();
  const house = {
    id: houseId,
    name: 'NearBai Main Branch',
    address: 'Poblacion, Kidapawan City, Cotabato',
    city: 'Kidapawan City',
    contactNumber: '09123456789',
    imageUrl: '',
    createdAt: getDateInNov2026(1),
  };
  write(KEYS.HOUSES, [house]);
  write(KEYS.CURRENT_HOUSE, houseId);

  admin.houseIds = [houseId];
  write(KEYS.USERS, users);

  // ─── 2. Create Rooms (Exact match to Table A) ───
  const roomsConfig = [
    { number: 'M101', type: 'Male', beds: 2, rate: 5000 },
    { number: 'M102', type: 'Male', beds: 3, rate: 7500 },
    { number: 'M103', type: 'Male', beds: 3, rate: 7500 },
    { number: 'F101', type: 'Female', beds: 3, rate: 7500 },
    { number: 'F102', type: 'Female', beds: 4, rate: 9500 },
    { number: 'F103', type: 'Female', beds: 3, rate: 7500 },
  ];

  const allRooms = roomsConfig.map((cfg) => {
    const roomId = uid();
    return {
      id: roomId,
      houseId,
      roomNumber: cfg.number,
      bedCapacity: cfg.beds,
      monthlyRate: cfg.rate,
      gender: cfg.type.toLowerCase(),
      notes: '',
      imageUrl: getRoomImage(roomId),
      createdAt: getDateInNov2026(1),
    };
  });
  write(KEYS.ROOMS, allRooms);

  const getRoom = (num) => allRooms.find((r) => r.roomNumber === num);

  // ─── 3. Create Tenants (Match Table B occupancy) ───
  const tenantsConfig = [
    { room: 'M101', name: 'Tenant M01' },
    { room: 'M101', name: 'Tenant M02' },
    { room: 'M102', name: 'Tenant M03' },
    { room: 'M102', name: 'Tenant M04' }, // Overdue
    { room: 'M103', name: 'Tenant M05' },
    { room: 'M103', name: 'Tenant M06' },
    { room: 'M103', name: 'Tenant M07' },
    { room: 'F101', name: 'Tenant F01' },
    { room: 'F101', name: 'Tenant F02' },
    { room: 'F101', name: 'Tenant F03' },
    { room: 'F102', name: 'Tenant F04' },
    { room: 'F102', name: 'Tenant F05' },
    { room: 'F102', name: 'Tenant F06' }, // Overdue
    { room: 'F103', name: 'Tenant F07' },
    { room: 'F103', name: 'Tenant F08' },
    { room: 'F103', name: 'Tenant F09' },
  ];

  const allTenants = [];
  const newUsers = [];

  tenantsConfig.forEach((t) => {
    const id = uid();
    const room = getRoom(t.room);
    const email = `${t.name.replace(/\s/g, '').toLowerCase()}@example.com`;
    const phone = generatePhone();

    newUsers.push({
      id,
      name: t.name,
      email,
      password: 'Tenant123!',
      role: 'tenant',
      houseIds: [houseId],
      phone,
      roomId: room.id,
      moveInDate: '2026-10-15',
      status: 'occupied',
      createdAt: getDateInNov2026(1),
    });

    allTenants.push({
      id,
      name: t.name,
      email,
      phone,
      emergencyContact: `Contact Person - ${generatePhone()}`,
      roomId: room.id,
      moveInDate: '2026-10-15',
      status: 'occupied',
      createdAt: getDateInNov2026(1),
    });
  });

  write(KEYS.USERS, [...users, ...newUsers]);
  write(KEYS.TENANTS, allTenants);

  // ─── 4. Generate Rent Payments (Match Table C & D) ───
  const allRents = [];
  const rentPaymentMap = {
    M101: { billed: 5000, collected: 5000 },
    M102: { billed: 5000, collected: 2500 },
    M103: { billed: 7500, collected: 7500 },
    F101: { billed: 7500, collected: 7500 },
    F102: { billed: 7125, collected: 5750 },
    F103: { billed: 7500, collected: 7500 },
  };

  allTenants.forEach((t) => {
    const room = allRooms.find((r) => r.id === t.roomId);
    const payInfo = rentPaymentMap[room.roomNumber];

    let amountPaid = payInfo.collected;
    let note = '';

    if (t.name === 'Tenant M04') {
      amountPaid = 0;
      note = 'Unpaid rent';
    } else if (t.name === 'Tenant F06') {
      amountPaid = 1000;
      note = 'Partial payment';
    } else {
      const roommates = allTenants.filter((x) => x.roomId === room.id).length;
      amountPaid = Math.ceil(payInfo.billed / roommates);
    }

    const perPersonDue = Math.ceil(
      payInfo.billed / allTenants.filter((x) => x.roomId === room.id).length
    );

    allRents.push({
      id: uid(),
      tenantId: t.id,
      billingMonth: 'November 2026',
      dueDate: '2026-11-05',
      amountDue: perPersonDue,
      amountPaid,
      paymentMethod: amountPaid > 0 ? 'cash' : null,
      orNumber: amountPaid > 0 ? `OR-2026${Math.floor(Math.random() * 1000)}` : '',
      notes: note,
      createdAt: getDateInNov2026(2),
      paidAt: amountPaid > 0 ? getDateInNov2026(3) : null,
    });
  });
  write(KEYS.RENT_PAYMENTS, allRents);

  // ─── 5. Generate Utility Charges (Match Table E) ───
  const allUtils = [];
  const utilMap = {
    M101: { tenants: 2, elec: 360, water: 240 },
    M102: { tenants: 2, elec: 360, water: 240 },
    M103: { tenants: 3, elec: 540, water: 360 },
    F101: { tenants: 3, elec: 540, water: 360 },
    F102: { tenants: 3, elec: 540, water: 360 },
    F103: { tenants: 3, elec: 540, water: 360 },
  };

  allTenants.forEach((t) => {
    const room = allRooms.find((r) => r.id === t.roomId);
    const utilInfo = utilMap[room.roomNumber];

    allUtils.push({
      id: uid(),
      tenantId: t.id,
      chargeType: 'electricity',
      amountBilled: utilInfo.elec / utilInfo.tenants,
      billingPeriod: 'November 2026',
      status: 'paid',
      notes: '',
      createdAt: getDateInNov2026(5),
    });
    allUtils.push({
      id: uid(),
      tenantId: t.id,
      chargeType: 'water',
      amountBilled: utilInfo.water / utilInfo.tenants,
      billingPeriod: 'November 2026',
      status: 'paid',
      notes: '',
      createdAt: getDateInNov2026(5),
    });
  });
  write(KEYS.UTILITY_CHARGES, allUtils);

  // ─── 6. Generate Expenses (Match Table F) ───
  const expensesConfig = [
    { desc: 'Electricity bill', amount: 2600 },
    { desc: 'Water bill', amount: 1100 },
    { desc: 'Internet', amount: 1200 },
    { desc: 'Cleaning', amount: 900 },
    { desc: 'Maintenance', amount: 650 },
    { desc: 'Cleaning supplies', amount: 450 },
  ];

  const allExpenses = expensesConfig.map((e) => ({
    id: uid(),
    houseId,
    description: e.desc,
    category: 'utilities',
    amount: e.amount,
    dateLogged: '2026-11-30',
    createdAt: getDateInNov2026(30),
  }));
  write(KEYS.EXPENSES, allExpenses);

  // ─── 7. Generate Inquiries / Reservations (Match Table G & H) ───
  const allReservations = [];

  // Helper to generate an inquiry with a specific status
  const createInq = (week, idx, status, gender) => {
    return {
      id: uid(),
      reference: `NBR-W${week}${idx}`,
      houseId,
      roomId: allRooms[0].id,
      fullName: `Inquirer ${status === 'pending' ? 'Pending' : 'Applicant'} W${week}-${idx}`,
      phone: generatePhone(),
      email: `w${week}-${idx}@example.com`,
      moveInDate: '2026-12-01',
      preferredRoomType: gender,
      notes: '',
      status: status,
      createdAt: getDateInNov2026(
        week === 1 ? Math.floor(Math.random() * 7) + 1 :
        week === 2 ? Math.floor(Math.random() * 7) + 8 :
        week === 3 ? Math.floor(Math.random() * 7) + 15 :
        Math.floor(Math.random() * 9) + 22
      ),
    };
  };

  // We must strictly maintain the totals from the adviser's image.
  // Week 1: 5 Total (2 Qualified) -> 3 remaining for Pending / Not Qualified
  // Week 2: 7 Total (3 Qualified) -> 4 remaining
  // Week 3: 8 Total (4 Qualified) -> 4 remaining
  // Week 4: 10 Total (6 Qualified) -> 4 remaining
  
  const weeksData = [
    { week: 1, total: 5, qualified: 2, remainder: 3 },
    { week: 2, total: 7, qualified: 3, remainder: 4 },
    { week: 3, total: 8, qualified: 4, remainder: 4 },
    { week: 4, total: 10, qualified: 6, remainder: 4 },
  ];

  weeksData.forEach(({ week, total, qualified, remainder }) => {
    // Determine how many are pending vs not_qualified.
    // Rule: Pending must be between 2 and 5.
    // But Pending cannot exceed the remainder.
    let pendingCount = randomInt(2, 5);
    if (pendingCount > remainder) {
      pendingCount = remainder;
    }
    
    const notQualifiedCount = remainder - pendingCount;

    // Create an array of statuses for this week
    const statuses = [
      ...Array(qualified).fill('qualified'),
      ...Array(pendingCount).fill('pending'),
      ...Array(notQualifiedCount).fill('not_qualified'),
    ];

    // Shuffle the statuses so they are mixed up chronologically
    const shuffledStatuses = shuffle(statuses);

    // Assign random genders (Male/Female) and create the records
    shuffledStatuses.forEach((status, idx) => {
      const gender = Math.random() > 0.5 ? 'Male' : 'Female';
      allReservations.push(createInq(week, idx + 1, status, gender));
    });
  });

  write(KEYS.RESERVATIONS, allReservations);

  write(KEYS.BOOKINGS, []);
  write(KEYS.FAVORITES, []);
  write(KEYS.ANNOUNCEMENTS, []);

  return {
    branches: 1,
    rooms: allRooms.length,
    tenants: allTenants.length,
    rentRecords: allRents.length,
    utilityRecords: allUtils.length,
    expenses: allExpenses.length,
    inquiries: allReservations.length,
  };
}

export function wipeAllData() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem('nb_session');
  localStorage.removeItem('nb_settings');
}