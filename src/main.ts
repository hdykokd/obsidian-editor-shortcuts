import { Plugin } from 'obsidian';
import {
  addCursorsToSelectionEnds,
  copyLine,
  deleteSelectedLines,
  deleteToStartOfLine,
  deleteToEndOfLine,
  expandSelectionToBrackets,
  expandSelectionToQuotes,
  expandSelectionToQuotesOrBrackets,
  goToHeading,
  goToLineBoundary,
  insertLineAbove,
  insertLineBelow,
  joinLines,
  moveCursor,
  navigateLine,
  isProgrammaticSelectionChange,
  selectAllOccurrences,
  selectLine,
  selectWordOrNextOccurrence,
  setIsManualSelection,
  setIsProgrammaticSelectionChange,
  transformCase,
  insertCursorAbove,
  insertCursorBelow,
} from './actions';
import {
  defaultMultipleSelectionOptions,
  iterateCodeMirrorDivs,
  setVaultConfig,
  toggleVaultConfig,
  withMultipleSelections,
} from './utils';
import { CASE, DIRECTION, MODIFIER_KEYS } from './constants';
import { insertLineBelowHandler } from './custom-selection-handlers';
import { SettingTab, DEFAULT_SETTINGS, PluginSettings } from './settings';
import { SettingsState } from './state';

export default class CodeEditorShortcuts extends Plugin {
  settings: PluginSettings;

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'insertLineAbove',
      name: 'Insert line above',
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'Enter',
        },
      ],
      editorCallback: (editor) =>
        withMultipleSelections(editor, insertLineAbove),
    });

    this.addCommand({
      id: 'insertLineBelow',
      name: 'Insert line below',
      hotkeys: [
        {
          modifiers: ['Mod'],
          key: 'Enter',
        },
      ],
      editorCallback: (editor) =>
        withMultipleSelections(editor, insertLineBelow, {
          ...defaultMultipleSelectionOptions,
          customSelectionHandler: insertLineBelowHandler,
        }),
    });

    this.addCommand({
      id: 'deleteLine',
      name: 'Delete line',
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'K',
        },
      ],
      editorCallback: (editor) =>
        withMultipleSelections(editor, deleteSelectedLines),
    });

    this.addCommand({
      id: 'deleteToStartOfLine',
      name: 'Delete to start of line',
      editorCallback: (editor) =>
        withMultipleSelections(editor, deleteToStartOfLine),
    });

    this.addCommand({
      id: 'deleteToEndOfLine',
      name: 'Delete to end of line',
      editorCallback: (editor) =>
        withMultipleSelections(editor, deleteToEndOfLine),
    });

    this.addCommand({
      id: 'joinLines',
      name: 'Join lines',
      hotkeys: [
        {
          modifiers: ['Mod'],
          key: 'J',
        },
      ],
      editorCallback: (editor) =>
        withMultipleSelections(editor, joinLines, {
          ...defaultMultipleSelectionOptions,
          repeatSameLineActions: false,
        }),
    });

    this.addCommand({
      id: 'duplicateLine',
      name: 'Duplicate line',
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'D',
        },
      ],
      editorCallback: (editor) =>
        withMultipleSelections(editor, copyLine, {
          ...defaultMultipleSelectionOptions,
          args: 'down',
        }),
    });

    this.addCommand({
      id: 'copyLineUp',
      name: 'Copy line up',
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'ArrowUp',
        },
      ],
      editorCallback: (editor) =>
        withMultipleSelections(editor, copyLine, {
          ...defaultMultipleSelectionOptions,
          args: 'up',
        }),
    });

    this.addCommand({
      id: 'copyLineDown',
      name: 'Copy line down',
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'ArrowDown',
        },
      ],
      editorCallback: (editor) =>
        withMultipleSelections(editor, copyLine, {
          ...defaultMultipleSelectionOptions,
          args: 'down',
        }),
    });

    this.addCommand({
      id: 'selectWordOrNextOccurrence',
      name: 'Select word or next occurrence',
      hotkeys: [
        {
          modifiers: ['Mod'],
          key: 'D',
        },
      ],
      editorCallback: (editor) => selectWordOrNextOccurrence(editor),
    });

    this.addCommand({
      id: 'selectAllOccurrences',
      name: 'Select all occurrences',
      hotkeys: [
        {
          modifiers: ['Mod', 'Shift'],
          key: 'L',
        },
      ],
      editorCallback: (editor) => selectAllOccurrences(editor),
    });

    this.addCommand({
      id: 'selectLine',
      name: 'Select line',
      hotkeys: [
        {
          modifiers: ['Mod'],
          key: 'L',
        },
      ],
      editorCallback: (editor) => withMultipleSelections(editor, selectLine),
    });

    this.addCommand({
      id: 'addCursorsToSelectionEnds',
      name: 'Add cursors to selection ends',
      hotkeys: [
        {
          modifiers: ['Alt', 'Shift'],
          key: 'I',
        },
      ],
      editorCallback: (editor) => addCursorsToSelectionEnds(editor),
    });

    this.addCommand({
      id: 'goToLineStart',
      name: 'Go to start of line',
      editorCallback: (editor) =>
        withMultipleSelections(editor, goToLineBoundary, {
          ...defaultMultipleSelectionOptions,
          args: 'start',
        }),
    });

    this.addCommand({
      id: 'goToLineEnd',
      name: 'Go to end of line',
      editorCallback: (editor) =>
        withMultipleSelections(editor, goToLineBoundary, {
          ...defaultMultipleSelectionOptions,
          args: 'end',
        }),
    });

    this.addCommand({
      id: 'goToNextLine',
      name: 'Go to next line',
      editorCallback: (editor) =>
        withMultipleSelections(editor, navigateLine, {
          ...defaultMultipleSelectionOptions,
          args: 'next',
        }),
    });

    this.addCommand({
      id: 'goToPrevLine',
      name: 'Go to previous line',
      editorCallback: (editor) =>
        withMultipleSelections(editor, navigateLine, {
          ...defaultMultipleSelectionOptions,
          args: 'prev',
        }),
    });

    this.addCommand({
      id: 'goToFirstLine',
      name: 'Go to first line',
      editorCallback: (editor) =>
        withMultipleSelections(editor, navigateLine, {
          ...defaultMultipleSelectionOptions,
          args: 'top',
        }),
    });

    this.addCommand({
      id: 'goToLastLine',
      name: 'Go to last line',
      editorCallback: (editor) =>
        withMultipleSelections(editor, navigateLine, {
          ...defaultMultipleSelectionOptions,
          args: 'bottom',
        }),
    });

    this.addCommand({
      id: 'goToNextChar',
      name: 'Move cursor forward',
      editorCallback: (editor) =>
        withMultipleSelections(editor, moveCursor, {
          ...defaultMultipleSelectionOptions,
          args: DIRECTION.FORWARD,
        }),
    });

    this.addCommand({
      id: 'goToPrevChar',
      name: 'Move cursor backward',
      editorCallback: (editor) =>
        withMultipleSelections(editor, moveCursor, {
          ...defaultMultipleSelectionOptions,
          args: DIRECTION.BACKWARD,
        }),
    });

    this.addCommand({
      id: 'transformToUppercase',
      name: 'Transform selection to uppercase',
      editorCallback: (editor) =>
        withMultipleSelections(editor, transformCase, {
          ...defaultMultipleSelectionOptions,
          args: CASE.UPPER,
        }),
    });

    this.addCommand({
      id: 'transformToLowercase',
      name: 'Transform selection to lowercase',
      editorCallback: (editor) =>
        withMultipleSelections(editor, transformCase, {
          ...defaultMultipleSelectionOptions,
          args: CASE.LOWER,
        }),
    });

    this.addCommand({
      id: 'transformToTitlecase',
      name: 'Transform selection to title case',
      editorCallback: (editor) =>
        withMultipleSelections(editor, transformCase, {
          ...defaultMultipleSelectionOptions,
          args: CASE.TITLE,
        }),
    });

    this.addCommand({
      id: 'toggleCase',
      name: 'Toggle case of selection',
      editorCallback: (editor) =>
        withMultipleSelections(editor, transformCase, {
          ...defaultMultipleSelectionOptions,
          args: CASE.NEXT,
        }),
    });

    this.addCommand({
      id: 'expandSelectionToBrackets',
      name: 'Expand selection to brackets',
      editorCallback: (editor) =>
        withMultipleSelections(editor, expandSelectionToBrackets),
    });

    this.addCommand({
      id: 'expandSelectionToQuotes',
      name: 'Expand selection to quotes',
      editorCallback: (editor) =>
        withMultipleSelections(editor, expandSelectionToQuotes),
    });

    this.addCommand({
      id: 'expandSelectionToQuotesOrBrackets',
      name: 'Expand selection to quotes or brackets',
      editorCallback: (editor) => expandSelectionToQuotesOrBrackets(editor),
    });

    this.addCommand({
      id: 'insertCursorAbove',
      name: 'Insert cursor above',
      editorCallback: (editor) => insertCursorAbove(editor),
    });

    this.addCommand({
      id: 'insertCursorBelow',
      name: 'Insert cursor below',
      editorCallback: (editor) => insertCursorBelow(editor),
    });

    this.addCommand({
      id: 'goToNextHeading',
      name: 'Go to next heading',
      editorCallback: (editor) => goToHeading(this.app, editor, 'next'),
    });

    this.addCommand({
      id: 'goToPrevHeading',
      name: 'Go to previous heading',
      editorCallback: (editor) => goToHeading(this.app, editor, 'prev'),
    });

    this.addCommand({
      id: 'toggle-line-numbers',
      name: 'Toggle line numbers',
      callback: () => toggleVaultConfig(this.app, 'showLineNumber'),
    });

    this.addCommand({
      id: 'indent-using-tabs',
      name: 'Indent using tabs',
      callback: () => setVaultConfig(this.app, 'useTab', true),
    });

    this.addCommand({
      id: 'indent-using-spaces',
      name: 'Indent using spaces',
      callback: () => setVaultConfig(this.app, 'useTab', false),
    });

    this.registerSelectionChangeListeners();

    this.addSettingTab(new SettingTab(this.app, this));
  }

  private registerSelectionChangeListeners() {
    this.app.workspace.onLayoutReady(() => {
      // Change handler for selectWordOrNextOccurrence
      const handleSelectionChange = (evt: Event) => {
        if (evt instanceof KeyboardEvent && MODIFIER_KEYS.includes(evt.key)) {
          return;
        }
        if (!isProgrammaticSelectionChange) {
          setIsManualSelection(true);
        }
        setIsProgrammaticSelectionChange(false);
      };
      iterateCodeMirrorDivs((cm: HTMLElement) => {
        this.registerDomEvent(cm, 'keydown', handleSelectionChange);
        this.registerDomEvent(cm, 'click', handleSelectionChange);
        this.registerDomEvent(cm, 'dblclick', handleSelectionChange);
      });
    });
  }

  async loadSettings() {
    const savedSettings = await this.loadData();
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...savedSettings,
    };
    SettingsState.autoInsertListPrefix = this.settings.autoInsertListPrefix;
  }

  async saveSettings() {
    await this.saveData(this.settings);
    SettingsState.autoInsertListPrefix = this.settings.autoInsertListPrefix;
  }
}
