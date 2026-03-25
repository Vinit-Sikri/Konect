const sequelize = require('../database/connection');

async function startServer(PORT, server) {
  try {
    await sequelize.sync({ force: false });
    console.log('Sequelize models synchronized with the database');
  } catch (error) {
    console.error('DB sync failed (continuing):', error.message);
  }

  await new Promise((resolve) => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log('######################################################################');
      console.log(`####   Server running on http://0.0.0.0:${PORT}   ####`);
      console.log('######################################################################');
      resolve();
    });
  });

  return server;
}

async function handleShutdown(server) {
  process.on('SIGINT', async () => {
    console.log('Shutting down...');

    try {
      await sequelize.close();
      console.log('DB closed');
    } catch (err) {
      console.error('DB close error:', err);
    }

    if (server) {
      server.close(() => {
        console.log('Server stopped');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
}

module.exports = {
  startServer,
  handleShutdown,
};