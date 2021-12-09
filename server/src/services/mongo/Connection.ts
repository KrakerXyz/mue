
import { MongoClient } from 'mongodb';

export async function getConnection(connectionString: string) {
   const client = new MongoClient(connectionString);
   await client.connect();
   return client;
}