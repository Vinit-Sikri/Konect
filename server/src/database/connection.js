// src/database/connection.js
const { Sequelize } = require('sequelize');
const config = require('../../config');

let sequelize;

if (config.database.url) {
  // ✅ For DATABASE_URL (Render / external DB)
  sequelize = new Sequelize(config.database.url, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Render ke liye required
      },
    },
  });
} else {
  // ✅ For local DB (fallback)
  sequelize = new Sequelize(
    config.database.database,
    config.database.username,
    config.database.password,
    {
      host: config.database.host,
      port: config.database.port,
      dialect: 'postgres',
      logging: false,
    }
  );
}

module.exports = sequelize;