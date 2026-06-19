const { body, validationResult } = require("express-validator");
const pool = require("../db/pool");

const categoryValidation = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("description").optional({ values: "falsy" }).trim(),
];

exports.index = async (req, res, next) => {
  try {
    const { rows: categories } = await pool.query(
      `SELECT c.*, COUNT(i.id)::int AS item_count
       FROM category c
       LEFT JOIN item i ON i.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name`
    );

    const { rows: recentItems } = await pool.query(
      `SELECT i.*, c.name AS category_name
       FROM item i
       JOIN category c ON c.id = i.category_id
       ORDER BY i.updated_at DESC
       LIMIT 10`
    );

    res.render("index", {
      title: "Inventory Dashboard",
      categories,
      recentItems,
    });
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const { rows: categories } = await pool.query(
      `SELECT c.*, COUNT(i.id)::int AS item_count
       FROM category c
       LEFT JOIN item i ON i.category_id = c.id
       GROUP BY c.id
       ORDER BY c.name`
    );

    res.render("category/list", { title: "Categories", categories });
  } catch (err) {
    next(err);
  }
};

exports.detail = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM category WHERE id = $1",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).render("error", {
        title: "Not Found",
        message: "Category not found.",
        statusCode: 404,
      });
    }

    const { rows: items } = await pool.query(
      `SELECT * FROM item WHERE category_id = $1 ORDER BY name`,
      [req.params.id]
    );

    res.render("category/detail", {
      title: rows[0].name,
      category: rows[0],
      items,
    });
  } catch (err) {
    next(err);
  }
};

exports.createGet = (req, res) => {
  res.render("category/form", {
    title: "New Category",
    category: {},
    errors: [],
    action: "/categories/create",
    method: "POST",
    submitLabel: "Create Category",
    requirePassword: false,
  });
};

exports.createPost = [
  ...categoryValidation,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("category/form", {
        title: "New Category",
        category: req.body,
        errors: errors.array(),
        action: "/categories/create",
        method: "POST",
        submitLabel: "Create Category",
        requirePassword: false,
      });
    }

    try {
      await pool.query(
        "INSERT INTO category (name, description) VALUES ($1, $2)",
        [req.body.name, req.body.description || null]
      );
      res.redirect("/categories");
    } catch (err) {
      if (err.code === "23505") {
        return res.status(400).render("category/form", {
          title: "New Category",
          category: req.body,
          errors: [{ msg: "A category with this name already exists." }],
          action: "/categories/create",
          method: "POST",
          submitLabel: "Create Category",
          requirePassword: false,
        });
      }
      next(err);
    }
  },
];

exports.updateGet = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM category WHERE id = $1",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).render("error", {
        title: "Not Found",
        message: "Category not found.",
        statusCode: 404,
      });
    }

    res.render("category/form", {
      title: `Edit ${rows[0].name}`,
      category: rows[0],
      errors: [],
      action: `/categories/${rows[0].id}/update`,
      method: "POST",
      submitLabel: "Update Category",
      requirePassword: true,
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePost = [
  ...categoryValidation,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("category/form", {
        title: "Edit Category",
        category: { ...req.body, id: req.params.id },
        errors: errors.array(),
        action: `/categories/${req.params.id}/update`,
        method: "POST",
        submitLabel: "Update Category",
        requirePassword: true,
      });
    }

    try {
      const { rowCount } = await pool.query(
        "UPDATE category SET name = $1, description = $2 WHERE id = $3",
        [req.body.name, req.body.description || null, req.params.id]
      );

      if (rowCount === 0) {
        return res.status(404).render("error", {
          title: "Not Found",
          message: "Category not found.",
          statusCode: 404,
        });
      }

      res.redirect(`/categories/${req.params.id}`);
    } catch (err) {
      if (err.code === "23505") {
        return res.status(400).render("category/form", {
          title: "Edit Category",
          category: { ...req.body, id: req.params.id },
          errors: [{ msg: "A category with this name already exists." }],
          action: `/categories/${req.params.id}/update`,
          method: "POST",
          submitLabel: "Update Category",
          requirePassword: true,
        });
      }
      next(err);
    }
  },
];

exports.deletePost = async (req, res, next) => {
  try {
    const { rows: items } = await pool.query(
      "SELECT id FROM item WHERE category_id = $1 LIMIT 1",
      [req.params.id]
    );

    if (items.length > 0) {
      const { rows: category } = await pool.query(
        "SELECT name FROM category WHERE id = $1",
        [req.params.id]
      );

      return res.status(400).render("error", {
        title: "Cannot Delete Category",
        message: `The category "${category[0]?.name || ""}" still contains items. Delete or reassign those items before deleting the category.`,
        statusCode: 400,
      });
    }

    const { rowCount } = await pool.query(
      "DELETE FROM category WHERE id = $1",
      [req.params.id]
    );

    if (rowCount === 0) {
      return res.status(404).render("error", {
        title: "Not Found",
        message: "Category not found.",
        statusCode: 404,
      });
    }

    res.redirect("/categories");
  } catch (err) {
    next(err);
  }
};
