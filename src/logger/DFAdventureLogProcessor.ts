import {
  ChatMessageData,
  ChatMessageDataConstructorData,
} from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/chatMessageData';
import SETTINGS from '../settings';
import DFChatEditor from '../edit/DFChatEditor';
import DFAdventureLogConfig from './DFAdventureLogConfig';

declare global {
  namespace SimpleCalendar.api {
    function formatDateTime(time: {
      year: number;
      month: number;
      day: number;
      hour: number;
      minute: number;
      second: number;
    }): { date: string; time: string };
    function formatDateTime(
      time: {
        year: number;
        month: number;
        day: number;
        hour: number;
        minute: number;
        second: number;
      },
      format: string,
    ): string;
    function timestamp(): number;
    function timestampToDate(timestamp: number): {
      year: number;
      month: number;
      day: number;
      hour: number;
      minute: number;
      second: number;
    };
  }
}

declare global {
  interface String {
    trimStart(): string;
  }
}
if (!String.prototype.trimStart) {
  String.prototype.trimStart = function () {
    const whitespace = [' ', '\n', '\r'];
    let index = -1;
    for (let c = 0; c < this.length; c++) {
      if (whitespace.every((x) => x !== this[c])) break;
      index = c;
    }
    return this.substr(index + 1);
  };
}

declare interface ChatCommand {
  commandKey: string;
  shouldDisplayToChat: boolean;
  invokeOnCommand: () => void;
  createdMessageType: number;
  iconClass: string;
  description: string;
  gmOnly: boolean;
}

declare class ChatCommands {
  /**
   * Registers a Chat Command to be handled
   */
  registerCommand(command: ChatCommand): void;
  /**
   * Deregister a Chat Command
   */
  deregisterCommand(command: ChatCommand): void;
  createCommandFromData(data: any): ChatCommand;
}

declare class GameExt extends Game {
  chatCommands: ChatCommands;
}

export default class DFAdventureLogProcessor {
  static readonly PREF_ENABLE = 'enable-command';
  static readonly PREF_GMONLY = 'df-log-gmonly';
  static readonly PREF_GMONLY_WHISPER = 'df-log-gmonly-whisper';
  static readonly PREF_MESSAGES = 'df-log-messages';
  static readonly PREF_SORTDESC = 'df-log-sortdesc';
  static readonly PREF_DISABLE_FORMATTING = 'df-log-disable-format';
  static readonly PREF_DISABLE_AUTHOR = 'df-log-disable-author';
  static readonly PREF_SIMPLE_CALENDAR = 'df-log-use-simple-calendar';
  static readonly PREF_USE_TIME = 'df-log-use-time';
  static readonly PREF_PLAYER_LOG_JOURNAL = 'PlayerAdventureLog';
  static logCommand: ChatCommand = null;
  static gmlogCommand: ChatCommand = null;
  static plogCommand: ChatCommand = null;

  static appendChatContextMenuOptions(options: ContextMenu.Item[]) {
    options.push({
      name: 'DF_CHAT_LOG.ContextMenu_AsEvent',
      icon: '<i style="color:SeaGreen" class="fas fa-edit"></i>',
      condition: () => {
        const enabled = SETTINGS.get(DFAdventureLogProcessor.PREF_ENABLE);
        const isGM = game.user.isGM;
        const gmOnly = SETTINGS.get(DFAdventureLogProcessor.PREF_GMONLY);
        return enabled && (!gmOnly || isGM);
      },
      callback: (header) => {
        const chatData = <ChatMessageData>(
          (<any>ui.chat.collection.get($(header).attr('data-message-id')))
        );
        DFAdventureLogProcessor.commandProcessor(chatData.content, false, false);
        return {};
      },
    });
    options.push({
      name: 'DF_CHAT_LOG.ContextMenu_AsQuote',
      icon: '<i style="color:SeaGreen" class="fas fa-quote-right"></i>',
      condition: () => {
        const enabled = SETTINGS.get(DFAdventureLogProcessor.PREF_ENABLE);
        const isGM = game.user.isGM;
        const gmOnly = SETTINGS.get(DFAdventureLogProcessor.PREF_GMONLY);
        return enabled && (!gmOnly || isGM);
      },
      callback: (header) => {
        const chatData = <ChatMessageData>(
          (<any>ui.chat.collection.get($(header).attr('data-message-id')))
        );
        if (chatData.content.trimStart().startsWith('"'))
          DFAdventureLogProcessor.commandProcessor('q ' + chatData.content, false, false);
        else
          DFAdventureLogProcessor.commandProcessor(
            `q "${game.users.get(chatData.user).name}" ${chatData.content}`,
            false,
            false,
          );
        return {};
      },
    });
    options.push({
      name: 'DF_CHAT_LOG.ContextMenu_AsGmEvent',
      icon: '<i style="color:FireBrick" class="fas fa-edit"></i>',
      condition: () => {
        const enabled = SETTINGS.get(DFAdventureLogProcessor.PREF_ENABLE);
        const isGM = game.user.isGM;
        return enabled && isGM;
      },
      callback: (header) => {
        const chatData = <ChatMessageData>(
          (<any>ui.chat.collection.get($(header).attr('data-message-id')))
        );
        DFAdventureLogProcessor.commandProcessor(chatData.content, true, false);
        return {};
      },
    });
    options.push({
      name: 'DF_CHAT_LOG.ContextMenu_AsGmQuote',
      icon: '<i style="color:FireBrick" class="fas fa-quote-right"></i>',
      condition: () => {
        const enabled = SETTINGS.get(DFAdventureLogProcessor.PREF_ENABLE);
        const isGM = game.user.isGM;
        return enabled && isGM;
      },
      callback: (header) => {
        const chatData = <ChatMessageData>(
          (<any>ui.chat.collection.get($(header).attr('data-message-id')))
        );
        if (chatData.content.trimStart().startsWith('"'))
          DFAdventureLogProcessor.commandProcessor('q ' + chatData.content, true, false);
        else
          DFAdventureLogProcessor.commandProcessor(
            `q "${game.users.get(chatData.user).name}" ${chatData.content}`,
            true,
            false,
          );
        return {};
      },
    });
  }

  static setupSettings() {
    SETTINGS.register(DFAdventureLogProcessor.PREF_ENABLE, {
      scope: 'world',
      name: 'DF_CHAT_LOG.Setting.EnableTitle',
      hint: 'DF_CHAT_LOG.Setting.EnableHint',
      config: true,
      type: Boolean,
      default: true,
      onChange: (enabled: boolean) => {
        if (!enabled && !!DFAdventureLogProcessor.logCommand)
          DFAdventureLogProcessor.deregisterCommand();
        else DFAdventureLogProcessor.registerCommand();
      },
    });
    SETTINGS.register(DFAdventureLogProcessor.PREF_GMONLY, {
      name: 'DF_CHAT_LOG.Setting.GmOnlyTitle',
      hint: 'DF_CHAT_LOG.Setting.GmOnlyHint',
      scope: 'world',
      type: Boolean,
      default: false,
      config: true,
      onChange: (gmOnly) => {
        if (gmOnly && !game.user.isGM) DFAdventureLogProcessor.deregisterCommand();
        else DFAdventureLogProcessor.registerCommand();
      },
    });
    SETTINGS.register(DFAdventureLogProcessor.PREF_GMONLY_WHISPER, {
      name: 'DF_CHAT_LOG.Setting.GmOnlyWhisperName',
      hint: 'DF_CHAT_LOG.Setting.GmOnlyWhisperHint',
      scope: 'world',
      type: Boolean,
      default: false,
      config: true,
    });
    SETTINGS.register(DFAdventureLogProcessor.PREF_USE_TIME, {
      scope: 'world',
      type: Boolean,
      name: 'DF_CHAT_LOG.Setting.UseTimeName',
      hint: 'DF_CHAT_LOG.Setting.UseTimeHint',
      default: true,
      config: true,
    });
    SETTINGS.register(DFAdventureLogProcessor.PREF_MESSAGES, {
      name: 'DF_CHAT_LOG.Setting.PrintMessagesName',
      hint: 'DF_CHAT_LOG.Setting.PrintMessagesHint',
      scope: 'world',
      type: Boolean,
      default: true,
      config: true,
    });
    SETTINGS.register(DFAdventureLogProcessor.PREF_SORTDESC, {
      name: 'DF_CHAT_LOG.Setting.SortDescendingName',
      hint: 'DF_CHAT_LOG.Setting.SortDescendingHint',
      scope: 'world',
      type: Boolean,
      default: false,
      config: true,
      onChange: () => this.resortLog(),
    });
    SETTINGS.register(DFAdventureLogProcessor.PREF_DISABLE_FORMATTING, {
      name: 'DF_CHAT_LOG.Setting.DisableFormatName'.localize(),
      hint: 'DF_CHAT_LOG.Setting.DisableFormatHint'.localize(),
      config: true,
      scope: 'world',
      type: Boolean,
      default: false,
    });
    SETTINGS.register(DFAdventureLogProcessor.PREF_DISABLE_AUTHOR, {
      name: 'DF_CHAT_LOG.Setting.DisableEntryAuthorName'.localize(),
      hint: 'DF_CHAT_LOG.Setting.DisableEntryAuthorHint'.localize(),
      config: true,
      scope: 'world',
      type: Boolean,
      default: false,
    });
    // If Simple Calendar is enabled
    if (game.modules.get('foundryvtt-simple-calendar')?.active) {
      SETTINGS.register(DFAdventureLogProcessor.PREF_SIMPLE_CALENDAR, {
        scope: 'world',
        type: Boolean,
        name: 'DF_CHAT_LOG.Setting.SimpleCalendarName',
        hint: 'DF_CHAT_LOG.Setting.SimpleCalendarHint',
        default: false,
        config: true,
      });
    }

    Hooks.on('closeDFAdventureLogConfig', () => {
      DFAdventureLogProcessor.logConfig = null;
    });
    if ((game as GameExt).chatCommands) DFAdventureLogProcessor.registerCommand();
    else
      Hooks.on('chatCommandsReady', function () {
        DFAdventureLogProcessor.registerCommand();
      });
  }

  static deregisterCommand() {
    (game as GameExt).chatCommands.deregisterCommand(DFAdventureLogProcessor.logCommand);
    (game as GameExt).chatCommands.deregisterCommand(DFAdventureLogProcessor.plogCommand);
    if (DFAdventureLogProcessor.gmlogCommand)
      (game as GameExt).chatCommands.deregisterCommand(DFAdventureLogProcessor.gmlogCommand);
    DFAdventureLogProcessor.logCommand = null;
    DFAdventureLogProcessor.plogCommand = null;
    DFAdventureLogProcessor.gmlogCommand = null;
  }
  static registerCommand() {
    if (!SETTINGS.get(DFAdventureLogProcessor.PREF_ENABLE)) return;
    if (SETTINGS.get(DFAdventureLogProcessor.PREF_GMONLY) && !game.user.isGM) return;
    if (DFAdventureLogProcessor.logCommand) return;

    DFAdventureLogProcessor.logCommand = (game as GameExt).chatCommands.createCommandFromData({
      commandKey: '/log',
      invokeOnCommand: async (_cl: any, msg: string, _cd: any) =>
        await DFAdventureLogProcessor.commandProcessor(msg, false, false),
      shouldDisplayToChat: false,
      iconClass: 'fa-edit',
      description: 'DF_CHAT_LOG.CommandDescription'.localize(),
    });
    (game as GameExt).chatCommands.registerCommand(DFAdventureLogProcessor.logCommand);

    DFAdventureLogProcessor.plogCommand = (game as GameExt).chatCommands.createCommandFromData({
      commandKey: '/plog',
      invokeOnCommand: async (_cl: any, msg: string, _cd: any) =>
        await DFAdventureLogProcessor.commandProcessor(msg, false, true),
      shouldDisplayToChat: false,
      iconClass: 'fa-edit',
      description: 'DF_CHAT_LOG.PCCommandDescription'.localize(),
    });
    (game as GameExt).chatCommands.registerCommand(DFAdventureLogProcessor.plogCommand);

    // If we are not the GM, early return to avoid registering the /gmlog command
    if (!game.user.isGM) return;
    // Register the /gmlog command
    DFAdventureLogProcessor.gmlogCommand = (game as GameExt).chatCommands.createCommandFromData({
      commandKey: '/gmlog',
      invokeOnCommand: async (_cl: any, msg: string, _cd: any) =>
        await DFAdventureLogProcessor.commandProcessor(msg, true, false),
      shouldDisplayToChat: false,
      iconClass: 'fa-edit',
      description: 'DF_CHAT_LOG.GMCommandDescription'.localize(),
    });
    (game as GameExt).chatCommands.registerCommand(DFAdventureLogProcessor.gmlogCommand);
  }

  private static _getTimestamp() {
    const useTime = SETTINGS.get(DFAdventureLogProcessor.PREF_USE_TIME);
    if (
      game.modules.get('foundryvtt-simple-calendar')?.active &&
      SETTINGS.get(DFAdventureLogProcessor.PREF_SIMPLE_CALENDAR)
    ) {
      const stamp = SimpleCalendar.api.formatDateTime(
        SimpleCalendar.api.timestampToDate(SimpleCalendar.api.timestamp()),
      );
      return useTime ? `${stamp.date} ${stamp.time}` : stamp.date;
    } else if (useTime)
      return new Date()
        .toLocaleString('sv')
        .replace(',', '')
        .replace(/ ([AP])/, '$1');
    else {
      return new Date()
        .toLocaleString('sv')
        .replace(',', '')
        .replace(/ ([AP])/, '$1')
        .split(' ')[0];
    }
  }

  private static logConfig: DFAdventureLogConfig = null;
  static async commandProcessor(
    messageText: string,
    gmLog: boolean,
    isPlayerLog: boolean,
    preventPostToChat = false,
  ): Promise<void> {
    messageText = messageText.trim();
    const tokens = messageText.split(' ');

    if (!SETTINGS.get(DFAdventureLogProcessor.PREF_ENABLE)) {
      (game as GameExt).chatCommands.deregisterCommand(DFAdventureLogProcessor.logCommand);
      ui.notifications.warn('DF_CHAT_LOG.Error.Disabled'.localize());
      return;
    }

    // If the user did not enter anything, send them a help message
    if (messageText.length == 0 || tokens.every((x) => x.length == 0)) {
      setTimeout(async () => {
        await Dialog.prompt({
          title: 'DF_CHAT_LOG.HelpDialog_Title'.localize(),
          label: 'OK',

          callback: () => {},
          content: await renderTemplate(
            `modules/df-chat-enhance/templates/lang/log-help.${'DF_CHAT_ENHANCE.LANG'.localize()}.hbs`,
            {
              isGM: game.user.isGM,
            },
          ),
          options: { width: 800 },
        });
      }, 1);
      return;
    }

    const speaker = ChatMessage.getSpeaker(<any>{ user: game.user });
    const messageData: DeepPartial<ChatMessageDataConstructorData> = {
      flavor: '',
      user: game.user.id,
      speaker: speaker,
      type: CONST.CHAT_MESSAGE_TYPES.OOC,
      content: '',
    };
    let line: string;
    const disableFormatting = SETTINGS.get(DFAdventureLogProcessor.PREF_DISABLE_FORMATTING);
    const disableAuthor = isPlayerLog || SETTINGS.get(DFAdventureLogProcessor.PREF_DISABLE_AUTHOR);
    switch (tokens[0].toLowerCase()) {
      case 'config':
        if (!game.user.isGM) {
          ui.notifications.warn('DF_CHAT_LOG.Error.ConfigGmOnly'.localize());
          return;
        }
        setTimeout(async () => {
          if (DFAdventureLogProcessor.logConfig) DFAdventureLogProcessor.logConfig.bringToTop();
          else {
            DFAdventureLogProcessor.logConfig = new DFAdventureLogConfig({});
            DFAdventureLogProcessor.logConfig.render(true);
          }
        }, 1);
        return;
      case 'q':
      case 'quote':
        messageText = messageText.replace(tokens[0], '').trimStart();
        let source: string;
        // If the token starts with a quote, but does not end with one
        if (tokens[1][0] === '"' && tokens[1][tokens[1].length - 1] !== '"') {
          // Extract the quoted Source
          let index = -1;
          for (let c = 1; c < messageText.length; c++) {
            if (messageText[c] === '"') {
              index = c;
              break;
            }
          }
          if (index < 0) {
            ui.notifications.error(
              'DF_CHAT_LOG.Error.MissingQuote'.localize().replace('{0}', tokens[1]),
            );
            setTimeout(() => $('#chat-message').val('/log q ' + messageText), 1);
            return;
          }
          source = messageText.slice(0, index + 1);
          messageText = messageText.slice(index + 1).trimStart();
        } else source = tokens[1];
        messageText = DFChatEditor.processMarkdown(messageText)[1].replace(source, '').trim();
        // Remove any double-quotes surrounding the source token
        source = source.replace(/"/gm, '');
        messageData.flavor = `${game.user.name} quoted ${source}`;
        messageData.content = `<span class="dfal-qu">${messageText}</span>`;
        if (messageText.length == 0) {
          ui.notifications.error('DF_CHAT_LOG.Error.MissingMessage'.localize());
          setTimeout(() => $('#chat-message').val(`/log q "${source}" ${messageText}`), 1);
          return;
        }
        line = 'DF_CHAT_LOG.Log_Quote';
        if (disableFormatting) line += '_Bland';
        if (disableAuthor) line += '_NoAuth';
        line = line.localize();
        line = line.replace('{0}', this._getTimestamp());
        line = line.replace('{1}', game.user.name);
        line = line.replace('{2}', source);
        messageText = line.replace('{3}', messageText);
        break;
      case 'e':
      case 'event':
        messageText = messageText.replace(tokens[0], '').trim();
      // fallthrough
      default:
        messageText = DFChatEditor.processMarkdown(messageText)[1].trim();
        messageData.flavor = 'Event Logged';
        messageData.content = `<span class="dfal-ev">${messageText}</span>`;
        line = 'DF_CHAT_LOG.Log_Event';
        if (disableFormatting) line += '_Bland';
        if (disableAuthor) line += '_NoAuth';
        line = line.localize();
        line = line.replace('{0}', this._getTimestamp());
        line = line.replace('{1}', game.user.name);
        messageText = line.replace('{2}', messageText);
        break;
    }

    // fetch the log to submit to
    const journalId = (
      isPlayerLog
        ? (game.user.getFlag(SETTINGS.MOD_NAME, this.PREF_PLAYER_LOG_JOURNAL) as string)
        : SETTINGS.get<string>(
            gmLog ? DFAdventureLogConfig.PREF_JOURNAL_GM : DFAdventureLogConfig.PREF_JOURNAL,
          )
    )?.split('.');
    if (!journalId || !game.journal.has(journalId[0])) {
      if (isPlayerLog) ui.notifications.error('DF_CHAT_LOG.Error.NoPlayerJournalSet'.localize());
      else if (game.user.isGM)
        ui.notifications.error('DF_CHAT_LOG.Error.NoJournalSetGM'.localize(), { permanent: true });
      else ui.notifications.warn('DF_CHAT_LOG.Error.NoJournalSet'.localize());
      return;
    }
    const journal = game.journal.get(journalId[0]).pages.get(journalId[1]);
    let html = $(journal.text.content);
    const messageHtml = $(messageText);
    let section = html.find('section.df-adventure-log');
    if (section.length == 0) {
      await DFAdventureLogConfig.initializeJournal(journalId.join('.'), false, gmLog, isPlayerLog);
      html = $(journal.text.content);
      section = html.find('section.df-adventure-log');
    }
    const descending = SETTINGS.get(this.PREF_SORTDESC);
    if (descending) section.prepend(messageHtml);
    else section.append(messageHtml);
    await journal.update({ 'text.content': $('<div></div>').append(html).html() });
    const rollType = game.settings.get('core', 'rollMode');
    if (game.user.isGM) {
      if (
        // If the roll type is anything but Public
        rollType !== 'publicroll' ||
        // If logs are GM Only and the Whisper All settings is true
        (SETTINGS.get(DFAdventureLogProcessor.PREF_GMONLY) &&
          SETTINGS.get(DFAdventureLogProcessor.PREF_GMONLY_WHISPER))
      ) {
        // Make the message a whisper
        messageData.whisper = [game.user.id];
      }
    }
    // All GM and Player logs are whispered
    if (isPlayerLog || gmLog) {
      messageData.whisper = [game.user.id];
    }
    // Post message to chat if Messages are enabled
    if (!preventPostToChat && SETTINGS.get(DFAdventureLogProcessor.PREF_MESSAGES))
      await ChatMessage.create(messageData, {});
  }

  static async resortLog() {
    const descending = SETTINGS.get(this.PREF_SORTDESC);
    const journalAll = SETTINGS.get(DFAdventureLogConfig.PREF_JOURNAL)?.split('.');
    const journalGM = SETTINGS.get(DFAdventureLogConfig.PREF_JOURNAL_GM)?.split('.');

    const journalSort = async (journal: JournalEntryPage) => {
      const html = $(journal.text?.content);
      const article = html.find('article.df-adventure-log');
      const result = (article.find('p') as any).sort(function (a: HTMLElement, b: HTMLElement) {
        return descending
          ? $(b).find('span.dfal-ts').text().localeCompare($(a).find('span.dfal-ts').text())
          : $(a).find('span.dfal-ts').text().localeCompare($(b).find('span.dfal-ts').text());
      });
      article.html(result);
      await journal.update({ 'text.content': $('<div></div>').append(html).html() });
    };

    if (game.journal.has(journalAll[0]))
      await journalSort(game.journal.get(journalAll[0]).pages.get(journalAll[1]));
    if (game.journal.has(journalGM[0]))
      await journalSort(game.journal.get(journalGM[0]).pages.get(journalGM[1]));
  }
}
