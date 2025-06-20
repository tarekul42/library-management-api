# Libarary Management API

A Restful API for managing books and borrow records in a library system. Built with **Express**, **Typescript**, and **MongoDB(Mongoose)**;

---

## Features

- Create, read, update, delete books with schema validation.
- Borrow books with qantity and due date tracking.
- Get summury of borrowed books using MongoDB aggregation pipeline.
- Filter books by genre, sort and limit etc.
- Mongoose schema validation and error handling.
- Uses Mongoose middlware and static/instance methods.
- Consistent error for unknown routes.

---

## Technologies Used

- **Backend:** Node.js, Express
- **Language:** TypeScript
- **Database:** MongoDB (Via Mongoose)

---

## Installation

**Clone the repository:**

```bash
git clone https://github.com/tarekul42/library-management-api
cd library-management-api
```

**Install dependencies:**

```bash
npm install
```

**Configure environment variables:**

- Create a `.env` file in the root directory and add:

```
<!-- set your mongodb connection string here -->
DATABASE_URL=mongodb://localhost:29047/lmapi
PORT=5000
```

## Development Setup

To run the server in development mode with automatic Typescript reloading, install `ts-node-dev`:

```bash
npm i --save-dev ts-node-dev
```

Then, add this script to your `package.json`:

```json
"scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts"
  }
```

Now you can start the server in development mode with:

```bash
npm run dev
```

The API will be running at `http://localhost:5000`

---

## API Endpoints

### Books

| Method | Endpoint             | Description             |
| ------ | -------------------- | ----------------------- |
| GET    | `/api/books`         | Get list of books       |
| POST   | `/api/books`         | Add a new book          |
| GET    | `/api/books/:bookId` | Get book details by ID  |
| PUT    | `/api/books/:bookId` | Update book information |
| DELETE | `/api/books/:bookId` | Delete a book           |

### Borrow

| Method | Endpoint      | Description            |
| ------ | ------------- | ---------------------- |
| POST   | `/api/borrow` | Borrow a book          |
| GET    | `/api/borrow` | Get all borrow records |

---

## Business Logic

- **Book Availability:**
  When borrowing, checks if enough copies are available. If copies reach 0, `available` is set to `false`. When updated to a positive number, `available` is set to `true`.
- **Validation:**
  All fields are validated accoring to the schema. Errors return a consistent error response.
- **404 Handling:**
  Any undefined route return a JSON 404 error.

---

## Example Error Response

```json
{
  "message": "Validation failed",
  "success": false,
  "error": {
    "name": "ValidationError",
    "errors": {
      "copies": {
        "message": "Copies must be a positive number",
        "name": "ValidatorError",
        "properties": {
          "message": "Copies must be a positive number",
          "type": "min",
          "min": 0
        },
        "kind": "min",
        "path": "copies",
        "value": -5
      }
    }
  }
}
```

---

# Notes

- **Genres:** Only accepts: `Fiction`, `NON_FICTION`, `SCIENCE`, `HISTORY`, `BIOGRAPHY`, `FANTASY`
- **Unique ISBN:** Each book must have a unique ISBN.
- **404:** Any unknown route returns a JSON 404 error.

---

## Contact

Tarekul Islam Rifat - [tarekulrifat205@gmail.com](mailto:tarekulrifat142@gmail.com)
