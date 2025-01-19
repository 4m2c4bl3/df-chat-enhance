import { getDefaultPageName, notifyJournalNotFound } from './util';
import { SYSTEM, JOURNAL_NAME, PAGE_NAME } from './constants';

export function addContextMenuOptions(_html, options) {
  options.unshift({
    name: 'SMTJE.actionDescription',
    icon: '<i class="fas fa-edit save-message-to-journal-entry"></i>',
    group: SYSTEM,

    callback: async (li) => {
      const messageId = li.data('messageId');
      const message = game?.messages?.get(messageId);

      if (message != null) {
        const journalName = game.user.getFlag(SYSTEM, JOURNAL_NAME);
        if (journalName == null) {
          ui.notifications.warn(game.i18n.localize('SMTJE.notif.noJournalSet'));
          return;
        }

        const journal = game.journal?.getName(journalName);
        if (journal == null) {
          notifyJournalNotFound(journalName);
          return;
        }
        if (!journal.canUserModify(game.user)) {
          ui.notifications.error(
            game.i18n.format('SMTJE.notif.permissionError.journal', { journalName }),
          );
          return;
        }

        const pageName = game.user.getFlag(SYSTEM, PAGE_NAME) ?? '';
        let page = journal.pages.getName(pageName);

        if (page == null) {
          const noPageNameSet = pageName == '';
          const newPageName = noPageNameSet ? getDefaultPageName() : pageName;
          if (noPageNameSet) {
            ui.notifications.info(
              game.i18n.format('SMTJE.notif.noPageSelected', {
                journalName,
                defaultPageName: 'SMTJE.defaultPageName',
              }),
            );
          } else {
            ui.notifications.info(
              game.i18n.format('SMTJE.notif.pageMissing', { pageName: newPageName, journalName }),
            );
          }

          await JournalEntryPage.createDocuments([{ name: newPageName }], {
            parent: journal,
          });

          game.user.setFlag(SYSTEM, PAGE_NAME, newPageName);
          page = journal.pages.getName(newPageName);
        }
        if (!page.canUserModify(game.user)) {
          ui.notifications.error(
            game.i18n.format('SMTJE.notif.permission.page', { pageName: page.name, journalName }),
          );
          return;
        }

        const newEntry = await message.getHTML();
        newEntry.addClass('save-message-to-journal-entry');
        const metadata = newEntry.find('.message-metadata')[0];
        const timestamp = newEntry.find('.message-timestamp')[0];
        timestamp.innerText = new Date(message.timestamp).toLocaleString();
        metadata.replaceChildren(timestamp);

        page.update({
          text: {
            content: `${newEntry[0].outerHTML}<hr class="save-message-to-journal-entry">${page.text?.content ?? ''}`,
            format: CONST.JOURNAL_ENTRY_PAGE_FORMATS.HTML,
          },
        });
      }
    },
  });
}
