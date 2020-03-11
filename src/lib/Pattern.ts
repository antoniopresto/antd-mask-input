import {
  DEFAULT_FORMAT_CHARACTERS,
  DEFAULT_PLACEHOLDER_CHAR,
  ESCAPE_CHAR,
  FormatCharacters,
} from './helpers';

export class Pattern {
  placeholderChar: string;
  formatCharacters: FormatCharacters;
  source: string;

  /** Pattern characters after escape characters have been processed. */
  pattern = [];

  /** Length of the pattern after escape characters have been processed. */
  length = 0;

  /** Index of the first editable character. */
  firstEditableIndex: null | number = null;

  /** Index of the last editable character. */
  lastEditableIndex: null | number = null;

  /** Lookup for indices of editable characters in the pattern. */
  _editableIndices: { [key: number]: boolean } = {};

  /** If true, only the pattern before the last valid value character shows. */
  isRevealingMask: boolean;

  constructor(
    source: string,
    formatCharacters: FormatCharacters,
    placeholderChar: string,
    isRevealingMask = false,
  ) {
    /** Placeholder character */
    this.placeholderChar = placeholderChar || DEFAULT_PLACEHOLDER_CHAR;
    /** Format character definitions. */
    this.formatCharacters = formatCharacters || DEFAULT_FORMAT_CHARACTERS;
    /** Pattern definition string with escape characters. */
    this.source = source;

    this.isRevealingMask = isRevealingMask;

    this._parse();
  }

  _parse() {
    var sourceChars = this.source.split('');
    var patternIndex = 0;
    var pattern: string[] = [];

    for (var i = 0, l = sourceChars.length; i < l; i++) {
      var char = sourceChars[i];
      if (char === ESCAPE_CHAR) {
        if (i === l - 1) {
          throw new Error('InputMask: pattern ends with a raw ' + ESCAPE_CHAR);
        }
        char = sourceChars[++i];
      } else if (char in this.formatCharacters) {
        if (this.firstEditableIndex === null) {
          this.firstEditableIndex = patternIndex;
        }
        this.lastEditableIndex = patternIndex;
        this._editableIndices[patternIndex] = true;
      }

      pattern.push(char);
      patternIndex++;
    }

    if (this.firstEditableIndex === null) {
      throw new Error(
        'InputMask: pattern "' + this.source + '" does not contain any editable characters.',
      );
    }

    // @ts-ignore
    this.pattern = pattern;
    this.length = pattern.length;
  }

  formatValue(value: string[]): string[] {
    var valueBuffer = [];
    var valueIndex = 0;

    for (var i = 0, l = this.length; i < l; i++) {
      if (this.isEditableIndex(i)) {
        if (
          !this.isRevealingMask &&
          value.length <= valueIndex &&
          !this.isValidAtIndex(value[valueIndex], i)
        ) {
          break;
        }
        valueBuffer.push(
          value.length > valueIndex && this.isValidAtIndex(value[valueIndex], i)
            ? this.transform(value[valueIndex], i)
            : this.placeholderChar
        );
        valueIndex++;
      } else {
        valueBuffer.push(this.pattern[i]);
        // Also allow the value to contain static values from the pattern by
        // advancing its index.
        if (value.length > valueIndex && value[valueIndex] === this.pattern[i]) {
          valueIndex++;
        }
      }
    }
    return valueBuffer;
  }

  findEditableIndexBefore(index: number): number {
    for (let i = index-1; i >= 0; i--) {
      if (this.isEditableIndex(i)) {
        return i;
      }
    }
    return 0;
  }

  isEditableIndex(index: number) {
    return !!this._editableIndices[index];
  }

  isValidAtIndex(char: string, index: number) {
    return this.formatCharacters[this.pattern[index]].validate(char);
  }

  transform(char: string, index: number) {
    var format = this.formatCharacters[this.pattern[index]];
    return typeof format.transform == 'function' ? format.transform(char) : char;
  }
}
