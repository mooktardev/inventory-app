# Inventory App

A full-stack inventory management application built with **Express**, **EJS**, and **PostgreSQL**. Part of [The Odin Project](https://www.theodinproject.com/) Node.js curriculum.

Track products organized by category, with full CRUD support and admin password protection for destructive actions.

## Features

- Dashboard with category overview and recently updated items
- View all categories and drill into a category to see its items
- View individual item details (price, quantity, description)
- Create categories and items via forms with validation
- Update and delete actions protected by an admin password
- Low-stock highlighting when quantity falls below 10
- Dark-themed responsive UI

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Views | EJS + express-ejs-layouts |
| Database | PostgreSQL (`pg`) |
| Validation | express-validator |
| Config | dotenv |

## Database Schema

### Tables

**`category`**

| Column | Type | Constraints |
|---|---|---|
| `id` | SERIAL | PRIMARY KEY |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE |
| `description` | TEXT | |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

**`item`**

| Column | Type | Constraints |
|---|---|---|
| `id` | SERIAL | PRIMARY KEY |
| `name` | VARCHAR(200) | NOT NULL |
| `description` | TEXT | |
| `price` | DECIMAL(10,2) | NOT NULL, CHECK ≥ 0 |
| `quantity` | INTEGER | NOT NULL, DEFAULT 0, CHECK ≥ 0 |
| `category_id` | INTEGER | NOT NULL, FK → category(id) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |

### Relations

```
category 1 ──< N item
```

- Each item belongs to **exactly one** category.
- A category can contain **many** items.

### Delete Behavior

Categories use `ON DELETE RESTRICT` on the `item.category_id` foreign key. A category **cannot** be deleted while it still contains items — delete or reassign those items first. The application also checks this in the controller and displays a clear error message.

## Project Structure

```
inventory-app/
├── app.js                      # Express entry point
├── db/
│   ├── pool.js                 # PostgreSQL connection pool
│   ├── schema.sql              # Table definitions
│   ├── setup.js                # Apply schema to the database
│   └── populate.js             # Seed dummy data
├── controllers/
│   ├── categoryController.js
│   └── itemController.js
├── routes/
│   ├── index.js
│   ├── categoryRoutes.js
│   └── itemRoutes.js
├── views/                      # EJS templates
├── middleware/
│   └── adminAuth.js            # Admin password verification
├── public/
│   └── styles.css
├── render.yaml                 # Render deployment blueprint
├── .env.example
└── package.json
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [PostgreSQL](https://www.postgresql.org/) installed and running locally

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd inventory-app
npm install
```

### 2. Create the database

```sql
CREATE DATABASE inventory_app;
```

### 3. Configure environment variables

Copy the example file and edit it with your credentials:

```bash
cp .env.example .env
```

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/inventory_app
ADMIN_PASSWORD=changeme
PORT=3000
```

### 4. Set up the schema and seed data

```bash
npm run db:setup
npm run db:populate
```

### 5. Start the server

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

For development with auto-restart on file changes:

```bash
npm run dev
```

## NPM Scripts

| Script | Description |
|---|---|
| `npm start` | Start the production server |
| `npm run dev` | Start with `--watch` for development |
| `npm run db:setup` | Create database tables from `db/schema.sql` |
| `npm run db:populate` | Truncate and re-seed with dummy data |

## Routes

| Method | Path | Description | Admin password |
|---|---|---|---|
| GET | `/` | Dashboard | |
| GET | `/categories` | List all categories | |
| GET | `/categories/create` | New category form | |
| POST | `/categories/create` | Create a category | |
| GET | `/categories/:id` | View category and its items | |
| GET | `/categories/:id/update` | Edit category form | |
| POST | `/categories/:id/update` | Update a category | Required |
| POST | `/categories/:id/delete` | Delete a category | Required |
| GET | `/items` | List all items | |
| GET | `/items/create` | New item form | |
| POST | `/items/create` | Create an item | |
| GET | `/items/:id` | View item details | |
| GET | `/items/:id/update` | Edit item form | |
| POST | `/items/:id/update` | Update an item | Required |
| POST | `/items/:id/delete` | Delete an item | Required |

## Admin Password Protection

Creating categories and items is open to anyone. **Updating and deleting** requires the admin password set in `ADMIN_PASSWORD`.

When prompted, enter the value from your `.env` file (default: `changeme`). An incorrect password returns a 403 error and the action is not performed.

## Dummy Data

`npm run db:populate` seeds the database with:

- **Electronics** — Wireless Mouse, USB-C Hub, Mechanical Keyboard
- **Office Supplies** — A4 Notebook, Ballpoint Pen Pack, Stapler
- **Furniture** — Office Chair, Standing Desk
- **Kitchen** — Coffee Beans 1kg, Ceramic Mug

Re-run this script any time you want to reset the data to a known state.

## Deployment (Render)

A `render.yaml` blueprint is included for [Render](https://render.com):

1. Push this repository to GitHub.
2. Create a new **Blueprint** on Render and connect the repo.
3. Render provisions a free PostgreSQL database and web service automatically.
4. The build step runs `db:setup` and `db:populate`.
5. Note the generated `ADMIN_PASSWORD` in the Render dashboard so you can perform update/delete actions.

## License

ISC
