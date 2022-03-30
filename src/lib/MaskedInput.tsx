import * as React from 'react';
import { useMemo } from 'react';
import { InputRef } from 'antd';
import Input, { InputProps } from 'antd/lib/input';
import IMask from 'imask';

export interface MaskedInputProps
  extends Omit<InputProps, 'onChange' | 'value' | 'defaultValue'> {
  mask: MaskType;
  definitions?: InputMaskOptions['definitions'];
  value?: string;
  defaultValue?: string;
  maskOptions?: InputMaskOptions;
  onChange?: (event: OnChangeEvent) => any;
}

export { IMask };

const KEY_PRESS_EVENT = keyPressPropName();

export const MaskedInput = React.forwardRef<InputRef, MaskedInputProps>(
  function MaskedInput(props: MaskedInputProps, antdRef) {
    const {
      mask,
      maskOptions: _maskOptions,
      value: _value,
      defaultValue,
      onChange,
      definitions,
      ...antdProps
    } = props;

    const innerRef = React.useRef<HTMLInputElement | null>(null);

    const maskOptions = useMemo(() => {
      return {
        mask,
        definitions: {
          '0': /[0-9]/,
          // @ts-ignore
          ..._maskOptions?.definitions,
          ...definitions,
        },
        lazy: false, // make placeholder always visible
        ..._maskOptions,
      } as IMaskOptions;
    }, [_maskOptions, definitions, mask]);

    const placeholder = useMemo(() => {
      return IMask.createPipe({ ...maskOptions, lazy: false } as any)('');
    }, [maskOptions]);

    const imask = React.useRef<IMask.InputMask<any> | null>(null);

    const propValue =
      (typeof _value === 'string' ? _value : defaultValue) || '';

    const lastValue = React.useRef(propValue);

    const [value, setValue] = React.useState(propValue);

    const _onEvent = React.useCallback(
      (ev: any, callOnChangeProps = false) => {
        const masked = imask.current;
        if (!masked) return;

        if (ev.target) {
          if (ev.target.value !== masked.value) {
            masked.value = ev.target.value;
            ev.target.value = masked.value;
            lastValue.current = masked.value;
          }
        }

        Object.assign(ev, {
          maskedValue: masked.value,
          unmaskedValue: masked.unmaskedValue,
        });

        masked.updateValue();
        setValue(lastValue.current);

        if (callOnChangeProps) {
          onChange?.(ev);
        }
      },
      [onChange]
    );

    const _onAccept = React.useCallback(
      (ev: any) => {
        if (!ev?.target) return;

        const input = innerRef.current;
        const masked = imask.current;
        if (!input || !masked) return;

        ev.target.value = masked.value;
        input.value = masked.value;
        lastValue.current = masked.value;

        _onEvent(ev, true);
      },
      [_onEvent]
    );

    const updateMaskRef = React.useCallback(() => {
      const input = innerRef.current;

      if (imask.current) {
        imask.current.updateOptions(maskOptions as any);
      }

      if (!imask.current && input) {
        imask.current = IMask<any>(input, maskOptions);
        imask.current.on('accept', _onAccept);
      }

      if (imask.current && imask.current.value !== lastValue.current) {
        imask.current.value = lastValue.current;
        imask.current.alignCursor();
      }
    }, [_onAccept, maskOptions]);

    function updateValue(value: string) {
      lastValue.current = value;
      const input = innerRef.current;
      const masked = imask.current;
      if (!(input && masked)) return;
      masked.value = value;
      // updating value with the masked
      //   version (imask.value has a setter that triggers masking)
      input.value = masked.value;
      lastValue.current = masked.value;
    }

    React.useEffect(() => {
      updateMaskRef();

      return () => {
        imask.current?.destroy();
        imask.current = null;
      };
    }, [mask, updateMaskRef]);

    React.useEffect(() => {
      updateValue(propValue);
    }, [propValue]);

    const eventHandlers = React.useMemo(() => {
      return {
        onBlur(ev: any) {
          _onEvent(ev);
          props.onBlur?.(ev);
        },

        onPaste(ev: React.ClipboardEvent<HTMLInputElement>) {
          lastValue.current = ev.clipboardData?.getData('text');

          if (ev.target) {
            // @ts-ignore
            ev.target.value = lastValue.current;
          }

          _onEvent(ev, true);
          props.onPaste?.(ev);
        },

        onFocus(ev: any) {
          _onEvent(ev);
          props.onFocus?.(ev);
        },

        [KEY_PRESS_EVENT]: (ev: any) => {
          _onEvent(ev, true);
          props[KEY_PRESS_EVENT]?.(ev);
        },
      };
    }, [_onEvent, props]);

    return (
      <Input
        placeholder={placeholder}
        {...antdProps}
        {...eventHandlers}
        onChange={(ev) => _onEvent(ev, true)}
        value={value}
        ref={function handleInputMask(ref) {
          if (antdRef) {
            if (typeof antdRef === 'function') {
              antdRef(ref);
            } else {
              antdRef.current = ref;
            }
          }

          if (ref?.input) {
            innerRef.current = ref.input;
            if (!imask.current) {
              updateMaskRef();
            }
          }
        }}
      />
    );
  }
);

function keyPressPropName() {
  if (typeof navigator !== 'undefined') {
    return navigator.userAgent.match(/Android/i)
      ? 'onBeforeInput'
      : 'onKeyPress';
  }
  return 'onKeyPress';
}

export default MaskedInput;

export type UnionToIntersection<T> = (
  T extends any ? (x: T) => any : never
) extends (x: infer R) => any
  ? {
      [K in keyof R]: R[K];
    }
  : never;

type OnChangeParam = Parameters<Exclude<InputProps['onChange'], undefined>>[0];

interface OnChangeEvent extends OnChangeParam {
  maskedValue: string;
  unmaskedValue: string;
}

interface IMaskOptionsBase
  extends UnionToIntersection<IMask.AnyMaskedOptions> {}

export type InputMaskOptions = {
  [K in keyof IMaskOptionsBase]?: IMaskOptionsBase[K];
};

type MaskFieldType = string | RegExp | Function | Date | InputMaskOptions;

interface IMaskOptions extends Omit<InputMaskOptions, 'mask'> {
  mask: MaskFieldType;
}

interface MaskOptionsList extends Array<IMaskOptions> {}

export type MaskType = MaskFieldType | MaskOptionsList;
