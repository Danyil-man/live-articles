import 'reflect-metadata';
import express from 'express';

async function startServer() {
  const app = express();
  await require('./dependecies').default({ expressApp: app });

  app
    .listen(process.env.PORT, () => {
      console.log(`
      ################################################
              Server listening on port: ${process.env.PORT} 
      ################################################
    `);
    })
    .on('error', (err) => {
      console.log('Error:', err);
      process.exit(1);
    });
}

startServer();
