export interface Database {
  connection: string;
  name: string;
}

export interface DatabaseCopyConfig {
  fromConnection: string;
  fromDatabase: string;
  toConnection: string;
  toDatabase: string;
}

export interface DatabaseCopyStatus {
  status: string;
}
