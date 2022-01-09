import { ConnectionString } from '../../../../core/models/index.js';
import { MongoClient } from 'mongodb';

export async function getConnection(connectionString: ConnectionString) {
   try {
      const client = new MongoClient(connectionString);
      await client.connect();
      return client;
   } catch (e) {
      throw new Error(`Error connecting to db: ${e}`);
   }
}
