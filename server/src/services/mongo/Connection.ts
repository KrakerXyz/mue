
import { MongoClient } from 'mongodb';

export const dbs = {
};

export async function getConnection(name: string) {
   const client = new MongoClient(dbs[name as keyof typeof dbs].connectionString);
   await client.connect();
   return client;
}