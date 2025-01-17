/* eslint-disable no-undef */
import { addContextMenuOptions, initSettings } from './logger';

Hooks.on('setup', initSettings);
Hooks.on('getChatLogEntryContext', addContextMenuOptions);
