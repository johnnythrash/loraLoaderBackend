const express = require("express");
const router = express.Router();
const {
  scanDirectory,
  saveModelData,
  saveLoraData,
} = require("../services/scanService");

module.exports = (db) => {
  // Route for scanning regular models
  router.post("/scan/models", async (req, res) => {
    const { directoryPath } = req.body;
    console.log(
      `[INFO] Received /scan/models request with directoryPath: ${directoryPath}`
    );

    try {
      console.log(`[INFO] Scanning directory for models: ${directoryPath}`);
      const models = scanDirectory(directoryPath, "model"); // Adjusted scanDirectory to specify type
      console.log(`[INFO] Found ${models.length} models in directory`);

      await Promise.all(
        models.map(async (model) => {
          console.log(
            `[INFO] Saving model: ${model.name} at path: ${model.path}`
          );
          await saveModelData(db, model.name, model.path);
          console.log(`[INFO] Model ${model.name} saved successfully.`);
        })
      );

      console.log(`[SUCCESS] All models scanned and saved successfully.`);
      res
        .status(200)
        .send({ message: "Models scanned and saved successfully." });
    } catch (error) {
      console.error(`[ERROR] Error in /scan/models: ${error.message}`);
      res.status(500).send({ error: error.message });
    }
  });

  // Route for scanning LoRAs
  router.post("/scan/loras", async (req, res) => {
    const { directoryPath } = req.body;
    console.log(
      `[INFO] Received /scan/loras request with directoryPath: ${directoryPath}`
    );

    try {
      console.log(`[INFO] Scanning directory for LoRAs: ${directoryPath}`);
      const loras = scanDirectory(directoryPath, "lora"); // Adjusted scanDirectory to specify type
      console.log(`[INFO] Found ${loras.length} LoRAs in directory`);

      await Promise.all(
        loras.map(async (lora) => {
          console.log(`[INFO] Saving LoRA: ${lora.name} at path: ${lora.path}`);
          await saveLoraData(db, lora.name, lora.path);
          console.log(`[INFO] LoRA ${lora.name} saved successfully.`);
        })
      );

      console.log(`[SUCCESS] All LoRAs scanned and saved successfully.`);
      res
        .status(200)
        .send({ message: "LoRAs scanned and saved successfully." });
    } catch (error) {
      console.error(`[ERROR] Error in /scan/loras: ${error.message}`);
      res.status(500).send({ error: error.message });
    }
  });

  // Get all models
  router.get("/models", (req, res) => {
    console.log(`[INFO] Received /models request`);
    db.all("SELECT * FROM models", (err, rows) => {
      if (err) {
        console.error(`[ERROR] Error retrieving models: ${err.message}`);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log(`[SUCCESS] Retrieved ${rows.length} models from database.`);
      res.json({ models: rows });
    });
  });

  // Get a single model by ID
  router.get("/models/:id", (req, res) => {
    const id = req.params.id;
    console.log(`[INFO] Received /models/${id} request`);
    db.get("SELECT * FROM models WHERE id = ?", [id], (err, row) => {
      if (err) {
        console.error(
          `[ERROR] Error retrieving model with ID ${id}: ${err.message}`
        );
        res.status(500).json({ error: err.message });
        return;
      }
      if (row) {
        console.log(`[SUCCESS] Retrieved model with ID ${id} from database.`);
        res.json({ model: row });
      } else {
        console.warn(`[WARN] Model with ID ${id} not found.`);
        res.status(404).json({ error: "Model not found" });
      }
    });
  });

  // Search models by name, tags, or description
  router.get("/models/search/:query", (req, res) => {
    const query = `%${req.params.query}%`;
    console.log(`[INFO] Received /models/search/${req.params.query} request`);
    db.all(
      "SELECT * FROM models WHERE name LIKE ? OR tags LIKE ? OR description LIKE ?",
      [query, query, query],
      (err, rows) => {
        if (err) {
          console.error(
            `[ERROR] Error searching models with query "${req.params.query}": ${err.message}`
          );
          res.status(500).json({ error: err.message });
          return;
        }
        console.log(
          `[SUCCESS] Found ${rows.length} models matching query "${req.params.query}".`
        );
        res.json({ models: rows });
      }
    );
  });

  return router;
};
