/* eslint-disable no-undef */
import { SYSTEM, JOURNAL_NAME, PAGE_NAME } from './settings';

export function addContextMenuOptions(_html, options) {
  options.unshift({
    name: 'actionDescription',
    icon: '<i class="fas fa-edit"></i>',
    group: SYSTEM,
    condition: (_li) => {
      return true;
    },
    callback: async (li) => {
      const messageId = li.data('messageId');
      const message = game?.messages?.get(messageId);
      if (message != null) {
        const journalName = game.user.getFlag(SYSTEM, JOURNAL_NAME);
        const pageName = game.user.getFlag(SYSTEM, PAGE_NAME);
        const existingJournal = game.journal?.getName(journalName)?.pages.getName(pageName);
        if (existingJournal == null) {
          ui.notifications.error(game.i18n.localize('error.noJournalSet'));
          return;
        }
        const newEntry = message.getHTML();
        await existingJournal.update({ text: { content: newEntry + '<hr>' + existingJournal } });
      }
    },
  });
}

class SelectJournalConfigurationForm extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = SYSTEM + 'edit';
    options.template = `modules/${SYSTEM}/templates/settings_form.html`;
    options.width = 400;
    options.submitOnChange = true;
    return options;
  }
  get title() {
    return game.i18n.localize('editSettingsTitle');
  }

  getValidJournals() {
    return game.journal.filter(
      (j) =>
        j.canUserModify(game.user) && j.pages.filter((p) => p.canUserModify(game.user)).size > 0,
    );
  }

  getData(_options) {
    const validJournals = this.getValidJournals();

    const journalNameOptions = validJournals.map((j) => j.name);
    const journalName = game.user.getFlag(SYSTEM, JOURNAL_NAME) ?? journalNameOptions[0];

    const pageNameOptions = validJournals
      .find((j) => j.name == journalName)
      ?.pages.filter((p) => p.canUserModify(game.user))
      .map((p) => p.name)
      .unshift(game.i18n.localize('pageNameBackup'));
    const pageName = game.user.getFlag(SYSTEM, PAGE_NAME);

    return {
      journalNameOptions,
      pageNameOptions,
      journalName,
      pageName,
    };
  }

  async _updateObject(_event, formData) {
    const { journalName, pageName = game.i18n.localize('pageNameBackup') } = formData;

    if (journalName != null) {
      const journalNameOld = game.user.getFlag(SYSTEM, JOURNAL_NAME);
      const journal = this.getValidJournals()?.getName(journalName);
      if (journal != null && journalNameOld != journalName) {
        game.user.setFlag(SYSTEM, JOURNAL_NAME, journalName);
      } else if (journal == null) {
        ui.notifications.error('This journal donut exist, idk what you did bro.');
        return;
      }

      const pageNameOld = game.user.getFlag(SYSTEM, PAGE_NAME);
      const page = journal.pages.getName(pageName);
      if (page != null && pageName != pageNameOld) {
        game.user.setFlag(SYSTEM, PAGE_NAME, pageName);
      } else if (page == null && pageName == game.i18n.localize('pageNameBackup')) {
        await JournalEntryPage.createDocuments([{ name: pageName }], { parent: journal });
        game.user.setFlag(SYSTEM, PAGE_NAME, pageName);
      }
    }

    this.render();
  }
}

export function initSettings() {
  game.settings.registerMenu('hide-player-ui', 'hide-player-ui-player-configuration', {
    name: 'editSettingsTitle',
    label: 'editSettingsTitle',
    icon: 'fas fa-cogs',
    type: SelectJournalConfigurationForm,
    restricted: false,
  });
}
