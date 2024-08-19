const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Resolve the path for the SQLite database
const dbPath = path.resolve(__dirname, "../data/data.db");
console.log(`Database Path: ${dbPath}`);

const db = new sqlite3.Database(dbPath, async (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");

    // Create table and wait for the completion
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS models (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          path TEXT,
          metadata TEXT,
					description TEXT,
    			version TEXT,
   				tags TEXT,
    			images TEXT
        )`,
        (err) => {
          if (err) {
            console.error("Error creating table:", err.message);
          } else {
            console.log('Table "models" created or already exists.');
            // After creating the table, proceed with the rest of the operations
            startScanning(); // Your function to start scanning and saving models
          }
        }
      );
    });
  }
});

function startScanning() {
  // This function should include your scanning logic and insert operations
  console.log("Scanning and saving models...");
  // Example insertion to verify:
  db.run(
    `INSERT INTO models (name, path, metadata) VALUES (?, ?, ?)`,
    ["testModel", "test/path", "{}"],
    function (err) {
      if (err) {
        console.error("Insert error:", err.message);
      } else {
        console.log(`Inserted model with ID ${this.lastID}`);
      }
    }
  );
}

module.exports = db;
