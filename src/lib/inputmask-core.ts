import {
  DEFAULT_PLACEHOLDER_CHAR,
  FormatCharacters,
  mergeFormatCharacters
} from './helpers';
import { Pattern } from './Pattern';

type SelectionObject = { start: number; end: number };

type Options = {
  formatCharacters: FormatCharacters;
  pattern: string;
  isRevealingMask: boolean;
  placeholderChar: string;
  selection: SelectionObject;
  value: string;
};

export class InputMask {
  static Pattern = Pattern;

  formatCharacters!: FormatCharacters;
  pattern!: Pattern;
  isRevealingMask!: boolean;
  placeholderChar!: string;
  selection!: SelectionObject;
  value!: string[];
  emptyValue = '';

  _history: {
    value: string;
    selection: SelectionObject;
    lastOp: string | null;
    startUndo?: boolean;
  }[] = [];

  _historyIndex: null | number = null;
  _lastOp: null | string = null;
  _lastSelection: null | SelectionObject = null;

  constructor(options: Partial<Options>) {
    const mergedOptions: Options = {
      ...{
        isRevealingMask: false,
        placeholderChar: DEFAULT_PLACEHOLDER_CHAR,
        selection: { start: 0, end: 0 },
        value: ''
      },
      ...options
    } as Options;

    if (!mergedOptions.pattern) {
      throw new Error('InputMask: you must provide a pattern.');
    }

    if (
      typeof mergedOptions.placeholderChar !== 'string' ||
      mergedOptions.placeholderChar.length > 1
    ) {
      throw new Error(
        'InputMask: placeholderChar should be a single character or an empty string.'
      );
    }

    this.placeholderChar = mergedOptions.placeholderChar;
    this.formatCharacters = mergeFormatCharacters(
      mergedOptions.formatCharacters
    );

    this.setPattern(mergedOptions.pattern, {
      value: mergedOptions.value,
      selection: mergedOptions.selection,
      isRevealingMask: mergedOptions.isRevealingMask
    });
  }

  setPattern(patternSource: string, options: Partial<Options>) {
    const merged = {
      selection: { start: 0, end: 0 },
      value: '',
      ...options
    };

    this.pattern = new Pattern(
      patternSource,
      this.formatCharacters,
      this.placeholderChar,
      merged.isRevealingMask
    );

    this.setValue(merged.value);

    this.emptyValue = this.pattern.formatValue(['']).join('');
    this.selection = merged.selection;
    this._resetHistory();
  }

  setValue(value?: string) {
    if (value == null) {
      value = '';
    }
    this.value = this.pattern.formatValue((value || '').split(''));
  }

  _resetHistory() {
    this._history = [];
    this._historyIndex = null;
    this._lastOp = null;
    this._lastSelection = { ...this.selection };
  }

  getValue(): string {
    if (this.pattern.isRevealingMask) {
      this.value = this.pattern.formatValue(
        (this.getRawValue() || '').split('')
      );
    }
    return (this.value || []).join('');
  }

  getRawValue(): string {
    var rawValue = [];
    for (var i = 0; i < this.value.length; i++) {
      if (this.pattern._editableIndices[i] === true) {
        rawValue.push(this.value[i]);
      }
    }
    return rawValue.join('');
  }

  /**
   * Applies a single character of input based on the current selection.
   * @param {string} char
   * @return {boolean} true if a change has been made to value or selection as a
   *   result of the input, false otherwise.
   */
  input(char: string) {
    // Ignore additional input if the cursor's at the end of the pattern
    if (
      this.selection.start === this.selection.end &&
      this.selection.start === this.pattern.length
    ) {
      return false;
    }

    const selectionBefore = copy(this.selection);
    const valueBefore = this.getValue();

    let inputIndex = this.selection.start;

    // If the cursor or selection is prior to the first editable character, make
    // sure any input given is applied to it.
    if (inputIndex < this.pattern.firstEditableIndex) {
      inputIndex = this.pattern.firstEditableIndex;
    }

    // Bail out or add the character to input
    if (this.pattern.isEditableIndex(inputIndex)) {
      if (!this.pattern.isValidAtIndex(char, inputIndex)) {
        return false;
      }
      this.value[inputIndex] = this.pattern.transform(char, inputIndex);
    } else {
      console.log('not editable');
    }

    // If multiple characters were selected, blank the remainder out based on the
    // pattern.
    let end = this.selection.end - 1;
    while (end > inputIndex) {
      if (this.pattern.isEditableIndex(end)) {
        this.value[end] = this.placeholderChar;
      }
      end--;
    }

    // Advance the cursor to the next character
    this.selection.start = this.selection.end = inputIndex + 1;

    this.value = this.pattern.formatValue(this.value);

    // Skip over any subsequent static characters
    while (
      this.pattern.length > this.selection.start &&
      !this.pattern.isEditableIndex(this.selection.start)
    ) {
      this.selection.start++;
      this.selection.end++;
    }

    // History
    if (this._historyIndex != null) {
      // Took more input after undoing, so blow any subsequent history away
      this._history.splice(
        this._historyIndex,
        this._history.length - this._historyIndex
      );
      this._historyIndex = null;
    }
    if (
      this._lastOp !== 'input' ||
      selectionBefore.start !== selectionBefore.end ||
      (this._lastSelection !== null &&
        selectionBefore.start !== this._lastSelection.start)
    ) {
      this._history.push({
        value: valueBefore,
        selection: selectionBefore,
        lastOp: this._lastOp
      });
    }
    this._lastOp = 'input';
    this._lastSelection = copy(this.selection);

    return true;
  }

  /**
   * Attempts to delete from the value based on the current cursor position or
   * selection.
   * @return {boolean} true if the value or selection changed as the result of
   *   backspacing, false otherwise.
   */
  backspace() {
    // If the cursor is at the start there's nothing to do
    if (this.selection.start === 0 && this.selection.end === 0) {
      return false;
    }

    var selectionBefore = { ...this.selection };
    var valueBefore = this.getValue();

    // No range selected - work on the character preceding the cursor
    if (this.selection.start === this.selection.end || !this.pattern.isEditableIndex(this.selection.start)) {
      this.selection.start = this.pattern.findEditableIndexBefore(this.selection.start);
    }
    if (this.pattern.isRevealingMask) {
      for (let i = this.selection.end-1; i >= this.selection.start; i--) {
        this.value[i] = this.placeholderChar;
      }
    } else {
      this.value.splice(this.selection.start);
    }
    this.selection.end = this.selection.start;

    // History
    if (this._historyIndex != null) {
      // Took more input after undoing, so blow any subsequent history away
      this._history.splice(
        this._historyIndex,
        this._history.length - this._historyIndex
      );
    }
    if (
      this._lastOp !== 'backspace' ||
      selectionBefore.start !== selectionBefore.end ||
      (this._lastSelection !== null &&
        selectionBefore.start !== this._lastSelection.start)
    ) {
      this._history.push({
        value: valueBefore,
        selection: selectionBefore,
        lastOp: this._lastOp
      });
    }
    this._lastOp = 'backspace';
    this._lastSelection = { ...this.selection };

    return true;
  }

  /**
   * Attempts to paste a string of input at the current cursor position or over
   * the top of the current selection.
   * Invalid content at any position will cause the paste to be rejected, and it
   * may contain static parts of the mask's pattern.
   * @param {string} input
   * @return {boolean} true if the paste was successful, false otherwise.
   */
  paste(input: string) {
    // This is necessary because we're just calling input() with each character
    // and rolling back if any were invalid, rather than checking up-front.
    var initialState = {
      value: this.value.slice(),
      selection: { ...this.selection },
      _lastOp: this._lastOp,
      _history: this._history.slice(),
      _historyIndex: this._historyIndex,
      _lastSelection: { ...this._lastSelection }
    };

    // If there are static characters at the start of the pattern and the cursor
    // or selection is within them, the static characters must match for a valid
    // paste.
    if (this.selection.start < this.pattern.firstEditableIndex!) {
      for (
        var i = 0, l = this.pattern.firstEditableIndex! - this.selection.start;
        i < l;
        i++
      ) {
        if (input.charAt(i) !== this.pattern.pattern[i]) {
          return false;
        }
      }

      // Continue as if the selection and input started from the editable part of
      // the pattern.
      input = input.substring(
        this.pattern.firstEditableIndex! - this.selection.start
      );
      this.selection.start = this.pattern.firstEditableIndex!;
    }

    for (
      i = 0, l = input.length;
      i < l && this.selection.start <= this.pattern.lastEditableIndex!;
      i++
    ) {
      var valid = this.input(input.charAt(i));
      // Allow static parts of the pattern to appear in pasted input - they will
      // already have been stepped over by input(), so verify that the value
      // deemed invalid by input() was the expected static character.
      if (!valid) {
        if (this.selection.start > 0) {
          // XXX This only allows for one static character to be skipped
          var patternIndex = this.selection.start - 1;
          if (
            !this.pattern.isEditableIndex(patternIndex) &&
            input.charAt(i) === this.pattern.pattern[patternIndex]
          ) {
            continue;
          }
        }

        Object.keys(initialState).forEach(key => {
          // @ts-ignore
          this[key] = initialState[key];
        });

        return false;
      }
    }

    return true;
  }

  undo() {
    // If there is no history, or nothing more on the history stack, we can't undo
    if (this._history.length === 0 || this._historyIndex === 0) {
      return false;
    }

    var historyItem;
    if (this._historyIndex == null) {
      // Not currently undoing, set up the initial history index
      this._historyIndex = this._history.length - 1;
      historyItem = this._history[this._historyIndex];
      // Add a new history entry if anything has changed since the last one, so we
      // can redo back to the initial state we started undoing from.
      var value = this.getValue();
      if (
        historyItem.value !== value ||
        historyItem.selection.start !== this.selection.start ||
        historyItem.selection.end !== this.selection.end
      ) {
        this._history.push({
          value: value,
          selection: { ...this.selection },
          lastOp: this._lastOp,
          startUndo: true
        });
      }
    } else {
      historyItem = this._history[--this._historyIndex];
    }

    this.value = historyItem.value.split('');
    this.selection = historyItem.selection;
    this._lastOp = historyItem.lastOp;
    return true;
  }

  redo() {
    if (this._history.length === 0 || this._historyIndex == null) {
      return false;
    }
    var historyItem = this._history[++this._historyIndex];
    // If this is the last history item, we're done redoing
    if (this._historyIndex === this._history.length - 1) {
      this._historyIndex = null;
      // If the last history item was only added to start undoing, remove it
      if (historyItem.startUndo) {
        this._history.pop();
      }
    }
    this.value = historyItem.value.split('');
    this.selection = historyItem.selection;
    this._lastOp = historyItem.lastOp;
    return true;
  }

  setSelection(selection: SelectionObject) {
    this.selection = { ...selection };

    if (this.selection.start === this.selection.end) {
      if (this.selection.start < this.pattern.firstEditableIndex!) {
        this.selection!.start = this.selection!.end = this.pattern
          .firstEditableIndex as number;
        return true;
      }
      // Set selection to the first editable, non-placeholder character before the selection
      // OR to the beginning of the pattern
      var index = this.selection.start;
      while (index >= this.pattern.firstEditableIndex!) {
        if (
          (this.pattern.isEditableIndex(index - 1) &&
            this.value[index - 1] !== this.placeholderChar) ||
          index === this.pattern.firstEditableIndex
        ) {
          this.selection.start = this.selection.end = index;
          break;
        }
        index--;
      }
      return true;
    }
    return false;
  }
}

function extend(dest: any, src: any) {
  if (src) {
    let props = Object.keys(src);

    for (var i = 0, l = props.length; i < l; i++) {
      dest[props[i]] = src[props[i]];
    }
  }

  return dest;
}

function copy<T = any>(obj: T): T {
  return extend({}, obj);
}

export default InputMask;
