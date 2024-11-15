const dotenv = require("dotenv");
const express = require("express");
const cookieparser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const cors = require("cors");

// Configuring dotenv
dotenv.config();
const app = express();

// Setting up middlewares to parse request body and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieparser());
app.use(cors());

const userCredentials = {
  username: "admin",
  password: "admin123",
  email: "admin@gmail.com",
  name: "admin",
};

app.post(
  "/login",
  check("username", "name is required"),
  check("password", "password is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Destructuring username &amp; password from body
    const { username, password } = req.body;

    // Checking if credentials match
    if (
      username === userCredentials.username &&
      password === userCredentials.password
    ) {
      //creating a access token
      const accessToken = jwt.sign(
        {
          username: userCredentials.username,
          email: userCredentials.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "10m",
        }
      );
      // Creating refresh token not that expiry of refresh
      //token is greater than the access token

      const refreshToken = jwt.sign(
        {
          username: userCredentials.username,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
      );

      // Assigning refresh token in http-only cookie
      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        sameSite: "None",
        secure: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
      return res.json({ accessToken });
    } else {
      // Return unauthorized error if credentials don't match
      return res.status(406).json({
        message: "Invalid credentials",
      });
    }
  }
);

app.post("/refresh", (req, res) => {
  if (req.cookies?.jwt) {
    // Destructuring refreshToken from cookie
    const refreshToken = req.cookies.jwt;

    // Verifying refresh token
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          // Wrong Refesh Token
          return res.status(406).json({ message: "Unauthorized" });
        } else {
          // Correct token we send a new access token
          const accessToken = jwt.sign(
            {
              username: userCredentials.username,
              email: userCredentials.email,
            },
            process.env.ACCESS_TOKEN_SECRET,
            {
              expiresIn: "10m",
            }
          );
          return res.json({ accessToken });
        }
      }
    );
  } else {
    return res.status(406).json({ message: "Unauthorized" });
  }
});

app.get("/", (req, res) => {
  res.send("Server");
  console.log("server running");
});
app.get("/user", (req, res) => {
  try {
    const { password, ...user } = userCredentials;
    res.json({ user });
  } catch (err) {
    res.status(err).json({ message: "no data available" });
  }
});

app.listen(8000, () => {
  console.log(`Server active on http://localhost:${8000}!`);
});
