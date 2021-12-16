
export type ConnectionString = `mongodb+srv://${string}` | `mongodb://${string}`;

export interface Connection {
   name: string;
   connectionString: ConnectionString;
}