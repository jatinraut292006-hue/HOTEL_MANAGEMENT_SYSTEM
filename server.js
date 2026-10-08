// Hotel Room Booking System - backend
// Express handles the routes, SQLite stores the data.

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new Database(process.env.DB_FILE || path.join(__dirname, 'hotel.db'));

// ---------- Database setup ----------
db.pragma('foreign_keys = ON');
db.exec(`
  CREATE TABLE IF NOT EXISTS rooms (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    room_no TEXT    NOT NULL UNIQUE,
    type    TEXT    NOT NULL CHECK (type IN ('Single','Double','Suite')),
    price   REAL    NOT NULL CHECK (price > 0)
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id     INTEGER NOT NULL,
    guest_name  TEXT    NOT NULL,
    check_in    TEXT    NOT NULL,  -- YYYY-MM-DD
    check_out   TEXT    NOT NULL,  -- YYYY-MM-DD
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
  );
`);

// ---------- Middleware ----------
app.use(express.json());                                // read JSON bodies
app.use(express.static(path.join(__dirname, 'public'))); // serve the frontend
app.use((req, res, next) => {                           // simple logger
  console.log(`${req.method} ${req.url}`);
  next();
});

// ---------- Helpers ----------
const ROOM_TYPES = ['Single', 'Double', 'Suite'];
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s));
const today = () => new Date().toISOString().slice(0, 10);

// Two stays overlap if each one starts before the other ends.
// Check-out day is free, so a guest can check in the same day another leaves.
const OVERLAP_SQL = `
  SELECT 1 FROM bookings
  WHERE room_id = ? AND check_in < ? AND check_out > ?
`;
function hasOverlap(roomId, checkIn, checkOut, ignoreBookingId = 0) {
  const sql = OVERLAP_SQL + ' AND id != ?';
  return !!db.prepare(sql).get(roomId, checkOut, checkIn, ignoreBookingId);
}

// Checks guest + dates. Returns an error message, or null if fine.
function validateStay({ guest_name, check_in, check_out }) {
  if (!guest_name || !String(guest_name).trim()) return 'Guest name is required.';
  if (!isDate(check_in) || !isDate(check_out)) return 'Dates must be in YYYY-MM-DD format.';
  if (check_in < today()) return 'Check-in date cannot be in the past.';
  if (check_out <= check_in) return 'Check-out must be after check-in.';
  return null;
}

// ---------- Room routes ----------

// Add a new room
app.post('/api/rooms', (req, res) => {
  const { room_no, type, price } = req.body;
  if (!room_no || !String(room_no).trim()) return res.status(400).json({ error: 'Room number is required.' });
  if (!ROOM_TYPES.includes(type)) return res.status(400).json({ error: 'Type must be Single, Double or Suite.' });
  if (!(Number(price) > 0)) return res.status(400).json({ error: 'Price must be a positive number.' });

  try {
    const info = db.prepare('INSERT INTO rooms (room_no, type, price) VALUES (?, ?, ?)')
      .run(String(room_no).trim(), type, Number(price));
    res.status(201).json({ id: info.lastInsertRowid, room_no: String(room_no).trim(), type, price: Number(price) });
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Room number already exists.' });
    res.status(500).json({ error: 'Could not add room.' });
  }
});

// List all rooms. "status" tells if the room is occupied today.
app.get('/api/rooms', (req, res) => {
  const rooms = db.prepare(`
    SELECT r.*,
      CASE WHEN EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.room_id = r.id AND b.check_in <= ? AND b.check_out > ?
      ) THEN 'Booked' ELSE 'Available' END AS status
    FROM rooms r ORDER BY r.room_no
  `).all(today(), today());
  res.json(rooms);
});

// Search available rooms by type and/or date range
// GET /api/rooms/search?type=Double&checkIn=2026-10-10&checkOut=2026-10-12
app.get('/api/rooms/search', (req, res) => {
  const { type, checkIn, checkOut } = req.query;
  if (type && !ROOM_TYPES.includes(type)) return res.status(400).json({ error: 'Invalid room type.' });

  const hasDates = checkIn || checkOut;
  if (hasDates) {
    if (!isDate(checkIn) || !isDate(checkOut)) return res.status(400).json({ error: 'Give both dates as YYYY-MM-DD.' });
    if (checkOut <= checkIn) return res.status(400).json({ error: 'Check-out must be after check-in.' });
  }

  let sql = 'SELECT * FROM rooms WHERE 1=1';
  const params = [];
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (hasDates) {
    sql += ` AND id NOT IN (SELECT room_id FROM bookings WHERE check_in < ? AND check_out > ?)`;
    params.push(checkOut, checkIn);
  }
  sql += ' ORDER BY room_no';
  res.json(db.prepare(sql).all(...params));
});

// Delete a room (its bookings are deleted too)
app.delete('/api/rooms/:id', (req, res) => {
  const info = db.prepare('DELETE FROM rooms WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Room not found.' });
  res.json({ message: 'Room deleted.' });
});

// ---------- Booking routes ----------

// List all bookings with room details
app.get('/api/bookings', (req, res) => {
  res.json(db.prepare(`
    SELECT b.*, r.room_no, r.type, r.price
    FROM bookings b JOIN rooms r ON r.id = b.room_id
    ORDER BY b.check_in
  `).all());
});

// Book a room
app.post('/api/bookings', (req, res) => {
  const { room_id, guest_name, check_in, check_out } = req.body;
  const problem = validateStay({ guest_name, check_in, check_out });
  if (problem) return res.status(400).json({ error: problem });

  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(room_id);
  if (!room) return res.status(404).json({ error: 'Room not found.' });

  // Check + insert inside one transaction so two requests cannot sneak in together
  const book = db.transaction(() => {
    if (hasOverlap(room.id, check_in, check_out)) return null;
    return db.prepare('INSERT INTO bookings (room_id, guest_name, check_in, check_out) VALUES (?, ?, ?, ?)')
      .run(room.id, guest_name.trim(), check_in, check_out).lastInsertRowid;
  });

  const id = book();
  if (!id) return res.status(409).json({ error: `Room ${room.room_no} is already booked for those dates.` });
  res.status(201).json({ id, room_id: room.id, guest_name: guest_name.trim(), check_in, check_out });
});

// Change a booking (guest name and/or dates)
app.put('/api/bookings/:id', (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });

  const updated = {
    guest_name: req.body.guest_name ?? booking.guest_name,
    check_in: req.body.check_in ?? booking.check_in,
    check_out: req.body.check_out ?? booking.check_out,
  };
  const problem = validateStay(updated);
  if (problem) return res.status(400).json({ error: problem });
  if (hasOverlap(booking.room_id, updated.check_in, updated.check_out, booking.id)) {
    return res.status(409).json({ error: 'Room is already booked for those dates.' });
  }
  db.prepare('UPDATE bookings SET guest_name = ?, check_in = ?, check_out = ? WHERE id = ?')
    .run(updated.guest_name.trim(), updated.check_in, updated.check_out, booking.id);
  res.json({ id: booking.id, room_id: booking.room_id, ...updated });
});

// Cancel a booking
app.delete('/api/bookings/:id', (req, res) => {
  const info = db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Booking not found.' });
  res.json({ message: 'Booking cancelled.' });
});

// ---------- Unknown API routes + start ----------
app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found.' }));

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
}
module.exports = app;
