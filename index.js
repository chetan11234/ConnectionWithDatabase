import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: "postgres",
  database: "World",
  host: "localhost",
  password: "Tumk53@H",
  port: 5432
});

db.connect();

async function getUserQuery(countryName) {
  const result = await db.query('SELECT country_code FROM countries WHERE country_name = $1', [countryName]);
  console.log(result.rows);
  return result.rows;
}
async function isDuplicate(countryCode) {
  const result = await db.query('SELECT country_code from visited_countries WHERE country_code = $1', [countryCode]);
  if (result.rows.length != 0) return true;
  else return false;
}

let error = "";

app.get("/", async (req, res) => {

  if (error === "") {
    let dbCountries = await db.query("SELECT country_code from visited_countries");
    res.render("index.ejs", { total: dbCountries.rows.length, countries: dbCountries.rows });
  } else {
    let dbCountries = await db.query("SELECT country_code from visited_countries");
    console.log(dbCountries);
    res.render("index.ejs", { total: dbCountries.rows.length, countries: dbCountries.rows, error: error });
  }

});

app.post("/add", async (req, res) => {
  const countryName = req.body.country;
  let country_codes;
  country_codes = await getUserQuery(countryName);
  if (country_codes.length === 0) {
    error = "Either this country does not exist or you have made spelling mistake.";
    res.redirect("/");
  } else {
    const isDupli = await isDuplicate(country_codes[0].country_code);
    if (country_codes.length === 1 && !isDupli) {
      let country_code = country_codes[0].country_code;
      console.log(country_code);
      await db.query('INSERT INTO visited_countries (country_code) VALUES ($1)', [country_code]);
      error = "";
      res.redirect("/");
    } else {
      error = "This country is already travelled by you.";
      res.redirect("/");
    }
  }

});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
