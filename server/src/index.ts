// eslint-disable-next-line @typescript-eslint/no-var-requires
import { config as dotEnvConfig } from 'dotenv';
dotEnvConfig();

import fastify from 'fastify';
import fastifyWebsocket from 'fastify-websocket';
import fastifyStatic from 'fastify-static';

import { WebSocketManager } from './services/index.js';
import path from 'path';
const __dirname = path.resolve();

import * as electron from 'electron';
import { WebsocketRpc } from './services/WebSocketRpc.js';

console.log('Initializing Fastify');

const server = fastify({
   logger: {
      level: 'trace',
      prettyPrint: process.env.NODE_ENV !== 'development' && {
         translateTime: 'SYS:h:MM:ss TT Z o',
         colorize: true,
         ignore: 'pid,hostname',
      },
   },
});

server.register(fastifyWebsocket, {
   errorHandler: (_, conn) => {
      conn.socket.close(4001, 'Unauthorized');
      conn.destroy();
   },
});

server.register(fastifyStatic, {
   root: path.join(__dirname, '.web'),
   immutable: true,
   maxAge: '1d',
});

const webSocketManager = new WebSocketManager();
server.get('/ws', { websocket: true }, webSocketManager.handler);

const websocketRpc = new WebsocketRpc();
server.get('/ws-rpc', { websocket: true }, websocketRpc.handler);

server.setNotFoundHandler((req, res) => {
   if (req.method !== 'GET') {
      return res.status(404).send();
   }
   if (req.url.startsWith('/api')) {
      return res.status(404).send();
   }
   return res.sendFile('index.html');
});

server.ready(() => {
   server.log.info('Fastify ready');
});

const start = async () => {
   try {
      await server.listen(3001, '0.0.0.0');
   } catch (err) {
      server.log.error(err);
      process.exit(1);
   }
};

if (process.versions['electron']) {
   console.log('Opening electron');
   start().then(() => {
      electron.app.whenReady().then(() => {
         const win = new electron.BrowserWindow({ width: 1200, height: 1000, autoHideMenuBar: true, frame: false });
         win.loadURL('http://localhost:3000');
      });
   });
} else {
   start();
}
