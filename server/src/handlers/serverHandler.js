// server_handler.js
const http = require('http');
const sequelize = require('../database/connection'); // Import Sequelize connection

async function startServer(PORT, server) {
    try {
        await sequelize.sync({ force: false });
        console.log('Sequelize models synchronized with the database');
        await new Promise((resolve) => {
            server.listen(PORT, '0.0.0.0', () => {
            console.log('######################################################################');
            console.log(`####          Server is running on http://0.0.0.0:${PORT}          ####`);
            console.log('######################################################################');
            resolve();
        });
        });
        return server; // Return the server object for graceful shutdown
    } catch (error) {
        console.error('Error synchronizing Sequelize models:', error.message);
        return null;
    }
}

async function handleShutdown(server) {
    process.on('SIGINT', () => {
        console.log('Received SIGINT signal (Ctrl+C)');
        sequelize.close()
            .then(() => {
                console.log('Closed Sequelize connection');
                if (!server) {
                    process.exit(0);
                }
                server.close(() => {
                    console.log('Server is shutting down gracefully');
                    process.exit(0);
                });
            })
            .catch((err) => {
                console.error('Error closing Sequelize connection:', err);
                if (!server) {
                    process.exit(1);
                }
                server.close(() => {
                    console.error('Server is shutting down abruptly');
                    process.exit(1);
                });
            });
    });
}

module.exports = {
    startServer,
    handleShutdown,
};
