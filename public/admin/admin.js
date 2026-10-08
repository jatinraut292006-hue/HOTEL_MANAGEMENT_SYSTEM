// ================================
// HOTEL ADMIN DASHBOARD
// ================================

// Small helper
const $ = (id) => document.getElementById(id);


// ================================
// API HELPER
// ================================

async function api(url, method = 'GET', body = null) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }

  return data;
}


// ================================
// LOAD ROOMS
// ================================

async function loadRooms() {
  try {
    const rooms = await api('/api/rooms');

    // Dashboard counts
    $('totalRooms').textContent = rooms.length;

    const available = rooms.filter(
      room => room.status === 'Available'
    ).length;

    const booked = rooms.filter(
      room => room.status === 'Booked'
    ).length;

    $('availableRooms').textContent = available;
    $('bookedRooms').textContent = booked;


    // Room table
    $('roomsBody').innerHTML = rooms.length
      ? rooms.map(room => `
          <tr>
            <td>${escapeHTML(room.room_no)}</td>

            <td>${escapeHTML(room.type)}</td>

            <td>₹${Number(room.price).toLocaleString('en-IN')}</td>

            <td>
              <span class="status ${room.status.toLowerCase()}">
                ${room.status}
              </span>
            </td>

            <td>
              <button
                class="delete"
                onclick="deleteRoom(${room.id})">
                Delete
              </button>
            </td>
          </tr>
        `).join('')
      : `
        <tr>
          <td colspan="5" class="empty">
            No rooms available.
          </td>
        </tr>
      `;

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}


// ================================
// LOAD BOOKINGS
// ================================

async function loadBookings() {
  try {
    const bookings = await api('/api/bookings');

    $('totalBookings').textContent = bookings.length;

    $('bookingsBody').innerHTML = bookings.length
      ? bookings.map(booking => `
          <tr>

            <td>
              ${escapeHTML(booking.guest_name)}
            </td>

            <td>
              ${escapeHTML(booking.room_no)}
              (${escapeHTML(booking.type)})
            </td>

            <td>
              ${booking.check_in}
            </td>

            <td>
              ${booking.check_out}
            </td>

            <td>
              <button
                class="delete"
                onclick="cancelBooking(${booking.id})">
                Cancel
              </button>
            </td>

          </tr>
        `).join('')
      : `
        <tr>
          <td colspan="5" class="empty">
            No bookings yet.
          </td>
        </tr>
      `;

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}


// ================================
// ADD ROOM
// ================================

$('roomForm').addEventListener('submit', async (event) => {

  event.preventDefault();

  const form = new FormData(event.target);

  const room = {
    room_no: form.get('room_no'),
    type: form.get('type'),
    price: form.get('price')
  };

  try {

    await api('/api/rooms', 'POST', room);

    alert('Room added successfully.');

    event.target.reset();

    await loadRooms();

  } catch (error) {

    alert(error.message);

  }

});


// ================================
// DELETE ROOM
// ================================

async function deleteRoom(id) {

  const confirmDelete = confirm(
    'Delete this room and all its bookings?'
  );

  if (!confirmDelete) {
    return;
  }

  try {

    await api(`/api/rooms/${id}`, 'DELETE');

    alert('Room deleted successfully.');

    await loadRooms();
    await loadBookings();

  } catch (error) {

    alert(error.message);

  }
}


// ================================
// CANCEL BOOKING
// ================================

async function cancelBooking(id) {

  const confirmCancel = confirm(
    'Cancel this booking?'
  );

  if (!confirmCancel) {
    return;
  }

  try {

    await api(`/api/bookings/${id}`, 'DELETE');

    alert('Booking cancelled successfully.');

    await loadRooms();
    await loadBookings();

  } catch (error) {

    alert(error.message);

  }
}


// ================================
// HTML SAFETY
// ================================

function escapeHTML(value) {

  return String(value).replace(
    /[&<>"']/g,
    character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]
  );

}


// ================================
// INITIAL LOAD
// ================================

loadRooms();
loadBookings();