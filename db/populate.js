require("dotenv").config();
const pool = require("./pool");

const categories = [
  {
    name: "Electronics",
    description: "Computers, peripherals, and gadgets",
    items: [
      {
        name: "Wireless Mouse",
        description: "Ergonomic wireless mouse with USB receiver",
        price: 29.99,
        quantity: 45,
      },
      {
        name: "USB-C Hub",
        description: "7-in-1 USB-C hub with HDMI and SD card reader",
        price: 49.99,
        quantity: 22,
      },
      {
        name: "Mechanical Keyboard",
        description: "Tenkeyless mechanical keyboard with Cherry MX switches",
        price: 89.99,
        quantity: 15,
      },
    ],
  },
  {
    name: "Office Supplies",
    description: "Stationery and desk accessories",
    items: [
      {
        name: "A4 Notebook",
        description: "200-page ruled notebook",
        price: 4.99,
        quantity: 120,
      },
      {
        name: "Ballpoint Pen Pack",
        description: "Pack of 12 blue ballpoint pens",
        price: 3.49,
        quantity: 80,
      },
      {
        name: "Stapler",
        description: "Heavy-duty desktop stapler",
        price: 12.99,
        quantity: 30,
      },
    ],
  },
  {
    name: "Furniture",
    description: "Desks, chairs, and storage",
    items: [
      {
        name: "Office Chair",
        description: "Adjustable mesh office chair with lumbar support",
        price: 249.99,
        quantity: 8,
      },
      {
        name: "Standing Desk",
        description: "Electric height-adjustable standing desk",
        price: 399.99,
        quantity: 5,
      },
    ],
  },
  {
    name: "Kitchen",
    description: "Break room and pantry items",
    items: [
      {
        name: "Coffee Beans 1kg",
        description: "Medium roast whole bean coffee",
        price: 18.99,
        quantity: 25,
      },
      {
        name: "Ceramic Mug",
        description: "350ml ceramic mug, dishwasher safe",
        price: 8.99,
        quantity: 40,
      },
    ],
  },
];

async function populate() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query("TRUNCATE item, category RESTART IDENTITY CASCADE");

    for (const cat of categories) {
      const { rows } = await client.query(
        `INSERT INTO category (name, description)
         VALUES ($1, $2)
         RETURNING id`,
        [cat.name, cat.description]
      );
      const categoryId = rows[0].id;

      for (const item of cat.items) {
        await client.query(
          `INSERT INTO item (name, description, price, quantity, category_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [item.name, item.description, item.price, item.quantity, categoryId]
        );
      }
    }

    await client.query("COMMIT");
    console.log("Database populated with dummy data.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to populate database:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

populate();
