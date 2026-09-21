require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const User = require("./models/User");
const requireAuth = require("./middleware/auth");

const app = express();


// =====================================
// CONFIGURATION
// =====================================

const PORT = process.env.PORT || 5000;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:3000";


// =====================================
// MIDDLEWARE
// =====================================

app.use(express.json());

app.use(cookieParser());

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
);


// =====================================
// DATABASE
// =====================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error(
      "MongoDB connection error:",
      error.message
    );
  });


// =====================================
// HEALTH CHECK
// =====================================

app.get("/", (req, res) => {

  res.json({
    success: true,
    message: "LoRA Platform API is running"
  });

});


// =====================================
// SIGN UP
// =====================================

app.post("/api/auth/signup", async (req, res) => {

  try {

    const {
      name,
      email,
      password,
      confirmPassword
    } = req.body;


    // -----------------------------
    // Required fields
    // -----------------------------

    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword
    ) {

      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });

    }


    // -----------------------------
    // Name validation
    // -----------------------------

    if (name.trim().length < 2) {

      return res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters"
      });

    }


    // -----------------------------
    // Email validation
    // -----------------------------

    const normalizedEmail =
      email.trim().toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {

      return res.status(400).json({
        success: false,
        message: "Enter a valid email address"
      });

    }


    // -----------------------------
    // Password validation
    // -----------------------------

    if (password.length < 8) {

      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters"
      });

    }


    // -----------------------------
    // Confirm password
    // -----------------------------

    if (password !== confirmPassword) {

      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });

    }


    // -----------------------------
    // Check existing account
    // -----------------------------

    const existingUser =
      await User.findOne({
        email: normalizedEmail
      });

    if (existingUser) {

      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists"
      });

    }


    // -----------------------------
    // Hash password
    // -----------------------------

    const passwordHash =
      await bcrypt.hash(password, 12);


    // -----------------------------
    // Create trial
    // -----------------------------

    const trialStartedAt = new Date();

    const trialEndsAt =
      new Date(
        trialStartedAt.getTime()
        + 60 * 60 * 1000
      );


    // -----------------------------
    // Create user
    // -----------------------------

    const user =
      await User.create({

        name: name.trim(),

        email: normalizedEmail,

        passwordHash,

        plan: "free",

        trialStartedAt,

        trialEndsAt

      });


    // -----------------------------
    // Create authentication token
    // -----------------------------

    const token =
      jwt.sign(
        {
          userId: user._id.toString()
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d"
        }
      );


    // -----------------------------
    // Secure cookie
    // -----------------------------

    res.cookie(
      "auth_token",
      token,
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV === "production",

        sameSite:
          process.env.NODE_ENV === "production"
            ? "none"
            : "lax",

        maxAge:
          7 * 24 * 60 * 60 * 1000
      }
    );


    // -----------------------------
    // Response
    // -----------------------------

    res.status(201).json({

      success: true,

      message:
        "Account created successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan
      }

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      success: false,

      message: "Internal server error"

    });

  }

});


// =====================================
// LOGIN
// =====================================

app.post("/api/auth/login", async (req, res) => {

  try {

    const {
      email,
      password
    } = req.body;


    if (!email || !password) {

      return res.status(400).json({

        success: false,

        message:
          "Email and password are required"

      });

    }


    const normalizedEmail =
      email.trim().toLowerCase();


    // Find account

    const user =
      await User.findOne({
        email: normalizedEmail
      });


    if (!user) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid email or password"

      });

    }


    // Compare password

    const passwordCorrect =
      await bcrypt.compare(
        password,
        user.passwordHash
      );


    if (!passwordCorrect) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid email or password"

      });

    }


    // Create JWT

    const token =
      jwt.sign(
        {
          userId:
            user._id.toString()
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d"
        }
      );


    // Cookie

    res.cookie(
      "auth_token",
      token,
      {

        httpOnly: true,

        secure:
          process.env.NODE_ENV === "production",

        sameSite:
          process.env.NODE_ENV === "production"
            ? "none"
            : "lax",

        maxAge:
          7 * 24 * 60 * 60 * 1000

      }
    );


    res.json({

      success: true,

      message: "Login successful",

      user: {

        id: user._id,

        name: user.name,

        email: user.email,

        plan: user.plan

      }

    });

  } catch (error) {

    console.error(error);

    res.status(500).json({

      success: false,

      message: "Internal server error"

    });

  }

});


// =====================================
// GET CURRENT USER
// =====================================

app.get(
  "/api/auth/me",
  requireAuth,
  async (req, res) => {

    try {

      const user =
        await User.findById(
          req.userId
        ).select("-passwordHash");


      if (!user) {

        return res.status(404).json({

          success: false,

          message: "User not found"

        });

      }


      res.json({

        success: true,

        user

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message: "Internal server error"

      });

    }

  }
);


// =====================================
// LOGOUT
// =====================================

app.post(
  "/api/auth/logout",
  (req, res) => {

    res.clearCookie(
      "auth_token",
      {

        httpOnly: true,

        secure:
          process.env.NODE_ENV === "production",

        sameSite:
          process.env.NODE_ENV === "production"
            ? "none"
            : "lax"

      }
    );


    res.json({

      success: true,

      message: "Logged out successfully"

    });

  }
);


// =====================================
// PROTECTED TEST API
// =====================================

app.get(
  "/api/protected",
  requireAuth,
  (req, res) => {

    res.json({

      success: true,

      message:
        "You are authenticated",

      userId:
        req.userId

    });

  }
);


// =====================================
// START SERVER
// =====================================

app.listen(
  PORT,
  () => {

    console.log(
      `Server running on port ${PORT}`
    );

  }
);