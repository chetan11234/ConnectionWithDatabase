import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "laterAddEnv",
  host: "laterAddEnv",
  database: "laterAddEnv",
  password: "laterAddEnv",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [];

const members_data = await db.query("SELECT user_id,name,color FROM members");
users = members_data.rows;
console.log("is this middleware");
console.log(users);

async function getUserVisitedCtry(user_id) {
  const result = await db.query("SELECT c.country_code FROM user_country_records as ucr JOIN countries as c ON c.country_code = ucr.country_code JOIN members as m ON m.user_id = ucr.user_id WHERE m.user_id = $1;", [user_id]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
app.get("/userId/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  console.log(user_id);
  const countries = await getUserVisitedCtry(user_id);
  console.log(countries);
  const user_Index = users.findIndex((user) => {
    if (user.user_id == user_id) return true;
  })
  console.log(user_Index);
  console.log(users[user_Index]);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    user_id: user_id,
    color: users[user_Index].color,
  });
});
app.post("/add/:user_id", async (req, res) => {
  const user_id = req.params.user_id;
  console.log(user_id);
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE $1",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    console.log(countryCode);
    try {
      console.log("before inserting in db");
      await db.query(
        "INSERT INTO user_country_records (user_id,country_code) VALUES ($1,$2)",
        [user_id, countryCode]
      );
      res.redirect(`/userId/${user_id}`);
    } catch (err) {
      console.log("error while inserting in database:");
      console.log(err);
      const countries = await getUserVisitedCtry(user_id);
      const user_Index = users.findIndex((user) => {
        if (user.user_id == user_id) return true;
      })
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country has already been added, try again.",
        users: users,
        user_id: user_id,
        color: users[user_Index].color
      });
    }
  } catch (err) {
    console.log(err);
    const countries = await getUserVisitedCtry(user_id);
    const user_Index = users.findIndex((user) => {
      if (user.user_id == user_id) return true;
    })
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      error: "This country does not exist, maybe you type incorrect .",
      user_id: user_id,
      color: users[user_Index].color,
    });
  }
});
app.post("/user", async (req, res) => {
  const isAdd = req.body.add;
  const user_id = req.body.user;
  console.log("it is entering")
  console.log(user_id);
  console.log(isAdd);
  if (isAdd == "new") {
    console.log("it is working fine. ");
    res.render("new.ejs");
  }
  else {
    console.log(user_id);
    const countries = await getUserVisitedCtry(user_id);
    console.log(countries);
    const user_Index = users.findIndex((user) => {
      if (user.user_id == user_id) return true;
    })

    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      user_id: user_id,
      color: users[user_Index].color,
    });

  }

});

app.post("/new", async (req, res) => {
  const name = req.body["name"];
  const color = req.body["color"];
  try {
    const assigned_id = await db.query("INSERT INTO members (name,color) VALUES ($1,$2) RETURNING user_id", [name, color]);
    const user_id = assigned_id.rows[0].user_id;
    console.log(assigned_id);
    users.push({ user_id: user_id, name: name, color: color });
    console.log(users);
    res.redirect(`/userId/${user_id}`);
  } catch (error) {
    console.log(error);
    res.render("new.ejs", {
      error: "Error in inserting ", user: name
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
