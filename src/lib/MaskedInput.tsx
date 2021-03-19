import React, { ChangeEvent, Component, ClipboardEvent } from 'react';
import { Input } from 'antd';
import InputMask from './inputmask-core';
import { isRedo, isUndo, getSelection, setSelection } from './helpers';
import { InputProps } from 'antd/lib/input';

export type MaskedInputProps = InputProps & {
  mask: string;
  formatCharacters?: object;
  placeholderChar?: string;
  value?: string;
};

export type MaskedInputState = {
  input: HTMLInputElement,
  _lastValue: any,
  _Input: Input | null,
  mask: InputMask,
  prevMask: string,
  prevValue: string
}

type TChangeEvent = ChangeEvent<HTMLInputElement>;
type TKeyboardEvent = any;
type TClipboardEvent = ClipboardEvent<any>;

export default class MaskedInput extends Component<MaskedInputProps> {

  state: MaskedInputState = {
    input: null,
    _lastValue: null,
    _Input: null,
    mask: null,
    prevMask: null,
    prevValue: null,
  };

  constructor(props: MaskedInputProps) {
    super(props);

    let options: any = {
      pattern: this.props.mask,
      value: this.props.value,
      formatCharacters: this.props.formatCharacters
    };

    if (this.props.placeholderChar) {
      options.placeholderChar = this.props.placeholderChar;
    }

    this.state.mask = new InputMask(options);
  }

  componentDidMount() {
    this.setInputValue(this._getDisplayValue());
  }

  static getDerivedStateFromProps(props: MaskedInputProps, state: MaskedInputState) {

    const currMask = state.prevMask;
    const currValue = state.prevValue;
    const nextMask = props.mask;
    const nextValue = props.value;


    if (
      nextMask !== currMask &&
      nextValue !== currValue
    ) {
      // if we get a new value and a new mask at the same time
      // check if the mask.value is still the initial value
      // - if so use the next's value
      // - otherwise the `this.mask` has a value for us (most likely from paste action)
      if (state.mask.getValue() === state.mask.emptyValue) {
        state.mask.setPattern(nextMask, {
          value: nextValue,
          selection: state.input && getSelection(state.input)
        });
      } else {
        state.mask.setPattern(nextMask, {
          value: state.mask.getRawValue(),
          selection: state.input && getSelection(state.input)
        });
      }
    } else if (currMask !== nextMask) {
      state.mask.setPattern(nextMask, {
        value: state.mask.getRawValue(),
        selection: state.input && getSelection(state.input)
      });
    }

    if (currValue !== nextValue) {
      state.mask.setValue(nextValue);

      let value = state.mask.getValue();
      value = value === state.mask.emptyValue ? '' : value;

      if (state._Input && state._Input.input && value !== state._lastValue) {
        state._lastValue = value;
        state._Input.setState({ value });
        state._Input.input.value = value;
      }
    }

    if (nextMask !== currMask || nextValue !== currValue) {
      const newState: { prevMask?: string, prevValue?: string } = {};

      if (nextMask !== currMask) {
        newState.prevMask = nextMask;
      }
      if (nextValue !== currValue) {
        newState.prevValue = nextValue
      }

      return newState;
    }

    return null;
  }


  componentDidUpdate(prevProps: MaskedInputProps) {
    if (!this.props.mask) return null;
    if (prevProps.mask !== this.props.mask && this.state.mask.selection.start) {
      this._updateInputSelection();
    }
    return;
  }

  _updateMaskSelection() {
    this.state.mask.selection = getSelection(this.state.input);
  }

  _updateInputSelection() {
    setSelection(this.state.input, this.state.mask.selection);
  }

  _onChange = (e: TChangeEvent) => {
    // console.log('onChange', JSON.stringify(getSelection(this.state.input)), e.target.value)

    let maskValue = this.state.mask.getValue();
    let incomingValue = e.target.value;
    if (incomingValue !== maskValue) {
      // only modify mask if form contents actually changed
      this._updateMaskSelection();
      this.state.mask.setValue(incomingValue); // write the whole updated value into the mask
      this.setInputValue(this._getDisplayValue()); // update the form with pattern applied to the value
      this._updateInputSelection();
    }

    if (this.props.onChange) {
      this.props.onChange(e);
    }
  };

  _onKeyDown = (e: TKeyboardEvent) => {
    setTimeout(() => {
      this.state.input.classList[this.state.input.value ? 'add' : 'remove']('has-value');
    }, 100);

    if (isUndo(e)) {
      e.preventDefault();
      if (this.state.mask.undo()) {
        this.setInputValue(this._getDisplayValue());
        this._updateInputSelection();
        if (this.props.onChange) {
          this.props.onChange(e);
        }
      }
      return;
    } else if (isRedo(e)) {
      e.preventDefault();
      if (this.state.mask.redo()) {
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
      if (this.state.mask.backspace()) {
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
    // console.log('onKeyPress', JSON.stringify(getSelection(this.state.input)), e.key, e.target.value)

    // Ignore modified key presses
    // Ignore enter key to allow form submission
    if (e.metaKey || e.altKey || e.ctrlKey || e.key === 'Enter') {
      return;
    }

    e.preventDefault();
    this._updateMaskSelection();
    if (this.state.mask.input(e.key || e.data)) {
      this.setInputValue(this.state.mask.getValue());
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
    if (this.state.mask.paste(e.clipboardData.getData('Text'))) {
      // @ts-ignore
      this.setInputValue(this.state.mask.getValue());
      // Timeout needed for IE
      setTimeout(() => this._updateInputSelection(), 0);
      if (this.props.onChange) {
        // @ts-ignore
        this.props.onChange(e);
      }
    }
  };

  _getDisplayValue() {
    let value = this.state.mask.getValue();
    return value === this.state.mask.emptyValue ? '' : value;
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
    this.state.input.focus();
  }

  blur() {
    this.state.input.blur();
  }

  getInputProps = () => {
    let maxLength = this.state.mask.pattern.length;
    let eventHandlers = this._getEventHandlers();
    let { placeholder = this.state.mask.emptyValue } = this.props;

    let { placeholderChar, formatCharacters, ...cleanedProps } = this.props;
    const props = { ...cleanedProps, ...eventHandlers, maxLength, placeholder };
    delete props.value;
    return props;
  };

  setInputValue = (value: string) => {
    if (!this.state._Input || !this.state._Input.input) return;
    if (value === this.state._lastValue) return;

    this.state._lastValue = value;
    this.state._Input.setState({ value });
    this.state._Input.input.value = value;
  };

  handleInputRef = (ref: Input) => {
    if (!ref) return;
    this.state._Input = ref;
    this.state.input = ref.input;

    if (
      this.state._lastValue === null &&
      typeof this.props.defaultValue === 'string'
    ) {
      this.state.mask.setValue(this.props.defaultValue); // write the whole updated value into the mask
      this.setInputValue(this._getDisplayValue()); // update the form with pattern applied to the value
    }
  };

  render() {
    return <Input {...this.getInputProps()} ref={this.handleInputRef} />;
  }
}
