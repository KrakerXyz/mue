import { Command } from '../../../../core/commands/index.js';
import eventEmitterPkg from 'eventemitter3';
const { EventEmitter } = eventEmitterPkg;
export const commandEvents = new EventEmitter<Record<Command['name'], Command>>();
