import React, { ChangeEvent, Component, ClipboardEvent } from 'react';
import { Input } from 'antd';
import InputMask from './inputmask-core';
import { isRedo, isUndo, getSelection, setSelection } from './helpers';
import { InputProps } from 'antd/lib/input';

export type MaskedInputProps = InputProps & {
  mask: string;
  showMask?: boolean;
  formatCharacters?: object;
  placeholderChar?: string;
  value?: string;
};

type TChangeEvent = ChangeEvent<HTMLInputElement>;
type TKeyboardEvent = any;
type TClipboardEvent = ClipboardEvent<any>;

export default class MaskedInput extends Component<MaskedInputProps> {
  mask: InputMask;
  input!: HTMLInputElement;

  constructor(props: MaskedInputProps) {
    super(props);

    let options: any = {
      pattern: this.props.mask,
      value: this.props.value,
      formatCharacters: this.props.formatCharacters,
      isRevealingMask: this.props.showMask
    };

    if (this.props.placeholderChar) {
      options.placeholderChar = this.props.placeholderChar;
    }

    this.mask = new InputMask(options);
  }

  componentDidMount() {
    this.setInputValue(this._getDisplayValue());
  }

  UNSAFE_componentWillReceiveProps(nextProps: MaskedInputProps) {
    if (
      this.props.mask !== nextProps.mask &&
      this.props.value !== nextProps.mask
    ) {
      // if we get a new value and a new mask at the same time
      // check if the mask.value is still the initial value
      // - if so use the nextProps value
      // - otherwise the `this.mask` has a value for us (most likely from paste action)
      if (this.mask.getValue() === this.mask.emptyValue) {
        this.mask.setPattern(nextProps.mask, { value: nextProps.value });
      } else {
        this.mask.setPattern(nextProps.mask, {
          value: this.mask.getRawValue()
        });
      }
    } else if (this.props.mask !== nextProps.mask) {
      this.mask.setPattern(nextProps.mask, { value: this.mask.getRawValue() });
    }

    if (this.props.value !== nextProps.value) {
      this.mask.setValue(nextProps.value);
      this.setInputValue(this._getDisplayValue());
    }
  }

  UNSAFE_componentWillUpdate(nextProps: MaskedInputProps) {
    if (!this.props.mask) return null;
    if (nextProps.mask !== this.props.mask) {
      this._updatePattern(nextProps);
    }
    return;
  }

  componentDidUpdate(prevProps: MaskedInputProps) {
    if (!this.props.mask) return null;
    if (prevProps.mask !== this.props.mask && this.mask.selection.start) {
      this._updateInputSelection();
    }
    return;
  }

  _updatePattern(props: MaskedInputProps) {
    this.mask.setPattern(props.mask, {
      value: this.mask.getRawValue(),
      selection: getSelection(this.input)
    });
  }

  _updateMaskSelection() {
    this.mask.selection = getSelection(this.input);
  }

  _updateInputSelection() {
    setSelection(this.input, this.mask.selection);
  }

  _onChange = (e: TChangeEvent) => {
    // console.log('onChange', JSON.stringify(getSelection(this.input)), e.target.value)

    let maskValue = this.mask.getValue();
    let incomingValue = e.target.value;
    if (incomingValue !== maskValue) {
      // only modify mask if form contents actually changed
      this._updateMaskSelection();
      this.mask.setValue(incomingValue); // write the whole updated value into the mask
      this.setInputValue(this._getDisplayValue()); // update the form with pattern applied to the value
      this._updateInputSelection();
    }

    if (this.props.onChange) {
      this.props.onChange(e);
    }
  };

  _onKeyDown = (e: TKeyboardEvent) => {
    setTimeout(() => {
      this.input.classList[this.input.value ? 'add' : 'remove']('has-value');
    }, 100);

    if (isUndo(e)) {
      e.preventDefault();
      if (this.mask.undo()) {
        this.setInputValue(this._getDisplayValue());
        this._updateInputSelection();
        if (this.props.onChange) {
          this.props.onChange(e);
        }
      }
      return;
    } else if (isRedo(e)) {
      e.preventDefault();
      if (this.mask.redo()) {
        this.setInputValue(this._getDisplayValue());
        this._updateInputSelection();
        if (this.props.onChange) {
          this.props.onChange(e);
        }
      }
      return;
    }

    if (e.key === 'Backspace') {
      e.preventDefault();
      this._updateMaskSelection();
      if (this.mask.backspace()) {
        let value = this._getDisplayValue();
        this.setInputValue(value);
        if (value) {
          this._updateInputSelection();
        }
        if (this.props.onChange) {
          this.props.onChange(e);
        }
      }
    }
  };

  _onKeyPress = (e: TKeyboardEvent) => {
    // console.log('onKeyPress', JSON.stringify(getSelection(this.input)), e.key, e.target.value)

    // Ignore modified key presses
    // Ignore enter key to allow form submission
    if (e.metaKey || e.altKey || e.ctrlKey || e.key === 'Enter') {
      return;
    }

    e.preventDefault();
    this._updateMaskSelection();
    if (this.mask.input(e.key || e.data)) {
      this.setInputValue(this.mask.getValue());
      this._updateInputSelection();
      if (this.props.onChange) {
        this.props.onChange(e);
      }
    }
  };

  _onPaste = (e: TClipboardEvent) => {
    e.preventDefault();
    this._updateMaskSelection();
    // getData value needed for IE also works in FF & Chrome
    if (this.mask.paste(e.clipboardData.getData('Text').replace(/[^0-9a-z]/gi, ''))) {
      // @ts-ignore
      this.setInputValue(this.mask.getValue());
      // Timeout needed for IE
      setTimeout(() => this._updateInputSelection(), 0);
      if (this.props.onChange) {
        // @ts-ignore
        this.props.onChange(e);
      }
    }
  };

  _getDisplayValue() {
    let value = this.mask.getValue();
    return value === this.mask.emptyValue ? '' : value;
  }

  _keyPressPropName() {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent.match(/Android/i)
        ? 'onBeforeInput'
        : 'onKeyPress';
    }
    return 'onKeyPress';
  }

  _getEventHandlers(): {
    onChange: (TChangeEvent) => void;
    onKeyDown: (TChangeEvent) => void;
    onPaste: (TClipboardEvent) => void;
    onBeforeInput?: (TChangeEvent) => void;
    onKeyPress?: (TChangeEvent) => void;
  } {
    return {
      onChange: this._onChange,
      onKeyDown: this._onKeyDown,
      onPaste: this._onPaste,
      [this._keyPressPropName()]: this._onKeyPress
    };
  }

  focus() {
    this.input.focus();
  }

  blur() {
    this.input.blur();
  }

  getInputProps = () => {
    let maxLength = this.mask.pattern.length;
    let eventHandlers = this._getEventHandlers();
    let { placeholder = this.mask.emptyValue } = this.props;

    let { showMask, placeholderChar, formatCharacters, ...cleanedProps } = this.props;
    const props = { ...cleanedProps, ...eventHandlers, maxLength, placeholder };
    delete props.value;
    return props;
  };

  _lastValue = null as any;
  setInputValue = (value: string) => {
    if (!this._Input) return;
    if (value === this._lastValue) return;

    this._lastValue = value;
    this._Input.setState({ value });
    this._Input.input.value = value;
  };

  _Input: Input | null = null;
  handleInputRef = (ref: Input) => {
    if (!ref) return;
    this._Input = ref;
    this.input = ref.input;

    if (
      this._lastValue === null &&
      typeof this.props.defaultValue === 'string'
    ) {
      this.mask.setValue(this.props.defaultValue); // write the whole updated value into the mask
      this.setInputValue(this._getDisplayValue()); // update the form with pattern applied to the value
    }
  };

  render() {
    return <Input {...this.getInputProps()} ref={this.handleInputRef} />;
  }
}
