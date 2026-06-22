import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let dbCountries;
const db = new pg.Client({
  user: "postgres",
  database: "World",
  host: "localhost",
  password: "Tumk53@H",
  port: 5432
});

db.connect();
db.query("SELECT country_code from visited_countries", (err, res) => {
  if (err) {
    console.log("Error in fetching data : " + err.message);
  } else {
    dbCountries = res.rows;
  }
})
app.get("/", async (req, res) => {

  // console.log(dbCountries);

  console.log("in the get http method.");
  res.render("index.ejs", { total: dbCountries.length, countries: dbCountries });
});

app.post("/add", async (req, res) => {
  const country = req.body.country;
  let country_code;
  const query = `SELECT country_code FROM countries WHERE country_name ='${country}';`;
  console.log(query);
  await db.query(query, (err, res) => {
    if (err) {
      console.log("Error in fetching data : " + err.message);
    } else {
      country_code = res.rows;
    }
  });
  console.log(country_code);
  // db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [country_code]);
  // res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
