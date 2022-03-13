import IMask, { AnyMaskedOptions, InputMask } from 'imask';
import { useEffect, useCallback, useState, useRef, useMemo } from 'react';

export type MaskOptions = AnyMaskedOptions & {
  initialValue?: string;
  onChange: (value: InputEvent) => any;
};

export function useMask(opts: MaskOptions) {
  const { initialValue } = opts || {};

  const ref = useRef<HTMLInputElement | null>(null);
  const maskRef = useRef<InputMask<{ mask: string }> | null>(null);
  const [displayValue, _setDisplayValue] = useState('');

  const config = useMemo(() => {
    const { initialValue, onChange, ...cleanOptions } = opts || {};

    return {
      definitions: {
        '0': /[0-9]/,
        // @ts-ignore
        ...cleanOptions?.definitions
      },
      lazy: false, // make placeholder always visible
      ...cleanOptions
    };
  }, [opts.mask, opts.initialValue]);

  const placeholder = useMemo(() => {
    return IMask.createPipe({ ...config, lazy: false })('');
  }, [config]);

  useEffect(() => {
    const el = ref.current;

    if (!el || !opts?.mask) {
      return _destroyMask();
    }

    const mask = maskRef.current;

    if (!mask) {
      if (el && opts?.mask) {
        const mask = IMask(el, config) as any;

        if (opts.initialValue) {
          mask.value = opts.initialValue;
        }

        maskRef.current = mask;
      }
    } else {
      mask.updateOptions(opts);
    }
  }, [opts.mask, opts.initialValue]);

  useEffect(() => {
    const mask = maskRef.current;
    if (mask) {
      mask.value = initialValue || '';
    }
  }, [initialValue]);

  const _destroyMask = useCallback(() => {
    maskRef.current?.destroy();
    maskRef.current = null;
  }, []);

  const _onAccept = useCallback((inputEvent: InputEvent) => {
    const mask = maskRef.current;

    if (!mask) return;
    if (mask.value !== displayValue) {
      _setDisplayValue(mask.value);
    }

    // if (opts.onChange) {
    //   const maskedValue = mask.value;
    //   const unmaskedValue = mask.unmaskedValue;
    //   if (maskedValue !== undefined && unmaskedValue !== undefined) {
    //     Object.assign(inputEvent, { maskedValue, unmaskedValue });
    //     opts.onChange(inputEvent);
    //   }
    // }
  }, []);

  useEffect(() => {
    if (!maskRef.current) return;
    const mask = maskRef.current;
    mask.on('accept', _onAccept);
    return () => {
      mask.off('accept', _onAccept);
    };
  }, []);

  useEffect(() => {
    return () => {
      // debugger
      _destroyMask();
    };
  }, [_destroyMask]);

  function setValue(value: string) {
    const mask = maskRef.current;
    if (mask) {
      if (mask.unmaskedValue !== value) {
        mask.value = value;
      }
    }
    _setDisplayValue(mask?.value || '');
  }

  return {
    ref,
    value: displayValue,
    setValue,
    placeholder
  };
}
