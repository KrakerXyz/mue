import type { CommandClientMessage, CommandServerMessage } from '@core/commands';
import type { SubscriptionClientMessage, SubscriptionServerMessage } from '@core/subscriptions';
import { EventEmitter } from './EventEmitter';

const sendQueue: any[] = [];
let connected = false;

const queueSend = (message?: string) => {
   if (message) { sendQueue.push(message); }
   if (!sendQueue.length) { return; }

   if (!connected) { return; }

   const toSend = sendQueue.shift();
   ws?.send(toSend);

   queueSend();
};


const emitter = new EventEmitter();

const url = 'ws://localhost:3000/ws';
const ws = new WebSocket(url);

ws.addEventListener('open', () => {
   connected = true;
   emitter.emit('connected', true);
   queueSend();
});

ws.addEventListener('close', () => {
   connected = false;
   emitter.emit('connected', false);
});

ws.addEventListener('message', data => {
   const obj: CommandServerMessage | SubscriptionServerMessage = JSON.parse(data.data);
   emitter.emit('message', obj);
});

export function addEventListener(this: any, name: 'connected' | 'disconnected' | 'message', cb: (evt: any) => void) {
   emitter.on(name, cb.bind(this));
}

export function send(msg: SubscriptionClientMessage | CommandClientMessage | string) {
   const str = typeof msg === 'string' ? msg : JSON.stringify(msg);
   queueSend(str);
}