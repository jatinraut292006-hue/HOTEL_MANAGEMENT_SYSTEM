# GrandStay Hotel Booking System

A full-stack **Hotel Room Booking System** developed using **HTML, CSS, JavaScript, Node.js, Express.js, and SQLite**.

The application provides two separate interfaces:

- **Customer Booking Website** – allows guests to search for available rooms and make bookings.
- **Hotel Admin Dashboard** – allows hotel staff to manage rooms and bookings.

The project demonstrates practical implementation of **full-stack web development, RESTful APIs, CRUD operations, database integration, validation, and dynamic frontend updates**.

---

## Features

### Customer Side

- View hotel rooms
- Search rooms by check-in and check-out dates
- Search rooms by room type
- View room price and availability
- Book a room
- Enter guest details
- Prevent overlapping bookings
- Dynamic room availability
- Responsive hotel-style interface

### Hotel Admin Side

- Dashboard with room and booking statistics
- Add new rooms
- View all rooms
- View room availability
- Delete rooms
- View all bookings
- Cancel bookings

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js |
| Framework | Express.js |
| Database | SQLite |
| SQLite Driver | better-sqlite3 |
| API Communication | REST API + JSON |
| Client Requests | Fetch API |

---

## Project Architecture

```text
                    HOTEL BOOKING SYSTEM
                             |
              +--------------+--------------+
              |                             |
       CUSTOMER WEBSITE              ADMIN DASHBOARD
              |                             |
              +--------------+--------------+
                             |
                       Express.js API
                             |
                       SQLite Database
                             |
                   +---------+---------+
                   |                   |
                 Rooms             Bookings
```

---

## Project Structure

```text
hotel-booking-system/
│
├── README.md
├── package.json
├── package-lock.json
├── server.js
├── test.js
│
└── public/
    ├── index.html
    ├── style.css
    ├── app.js
    │
    └── admin/
        ├── index.html
        ├── admin.css
        └── admin.js
```

---

## Database Design

The application uses two main tables.

### Rooms Table

```text
rooms
-------------------------
id
room_no
type
price
```

Supported room types:

- Single
- Double
- Suite

### Bookings Table

```text
bookings
-------------------------
id
room_id
guest_name
check_in
check_out
```

The `room_id` field connects bookings with rooms.

---

## REST API Endpoints

### Room APIs

#### Add Room

```http
POST /api/rooms
```

Example:

```json
{
  "room_no": "101",
  "type": "Double",
  "price": 2500
}
```

#### View All Rooms

```http
GET /api/rooms
```

#### Search Available Rooms

```http
GET /api/rooms/search
```

Example:

```text
/api/rooms/search?type=Double&checkIn=2026-10-10&checkOut=2026-10-12
```

#### Delete Room

```http
DELETE /api/rooms/:id
```

---

### Booking APIs

#### View All Bookings

```http
GET /api/bookings
```

#### Create Booking

```http
POST /api/bookings
```

Example:

```json
{
  "room_id": 1,
  "guest_name": "Jatin Raut",
  "check_in": "2026-10-10",
  "check_out": "2026-10-12"
}
```

#### Update Booking

```http
PUT /api/bookings/:id
```

#### Cancel Booking

```http
DELETE /api/bookings/:id
```

---

## Validation

The system validates:

- Guest name
- Room number
- Room type
- Room price
- Check-in date
- Check-out date
- Room existence
- Booking date conflicts

### Double-Booking Prevention

The system prevents overlapping bookings for the same room.

For example:

```text
Existing booking:
10 Oct → 12 Oct

New booking:
11 Oct → 14 Oct
```

The second booking is rejected.

The system allows:

```text
Existing booking:
10 Oct → 12 Oct

New booking:
12 Oct → 14 Oct
```

because the first guest checks out on the same day the second guest checks in.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/jatinraut292006-hue/HOTEL_MANAGEMENT_SYSTEM.git
```

### 2. Open the project

```bash
cd HOTEL_MANAGEMENT_SYSTEM
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the server

```bash
npm start
```

The application runs at:

```text
http://localhost:3000
```

---

## Application URLs

### Customer Website

```text
http://localhost:3000/
```

Customers can search and book hotel rooms.

### Hotel Admin Dashboard

```text
http://localhost:3000/admin/
```

Hotel staff can manage rooms and bookings.

---

## Testing

Run the automated test suite using:

```bash
npm test
```

The tests cover:

- Adding a room
- Duplicate room number
- Invalid room price
- Creating a booking
- Overlapping booking
- Same-day check-in
- Invalid check-out date
- Past date
- Missing guest name
- Unknown room
- Searching unavailable rooms
- Searching available rooms
- Booking update conflict
- Cancelling a booking
- Cancelling a non-existent booking

Expected successful result:

```text
All 15 tests passed.
```

---

## CRUD Operations

| Operation | Implementation |
|---|---|
| Create | Add Room, Create Booking |
| Read | View Rooms, View Bookings |
| Update | Update Booking |
| Delete | Delete Room, Cancel Booking |

---

## Future Enhancements

- User authentication
- Admin login
- Online payment integration
- Email booking confirmation
- Customer booking history
- Room images
- Hotel location/map
- Reviews and ratings
- PDF booking receipts
- Advanced admin analytics

---

## Learning Outcomes

This project demonstrates practical knowledge of:

- Full-stack web development
- Node.js and Express.js
- RESTful API development
- SQLite database integration
- CRUD operations
- Frontend-backend communication
- Fetch API
- Form validation
- Database relationships
- Booking conflict detection
- Automated testing

---

## Author

**Jatin Raut**

Hotel Room Booking System  
Full-Stack Web Development Project