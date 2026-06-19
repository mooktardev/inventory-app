const { body, validationResult } = require("express-validator");
const pool = require("../db/pool");

const itemValidation = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("description").optional({ values: "falsy" }).trim(),
  body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a non-negative number."),
  body("quantity")
    .isInt({ min: 0 })
    .withMessage("Quantity must be a non-negative integer."),
  body("category_id")
    .isInt({ min: 1 })
    .withMessage("Please select a valid category."),
];

async function getCategories() {
  const { rows } = await pool.query(
    "SELECT id, name FROM category ORDER BY name"
  );
  return rows;
}

exports.list = async (req, res, next) => {
  try {
    const { rows: items } = await pool.query(
      `SELECT i.*, c.name AS category_name
       FROM item i
       JOIN category c ON c.id = i.category_id
       ORDER BY i.name`
    );

    res.render("item/list", { title: "All Items", items });
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, c.name AS category_name, c.id AS category_id
       FROM item i
       JOIN category c ON c.id = i.category_id
       WHERE i.id = $1`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).render("error", {
        title: "Not Found",
        message: "Item not found.",
        statusCode: 404,
      });
    }

    res.render("item/detail", {
      title: rows[0].name,
      item: rows[0],
    });
  } catch (err) {
    next(err);
  }
};

exports.createGet = async (req, res, next) => {
  try {
    const categories = await getCategories();

    if (categories.length === 0) {
      return res.status(400).render("error", {
        title: "No Categories",
        message:
          "You need at least one category before creating items. Create a category first.",
        statusCode: 400,
      });
    }

    res.render("item/form", {
      title: "New Item",
      item: { category_id: req.query.category_id || "" },
      categories,
      errors: [],
      action: "/items/create",
      method: "POST",
      submitLabel: "Create Item",
      requirePassword: false,
    });
  } catch (err) {
    next(err);
  }
};

exports.createPost = [
  ...itemValidation,
  async (req, res, next) => {
    const categories = await getCategories();
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).render("item/form", {
        title: "New Item",
        item: req.body,
        categories,
        errors: errors.array(),
        action: "/items/create",
        method: "POST",
        submitLabel: "Create Item",
        requirePassword: false,
      });
    }

    try {
      const { rows } = await pool.query(
        `INSERT INTO item (name, description, price, quantity, category_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          req.body.name,
          req.body.description || null,
          req.body.price,
          req.body.quantity,
          req.body.category_id,
        ]
      );

      res.redirect(`/items/${rows[0].id}`);
    } catch (err) {
      if (err.code === "23503") {
        return res.status(400).render("item/form", {
          title: "New Item",
          item: req.body,
          categories,
          errors: [{ msg: "Selected category does not exist." }],
          action: "/items/create",
          method: "POST",
          submitLabel: "Create Item",
          requirePassword: false,
        });
      }
      next(err);
    }
  },
];

exports.updateGet = async (req, res, next) => {
  try {
    const [categories, itemResult] = await Promise.all([
      getCategories(),
      pool.query("SELECT * FROM item WHERE id = $1", [req.params.id]),
    ]);

    if (itemResult.rows.length === 0) {
      return res.status(404).render("error", {
        title: "Not Found",
        message: "Item not found.",
        statusCode: 404,
      });
    }

    res.render("item/form", {
      title: `Edit ${itemResult.rows[0].name}`,
      item: itemResult.rows[0],
      categories,
      errors: [],
      action: `/items/${itemResult.rows[0].id}/update`,
      method: "POST",
      submitLabel: "Update Item",
      requirePassword: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePost = [
  ...itemValidation,
  async (req, res, next) => {
    const categories = await getCategories();
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).render("item/form", {
        title: "Edit Item",
        item: { ...req.body, id: req.params.id },
        categories,
        errors: errors.array(),
        action: `/items/${req.params.id}/update`,
        method: "POST",
        submitLabel: "Update Item",
        requirePassword: true,
      });
    }

    try {
      const { rowCount } = await pool.query(
        `UPDATE item
         SET name = $1, description = $2, price = $3, quantity = $4,
             category_id = $5, updated_at = NOW()
         WHERE id = $6`,
        [
          req.body.name,
          req.body.description || null,
          req.body.price,
          req.body.quantity,
          req.body.category_id,
          req.params.id,
        ]
      );

      if (rowCount === 0) {
        return res.status(404).render("error", {
          title: "Not Found",
          message: "Item not found.",
          statusCode: 404,
        });
      }

      res.redirect(`/items/${req.params.id}`);
    } catch (err) {
      if (err.code === "23503") {
        return res.status(400).render("item/form", {
          title: "Edit Item",
          item: { ...req.body, id: req.params.id },
          categories,
          errors: [{ msg: "Selected category does not exist." }],
          action: `/items/${req.params.id}/update`,
          method: "POST",
          submitLabel: "Update Item",
          requirePassword: true,
        });
      }
      next(err);
    }
  },
];

exports.deletePost = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT category_id FROM item WHERE id = $1",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).render("error", {
        title: "Not Found",
        message: "Item not found.",
        statusCode: 404,
      });
    }

    const categoryId = rows[0].category_id;

    await pool.query("DELETE FROM item WHERE id = $1", [req.params.id]);

    const redirectTo = req.body.redirect_to;
    if (redirectTo === "category") {
      return res.redirect(`/categories/${categoryId}`);
    }

    res.redirect("/items");
  } catch (err) {
    next(err);
  }
};
