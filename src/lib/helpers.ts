let KEYCODE_Z = 90;
let KEYCODE_Y = 89;

export function isUndo(e: KeyboardEvent): boolean {
  return (
    (e.ctrlKey || e.metaKey) &&
    e.keyCode === (e.shiftKey ? KEYCODE_Y : KEYCODE_Z)
  );
}

export function isRedo(e: KeyboardEvent): boolean {
  return (
    (e.ctrlKey || e.metaKey) &&
    e.keyCode === (e.shiftKey ? KEYCODE_Z : KEYCODE_Y)
  );
}

type GetSelectionResult = { start: number; end: number };

export function getSelection(el: HTMLInputElement): GetSelectionResult {
  let start, end;
  if (el.selectionStart !== undefined) {
    start = el.selectionStart;
    end = el.selectionEnd;
  } else {
    try {
      el.focus();
      // @ts-ignore (IE only)
      let rangeEl = el.createTextRange();
      let clone = rangeEl.duplicate();

      // @ts-ignore (IE only)
      rangeEl.moveToBookmark(document.selection.createRange().getBookmark());
      clone.setEndPoint('EndToStart', rangeEl);

      start = clone.text.length;
      end = start + rangeEl.text.length;
    } catch (e) {
      /* not focused or not visible */
    }
  }

  return { start, end };
}

let selectionTimeout: any;
export function setSelection(
  el: HTMLInputElement,
  selection: GetSelectionResult
) {
  clearTimeout(selectionTimeout);

  try {
    if (
      el.selectionStart === selection.start &&
      el.selectionEnd === selection.end
    ) {
      return;
    }

    if (el.selectionStart !== undefined) {
      el.focus();
      el.setSelectionRange(selection.start, selection.end);

      // fix https://bugs.chromium.org/p/chromium/issues/detail?id=32865
      selectionTimeout = setTimeout(() => {
        setSelection(el, selection);
      }, 0);
      
    } else {
      el.focus();
      // @ts-ignore (IE only)
      let rangeEl = el.createTextRange();
      rangeEl.collapse(true);
      rangeEl.moveStart('character', selection.start);
      rangeEl.moveEnd('character', selection.end - selection.start);
      rangeEl.select();
    }
  } catch (e) {
    /* not focused or not visible */
  }
}

/**
 * Merge an object defining format characters into the defaults.
 * Passing null/undefined for en existing format character removes it.
 * Passing a definition for an existing format character overrides it.
 */
export function mergeFormatCharacters(formatCharacters: FormatCharacters) {
  var merged = { ...DEFAULT_FORMAT_CHARACTERS };
  if (formatCharacters) {
    var chars = Object.keys(formatCharacters);
    for (var i = 0, l = chars.length; i < l; i++) {
      var char = chars[i];
      if (formatCharacters[char] == null) {
        delete merged[char];
      } else {
        merged[char] = formatCharacters[char];
      }
    }
  }
  return merged;
}

export const ESCAPE_CHAR = '\\';

export const DIGIT_RE = /^\d$/;
export const LETTER_RE = /^[A-Za-z]$/;
export const ALPHANNUMERIC_RE = /^[\dA-Za-z]$/;

export const DEFAULT_PLACEHOLDER_CHAR = '_';

export const DEFAULT_FORMAT_CHARACTERS: FormatCharacters = {
  '*': {
    validate: function(char: string) {
      return ALPHANNUMERIC_RE.test(char);
    }
  },
  '1': {
    validate: function(char: string) {
      return DIGIT_RE.test(char);
    }
  },
  a: {
    validate: function(char: string) {
      return LETTER_RE.test(char);
    }
  },
  A: {
    validate: function(char: string) {
      return LETTER_RE.test(char);
    },
    transform: function(char: string) {
      return char.toUpperCase();
    }
  },
  '#': {
    validate: function(char: string) {
      return ALPHANNUMERIC_RE.test(char);
    },
    transform: function(char: string) {
      return char.toUpperCase();
    }
  }
};

export type FormatCharacters = {
  [key: string]: {
    transform?(str: string): string;
    validate(str: string): boolean;
  };
};
