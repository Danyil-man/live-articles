import mongoose, { Connection } from 'mongoose';
import dotenv from 'dotenv';

const envFound = dotenv.config();
if (envFound.error) {
  throw new Error("Couldn't find .env file");
}

export default async (): Promise<Connection> => {
  mongoose.set('strictQuery', false);
  const connection = await mongoose.connect(
    `mongodb+srv://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@livearticles.crlqlbt.mongodb.net/?retryWrites=true&w=majority`,
    {
      serverSelectionTimeoutMS: 1800000,
    },
  );
  return connection.connection;
};
