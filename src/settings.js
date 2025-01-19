import { getDefaultPageName, notifyJournalNotFound } from './util';
import { DEFAULT_PAGE_NAME_SETTING, JOURNAL_NAME, PAGE_NAME, SYSTEM } from './constants';

export function initSettings() {
  if (game != null) {
    game.settings.registerMenu(SYSTEM, SYSTEM + 'configuration', {
      name: 'SMTJE.settings.configuration.name',
      label: 'SMTJE.settings.configuration.label',
      hint: 'SMTJE.settings.configuration.hint',
      icon: 'fas fa-cogs',
      type: SelectJournalConfigurationForm,
      restricted: false,
    });

    game.settings.register(SYSTEM, DEFAULT_PAGE_NAME_SETTING, {
      name: 'SMTJE.settings.defaultPage.name',
      hint: 'SMTJE.settings.defaultPage.hint',
      icon: 'fas fa-cogs',
      scope: 'world',
      type: String,
      restricted: true,
      config: true,
      default: '',
    });
  }
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
    return game.i18n.localize('SMTJE.settings.configuration.label');
  }

  getValidJournals() {
    return game.journal.filter((j) => j.canUserModify(game.user));
  }

  getData(_options) {
    const validJournals = this.getValidJournals();

    const journalNameOptions = validJournals.map((j) => ({ key: j.name, label: j.name }));
    const journalName = game.user.getFlag(SYSTEM, JOURNAL_NAME) ?? journalNameOptions[0];

    const defaultPageName = getDefaultPageName();
    const defaultPageNameOption = { key: defaultPageName, label: defaultPageName };
    const matchDefaultOption = (o) => JSON.stringify(o) === JSON.stringify(defaultPageNameOption);
    const pageNameOptions =
      validJournals
        .find((j) => j.name == journalName)
        ?.pages?.filter((p) => p.canUserModify(game.user) && p.type === 'text')
        ?.map((p) => ({ key: p.name, label: p.name }))
        ?.filter((o) => !matchDefaultOption(o))
        ?.sort((a, b) => a.sort - b.sort) ?? [];
    pageNameOptions.unshift(defaultPageNameOption);
    const pageName = game.user.getFlag(SYSTEM, PAGE_NAME) ?? defaultPageName;

    return {
      journalNameOptions,
      pageNameOptions,
      journalName,
      pageName,
      defaultPageName: getDefaultPageName(),
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
      console.error(`Could not find .close button when adding listeners`);
    } else {
      closeButton.addEventListener('click', this.onClose.bind(this));
    }
  }

  async _updateObject(_event, formData) {
    let { journalName, pageName = getDefaultPageName() } = formData;

    if (journalName != null) {
      const journalNameOld = game.user.getFlag(SYSTEM, JOURNAL_NAME);
      const journal = this.getValidJournals()?.find((j) => j.name == journalName);

      if (journal == null) {
        notifyJournalNotFound(journalName);
        return;
      }
      if (journalNameOld != journalName) {
        game.user.setFlag(SYSTEM, JOURNAL_NAME, journalName);
        pageName = getDefaultPageName();
      }

      const pageNameOld = game.user.getFlag(SYSTEM, PAGE_NAME);
      if (pageName != pageNameOld) {
        game.user.setFlag(SYSTEM, PAGE_NAME, pageName);
      }
    }

    setTimeout(() => {
      this.render();
    }, 100);
  }
}
