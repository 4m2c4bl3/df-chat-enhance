import { ChatMessageData } from 'node_modules/fvtt-types/src/foundry/common/documents/_types.mjs';
import SETTINGS from '../settings';
const TEMPLATE = '$0: $1 (+$2&nbsp;more)';
const LENGTH_ADJUST = '&nbsp;'.length - 1;

export default class WhisperTruncation {
  private static readonly PREF_ENABLED = 'whisper-trunc_enabled';
  private static readonly PREF_CHAR_LIMIT = 'whisper-trunc_char-limit';

  static init() {
    Hooks.on('renderChatMessage', this._messageRender.bind(this));
    SETTINGS.register(this.PREF_ENABLED, {
      name: 'DF_CHAT_WHISPER_TRUNC.SettingEnabledName',
      hint: 'DF_CHAT_WHISPER_TRUNC.SettingEnabledHint',
      config: true,
      type: Boolean,
      default: true,
      scope: 'world',
      onChange: async () => {
        if (ui.chat != null){
           // @ts-ignore
          ui.chat._state = 0;
           // @ts-ignore
          ui.chat_lastId = null;
          await ui.chat.render(true);
        }
      },
    });
    SETTINGS.register(this.PREF_CHAR_LIMIT, {
      name: 'DF_CHAT_WHISPER_TRUNC.SettingCharLimitName',
      hint: 'DF_CHAT_WHISPER_TRUNC.SettingCharLimitHint',
      config: true,
      type: Number,
      default: 50,
      scope: 'world',
      onChange: async () => {
        if (ui.chat != null){
           // @ts-ignore
          ui.chat._state = 0;
           // @ts-ignore
          ui.chat._lastId = null;
          await ui.chat.render(true);
        }
      },
    });
  }

  private static _messageRender(
    message: ChatMessageData,
    html: JQuery<HTMLElement>,
    _cmd: ChatMessageData,
  ) {
    // ignore regular messages, or whispers with only 1 recipient
    if (!SETTINGS.get(this.PREF_ENABLED) || !message.whisper || !game.users || message.whisper.length <= 1) return;
    const users = (message.whisper.map((x) => game.users.get(x as string)).filter(u => u != null) ?? []) as unknown as Users[];
    let accum : string = users[0].name ?? '';
    let title = this._formatTitle(accum, users.length - 1);
    let c = 1;
    const CHAR_LIMIT = SETTINGS.get<number>(this.PREF_CHAR_LIMIT);
    for (; c < users.length; c++) {
      // Append name to names string
      const tmpNames = accum + ', ' + users[c].name;
      // Generate a temp title
      const tmpTitle = this._formatTitle(tmpNames, users.length - c - 1);
      // If the potential title is too large, break so we can use the previous iteration's results
      if (tmpTitle.length - LENGTH_ADJUST > CHAR_LIMIT) break;
      // Set the accum and title to the newly generated values
      accum = tmpNames;
      title = tmpTitle;
    }
    // If we never ran out of room, exit
    if (c === users.length) return;
    // Update the HTML
    const newHeader = `<span class="whisper-to" title="${users
      .slice(c)
      .map((x) => x.name)
      .join(', ')}">${title}</span>`;
    html.find('span.whisper-to').replaceWith(newHeader);
  }

  private static _formatTitle(names: string, count: number): string {
    return count > 0
      ? TEMPLATE.replace('$0', 'CHAT.To'.localize())
          .replace('$1', names)
          .replace('$2', count.toString())
      : names;
  }
}
