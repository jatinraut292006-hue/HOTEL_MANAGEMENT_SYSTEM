// Edge-case tests. Run: npm test   (uses a temporary database)
process.env.DB_FILE = ':memory:';
const app = require('./server');
const assert = require('assert');

const server = app.listen(0, async () => {
  const base = `http://localhost:${server.address().port}/api`;
  const call = async (path, method = 'GET', body) => {
    const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
    return { status: r.status, data: await r.json() };
  };
  const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  let pass = 0;
  const test = async (name, fn) => { await fn(); pass++; console.log('PASS', name); };

  try {
    const room = (await call('/rooms', 'POST', { room_no: '101', type: 'Double', price: 2500 })).data;

    await test('add room', async () => assert.ok(room.id));
    await test('duplicate room number -> 409', async () =>
      assert.strictEqual((await call('/rooms', 'POST', { room_no: '101', type: 'Single', price: 1000 })).status, 409));
    await test('bad price -> 400', async () =>
      assert.strictEqual((await call('/rooms', 'POST', { room_no: '102', type: 'Single', price: -5 })).status, 400));

    const b1 = await call('/bookings', 'POST', { room_id: room.id, guest_name: 'Asha', check_in: day(5), check_out: day(8) });
    await test('book room', async () => assert.strictEqual(b1.status, 201));
    await test('overlapping booking -> 409', async () =>
      assert.strictEqual((await call('/bookings', 'POST', { room_id: room.id, guest_name: 'Ravi', check_in: day(7), check_out: day(10) })).status, 409));
    await test('same-day check-in after check-out is allowed', async () =>
      assert.strictEqual((await call('/bookings', 'POST', { room_id: room.id, guest_name: 'Ravi', check_in: day(8), check_out: day(10) })).status, 201));
    await test('check-out before check-in -> 400', async () =>
      assert.strictEqual((await call('/bookings', 'POST', { room_id: room.id, guest_name: 'X', check_in: day(20), check_out: day(19) })).status, 400));
    await test('past date -> 400', async () =>
      assert.strictEqual((await call('/bookings', 'POST', { room_id: room.id, guest_name: 'X', check_in: day(-3), check_out: day(-1) })).status, 400));
    await test('missing guest name -> 400', async () =>
      assert.strictEqual((await call('/bookings', 'POST', { room_id: room.id, guest_name: ' ', check_in: day(30), check_out: day(31) })).status, 400));
    await test('unknown room -> 404', async () =>
      assert.strictEqual((await call('/bookings', 'POST', { room_id: 999, guest_name: 'X', check_in: day(30), check_out: day(31) })).status, 404));

    await test('search hides booked room', async () =>
      assert.strictEqual((await call(`/rooms/search?type=Double&checkIn=${day(6)}&checkOut=${day(7)}`)).data.length, 0));
    await test('search shows free room', async () =>
      assert.strictEqual((await call(`/rooms/search?type=Double&checkIn=${day(15)}&checkOut=${day(16)}`)).data.length, 1));

    await test('update booking into overlap -> 409', async () => {
      const id = (await call('/bookings')).data.find((b) => b.guest_name === 'Ravi').id;
      assert.strictEqual((await call(`/bookings/${id}`, 'PUT', { check_in: day(6) })).status, 409);
    });

    await test('cancel booking', async () =>
      assert.strictEqual((await call(`/bookings/${b1.data.id}`, 'DELETE')).status, 200));
    await test('cancel non-existent booking -> 404', async () =>
      assert.strictEqual((await call(`/bookings/${b1.data.id}`, 'DELETE')).status, 404));

    console.log(`\nAll ${pass} tests passed.`);
  } catch (e) {
    console.error('FAIL', e.message);
    process.exitCode = 1;
  }
  server.close();
});
