import { addContextMenuOptions } from './saveToJournal';
import { initSettings } from './settings';

Hooks.on('setup', initSettings);
Hooks.on('getChatLogEntryContext', addContextMenuOptions);
