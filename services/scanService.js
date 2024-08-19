const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const axios = require("axios");

async function extractMetadata(filePath) {
  try {
    const metadata = execSync(
      `python extract_lora_metadata.py "${filePath}"`
    ).toString();
    return JSON.parse(metadata);
  } catch (error) {
    console.error(`Error extracting metadata for ${filePath}:`, error.message);
    return null;
  }
}

async function fetchModelDataByHash(fileHash) {
  try {
    const response = await axios.get(
      `https://civitai.com/api/v1/model-versions/by-hash/${fileHash}`
    );
    if (response.data) {
      return response.data;
    } else {
      console.log(`No model found for hash: ${fileHash}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching model data by hash:", error);
    return null;
  }
}

const saveLoraData = async (db, loraName, loraPath) => {
  const metadata = extractMetadata(loraPath);

  if (metadata) {
    const metadataToSave = {
      name: metadata.name || loraName,
      description: metadata.description || "",
      tags: metadata.tags ? metadata.tags.join(",") : "",
      version: metadata.version || "",
      images: metadata.images ? metadata.images.join(",") : "",
    };

    db.run(
      `INSERT INTO loras (name, path, description, version, tags, images) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        metadataToSave.name,
        loraPath,
        metadataToSave.description,
        metadataToSave.version,
        metadataToSave.tags,
        metadataToSave.images,
      ],
      function (err) {
        if (err) {
          console.error(`Failed to insert LoRA ${loraName}:`, err.message);
        } else {
          console.log(`LoRA ${loraName} inserted with ID ${this.lastID}`);
        }
      }
    );
  } else {
    console.log(`No metadata found for LoRA ${loraName}`);
  }
};
async function saveModelData(db, modelName, modelPath) {
  const metadata = extractMetadata(modelPath);

  if (metadata) {
    const metadataToSave = {
      name: metadata.name || modelName,
      description: metadata.description || "",
      tags: metadata.tags ? metadata.tags.join(",") : "",
      version: metadata.version || "",
      images: metadata.images ? metadata.images.join(",") : "",
    };

    // Check if the model already exists
    db.get("SELECT * FROM models WHERE path = ?", [modelPath], (err, row) => {
      if (err) {
        console.error(`Error querying model ${modelName}:`, err.message);
      } else if (row) {
        // Model exists, check if any data needs to be updated
        const isDifferent =
          JSON.stringify(metadataToSave) !==
          JSON.stringify({
            name: row.name,
            description: row.description,
            tags: row.tags,
            version: row.version,
            images: row.images,
          });

        if (isDifferent) {
          db.run(
            `UPDATE models SET name = ?, description = ?, version = ?, tags = ?, images = ? WHERE path = ?`,
            [
              metadataToSave.name,
              metadataToSave.description,
              metadataToSave.version,
              metadataToSave.tags,
              metadataToSave.images,
              modelPath,
            ],
            function (err) {
              if (err) {
                console.error(
                  `Failed to update model ${modelName}:`,
                  err.message
                );
              } else {
                console.log(`Model ${modelName} updated.`);
              }
            }
          );
        } else {
          console.log(`Model ${modelName} already exists and is up-to-date.`);
        }
      } else {
        // Model does not exist, insert it
        db.run(
          `INSERT INTO models (name, path, description, version, tags, images) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            metadataToSave.name,
            modelPath,
            metadataToSave.description,
            metadataToSave.version,
            metadataToSave.tags,
            metadataToSave.images,
          ],
          function (err) {
            if (err) {
              console.error(
                `Failed to insert model ${modelName}:`,
                err.message
              );
            } else {
              console.log(`Model ${modelName} inserted with ID ${this.lastID}`);
            }
          }
        );
      }
    });
  } else {
    console.log(`No metadata found for model ${modelName}`);
  }
}

function fallbackSave(db, modelName, modelPath, metadata) {
  const metadataToSave = {
    name: metadata?.name || modelName,
    description: metadata?.description || "",
    tags: metadata?.tags ? metadata.tags.join(",") : "",
    version: metadata?.version || "",
    images: metadata?.images ? metadata.images.join(",") : "",
  };

  db.run(
    `INSERT INTO models (name, path, description, version, tags, images) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      metadataToSave.name,
      modelPath,
      metadataToSave.description,
      metadataToSave.version,
      metadataToSave.tags,
      metadataToSave.images,
    ],
    function (err) {
      if (err) {
        console.error(`Failed to insert model ${modelName}:`, err.message);
      } else {
        console.log(`Model ${modelName} inserted with ID ${this.lastID}`);
      }
    }
  );
}

function scanDirectory(directoryPath) {
  let models = [];
  fs.readdirSync(directoryPath).forEach((file) => {
    const ext = path.extname(file);
    if (ext === ".ckpt" || ext === ".safetensors") {
      const modelName = path.basename(file, ext);
      const modelPath = path.join(directoryPath, file);

      if (fs.existsSync(modelPath)) {
        models.push({
          name: modelName,
          type: ext === ".ckpt" ? "Checkpoint" : "LoRA",
          path: modelPath,
        });
      } else {
        console.warn(`File not found: ${modelPath}, skipping...`);
      }
    }
  });
  return models;
}

module.exports = {
  scanDirectory,
  saveModelData,
  fetchModelDataByHash,
  saveLoraData,
};
