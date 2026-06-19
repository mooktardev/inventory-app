require("dotenv").config();
const path = require("path");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");

const indexRouter = require("./routes/index");
const categoryRouter = require("./routes/categoryRoutes");
const itemRouter = require("./routes/itemRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout");

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.use("/", indexRouter);
app.use("/categories", categoryRouter);
app.use("/items", itemRouter);

app.use((req, res) => {
  res.status(404).render("error", {
    title: "Not Found",
    message: "The page you requested does not exist.",
    statusCode: 404,
  });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).render("error", {
    title: "Server Error",
    message: "Something went wrong. Please try again later.",
    statusCode: 500,
  });
});

app.listen(PORT, () => {
  console.log(`Inventory app running at http://localhost:${PORT}`);
});
