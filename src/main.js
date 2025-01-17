/* eslint-disable no-undef */
import { addContextMenuOptions } from './logger';

Hooks.on('getChatLogEntryContext', addContextMenuOptions);
