/* eslint-disable no-undef */
import { SYSTEM, JOURNAL_NAME, PAGE_NAME } from './settings';

const getDefaultPageName = () => {
  return game.i18n.localize('SMTJE.defaultPageName');
};

export function addContextMenuOptions(_html, options) {
  options.unshift({
    name: 'SMTJE.actionDescription',
    icon: '<i class="fas fa-edit"></i>',
    group: SYSTEM,
    // condition: (_li) => {
    //   return true;
    // },
    callback: async (li) => {
      const messageId = li.data('messageId');
      const message = game?.messages?.get(messageId);
      if (message != null) {
        const journalName = game.user.getFlag(SYSTEM, JOURNAL_NAME);
        const pageName = game.user.getFlag(SYSTEM, PAGE_NAME);
        const journal = game.journal?.getName(journalName);
        let page = journal?.pages.getName(pageName);

        if (journal == null) {
          ui.notifications.warn(game.i18n.localize('SMTJE.error.noJournalSet'));
          return;
        }
        if (page == null) {
          const noPageNameSet = pageName == '' || pageName == null;
          if (noPageNameSet) {
            ui.notifications.info(game.i18n.format('SMTJE.error.noPage', { journalName }));
          } else {
            ui.notifications.info(
              game.i18n.format('SMTJE.error.pageMissing', { pageName, journalName }),
            );
          }

          const newPageName = noPageNameSet ? getDefaultPageName() : pageName;
          await JournalEntryPage.createDocuments([{ name: newPageName }], {
            parent: journal,
          });
          page = journal?.pages.getName(newPageName);
          game.user.setFlag(SYSTEM, PAGE_NAME, newPageName);
        }

        const newEntry = await message.getHTML();
        newEntry.addClass('save-message-to-journal-entry');
        const metadata = newEntry.find('.message-metadata')[0];
        const timestamp = newEntry.find('.message-timestamp')[0];
        timestamp.innerText = new Date(message.timestamp).toLocaleString();
        metadata.replaceChildren(timestamp);

        await page.update({
          text: {
            content: newEntry[0].outerHTML + '<hr>' + (page?.text?.content ?? ''),
            format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
          },
        });
      }
    },
  });
}

class SelectJournalConfigurationForm extends FormApplication {
  static get defaultOptions() {
    const options = super.defaultOptions;
    options.id = SYSTEM + 'configuration';
    options.template = `modules/${SYSTEM}/templates/settings_form.hbs`;
    options.width = 350;
    options.submitOnChange = true;
    options.closeOnSubmit = false;
    return options;
  }
  get title() {
    return game.i18n.localize('SMTJE.settings.label');
  }

  getValidJournals() {
    return game.journal.filter((j) => j.canUserModify(game.user));
  }

  getData(_options) {
    const validJournals = this.getValidJournals();

    const journalNameOptions = validJournals.map((j) => ({ key: j.name, label: j.name }));
    const journalName = game.user.getFlag(SYSTEM, JOURNAL_NAME) ?? journalNameOptions[0];

    const pageNameOptions = validJournals
      .find((j) => j.name == journalName)
      ?.pages.filter((p) => p.canUserModify(game.user))
      .map((p) => ({ key: p.name, label: p.name })) ?? [getDefaultPageName()];
    if (!pageNameOptions.includes(getDefaultPageName())) {
      pageNameOptions.unshift(getDefaultPageName());
    }
    const pageName = game.user.getFlag(SYSTEM, PAGE_NAME) ?? getDefaultPageName();

    return {
      journalNameOptions,
      pageNameOptions,
      journalName,
      pageName,
    };
  }

  onClose(event) {
    event.preventDefault();
    void this.close();
  }

  activateListeners(html) {
    super.activateListeners(html);
    const closeButton = html[0].querySelector('.close');
    if (!closeButton) {
      module.logger.error(`Could not find .close button when adding listeners`);
    } else {
      closeButton.addEventListener('click', this.onClose.bind(this));
    }
  }

  async _updateObject(_event, formData) {
    const { journalName, pageName = getDefaultPageName() } = formData;

    if (journalName != null) {
      const journalNameOld = game.user.getFlag(SYSTEM, JOURNAL_NAME);
      const journal = this.getValidJournals()?.find((j) => j.name == journalName);
      if (journal != null && journalNameOld != journalName) {
        game.user.setFlag(SYSTEM, JOURNAL_NAME, journalName);
      } else if (journal == null) {
        ui.notifications.error(game.i18n.format('SMTJE.error.journalNotFound', { journalName }));
        return;
      }

      const pageNameOld = game.user.getFlag(SYSTEM, PAGE_NAME);
      const page = journal.pages.getName(pageName);

      if (page != null && pageName != pageNameOld) {
        game.user.setFlag(SYSTEM, PAGE_NAME, pageName);
      } else if (page == null && pageName == getDefaultPageName()) {
        await JournalEntryPage.createDocuments([{ name: pageName }], { parent: journal });
        game.user.setFlag(SYSTEM, PAGE_NAME, pageName);
      }
    }

    setTimeout(() => {
      this.render();
    }, 100);
  }
}

export function initSettings() {
  game.settings.registerMenu(SYSTEM, SYSTEM + '-configuration', {
    name: 'SMTJE.settings.name',
    label: 'SMTJE.settings.label',
    icon: 'fas fa-cogs',
    type: SelectJournalConfigurationForm,
    restricted: false,
  });
}
