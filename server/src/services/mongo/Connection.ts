
import { ConnectionString } from '@core/models';
import { MongoClient } from 'mongodb';

export async function getConnection(connectionString: ConnectionString) {
   const client = new MongoClient(connectionString);
   await client.connect();
   return client;
}