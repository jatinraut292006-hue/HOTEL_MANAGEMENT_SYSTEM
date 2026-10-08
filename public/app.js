// ========================================
// GRANDSTAY HOTEL - CUSTOMER FRONTEND
// ========================================

const $ = (id) => document.getElementById(id);

let currentRooms = [];


// ========================================
// API HELPER
// ========================================

async function api(url, method = 'GET', body = null) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }

  return data;
}


// ========================================
// DATE HELPERS
// ========================================

function todayString() {
  const now = new Date();
  const offset = now.getTimezoneOffset();

  return new Date(now.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 10);
}

function setMinimumDates() {
  document
    .querySelectorAll('input[type="date"]')
    .forEach((input) => {
      input.min = todayString();
    });
}


// ========================================
// TOAST MESSAGE
// ========================================

let toastTimer;

function showToast(message, error = false) {
  const toast = $('toast');

  toast.textContent = message;
  toast.className = error ? 'toast show error' : 'toast show';

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.className = 'toast';
  }, 3500);
}


// ========================================
// HTML SAFETY
// ========================================

function escapeHTML(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]
  );
}


// ========================================
// ROOM CARD
// ========================================

function roomCard(room, searched = false) {

  const roomType = escapeHTML(room.type);
  const roomNo = escapeHTML(room.room_no);
  const price = Number(room.price).toLocaleString('en-IN');

  let statusHTML = '';
  let buttonHTML = '';

  if (searched) {

    statusHTML = `
      <span class="room-status available">
        Available
      </span>
    `;

    buttonHTML = `
      <button
        class="book-button"
        onclick="openBooking(${room.id}, '${roomNo}')">
        Book Now
      </button>
    `;

  } else {

    const status = room.status || 'Available';

    const isAvailable = status === 'Available';

    statusHTML = `
      <span class="room-status ${isAvailable ? 'available' : 'booked'}">
        ${isAvailable ? 'Available' : 'Booked'}
      </span>
    `;

    buttonHTML = isAvailable
      ? `
        <button
          class="book-button"
          onclick="openBooking(${room.id}, '${roomNo}')">
          Book Now
        </button>
      `
      : `
        <button
          class="book-button"
          disabled
          style="opacity:.5;cursor:not-allowed;">
          Currently Booked
        </button>
      `;
  }


  return `
    <article class="room-card">

      <div class="room-image">
        <span>${roomType}</span>
      </div>

      <div class="room-details">

        <div class="room-type">
          ${roomType} Room
        </div>

        <h3>
          Room ${roomNo}
        </h3>

        <div class="room-price">
          <strong>₹${price}</strong>
          <small> / night</small>
        </div>

        <div class="room-actions">

          ${statusHTML}

          ${buttonHTML}

        </div>

      </div>

    </article>
  `;
}


// ========================================
// DISPLAY ROOMS
// ========================================

function displayRooms(rooms, searched = false) {

  currentRooms = rooms;

  const grid = $('roomsGrid');

  if (!rooms.length) {

    grid.innerHTML = `
      <div class="empty-rooms">
        <h3>No rooms available</h3>
        <p>
          Try different dates or select another room type.
        </p>
      </div>
    `;

    return;
  }

  grid.innerHTML = rooms
    .map(room => roomCard(room, searched))
    .join('');
}


// ========================================
// LOAD ALL ROOMS
// ========================================

async function loadRooms() {

  try {

    const rooms = await api('/api/rooms');

    displayRooms(rooms, false);

  } catch (error) {

    console.error(error);

    $('roomsGrid').innerHTML = `
      <div class="empty-rooms">
        <h3>Unable to load rooms</h3>
        <p>Please check whether the server is running.</p>
      </div>
    `;

    showToast(error.message, true);
  }
}


// ========================================
// SEARCH AVAILABLE ROOMS
// ========================================

$('searchForm').addEventListener(
  'submit',
  async (event) => {

    event.preventDefault();

    const form = new FormData(event.target);

    const checkIn = form.get('checkIn');
    const checkOut = form.get('checkOut');
    const type = form.get('type');


    if (!checkIn || !checkOut) {
      showToast(
        'Please select both check-in and check-out dates.',
        true
      );

      return;
    }


    if (checkOut <= checkIn) {
      showToast(
        'Check-out must be after check-in.',
        true
      );

      return;
    }


    const params = new URLSearchParams();

    params.set('checkIn', checkIn);
    params.set('checkOut', checkOut);

    if (type) {
      params.set('type', type);
    }


    try {

      const rooms = await api(
        '/api/rooms/search?' + params.toString()
      );

      displayRooms(rooms, true);

      $('rooms').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });


      showToast(
        `${rooms.length} room${rooms.length === 1 ? '' : 's'} available.`
      );

    } catch (error) {

      showToast(error.message, true);
    }
  }
);


// ========================================
// OPEN BOOKING MODAL
// ========================================

function openBooking(roomId, roomNo) {

  const modal = $('bookingModal');

  const roomIdInput =
    document.querySelector(
      '#bookingForm input[name="room_id"]'
    );

  const roomNoText = $('selectedRoomNo');

  roomIdInput.value = roomId;
  roomNoText.textContent = `#${roomNo}`;

  modal.hidden = false;

  document.body.style.overflow = 'hidden';

  const searchForm =
    new FormData($('searchForm'));

  const searchCheckIn =
    searchForm.get('checkIn');

  const searchCheckOut =
    searchForm.get('checkOut');


  if (searchCheckIn) {
    $('bookingForm').check_in.value =
      searchCheckIn;
  }

  if (searchCheckOut) {
    $('bookingForm').check_out.value =
      searchCheckOut;
  }


  setMinimumDates();

  $('bookingForm').guest_name.focus();
}


// ========================================
// CLOSE BOOKING MODAL
// ========================================

function closeBooking() {

  $('bookingModal').hidden = true;

  document.body.style.overflow = '';

  $('bookingForm').reset();

  setMinimumDates();
}


$('closeModal').addEventListener(
  'click',
  closeBooking
);


// Close modal by clicking background

$('bookingModal').addEventListener(
  'click',
  (event) => {

    if (event.target === $('bookingModal')) {
      closeBooking();
    }

  }
);


// ========================================
// CONFIRM BOOKING
// ========================================

$('bookingForm').addEventListener(
  'submit',
  async (event) => {

    event.preventDefault();

    const form = new FormData(event.target);

    const roomId =
      Number(form.get('room_id'));

    const guestName =
      form.get('guest_name');

    const checkIn =
      form.get('check_in');

    const checkOut =
      form.get('check_out');


    if (!guestName.trim()) {

      showToast(
        'Please enter your name.',
        true
      );

      return;
    }


    if (!checkIn || !checkOut) {

      showToast(
        'Please select your stay dates.',
        true
      );

      return;
    }


    if (checkOut <= checkIn) {

      showToast(
        'Check-out must be after check-in.',
        true
      );

      return;
    }


    try {

      await api(
        '/api/bookings',
        'POST',
        {
          room_id: roomId,
          guest_name: guestName,
          check_in: checkIn,
          check_out: checkOut
        }
      );


      closeBooking();

      showToast(
        'Booking confirmed successfully!'
      );


      // Reload current room information
      await loadRooms();


    } catch (error) {

      showToast(
        error.message,
        true
      );
    }
  }
);


// ========================================
// START
// ========================================

setMinimumDates();

loadRooms();