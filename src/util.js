import { DEFAULT_PAGE_NAME_SETTING, SYSTEM } from './constants';

export const getDefaultPageName = () => {
  const override = game.settings.get(SYSTEM, DEFAULT_PAGE_NAME_SETTING);
  if (override != null && override.length > 0) {
    return override;
  }
  return game.i18n.localize('SMTJE.defaultPageName');
};

export const notifyJournalNotFound = (journalName) => {
  ui.notifications.error(game.i18n.format('SMTJE.error.journalNotFound', { journalName }));
};
