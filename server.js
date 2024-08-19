const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const PORT = process.env.PORT || 5555;

const app = express();
app.use(cors());
app.use(express.json());

// Connect to the SQLite database
const dbPath = path.resolve(__dirname, "./data/data.db");
console.log(`Database Path: ${dbPath}`);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    console.log("Connected to the SQLite database.");

    // Check if the models table exists
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='models'",
      (err, row) => {
        if (!row) {
          // Create the models table if it doesn't exist
          db.run(
            `CREATE TABLE models (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT,
              path TEXT,
              description TEXT,
              version TEXT,
              tags TEXT,
              images TEXT
            )`,
            (err) => {
              if (err) {
                console.error("Error creating models table:", err.message);
              } else {
                console.log('Table "models" created.');
              }
            }
          );
        } else {
          console.log('Table "models" already exists.');
        }
      }
    );

    // Check if the loras table exists
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='loras'",
      (err, row) => {
        if (!row) {
          // Create the loras table if it doesn't exist
          db.run(
            `CREATE TABLE loras (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT,
              path TEXT,
              description TEXT,
              version TEXT,
              tags TEXT,
              images TEXT
            )`,
            (err) => {
              if (err) {
                console.error("Error creating loras table:", err.message);
              } else {
                console.log('Table "loras" created.');
              }
            }
          );
        } else {
          console.log('Table "loras" already exists.');
        }
      }
    );
  }
});
// Import and use your routes after DB connection
const modelRoutes = require("./routes/modelRoutes")(db);
app.use("/api", modelRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
