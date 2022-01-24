import { Database } from './index.js';

export interface SchemaGroup {
   id: string;
   name: string;
   databases: Database[];
}
