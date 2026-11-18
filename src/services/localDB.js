// src/services/localDB.js — NearBai Information System

const KEYS = {
  USERS: 'nb_users',
  HOUSES: 'nb_houses',
  ROOMS: 'nb_rooms',
  TENANTS: 'nb_tenants',
  RENT_PAYMENTS: 'nb_rent_payments',
  UTILITY_CHARGES: 'nb_utility_charges',
  EXPENSES: 'nb_expenses',
  SESSION: 'nb_session',
  SETTINGS: 'nb_settings',
  CURRENT_HOUSE: 'nb_current_house',
  RESERVATIONS: 'nb_reservations',
  ANNOUNCEMENTS: 'nb_announcements',
  BOOKINGS: 'nb_bookings',
  FAVORITES: 'nb_favorites',
};

const read = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const ADMIN_EMAIL = 'admin@nearbai.ph';
const ADMIN_PASSWORD = 'Admin123!';
const CARETAKER_EMAIL = 'caretaker@nearbai.ph';
const CARETAKER_PASSWORD = 'Caretaker123!';

const ROOM_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1560185008-b033106af5c3?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=82',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=82',
];

export function getRoomImage(roomId = '') {
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) {
    hash = ((hash << 5) - hash + roomId.charCodeAt(i)) | 0;
  }
  return ROOM_IMAGE_URLS[Math.abs(hash) % ROOM_IMAGE_URLS.length];
}

export function ensureSeeded() {
  let users = read(KEYS.USERS);
  let housesList = read(KEYS.HOUSES);
  let houseId = housesList[0]?.id;

  if (!houseId) {
    houseId = uid();
    housesList = [{
      id: houseId,
      name: 'Kidapawan City Main Branch',
      address: 'Poblacion, Kidapawan City, Cotabato',
      city: 'Kidapawan City',
      contactNumber: '',
      imageUrl: '',
      createdAt: new Date().toISOString(),
    }];
    write(KEYS.HOUSES, housesList);
  }
  write(KEYS.CURRENT_HOUSE, houseId);

  let changed = false;

  if (!users.some((u) => u.role === 'admin')) {
    users.push({
      id: 'admin-1', name: 'Administrator', email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
      role: 'admin', houseIds: [houseId], phone: '', createdAt: new Date().toISOString(),
    });
    changed = true;
  }

  if (!users.some((u) => u.role === 'caretaker')) {
    users.push({
      id: 'caretaker-1', name: 'Caretaker', email: CARETAKER_EMAIL, password: CARETAKER_PASSWORD,
      role: 'caretaker', houseIds: [houseId], phone: '', createdAt: new Date().toISOString(),
    });
    changed = true;
  }

  if (changed) write(KEYS.USERS, users);
}

export const ADMIN_CREDENTIALS = { email: ADMIN_EMAIL, password: ADMIN_PASSWORD };
export const CARETAKER_CREDENTIALS = { email: CARETAKER_EMAIL, password: CARETAKER_PASSWORD };

// ================= AUTH =================
export const auth = {
  login(email, password) {
    ensureSeeded();
    const users = read(KEYS.USERS);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    const session = {
      token: 'nb-' + uid(),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, houseIds: user.houseIds || [] },
    };
    write(KEYS.SESSION, session);
    return session;
  },
  logout() { localStorage.removeItem(KEYS.SESSION); },
  getSession() { return read(KEYS.SESSION, null); },
};

// ================= PROPERTY =================
export const houses = {
  list() { return read(KEYS.HOUSES); },
  get(id) { return read(KEYS.HOUSES).find((h) => h.id === id); },
  create({ name, address, contactNumber, imageUrl }) {
    const all = read(KEYS.HOUSES);
    const house = { id: uid(), name, address: address || '', contactNumber: contactNumber || '', imageUrl: imageUrl || '', createdAt: new Date().toISOString() };
    all.push(house); write(KEYS.HOUSES, all); return house;
  },
  update(id, changes) {
    const all = read(KEYS.HOUSES);
    const idx = all.findIndex((h) => h.id === id);
    if (idx < 0) throw new Error('Property not found');
    all[idx] = { ...all[idx], ...changes }; write(KEYS.HOUSES, all); return all[idx];
  },
  remove(id) {
    const roomsArr = read(KEYS.ROOMS).filter((r) => r.houseId === id);
    if (roomsArr.length > 0) throw new Error(`Property has ${roomsArr.length} room(s). Delete rooms first.`);
    write(KEYS.HOUSES, read(KEYS.HOUSES).filter((h) => h.id !== id)); return true;
  },
  current() {
    const id = read(KEYS.CURRENT_HOUSE, null);
    if (!id) { const first = read(KEYS.HOUSES)[0]; if (first) { write(KEYS.CURRENT_HOUSE, first.id); return first; } return null; }
    return houses.get(id);
  },
  setCurrent(id) { write(KEYS.CURRENT_HOUSE, id); },
};

// ================= ROOMS =================
export const rooms = {
  list(houseId) {
    const allRooms = read(KEYS.ROOMS);
    const tenantList = read(KEYS.TENANTS);
    const filtered = houseId ? allRooms.filter((r) => r.houseId === houseId) : allRooms;
    return filtered.map((r) => {
      const occupants = tenantList.filter((t) => t.roomId === r.id && t.status === 'occupied').length;
      return { ...r, imageUrl: r.imageUrl || getRoomImage(r.id), occupants };
    });
  },
  create({ houseId, roomNumber, bedCapacity, monthlyRate, notes, gender, imageUrl }) {
    const all = read(KEYS.ROOMS);
    if (all.find((r) => r.houseId === houseId && r.roomNumber === roomNumber)) throw new Error(`Room ${roomNumber} already exists`);
    const id = uid();
    const room = { id, houseId, roomNumber, bedCapacity: Number(bedCapacity), monthlyRate: Number(monthlyRate) || 0, gender: gender || 'mixed', notes: notes || '', imageUrl: imageUrl || getRoomImage(id), createdAt: new Date().toISOString() };
    all.push(room); write(KEYS.ROOMS, all); return room;
  },
  update(id, changes) {
    const all = read(KEYS.ROOMS);
    const idx = all.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error('Room not found');
    const occupants = read(KEYS.TENANTS).filter((t) => t.roomId === id && t.status === 'occupied').length;
    if (changes.bedCapacity && Number(changes.bedCapacity) < occupants) throw new Error(`Capacity cannot be less than current occupants (${occupants})`);
    all[idx] = { ...all[idx], ...changes }; write(KEYS.ROOMS, all); return all[idx];
  },
  remove(id) {
    const occupants = read(KEYS.TENANTS).filter((t) => t.roomId === id && t.status === 'occupied').length;
    if (occupants > 0) throw new Error(`Room has ${occupants} tenant(s)`);
    write(KEYS.ROOMS, read(KEYS.ROOMS).filter((r) => r.id !== id)); return true;
  },
};

// ================= TENANTS =================
export const tenants = {
  list(houseId) {
    const allRooms = read(KEYS.ROOMS);
    return read(KEYS.TENANTS)
      .filter((t) => !houseId || allRooms.find((r) => r.id === t.roomId)?.houseId === houseId)
      .map((t) => {
        const room = allRooms.find((r) => r.id === t.roomId);
        return { ...t, room: room ? { id: room.id, number: room.roomNumber } : null };
      });
  },
  listPending(houseId) {
    const allRooms = read(KEYS.ROOMS);
    return read(KEYS.TENANTS)
      .filter((t) => t.status === 'reserved')
      .filter((t) => !houseId || allRooms.find((r) => r.id === t.roomId)?.houseId === houseId)
      .map((t) => {
        const room = allRooms.find((r) => r.id === t.roomId);
        return { ...t, room: room ? { id: room.id, number: room.roomNumber } : null };
      });
  },
  create({ name, email, password, phone, emergencyContact, roomId, moveInDate }) {
    const users = read(KEYS.USERS);
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) throw new Error('Email already in use');
    let status = 'reserved';
    if (roomId) {
      const room = read(KEYS.ROOMS).find((r) => r.id === roomId);
      if (!room) throw new Error('Room not found');
      const occupants = read(KEYS.TENANTS).filter((t) => t.roomId === roomId && t.status === 'occupied').length;
      if (occupants >= room.bedCapacity) throw new Error(`Room ${room.roomNumber} is full`);
      status = 'occupied';
    }
    const boarder = {
      id: uid(), name, email, password, role: 'tenant',
      houseIds: roomId ? [read(KEYS.ROOMS).find((r) => r.id === roomId)?.houseId].filter(Boolean) : [],
      phone: phone || '', emergencyContact: emergencyContact || '', roomId: roomId || null,
      moveInDate: moveInDate || new Date().toISOString().split('T')[0], status: status,
      createdAt: new Date().toISOString(),
    };
    users.push(boarder); write(KEYS.USERS, users);
    const allTenants = read(KEYS.TENANTS);
    allTenants.push({ id: boarder.id, name, email, phone: phone || '', emergencyContact: emergencyContact || '', roomId: roomId || null, moveInDate: boarder.moveInDate, status: boarder.status, createdAt: boarder.createdAt });
    write(KEYS.TENANTS, allTenants);
    return boarder;
  },
  checkIn(id, roomId) {
    const allTenants = read(KEYS.TENANTS);
    const allUsers = read(KEYS.USERS);
    const allRooms = read(KEYS.ROOMS);
    const tenant = allTenants.find(t => t.id === id);
    const room = allRooms.find(r => r.id === roomId);
    if (!tenant) throw new Error('Tenant not found');
    if (!room) throw new Error('Room not found');
    const occupants = allTenants.filter(t => t.roomId === roomId && t.status === 'occupied').length;
    if (occupants >= room.bedCapacity) throw new Error(`Room ${room.roomNumber} is full`);
    tenant.status = 'occupied';
    tenant.roomId = roomId;
    write(KEYS.TENANTS, allTenants);
    const user = allUsers.find(u => u.id === id);
    if (user) { user.status = 'occupied'; user.roomId = roomId; user.houseIds = [room.houseId]; write(KEYS.USERS, allUsers); }
    return tenant;
  },
  remove(id) {
    write(KEYS.USERS, read(KEYS.USERS).filter((u) => u.id !== id));
    write(KEYS.TENANTS, read(KEYS.TENANTS).filter((t) => t.id !== id));
    write(KEYS.RENT_PAYMENTS, read(KEYS.RENT_PAYMENTS).filter((p) => p.tenantId !== id));
    write(KEYS.UTILITY_CHARGES, read(KEYS.UTILITY_CHARGES).filter((c) => c.tenantId !== id));
    return true;
  },
};

// ================= RENT PAYMENTS =================
function computeRentStatus(rent) {
  if (rent.amountPaid >= rent.amountDue) return 'paid';
  if (rent.dueDate && new Date(rent.dueDate) < new Date() && rent.amountPaid < rent.amountDue) return 'overdue';
  if (rent.amountPaid > 0) return 'partial';
  return 'unpaid';
}

export const rentPayments = {
  listForHouse(houseId) {
    const allRooms = read(KEYS.ROOMS);
    const tenantsArr = read(KEYS.TENANTS);
    return read(KEYS.RENT_PAYMENTS)
      .map((p) => {
        const tenant = tenantsArr.find((t) => t.id === p.tenantId);
        const room = tenant?.roomId ? allRooms.find((r) => r.id === tenant.roomId) : null;
        const balance = Math.max(0, p.amountDue - p.amountPaid);
        return { ...p, status: computeRentStatus(p), balance, tenantName: tenant?.name || 'Unknown', roomNumber: room?.roomNumber || '—', houseId: room?.houseId || null };
      })
      .filter((p) => !houseId || p.houseId === houseId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  listForTenant(tenantId) {
    return read(KEYS.RENT_PAYMENTS).filter((p) => p.tenantId === tenantId)
      .map((p) => ({ ...p, status: computeRentStatus(p), balance: Math.max(0, p.amountDue - p.amountPaid) }));
  },
  generateRoomBills({ roomId, billingMonth, customAmount }) {
    const allRooms = read(KEYS.ROOMS);
    const tenantsArr = read(KEYS.TENANTS);
    const room = allRooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    const occupants = tenantsArr.filter(t => t.roomId === roomId && t.status === 'occupied');
    if (occupants.length === 0) throw new Error('No tenants in this room to bill.');
    const totalAmount = customAmount || room.monthlyRate;
    const splitAmount = Math.ceil(totalAmount / occupants.length);
    const allPayments = read(KEYS.RENT_PAYMENTS);
    const created = [];
    const targetDate = new Date(billingMonth + " 1");
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    occupants.forEach(t => {
      let dueDate = null;
      if (t.moveInDate) {
        const moveIn = new Date(t.moveInDate);
        let dueYear = targetYear; let dueMonth = targetMonth;
        const moveInDay = moveIn.getDate();
        const daysInTargetMonth = new Date(dueYear, dueMonth + 1, 0).getDate();
        const actualDay = Math.min(moveInDay, daysInTargetMonth);
        dueDate = new Date(dueYear, dueMonth, actualDay).toISOString().split('T')[0];
      } else { dueDate = new Date(targetYear, targetMonth, 5).toISOString().split('T')[0]; }
      const payment = {
        id: uid(), tenantId: t.id, billingMonth, dueDate, amountDue: splitAmount, amountPaid: 0, paymentMethod: null, orNumber: '', notes: `Auto-split for Room ${room.roomNumber} (${occupants.length} tenants)`, createdAt: new Date().toISOString(), paidAt: null
      };
      allPayments.push(payment); created.push(payment);
    });
    write(KEYS.RENT_PAYMENTS, allPayments);
    return { count: created.length, perPerson: splitAmount, total: totalAmount };
  },
  create({ tenantId, billingMonth, amountDue, amountPaid, paymentMethod, orNumber, notes }) {
    const all = read(KEYS.RENT_PAYMENTS);
    const paid = Number(amountPaid) || 0;
    const payment = { id: uid(), tenantId, billingMonth, amountDue: Number(amountDue), amountPaid: paid, paymentMethod: paid > 0 ? paymentMethod || 'cash' : null, orNumber: paid > 0 ? orNumber || '' : '', notes: notes || '', createdAt: new Date().toISOString(), paidAt: paid > 0 ? new Date().toISOString() : null };
    all.push(payment); write(KEYS.RENT_PAYMENTS, all); return payment;
  },
  recordPayment(id, { amount, paymentMethod, orNumber }) {
    const all = read(KEYS.RENT_PAYMENTS);
    const idx = all.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error('Payment record not found');
    const p = all[idx];
    p.amountPaid = Math.min(p.amountDue, p.amountPaid + Number(amount));
    p.paymentMethod = paymentMethod; p.orNumber = orNumber || p.orNumber; p.paidAt = new Date().toISOString();
    write(KEYS.RENT_PAYMENTS, all); return p;
  },
  markPaid(id) {
    const all = read(KEYS.RENT_PAYMENTS);
    const idx = all.findIndex((p) => p.id === id);
    if (idx < 0) throw new Error('Not found');
    all[idx].amountPaid = all[idx].amountDue; all[idx].paidAt = new Date().toISOString();
    write(KEYS.RENT_PAYMENTS, all); return all[idx];
  },
};

// ================= UTILITY CHARGES =================
export const utilityCharges = {
  listForHouse(houseId) {
    const allRooms = read(KEYS.ROOMS);
    const tenantsArr = read(KEYS.TENANTS);
    return read(KEYS.UTILITY_CHARGES)
      .map((c) => {
        const tenant = tenantsArr.find((t) => t.id === c.tenantId);
        const room = tenant?.roomId ? allRooms.find((r) => r.id === tenant.roomId) : null;
        return { ...c, tenantName: tenant?.name || 'Unknown', roomNumber: room?.roomNumber || '—', houseId: room?.houseId || null };
      })
      .filter((c) => !houseId || c.houseId === houseId);
  },
  listForTenant(tenantId) { return read(KEYS.UTILITY_CHARGES).filter((c) => c.tenantId === tenantId); },
  generateRoomUtilities({ roomId, chargeType, billingPeriod, totalAmount, notes }) {
    const allRooms = read(KEYS.ROOMS);
    const tenantsArr = read(KEYS.TENANTS);
    const room = allRooms.find(r => r.id === roomId);
    if (!room) throw new Error('Room not found');
    const occupants = tenantsArr.filter(t => t.roomId === roomId && t.status === 'occupied');
    if (occupants.length === 0) throw new Error('No tenants in this room to bill.');
    const splitAmount = Math.ceil(Number(totalAmount) / occupants.length);
    const allCharges = read(KEYS.UTILITY_CHARGES);
    const created = [];
    occupants.forEach(t => {
      const charge = { id: uid(), tenantId: t.id, chargeType, amountBilled: splitAmount, billingPeriod, status: 'unpaid', notes: `Split for Room ${room.roomNumber}`, createdAt: new Date().toISOString() };
      allCharges.push(charge); created.push(charge);
    });
    write(KEYS.UTILITY_CHARGES, allCharges);
    return { count: created.length, perPerson: splitAmount, total: totalAmount };
  },
  create({ tenantId, chargeType, amountBilled, billingPeriod, notes }) {
    const all = read(KEYS.UTILITY_CHARGES);
    const charge = { id: uid(), tenantId, chargeType, amountBilled: Number(amountBilled), billingPeriod, status: 'unpaid', notes: notes || '', createdAt: new Date().toISOString() };
    all.push(charge); write(KEYS.UTILITY_CHARGES, all); return charge;
  },
  markPaid(id) {
    const all = read(KEYS.UTILITY_CHARGES);
    const idx = all.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error('Not found');
    all[idx].status = 'paid'; write(KEYS.UTILITY_CHARGES, all); return all[idx];
  },
  remove(id) { write(KEYS.UTILITY_CHARGES, read(KEYS.UTILITY_CHARGES).filter((c) => c.id !== id)); return true; },
};

// ================= EXPENSES =================
export const expenses = {
  list(houseId) { return read(KEYS.EXPENSES).filter((e) => !houseId || e.houseId === houseId).sort((a, b) => b.dateLogged.localeCompare(a.dateLogged)); },
  create({ houseId, description, category, amount, dateLogged }) {
    const all = read(KEYS.EXPENSES);
    const expense = { id: uid(), houseId, description, category: category || 'other', amount: Number(amount), dateLogged: dateLogged || new Date().toISOString().split('T')[0], createdAt: new Date().toISOString() };
    all.push(expense); write(KEYS.EXPENSES, all); return expense;
  },
  remove(id) { write(KEYS.EXPENSES, read(KEYS.EXPENSES).filter((e) => e.id !== id)); return true; },
};

// ================= SETTINGS =================
const DEFAULT_SETTINGS = {
  ownerName: '', gcash: { accountName: '', phone: '', enabled: true }, bank: { bankName: '', accountName: '', accountNumber: '', enabled: false }, cash: { enabled: true, note: 'Pay in person to the caretaker' },
};
export const settings = {
  get() {
    const stored = read(KEYS.SETTINGS, null);
    if (!stored) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    return { ...DEFAULT_SETTINGS, ...stored, gcash: { ...DEFAULT_SETTINGS.gcash, ...(stored.gcash || {}) }, bank: { ...DEFAULT_SETTINGS.bank, ...(stored.bank || {}) }, cash: { ...DEFAULT_SETTINGS.cash, ...(stored.cash || {}) } };
  },
  update(changes) {
    const current = settings.get();
    const merged = { ...current, ...changes, gcash: { ...current.gcash, ...(changes.gcash || {}) }, bank: { ...current.bank, ...(changes.bank || {}) }, cash: { ...current.cash, ...(changes.cash || {}) } };
    write(KEYS.SETTINGS, merged); return merged;
  },
};

// ================= RESERVATIONS / INQUIRIES =================
export const reservations = {
  list(houseId) {
    const allRooms = read(KEYS.ROOMS);
    const guestReqs = read(KEYS.RESERVATIONS).map((r) => {
      const room = allRooms.find((rm) => rm.id === r.roomId);
      return { ...r, type: 'guest', roomNumber: room?.roomNumber || '—', roomRate: room?.monthlyRate || 0, houseId: room?.houseId || null, tenantName: r.fullName };
    });
    return guestReqs.filter((r) => !houseId || r.houseId === houseId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  create({ houseId, roomId, fullName, phone, email, moveInDate, preferredRoomType, notes }) {
    if (!houseId || !fullName || !phone) throw new Error('Please fill in all required fields.');
    const all = read(KEYS.RESERVATIONS);
    const reference = 'NBR-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const reservation = {
      id: uid(), reference, houseId, roomId: roomId || null, fullName: fullName.trim(), phone: phone.trim(), email: (email || '').trim(),
      moveInDate: moveInDate || new Date().toISOString().split('T')[0], preferredRoomType: preferredRoomType || 'Male',
      notes: notes || '', status: 'pending', createdAt: new Date().toISOString(),
    };
    all.push(reservation); write(KEYS.RESERVATIONS, all); return reservation;
  },
  qualify(id, qualified, reason = '') {
    const all = read(KEYS.RESERVATIONS);
    const idx = all.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error('Inquiry not found');
    all[idx].status = qualified ? 'qualified' : 'not_qualified';
    all[idx].qualificationReason = reason;
    all[idx].processedAt = new Date().toISOString();
    write(KEYS.RESERVATIONS, all); return all[idx];
  },
  approve(id, password) {
    const all = read(KEYS.RESERVATIONS);
    const idx = all.findIndex((r) => r.id === id);
    if (idx < 0) throw new Error('Reservation not found');
    const res = all[idx];
    if (res.status !== 'qualified' && res.status !== 'pending') throw new Error('Inquiry must be Qualified first');
    const boarder = tenants.create({ name: res.fullName, email: res.email || `${res.reference.toLowerCase()}@nearbai.local`, password: password || 'Tenant123!', phone: res.phone, emergencyContact: '', roomId: res.roomId, moveInDate: res.moveInDate });
    res.status = 'approved'; res.tenantId = boarder.id; res.processedAt = new Date().toISOString();
    write(KEYS.RESERVATIONS, all); return res;
  },
  reject(id, reason) { return reservations.qualify(id, false, reason); },
  getByReference(ref) { return read(KEYS.RESERVATIONS).find((r) => r.reference === ref) || null; },
};

// ================= ANNOUNCEMENTS =================
export const announcements = {
  list(houseId) { 
    return read(KEYS.ANNOUNCEMENTS)
      .filter((a) => !houseId || a.houseId === houseId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)); 
  },
  get(id) {
    return read(KEYS.ANNOUNCEMENTS).find((a) => a.id === id);
  },
  create({ houseId, title, body, priority }) {
    const all = read(KEYS.ANNOUNCEMENTS);
    const ann = { 
      id: uid(), houseId, title, body, priority: priority || 'normal', createdAt: new Date().toISOString() 
    };
    all.push(ann); write(KEYS.ANNOUNCEMENTS, all); return ann;
  },
  remove(id) { write(KEYS.ANNOUNCEMENTS, read(KEYS.ANNOUNCEMENTS).filter((a) => a.id !== id)); },
};

// ================= BOOKINGS =================
export const bookings = {
  list(houseId) {
    const allRooms = read(KEYS.ROOMS);
    const tenantsArr = read(KEYS.TENANTS);
    return read(KEYS.BOOKINGS).map((b) => {
      const room = allRooms.find((r) => r.id === b.roomId);
      const tenant = tenantsArr.find((t) => t.id === b.tenantId);
      return { ...b, roomNumber: room?.roomNumber || '—', houseId: room?.houseId || null, tenantName: tenant?.name || b.guestName || 'Unknown' };
    }).filter((b) => !houseId || b.houseId === houseId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  listForTenant(tenantId) {
    const allRooms = read(KEYS.ROOMS);
    return read(KEYS.BOOKINGS).filter((b) => b.tenantId === tenantId).map((b) => {
      const room = allRooms.find((r) => r.id === b.roomId);
      return { ...b, roomNumber: room?.roomNumber || '—' };
    });
  },
  takenBeds(roomId) {
    const active = read(KEYS.BOOKINGS).filter((b) => b.roomId === roomId && (b.status === 'pending' || b.status === 'approved'));
    return active.map((b) => b.bedNumber);
  },
  create({ tenantId, roomId, bedNumber, moveInDate, guestName, guestPhone }) {
    const room = read(KEYS.ROOMS).find((r) => r.id === roomId);
    if (!room) throw new Error('Room not found');
    const taken = bookings.takenBeds(roomId);
    if (taken.includes(bedNumber)) throw new Error(`Bed ${bedNumber} is already booked.`);
    const all = read(KEYS.BOOKINGS);
    const booking = { id: uid(), reference: 'BKG-' + Math.random().toString(36).slice(2, 7).toUpperCase(), tenantId: tenantId || null, guestName: guestName || '', guestPhone: guestPhone || '', roomId, bedNumber, moveInDate: moveInDate || new Date().toISOString().split('T')[0], status: 'pending', createdAt: new Date().toISOString() };
    all.push(booking); write(KEYS.BOOKINGS, all); return booking;
  },
  approve(id, password) {
    const all = read(KEYS.BOOKINGS);
    const idx = all.findIndex((b) => b.id === id);
    if (idx < 0) throw new Error('Booking not found');
    const bk = all[idx];
    if (bk.status !== 'pending') throw new Error('Already processed');
    if (!bk.tenantId && bk.guestName) {
      const newTenant = tenants.create({ name: bk.guestName, email: `${bk.reference.toLowerCase()}@nearbai.local`, password: password || 'Tenant123!', phone: bk.guestPhone, emergencyContact: '', roomId: bk.roomId, moveInDate: bk.moveInDate });
      bk.tenantId = newTenant.id;
    }
    bk.status = 'approved'; bk.processedAt = new Date().toISOString();
    write(KEYS.BOOKINGS, all); return bk;
  },
  reject(id, reason) {
    const all = read(KEYS.BOOKINGS);
    const idx = all.findIndex((b) => b.id === id);
    if (idx < 0) throw new Error('Booking not found');
    all[idx].status = 'rejected'; all[idx].rejectionReason = reason || 'No reason provided'; all[idx].processedAt = new Date().toISOString();
    write(KEYS.BOOKINGS, all); return all[idx];
  },
  cancel(id, byTenant = false) {
    const all = read(KEYS.BOOKINGS);
    const idx = all.findIndex((b) => b.id === id);
    if (idx < 0) throw new Error('Booking not found');
    if (byTenant && all[idx].status !== 'pending') throw new Error('Only pending bookings can be cancelled');
    all[idx].status = 'cancelled'; all[idx].cancelledAt = new Date().toISOString();
    write(KEYS.BOOKINGS, all); return all[idx];
  },
};

// ================= FAVORITES =================
export const favorites = {
  list(tenantId) {
    const allRooms = read(KEYS.ROOMS);
    const allHouses = read(KEYS.HOUSES);
    return read(KEYS.FAVORITES).filter((f) => f.tenantId === tenantId).map((f) => {
      const house = allHouses.find((h) => h.id === f.houseId);
      const houseRooms = allRooms.filter((r) => r.houseId === f.houseId);
      const totalBeds = houseRooms.reduce((s, r) => s + r.bedCapacity, 0);
      const occupied = tenants.list(f.houseId).filter((t) => t.status === 'occupied').length;
      return { ...f, house, available: Math.max(0, totalBeds - occupied) };
    });
  },
  isFavorite(tenantId, houseId) { return read(KEYS.FAVORITES).some((f) => f.tenantId === tenantId && f.houseId === houseId); },
  toggle(tenantId, houseId) {
    const all = read(KEYS.FAVORITES);
    const existing = all.findIndex((f) => f.tenantId === tenantId && f.houseId === houseId);
    if (existing >= 0) { all.splice(existing, 1); write(KEYS.FAVORITES, all); return false; }
    all.push({ id: uid(), tenantId, houseId, createdAt: new Date().toISOString() });
    write(KEYS.FAVORITES, all); return true;
  },
};

// ================= ANALYTICS =================
export const analytics = {
  dashboard(houseId) {
    const allRooms = rooms.list(houseId);
    const tenantsArr = tenants.list(houseId);
    const rents = rentPayments.listForHouse(houseId);
    const utils = utilityCharges.listForHouse(houseId);
    const exp = expenses.list(houseId);
    const pendingInquiries = reservations.list(houseId).filter((r) => r.status === 'pending').length;

    const occupiedBeds = tenantsArr.filter((t) => t.status === 'occupied').length;
    const totalCapacity = allRooms.reduce((s, r) => s + r.bedCapacity, 0);
    const occupancyRate = totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 100) : 0;

    const totalRentDue = rents.reduce((s, r) => s + r.amountDue, 0);
    const totalRentPaid = rents.reduce((s, r) => s + r.amountPaid, 0);
    const totalUtilBilled = utils.reduce((s, c) => s + c.amountBilled, 0);
    const totalUtilPaid = utils.reduce((s, c) => s + (c.status === 'paid' ? c.amountBilled : 0), 0);
    const totalUtilUnpaid = utils.reduce((s, c) => s + (c.status === 'unpaid' ? c.amountBilled : 0), 0);
    const totalExpenses = exp.reduce((s, e) => s + e.amount, 0);
    const totalCollections = totalRentPaid + totalUtilPaid;
    const netIncome = totalCollections - totalExpenses;

    const paidList = rents.filter((r) => r.status === 'paid');
    const unpaidList = rents.filter((r) => r.status === 'unpaid');
    const partialList = rents.filter((r) => r.status === 'partial');
    const overdueList = rents.filter((r) => r.status === 'overdue');

    return {
      propertiesCount: houses.list().length, roomsCount: allRooms.length, tenantsCount: tenantsArr.length,
      occupiedBeds, totalCapacity, occupancyRate,
      totalRentDue, totalRentPaid, totalUtilBilled, totalUtilPaid, totalUtilUnpaid,
      totalExpenses, totalCollections, netIncome,
      paidCount: paidList.length, unpaidList: [...unpaidList, ...partialList], overdueList,
      pendingInquiries, recentRent: rents.slice(0, 5),
    };
  },
  roomDemand(houseId) {
    const allRooms = rooms.list(houseId);
    const allInquiries = reservations.list(houseId);
    const allTenants = tenants.list(houseId);
    return allRooms.map((room) => {
      const occupants = allTenants.filter((t) => t.roomId === room.id && t.status === 'occupied').length;
      const vacant = Math.max(0, room.bedCapacity - occupants);
      const roomInquiries = allInquiries.filter((i) => i.preferredRoomType?.toLowerCase() === room.gender?.toLowerCase());
      const qualified = roomInquiries.filter((i) => i.status === 'qualified').length;
      const pending = roomInquiries.filter((i) => i.status === 'pending').length;
      return {
        id: room.id, roomNumber: room.roomNumber, type: room.gender, capacity: room.bedCapacity, occupied: occupants, vacant,
        inquiries: roomInquiries.length, qualified, pending, demandGap: vacant > 0 ? Math.min(vacant, qualified) : qualified,
      };
    });
  },
};

// ================= GLOBAL EXPORT HELPERS =================
export const globalData = {
  getAll() {
    const allHouses = read(KEYS.HOUSES);
    const allRooms = read(KEYS.ROOMS);
    const allTenants = read(KEYS.TENANTS);
    const allRents = read(KEYS.RENT_PAYMENTS);
    const allUtils = read(KEYS.UTILITY_CHARGES);
    const allExpenses = read(KEYS.EXPENSES);
    const allReservations = read(KEYS.RESERVATIONS);
    const houseById = {}; allHouses.forEach(h => { houseById[h.id] = h; });
    const roomById = {}; allRooms.forEach(r => { roomById[r.id] = r; });
    const tenantById = {}; allTenants.forEach(t => { tenantById[t.id] = t; });
    const branchOfRoom = (roomId) => {
      const room = roomById[roomId];
      const house = room ? houseById[room.houseId] : null;
      return house ? house.name : '—';
    };
    const rents = allRents.map(p => {
      const tenant = tenantById[p.tenantId];
      const room = tenant?.roomId ? roomById[tenant.roomId] : null;
      const balance = Math.max(0, p.amountDue - p.amountPaid);
      let status = 'unpaid';
      if (p.amountPaid >= p.amountDue) status = 'paid';
      else if (p.dueDate && new Date(p.dueDate) < new Date() && p.amountPaid < p.amountDue) status = 'overdue';
      else if (p.amountPaid > 0) status = 'partial';
      return { ...p, status, balance, tenantName: tenant?.name || 'Unknown', roomNumber: room?.roomNumber || '—', branch: branchOfRoom(room?.id), houseId: room?.houseId || null };
    });
    const utils = allUtils.map(c => {
      const tenant = tenantById[c.tenantId];
      const room = tenant?.roomId ? roomById[tenant.roomId] : null;
      return { ...c, tenantName: tenant?.name || 'Unknown', roomNumber: room?.roomNumber || '—', branch: branchOfRoom(room?.id), houseId: room?.houseId || null };
    });
    const expenses = allExpenses.map(e => ({ ...e, branch: houseById[e.houseId]?.name || '—' }));
    const tenants = allTenants.map(t => { const room = t.roomId ? roomById[t.roomId] : null; return { ...t, roomNumber: room?.roomNumber || '—', branch: branchOfRoom(t.roomId) }; });
    const reservations = allReservations.map(r => { const room = r.roomId ? roomById[r.roomId] : null; return { ...r, roomNumber: room?.roomNumber || '—', branch: branchOfRoom(r.roomId) }; });
    return { rents, utils, expenses, tenants, reservations };
  },
};

// ================= GLOBAL ANALYTICS (ALL BRANCHES DASHBOARD) =================
export const globalAnalytics = {
  dashboard() {
    const allHouses = read(KEYS.HOUSES);
    const allRooms = read(KEYS.ROOMS);
    const allTenants = read(KEYS.TENANTS);
    const allRents = read(KEYS.RENT_PAYMENTS);
    const allUtils = read(KEYS.UTILITY_CHARGES);
    const allExpenses = read(KEYS.EXPENSES);
    const allReservations = read(KEYS.RESERVATIONS);
    const allBookings = read(KEYS.BOOKINGS);
    const roomById = {}; allRooms.forEach((r) => { roomById[r.id] = r; });
    const tenantById = {}; allTenants.forEach((t) => { tenantById[t.id] = t; });
    const branchStats = allHouses.map((house) => {
      const houseRooms = allRooms.filter((r) => r.houseId === house.id);
      const houseRoomIds = new Set(houseRooms.map((r) => r.id));
      const houseTenants = allTenants.filter((t) => t.roomId && houseRoomIds.has(t.roomId));
      const occupiedTenants = houseTenants.filter((t) => t.status === 'occupied');
      const totalBeds = houseRooms.reduce((s, r) => s + (r.bedCapacity || 0), 0);
      const occupancyRate = totalBeds > 0 ? Math.round((occupiedTenants.length / totalBeds) * 100) : 0;
      const houseRents = allRents.filter((p) => { const tenant = tenantById[p.tenantId]; return tenant?.roomId && houseRoomIds.has(tenant.roomId); });
      const rentPaid = houseRents.reduce((s, p) => s + (p.amountPaid || 0), 0);
      const houseUtils = allUtils.filter((c) => { const tenant = tenantById[c.tenantId]; return tenant?.roomId && houseRoomIds.has(tenant.roomId); });
      const utilPaid = houseUtils.reduce((s, c) => s + (c.status === 'paid' ? c.amountBilled || 0 : 0), 0);
      const houseExpenses = allExpenses.filter((e) => e.houseId === house.id);
      const expensesTotal = houseExpenses.reduce((s, e) => s + (e.amount || 0), 0);
      const collections = rentPaid + utilPaid;
      const netIncome = collections - expensesTotal;
      return { id: house.id, name: house.name, city: house.city || house.address || '—', tenants: occupiedTenants.length, totalBeds, occupancyRate, collections, expenses: expensesTotal, netIncome };
    });
    branchStats.sort((a, b) => b.netIncome - a.netIncome);
    const totalProperties = allHouses.length;
    const totalRooms = allRooms.length;
    const totalTenants = allTenants.filter((t) => t.status === 'occupied').length;
    const totalBedsAll = allRooms.reduce((s, r) => s + (r.bedCapacity || 0), 0);
    const overallOccupancy = totalBedsAll > 0 ? Math.round((totalTenants / totalBedsAll) * 100) : 0;
    const totalCollections = branchStats.reduce((s, b) => s + b.collections, 0);
    const totalExpenses = branchStats.reduce((s, b) => s + b.expenses, 0);
    const totalNetIncome = totalCollections - totalExpenses;
    const pendingReservations = allReservations.filter((r) => r.status === 'pending').length;
    const pendingBookings = allBookings.filter((b) => b.status === 'pending').length;
    const totalPendingInquiries = pendingReservations + pendingBookings;
    return { totalProperties, totalRooms, totalTenants, overallOccupancy, totalCollections, totalExpenses, totalNetIncome, totalPendingInquiries, branchStats };
  },
};

// ================= SIMULATION DATASET (For the Admin View) =================
export const simulationData = {
  get() {
    const house = houses.current();
    if (!house) return null;

    const allRooms = rooms.list(house.id);
    const allTenants = tenants.list(house.id);
    const allRents = rentPayments.listForHouse(house.id);
    const allUtils = utilityCharges.listForHouse(house.id);
    const allExpenses = expenses.list(house.id);
    const allInquiries = reservations.list(house.id);

    const fmt = (num) => `₱${Number(num || 0).toLocaleString('en-PH')}`;

    // --- Table A ---
    let totalBeds = 0;
    let totalRent = 0;
    const tableA = allRooms.map(r => {
      const rentPerBed = Math.ceil(r.monthlyRate / r.bedCapacity);
      totalBeds += r.bedCapacity;
      totalRent += r.monthlyRate;
      return {
        room: r.roomNumber, type: r.gender || 'mixed', beds: r.bedCapacity,
        roomRent: fmt(r.monthlyRate), rentPerBed: fmt(rentPerBed)
      };
    });
    tableA.push({ room: 'Total', type: '—', beds: totalBeds, roomRent: fmt(totalRent), rentPerBed: '—' });

    // --- Table B ---
    let totalOccupied = 0;
    let totalVacant = 0;
    const tableB = allRooms.map(r => {
      const occupied = allTenants.filter(t => t.roomId === r.id && t.status === 'occupied').length;
      const vacant = Math.max(0, r.bedCapacity - occupied);
      const occRate = r.bedCapacity > 0 ? Math.round((occupied / r.bedCapacity) * 100) : 0;
      totalOccupied += occupied;
      totalVacant += vacant;
      return { room: r.roomNumber, occupied, vacant, occupancy: `${occRate}%` };
    });
    const overallOcc = totalBeds > 0 ? ((totalOccupied / totalBeds) * 100).toFixed(1) : 0;
    tableB.push({ room: 'Total', occupied: totalOccupied, vacant: totalVacant, occupancy: `${overallOcc}%` });

    // --- Table C ---
    let totalBilled = 0, totalCollected = 0, totalUnpaid = 0;
    const tableC = allRooms.map(r => {
      const roomRents = allRents.filter(p => p.roomNumber === r.roomNumber);
      const billed = roomRents.reduce((s, p) => s + p.amountDue, 0);
      const collected = roomRents.reduce((s, p) => s + p.amountPaid, 0);
      const unpaid = billed - collected;
      totalBilled += billed; totalCollected += collected; totalUnpaid += unpaid;
      return { room: r.roomNumber, billed: fmt(billed), collected: fmt(collected), unpaid: fmt(unpaid) };
    });
    tableC.push({ room: 'Total', billed: fmt(totalBilled), collected: fmt(totalCollected), unpaid: fmt(totalUnpaid) });

    // --- Table D ---
    const overdueList = allRents.filter(r => r.balance > 0);
    let dRentDue = 0, dPaid = 0, dOverdue = 0;
    const tableD = overdueList.map(r => {
      dRentDue += r.amountDue; dPaid += r.amountPaid; dOverdue += r.balance;
      return { tenant: r.tenantName, room: r.roomNumber, rentDue: fmt(r.amountDue), paid: fmt(r.amountPaid), overdue: fmt(r.balance) };
    });
    tableD.push({ tenant: 'Total', room: '—', rentDue: fmt(dRentDue), paid: fmt(dPaid), overdue: fmt(dOverdue) });

    // --- Table E ---
    let totalElec = 0, totalWater = 0, totalUtils = 0;
    const tableE = allRooms.map(r => {
      const roomUtils = allUtils.filter(u => u.roomNumber === r.roomNumber);
      const elec = roomUtils.filter(u => u.chargeType === 'electricity').reduce((s, u) => s + u.amountBilled, 0);
      const water = roomUtils.filter(u => u.chargeType === 'water').reduce((s, u) => s + u.amountBilled, 0);
      const total = elec + water;
      if (total === 0) return null;
      const occupants = allTenants.filter(t => t.roomId === r.id && t.status === 'occupied').length;
      totalElec += elec; totalWater += water; totalUtils += total;
      return { room: r.roomNumber, tenants: occupants, elec: fmt(elec), water: fmt(water), total: fmt(total) };
    }).filter(Boolean);
    tableE.push({ room: 'Total', tenants: totalOccupied, elec: fmt(totalElec), water: fmt(totalWater), total: fmt(totalUtils) });

    // --- Table F ---
    let totalExp = 0;
    const tableF = allExpenses.map(e => {
      totalExp += e.amount;
      return { expense: e.description, amount: fmt(e.amount) };
    });
    tableF.push({ expense: 'Total Expenses', amount: fmt(totalExp) });

    // --- Table G ---
    const maleInq = allInquiries.filter(i => i.preferredRoomType?.toLowerCase() === 'male');
    const femaleInq = allInquiries.filter(i => i.preferredRoomType?.toLowerCase() === 'female');
    const maleQual = maleInq.filter(i => i.status === 'qualified').length;
    const femaleQual = femaleInq.filter(i => i.status === 'qualified').length;
    
    const maleRooms = allRooms.filter(r => r.gender === 'male');
    const femaleRooms = allRooms.filter(r => r.gender === 'female');
    const maleAvail = maleRooms.reduce((s, r) => s + r.bedCapacity, 0) - allTenants.filter(t => t.status === 'occupied' && maleRooms.some(r => r.id === t.roomId)).length;
    const femaleAvail = femaleRooms.reduce((s, r) => s + r.bedCapacity, 0) - allTenants.filter(t => t.status === 'occupied' && femaleRooms.some(r => r.id === t.roomId)).length;

    const tableG = [
      { pref: 'Male', inq: maleInq.length, qual: maleQual, avail: Math.max(0, maleAvail), gap: Math.max(0, maleQual - maleAvail) },
      { pref: 'Female', inq: femaleInq.length, qual: femaleQual, avail: Math.max(0, femaleAvail), gap: Math.max(0, femaleQual - femaleAvail) },
      { pref: 'Total', inq: allInquiries.length, qual: maleQual + femaleQual, avail: Math.max(0, maleAvail + femaleAvail), gap: '—' }
    ];

    // --- Table H ---
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
    const tableH = weeks.map(w => ({ week: w.label, total: w.total, qualified: w.qualified }));
    tableH.push({ week: 'Total', total: allInquiries.length, qualified: maleQual + femaleQual });

    // --- Table I ---
    const totalColl = totalCollected + totalUtils;
    const netCash = totalColl - totalExp;
    const uncollected = totalUnpaid + (totalUtils - allUtils.filter(u => u.status === 'paid').reduce((s, u) => s + u.amountBilled, 0));
    const rentRate = totalBilled > 0 ? ((totalCollected / totalBilled) * 100).toFixed(2) : 0;
    const utilRate = totalUtils > 0 ? ((allUtils.filter(u => u.status === 'paid').reduce((s, u) => s + u.amountBilled, 0) / totalUtils) * 100).toFixed(2) : 0;

    const tableI = [
      { metric: 'Occupancy Rate', value: `${overallOcc}% (${totalOccupied}/${totalBeds} beds)` },
      { metric: 'Rent Collection Rate', value: `${rentRate}% (${fmt(totalCollected)} / ${fmt(totalBilled)})` },
      { metric: 'Utility Collection Rate', value: `${utilRate}%` },
      { metric: 'Overdue Tenants', value: overdueList.length },
      { metric: 'Total Uncollected Bills', value: fmt(uncollected) },
      { metric: 'Net Cash Flow', value: `${fmt(netCash)} (${fmt(totalColl)} collections - ${fmt(totalExp)} expenses)` },
    ];

    return { tableA, tableB, tableC, tableD, tableE, tableF, tableG, tableH, tableI };
  }
};