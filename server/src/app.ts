import 'reflect-metadata';
import express from 'express';

async function startServer() {
  const app = express();
  await require('./dependecies').default({ expressApp: app });

  app
    .listen(5000, () => {
      console.log(`
      ################################################
              Server listening on port: ${5000}
      ################################################
    `);
    })
    .on('error', (err) => {
      console.log('Error:', err);
      process.exit(1);
    });
}

startServer();
