
import { Command } from '@core/commands';
import { EventEmitter } from 'eventemitter3';

export const commandEvents = new EventEmitter<Record<Command['name'], Command>>();