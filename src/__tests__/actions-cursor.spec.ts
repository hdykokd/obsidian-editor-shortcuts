import CodeMirror from 'codemirror';
import type { Editor } from 'codemirror';
import { getDocumentAndSelection } from './test-helpers';
import {
  insertLineAbove,
  insertLineBelow,
  deleteSelectedLines,
  deleteToStartOfLine,
  deleteToEndOfLine,
  joinLines,
  copyLine,
  selectWordOrNextOccurrence,
  selectAllOccurrences,
  selectLine,
  goToLineBoundary,
  navigateLine,
  moveCursor,
  transformCase,
  expandSelectionToBrackets,
  expandSelectionToQuotes,
  expandSelectionToQuotesOrBrackets,
  addCursorsToSelectionEnds,
  insertCursorAbove,
  insertCursorBelow,
} from '../actions';
import { CASE, CODE_EDITOR, DIRECTION } from '../constants';
import { withMultipleSelections } from '../utils';
import { SettingsState } from '../state';

// fixes jsdom type error - https://github.com/jsdom/jsdom/issues/3002#issuecomment-655748833
document.createRange = () => {
  const range = new Range();

  range.getBoundingClientRect = jest.fn();

  range.getClientRects = jest.fn(() => ({
    item: () => null,
    length: 0,
  }));

  return range;
};

describe('Code Editor Shortcuts: actions - single cursor selection', () => {
  let editor: Editor;
  const originalDoc = 'lorem ipsum\ndolor sit\namet';

  beforeAll(() => {
    editor = CodeMirror(document.body);
    // To make cm.operation() work, since editor here already refers to the
    // CodeMirror object
    (editor as any).cm = editor;

    // Assign the CodeMirror equivalents of posToOffset and offsetToPos
    (editor as any).posToOffset = editor.indexFromPos;
    (editor as any).offsetToPos = editor.posFromIndex;
  });

  beforeEach(() => {
    SettingsState.autoInsertListPrefix = true;
    editor.setValue(originalDoc);
    editor.setCursor({ line: 1, ch: 0 });
  });

  describe('insertLineAbove', () => {
    it('should insert line above', () => {
      withMultipleSelections(editor as any, insertLineAbove);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\n\ndolor sit\namet');
      expect(cursor.line).toEqual(1);
    });

    it('should insert line above first line', () => {
      editor.setCursor({ line: 0, ch: 0 });

      withMultipleSelections(editor as any, insertLineAbove);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('\nlorem ipsum\ndolor sit\namet');
      expect(cursor.line).toEqual(0);
    });

    describe('when inside a list', () => {
      it('should not insert a prefix when setting is disabled', () => {
        SettingsState.autoInsertListPrefix = false;
        editor.setValue('- aaa\n- bbb');
        editor.setCursor({ line: 1, ch: 4 });

        withMultipleSelections(editor as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('- aaa\n\n- bbb');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 0,
          }),
        );
      });

      it('should not insert a prefix when at the first list item', () => {
        editor.setValue('- aaa\n- bbb');
        editor.setCursor({ line: 0, ch: 4 });

        withMultipleSelections(editor as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('\n- aaa\n- bbb');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 0,
            ch: 0,
          }),
        );
      });

      it.each([
        ['-', '- aaa\n- bbb', '- aaa\n- \n- bbb'],
        ['*', '* aaa\n* bbb', '* aaa\n* \n* bbb'],
        ['+', '+ aaa\n+ bbb', '+ aaa\n+ \n+ bbb'],
        ['>', '> aaa\n> bbb', '> aaa\n> \n> bbb'],
      ])('should insert `%s` prefix', (_scenario, content, expectedDoc) => {
        editor.setValue(content);
        editor.setCursor({ line: 1, ch: 4 });

        withMultipleSelections(editor as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual(expectedDoc);
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 2,
          }),
        );
      });

      it.each([
        ['- [ ]', '- [ ] aaa\n- [ ] bbb', '- [ ] aaa\n- [ ] \n- [ ] bbb'],
        ['- [x]', '- [x] aaa\n- [x] bbb', '- [x] aaa\n- [ ] \n- [x] bbb'],
      ])(
        'should insert empty checkbox for `%s` prefix',
        (_scenario, content, expectedDoc) => {
          editor.setValue(content);
          editor.setCursor({ line: 1, ch: 7 });

          withMultipleSelections(editor as any, insertLineAbove);

          const { doc, cursor } = getDocumentAndSelection(editor);
          expect(doc).toEqual(expectedDoc);
          expect(cursor).toEqual(
            expect.objectContaining({
              line: 1,
              ch: 6,
            }),
          );
        },
      );

      it('should insert list prefix at the correct indentation', () => {
        editor.setValue('- aaa\n  - bbb');
        editor.setCursor({ line: 1, ch: 4 });

        withMultipleSelections(editor as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('- aaa\n  - \n  - bbb');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 4,
          }),
        );
      });

      it('should insert number prefix', () => {
        // @ts-expect-error - editor.transaction only exists in CM6
        editor.transaction = () => null;
        editor.setValue('1. aaa\n2. bbb');
        editor.setCursor({ line: 1, ch: 4 });

        withMultipleSelections(editor as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(editor);
        // TODO: doc should equal '1. aaa\n2. \n3. bbb' once transactions are
        // implemented in the test environment
        expect(doc).toEqual('1. aaa\n2. \n2. bbb');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 3,
          }),
        );
      });

      it.todo('should format the remaining number prefixes');
    });
  });

  describe('insertLineBelow', () => {
    it('should insert line below', () => {
      withMultipleSelections(editor as any, insertLineBelow);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit\n\namet');
      expect(cursor.line).toEqual(2);
    });

    it('should insert line below with the same indentation level', () => {
      editor.setValue('    lorem ipsum\n    dolor sit\n    amet');
      editor.setCursor({ line: 1, ch: 0 });

      withMultipleSelections(editor as any, insertLineBelow);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('    lorem ipsum\n    dolor sit\n    \n    amet');
      expect(cursor.line).toEqual(2);
      expect(cursor.ch).toEqual(4);
    });

    it('should insert line below last line', () => {
      editor.setCursor({ line: 2, ch: 0 });

      withMultipleSelections(editor as any, insertLineBelow);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit\namet\n');
      expect(cursor.line).toEqual(3);
    });

    describe('when inside a list', () => {
      it('should not insert a prefix when setting is disabled', () => {
        SettingsState.autoInsertListPrefix = false;
        editor.setValue('- aaa\n- bbb');
        editor.setCursor({ line: 1, ch: 4 });

        withMultipleSelections(editor as any, insertLineAbove);

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('- aaa\n\n- bbb');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 0,
          }),
        );
      });

      it.each([
        ['-', '- aaa\n- bbb', '- aaa\n- \n- bbb'],
        ['*', '* aaa\n* bbb', '* aaa\n* \n* bbb'],
        ['+', '+ aaa\n+ bbb', '+ aaa\n+ \n+ bbb'],
        ['>', '> aaa\n> bbb', '> aaa\n> \n> bbb'],
      ])('should insert `%s` prefix', (_scenario, content, expectedDoc) => {
        editor.setValue(content);
        editor.setCursor({ line: 0, ch: 4 });

        withMultipleSelections(editor as any, insertLineBelow);

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual(expectedDoc);
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 2,
          }),
        );
      });

      it.each([
        ['- [ ]', '- [ ] aaa\n- [ ] bbb', '- [ ] aaa\n- [ ] \n- [ ] bbb'],
        ['- [x]', '- [x] aaa\n- [x] bbb', '- [x] aaa\n- [ ] \n- [x] bbb'],
      ])(
        'should insert empty checkbox for `%s` prefix',
        (_scenario, content, expectedDoc) => {
          editor.setValue(content);
          editor.setCursor({ line: 0, ch: 7 });

          withMultipleSelections(editor as any, insertLineBelow);

          const { doc, cursor } = getDocumentAndSelection(editor);
          expect(doc).toEqual(expectedDoc);
          expect(cursor).toEqual(
            expect.objectContaining({
              line: 1,
              ch: 6,
            }),
          );
        },
      );

      it('should insert list prefix at the correct indentation', () => {
        editor.setValue('- aaa\n  - bbb');
        editor.setCursor({ line: 1, ch: 4 });

        withMultipleSelections(editor as any, insertLineBelow);

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual('- aaa\n  - bbb\n  - ');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 2,
            ch: 4,
          }),
        );
      });

      it('should insert number prefix', () => {
        // @ts-expect-error - editor.transaction only exists in CM6
        editor.transaction = () => null;
        editor.setValue('1. aaa\n2. bbb');
        editor.setCursor({ line: 0, ch: 4 });

        withMultipleSelections(editor as any, insertLineBelow);

        const { doc, cursor } = getDocumentAndSelection(editor);
        // TODO: doc should equal '1. aaa\n2. \n3. bbb' once transactions are
        // implemented in the test environment
        expect(doc).toEqual('1. aaa\n2. \n2. bbb');
        expect(cursor).toEqual(
          expect.objectContaining({
            line: 1,
            ch: 3,
          }),
        );
      });

      it.todo('should format the remaining number prefixes');
    });
  });

  describe('deleteSelectedLines', () => {
    it('should delete line at cursor', () => {
      withMultipleSelections(editor as any, deleteSelectedLines);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\namet');
      expect(cursor.line).toEqual(1);
    });

    it('should delete last line', () => {
      editor.setCursor({ line: 2, ch: 0 });

      withMultipleSelections(editor as any, deleteSelectedLines);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit');
      expect(cursor.line).toEqual(1);
    });
  });

  describe('deleteToStartOfLine', () => {
    it('should delete to the start of the line', () => {
      editor.setCursor({ line: 1, ch: 7 });
      withMultipleSelections(editor as any, deleteToStartOfLine);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\nit\namet');
      expect(cursor).toEqual(
        expect.objectContaining({
          line: 1,
          ch: 0,
        }),
      );
    });

    it('should delete the preceding newline when at the start of the line', () => {
      editor.setCursor({ line: 1, ch: 0 });
      withMultipleSelections(editor as any, deleteToStartOfLine);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsumdolor sit\namet');
      expect(cursor).toEqual(
        expect.objectContaining({
          line: 0,
          ch: 11,
        }),
      );
    });

    it('should delete nothing when at the start of the document', () => {
      editor.setCursor({ line: 0, ch: 0 });
      withMultipleSelections(editor as any, deleteToStartOfLine);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit\namet');
      expect(cursor).toEqual(
        expect.objectContaining({
          line: 0,
          ch: 0,
        }),
      );
    });
  });

  describe('deleteToEndOfLine', () => {
    it('should delete to the end of the line', () => {
      editor.setCursor({ line: 1, ch: 1 });
      withMultipleSelections(editor as any, deleteToEndOfLine);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\nd\namet');
      expect(cursor).toEqual(
        expect.objectContaining({
          line: 1,
          ch: 1,
        }),
      );
    });

    it('should delete the newline when at the end of the line', () => {
      editor.setCursor({ line: 1, ch: 9 });
      withMultipleSelections(editor as any, deleteToEndOfLine);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sitamet');
      expect(cursor).toEqual(
        expect.objectContaining({
          line: 1,
          ch: 9,
        }),
      );
    });

    it('should delete nothing when at the end of the document', () => {
      editor.setCursor({ line: 2, ch: 4 });
      withMultipleSelections(editor as any, deleteToEndOfLine);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit\namet');
      expect(cursor).toEqual(
        expect.objectContaining({
          line: 2,
          ch: 4,
        }),
      );
    });
  });

  describe('joinLines', () => {
    it('should join next line to current line', () => {
      withMultipleSelections(editor as any, joinLines);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit amet');
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(9);
    });

    it('should not join next line when at the end of the document', () => {
      editor.setCursor({ line: 2, ch: 2 });

      withMultipleSelections(editor as any, joinLines);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(2);
      expect(cursor.ch).toEqual(4);
    });

    it('should remove markdown list characters', () => {
      const content = '- aaa\n* bbb\n+ ccc\n~ ddd';
      editor.setValue(content);
      editor.setCursor({ line: 0, ch: 0 });

      withMultipleSelections(editor as any, joinLines);
      withMultipleSelections(editor as any, joinLines);
      withMultipleSelections(editor as any, joinLines);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('- aaa bbb ccc ~ ddd');
      expect(cursor.line).toEqual(0);
      expect(cursor.ch).toEqual(13);
    });

    it('should remove markdown quote characters', () => {
      const content = '> aaa\n> bbb\n> ccc';
      editor.setValue(content);
      editor.setCursor({ line: 0, ch: 0 });

      withMultipleSelections(editor as any, joinLines);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('> aaa bbb\n> ccc');
      expect(cursor.line).toEqual(0);
      expect(cursor.ch).toEqual(5);
    });

    it('should not add a space after the current line if one already exists', () => {
      const content = 'lorem ipsum\ndolor sit \namet';
      editor.setValue(content);
      editor.setCursor({ line: 1, ch: 0 });

      withMultipleSelections(editor as any, joinLines);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit amet');
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(10);
    });
  });

  describe('copyLine', () => {
    it('should copy current line up', () => {
      editor.setCursor({ line: 1, ch: 3 });

      withMultipleSelections(editor as any, copyLine, {
        args: 'up',
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit\ndolor sit\namet');
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(3);
    });

    it('should copy current line up from the end of a line', () => {
      editor.setCursor({ line: 1, ch: 9 });

      withMultipleSelections(editor as any, copyLine, {
        args: 'up',
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit\ndolor sit\namet');
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(9);
    });

    it('should copy current line down', () => {
      editor.setCursor({ line: 1, ch: 3 });

      withMultipleSelections(editor as any, copyLine, {
        args: 'down',
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\ndolor sit\ndolor sit\namet');
      expect(cursor.line).toEqual(2);
      expect(cursor.ch).toEqual(3);
    });
  });

  describe('selectWordOrNextOccurrence', () => {
    it('should select word', () => {
      selectWordOrNextOccurrence(editor as any);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selectedText).toEqual('dolor');
    });

    it('should select word containing unicode characters', () => {
      editor.setValue('café');
      editor.setCursor({ line: 0, ch: 2 });

      selectWordOrNextOccurrence(editor as any);

      const { selectedText } = getDocumentAndSelection(editor);
      expect(selectedText).toEqual('café');
    });
  });

  describe('selectAllOccurrences', () => {
    const originalDocRepeated = `${originalDoc}\n${originalDoc}\n${originalDoc}`;

    it('should select all occurrences of selection', () => {
      editor.setValue(originalDocRepeated);
      editor.setCursor({ line: 7, ch: 2 });

      selectAllOccurrences(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDocRepeated);
      expect(selections).toEqual([
        {
          anchor: expect.objectContaining({ line: 1, ch: 0 }),
          head: expect.objectContaining({ line: 1, ch: 5 }),
        },
        {
          anchor: expect.objectContaining({ line: 4, ch: 0 }),
          head: expect.objectContaining({ line: 4, ch: 5 }),
        },
        {
          anchor: expect.objectContaining({ line: 7, ch: 0 }),
          head: expect.objectContaining({ line: 7, ch: 5 }),
        },
      ]);
    });
  });

  describe('selectLine', () => {
    it('should select line', () => {
      withMultipleSelections(editor as any, selectLine);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selectedText).toEqual('dolor sit\n');
    });
  });

  describe('addCursorsToSelectionEnds', () => {
    it('should not add cursors to selection ends', () => {
      addCursorsToSelectionEnds(editor as any, CODE_EDITOR.VSCODE);

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(0);
    });
  });

  describe('goToLineBoundary', () => {
    it('should go to line start', () => {
      withMultipleSelections(editor as any, goToLineBoundary, {
        args: 'start',
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(0);
    });

    it('should go to line end', () => {
      withMultipleSelections(editor as any, goToLineBoundary, {
        args: 'end',
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(9);
    });
  });

  describe('navigateLine', () => {
    it('should navigate to the previous line', () => {
      editor.setCursor({ line: 2, ch: 0 });
      withMultipleSelections(editor as any, navigateLine, { args: 'prev' });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(0);
    });

    it('should not navigate past the start of the document', () => {
      editor.setCursor({ line: 0, ch: 0 });
      withMultipleSelections(editor as any, navigateLine, { args: 'prev' });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(0);
      expect(cursor.ch).toEqual(0);
    });

    it('should navigate to the next line', () => {
      withMultipleSelections(editor as any, navigateLine, { args: 'next' });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(2);
      expect(cursor.ch).toEqual(0);
    });

    it('should not navigate past the end of the document', () => {
      editor.setCursor({ line: 2, ch: 4 });
      withMultipleSelections(editor as any, navigateLine, { args: 'next' });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(2);
      expect(cursor.ch).toEqual(4);
    });

    it('should snap to the end of the line', () => {
      editor.setValue('line zero\nzz\nline two');
      editor.setCursor({ line: 0, ch: 5 });

      withMultipleSelections(editor as any, navigateLine, { args: 'next' });

      const { cursor } = getDocumentAndSelection(editor);
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(2);
    });

    it('should navigate to the first line', () => {
      withMultipleSelections(editor as any, navigateLine, { args: 'first' });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(0);
      expect(cursor.ch).toEqual(0);
    });

    it('should navigate to the last line', () => {
      withMultipleSelections(editor as any, navigateLine, { args: 'last' });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(2);
      expect(cursor.ch).toEqual(0);
    });
  });

  describe('moveCursor', () => {
    it('should navigate the cursor backward', () => {
      editor.setCursor({ line: 2, ch: 2 });
      withMultipleSelections(editor as any, moveCursor, {
        args: DIRECTION.BACKWARD,
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(2);
      expect(cursor.ch).toEqual(1);
    });

    it('should navigate the cursor backward over a line boundary', () => {
      withMultipleSelections(editor as any, moveCursor, {
        args: DIRECTION.BACKWARD,
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(0);
      expect(cursor.ch).toEqual(11);
    });

    it('should not attempt to navigate the cursor past start of document', () => {
      editor.setCursor({ line: 0, ch: 0 });
      withMultipleSelections(editor as any, moveCursor, {
        args: DIRECTION.BACKWARD,
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(0);
      expect(cursor.ch).toEqual(0);
    });

    it('should navigate the cursor forward', () => {
      withMultipleSelections(editor as any, moveCursor, {
        args: DIRECTION.FORWARD,
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(1);
    });

    it('should navigate the cursor forward over a line boundary', () => {
      editor.setCursor({ line: 1, ch: 9 });
      withMultipleSelections(editor as any, moveCursor, {
        args: DIRECTION.FORWARD,
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(2);
      expect(cursor.ch).toEqual(0);
    });

    it('should not attempt to navigate the cursor past end of document', () => {
      editor.setCursor({ line: 2, ch: 4 });
      withMultipleSelections(editor as any, moveCursor, {
        args: DIRECTION.FORWARD,
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(2);
      expect(cursor.ch).toEqual(4);
    });
  });

  describe('transformCase', () => {
    it('should transform to uppercase', () => {
      withMultipleSelections(editor as any, transformCase, {
        args: CASE.UPPER,
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\nDOLOR sit\namet');
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(0);
    });

    it('should transform to lowercase', () => {
      editor.setValue('lorem ipsum\nDOLOR sit\namet');
      editor.setCursor({ line: 1, ch: 0 });

      withMultipleSelections(editor as any, transformCase, {
        args: CASE.LOWER,
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(0);
    });

    it('should transform to title case', () => {
      withMultipleSelections(editor as any, transformCase, {
        args: CASE.TITLE,
      });

      const { doc, cursor } = getDocumentAndSelection(editor);
      expect(doc).toEqual('lorem ipsum\nDolor sit\namet');
      expect(cursor.line).toEqual(1);
      expect(cursor.ch).toEqual(0);
    });

    it.each([
      ['default', 'loreM', 'LOREM'],
      ['uppercase', 'LOREM', 'lorem'],
      ['lowercase', 'lorem', 'Lorem'],
      ['title case', 'Lorem', 'LOREM'],
    ])(
      'should cycle to next case from %s',
      (_scenario, initialContent, expectedContent) => {
        editor.setValue(initialContent);
        editor.setCursor({ line: 0, ch: 0 });

        withMultipleSelections(editor as any, transformCase, {
          args: CASE.NEXT,
        });

        const { doc, cursor } = getDocumentAndSelection(editor);
        expect(doc).toEqual(expectedContent);
        expect(cursor.line).toEqual(0);
        expect(cursor.ch).toEqual(0);
      },
    );
  });

  describe('expandSelectionToBrackets', () => {
    it.each([
      ['()', '(lorem ipsum) dolor'],
      ['[]', 'dolor [lorem ipsum]'],
      ['{}', 'dolor {lorem ipsum} sit amet'],
    ])(
      'should expand selection to %s brackets if cursor is inside',
      (_scenario, content) => {
        editor.setValue(content);
        editor.setCursor({ line: 0, ch: 8 });

        withMultipleSelections(editor as any, expandSelectionToBrackets);

        const { doc, selectedText } = getDocumentAndSelection(editor);
        expect(doc).toEqual(content);
        expect(selectedText).toEqual('lorem ipsum');
      },
    );

    it('should not expand selection to brackets if cursor is outside', () => {
      const content = '(lorem ipsum) dolor';
      editor.setValue(content);
      editor.setCursor({ line: 0, ch: 15 });

      withMultipleSelections(editor as any, expandSelectionToBrackets);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(content);
      expect(selectedText).toEqual('');
    });

    it('should not expand selection to mismatched brackets', () => {
      const content = '(lorem ipsum] dolor';
      editor.setValue(content);
      editor.setCursor({ line: 0, ch: 6 });

      withMultipleSelections(editor as any, expandSelectionToBrackets);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(content);
      expect(selectedText).toEqual('');
    });
  });

  describe('expandSelectionToQuotes', () => {
    it.each([
      ['single', "'lorem ipsum' dolor"],
      ['double', 'dolor "lorem ipsum"'],
    ])(
      'should expand selection to %s quotes if cursor is inside',
      (_scenario, content) => {
        editor.setValue(content);
        editor.setCursor({ line: 0, ch: 8 });

        withMultipleSelections(editor as any, expandSelectionToQuotes);

        const { doc, selectedText } = getDocumentAndSelection(editor);
        expect(doc).toEqual(content);
        expect(selectedText).toEqual('lorem ipsum');
      },
    );

    it('should not expand selection to quotes if cursor is outside', () => {
      const content = '"lorem ipsum" dolor';
      editor.setValue(content);
      editor.setCursor({ line: 0, ch: 15 });

      withMultipleSelections(editor as any, expandSelectionToQuotes);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(content);
      expect(selectedText).toEqual('');
    });

    it('should not expand selection to mismatched quotes', () => {
      const content = '\'lorem ipsum" dolor';
      editor.setValue(content);
      editor.setCursor({ line: 0, ch: 6 });

      withMultipleSelections(editor as any, expandSelectionToQuotes);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(content);
      expect(selectedText).toEqual('');
    });
  });

  describe('expandSelectionToQuotesOrBrackets', () => {
    it.each([
      ['quotes', '("lorem ipsum" dolor)'],
      ['brackets', '"(lorem ipsum) dolor"'],
    ])('should expand selection to %s', (_scenario, content) => {
      editor.setValue(content);
      editor.setCursor({ line: 0, ch: 7 });

      expandSelectionToQuotesOrBrackets(editor as any);

      const { doc, selectedText } = getDocumentAndSelection(editor);
      expect(doc).toEqual(content);
      expect(selectedText).toEqual('lorem ipsum');
    });
  });

  describe('insertCursorAbove', () => {
    it('should insert cursor above at the same position', () => {
      insertCursorAbove(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selections).toEqual([
        { anchor: { line: 0, ch: 0 }, head: { line: 0, ch: 0 } },
        { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 0 } },
      ]);
    });

    it('should insert cursor above at the end if previous line is shorter', () => {
      editor.setValue('aaa\nbbbbbb');
      editor.setCursor({ line: 1, ch: 5 });

      insertCursorAbove(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual('aaa\nbbbbbb');
      expect(selections).toEqual([
        { anchor: { line: 0, ch: 3 }, head: { line: 0, ch: 3 } },
        { anchor: { line: 1, ch: 5 }, head: { line: 1, ch: 5 } },
      ]);
    });

    it('should not insert cursor above if on the first line of the document', () => {
      editor.setCursor({ line: 0, ch: 3 });

      insertCursorAbove(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selections).toEqual([
        { anchor: { line: 0, ch: 3 }, head: { line: 0, ch: 3 } },
      ]);
    });
  });

  describe('insertCursorBelow', () => {
    it('should insert cursor below at the same position', () => {
      insertCursorBelow(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selections).toEqual([
        { anchor: { line: 1, ch: 0 }, head: { line: 1, ch: 0 } },
        { anchor: { line: 2, ch: 0 }, head: { line: 2, ch: 0 } },
      ]);
    });

    it('should insert cursor below at the end if next line is shorter', () => {
      editor.setValue('aaaaaa\nbbb');
      editor.setCursor({ line: 0, ch: 5 });

      insertCursorBelow(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual('aaaaaa\nbbb');
      expect(selections).toEqual([
        { anchor: { line: 0, ch: 5 }, head: { line: 0, ch: 5 } },
        { anchor: { line: 1, ch: 3 }, head: { line: 1, ch: 3 } },
      ]);
    });

    it('should not insert cursor below if on the last line of the document', () => {
      editor.setCursor({ line: 2, ch: 3 });

      insertCursorBelow(editor as any);

      const { doc, selections } = getDocumentAndSelection(editor);
      expect(doc).toEqual(originalDoc);
      expect(selections).toEqual([
        { anchor: { line: 2, ch: 3 }, head: { line: 2, ch: 3 } },
      ]);
    });
  });
});
