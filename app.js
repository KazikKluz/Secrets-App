const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const encrypt = require("mongoose-encryption");
const app = express();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");

require("dotenv").config();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL:
        "https://secrets-app-9vdd6.ondigitalocean.app/auth/google/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.APP_ID,
      clientSecret: process.env.APP_SECRET,
      callbackURL:
        "https://secrets-app-9vdd6.ondigitalocean.app/auth/facebook/secrets",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ facebookId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

app.get("/", (req, res) => {
  res.render("home");
});

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
  "/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  }
);

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/");
  }
});

app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.passwore,
  });
  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/submit", (req, res) => {
  User.findById(req.user.id, (err, foundUser) => {
    if (foundUser) {
      foundUser.secret = req.body.secret;
      foundUser.save();
      res.redirect("/secrets");
    }
  });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, () => {
          res.redirect("/secrets");
        });
      }
    }
  );
});

app.get("/secrets", (req, res) => {
  User.find({ secret: { $ne: null } }, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else if (foundUser) {
      res.render("secrets", { userWithSecrets: foundUser });
    }
  });
});

app.listen(3000, (err) => {
  if (!err) {
    console.log("server running at port 3000");
  }
});
