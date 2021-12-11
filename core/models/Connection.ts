
export type ConnectionString = `mongodb+srv://${string}`;

export interface Connection {
   name: string;
   connectionString: ConnectionString;
}