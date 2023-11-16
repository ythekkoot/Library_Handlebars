const HTTP_PORT = process.env.PORT || 3000;

const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const app = express();
const fs = require("fs");
const crypto = require("crypto");
const cookieParser = require("cookie-parser");
const { constants } = require("buffer");
const { response } = require("express");

const loginInfo = JSON.parse(fs.readFileSync("./users.json"));
const bookList = JSON.parse(fs.readFileSync("./books.json"));

/*jshint -W119*/
// authentication data
const authTokens = {};
authTokens["0"] = "notAuthenticated";
const generateAuthToken = () => {
  return crypto.randomBytes(30).toString("hex");
};

app.engine(
  ".hbs",
  exphbs.engine({
    extname: ".hbs",
    helpers: require("./handlebars-helpers"),
    defaultLayout: "layout",
    layoutsDir: path.join(__dirname, "/views"),
  })
);

// middleware
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", ".hbs");
app.use(cookieParser());
app.use((req, res, next) => {
  const authToken = req?.cookies?.AuthToken ?? "0"; // jshint ignore:line
//   if (authToken === "0") {
//     setTimeout(() =>  { 
//         res.redirect("/");
//     }, 10000);
//   }

  if (authTokens[authToken] === "notAuthenticated") {
    next();
  } else {
    req.user = authTokens[authToken];
    next();
  }
});

app.get("/", (req, res) => {
  const path = req.path;
  res.render("index", { title: "Library", url: path });
});

app.get("/sign-in", (req, res) => {
  const path = req.path;
  res.render("sign_in", { title: "Library-Sign-in", url: path });
});

app.post("/sign-in", (req, res) => {
  const path = req.path;
  const { username, password } = req.body;
  //const isValidUser = Object.keys(loginInfo).some(key => key === username && loginInfo[key] === password);
  const isValidUser = Object.keys(loginInfo).some((key) => key === username);

  if (isValidUser) {
    const isValidPass = loginInfo[username] === password;
    if (isValidPass) {
      const authToken = generateAuthToken();
      authTokens[authToken] = username;
      res.cookie("AuthToken", authToken, { maxAge: 180000 });  // Timeout after 3 minutes
      res.redirect("/home");
    } else {
      res.render("sign_in", {
        title: "Library-Sign-in",
        message: "Invalid password",
        messageClass: "alert-danger",
        url: path,
      });
    }
  } else {
    res.render("sign_in", {
      title: "Library-Sign-in",
      message: "Not a registered username",
      messageClass: "alert-danger",
      url: path,
    });
  }
});

app.get("/booklist", (req, res) => {
  res.json({ data: bookList });
});

app.get("/home", (req, res) => {
  const path = req.path;
  let checkBox = req.body.Book;

  let someData = {
    availableBooks: bookList,
    userName: req.user,
  };

  if (req.user) {
    res.render("home", { title: "Library-Home", url: path, data: someData });
  } else {
    res.redirect("/");
  }
});

app.post("/borrow", async (req, res) => {

  const { Book } = req.body;
  let data = [];
  if(Array.isArray(Book)) {
    data = [...Book];
  }
  else {
    data = [Book];
  }
  const newData = bookList.map((book) => {
    if (data.indexOf(book.title) !== -1) {
      return { ...book, available: false };
    } else {
      return book;
    }
  });

  fs.writeFileSync("books.json", JSON.stringify(newData));
  let sentData = { availableBooks: newData, userName: req.user };
  res.render("home", { title: "Library-Home", url: "/home", data: sentData });
});

app.post("/return", async (req, res) => {
  const { Book } = req.body;
  let data = [];
  if(Array.isArray(Book)) {
    data = [...Book];
  }
  else {
    data = [Book];
  }
  const newData = bookList.map((book) => {
    if (data.indexOf(book.title) !== -1) {
      return { ...book, available: true };
    } else {
      return book;
    }
  });
  fs.writeFileSync("books.json", JSON.stringify(newData));
  let sentData = { availableBooks: newData, userName: req.user };
  res.render("home", { title: "Library-Home", url: "/home", data: sentData });
});

app.get("/sign-out", (req, res) => {
  const cookie = req.cookies;

  if (cookie) {
    delete authTokens[cookie];
    res.clearCookie("AuthToken");
  }
  res.redirect("/");
});

const server = app.listen(HTTP_PORT, () => {
  console.log(`Listening on port ${HTTP_PORT}`);
});
