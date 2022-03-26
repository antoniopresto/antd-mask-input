/**
 * @jest-environment jsdom
 */
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { Form, FormInstance } from 'antd';
import React from 'react';

import MaskedInput from './MaskedInput';

describe('MaskedInput', () => {
  afterEach(async () => {
    await cleanup();
  });

  it('should render correctly', async () => {
    const { container } = render(
      <MaskedInput mask={'111.111.111.111'} value="192.16.1.5" />
    );

    const sut = container.querySelector('input');
    expect(sut).toBeTruthy();
  });

  test('should handle a masking workflow', () => {
    const { container } = render(<MaskedInput mask={'00/00'} value="123" />);

    const sut = container.querySelector('input')!;
    expect(sut).toBeTruthy();
    expect(sut.value).toBe('12/3_');
    expect(sut.placeholder).toBe('__/__');
  });

  test('should handle updating mask', () => {
    let defaultMask = '0000 0000 0000 0000';
    let amexMask = '0000 000000 00000';

    const { container, rerender } = render(<MaskedInput mask={defaultMask} />);
    let input = container.querySelector('input')!;

    expect(input.value).toBe('____ ____ ____ ____');
    expect(input.placeholder).toBe('____ ____ ____ ____');

    rerender(<MaskedInput mask={amexMask} />);

    input = container.querySelector('input')!;

    expect(input.value).toBe('____ ______ _____');
    expect(input.placeholder).toBe('____ ______ _____');
  });

  test('should handle updating value', () => {

    let defaultMask = '0000 0000 0000 0000';

    const { container, rerender } = render(
      <MaskedInput mask={defaultMask} value="" />
    );

    let input = container.querySelector('input')!;

    expect(input.value).toBe('____ ____ ____ ____');
    expect(input.placeholder).toBe('____ ____ ____ ____');

    rerender(
      <MaskedInput
        mask={defaultMask}
        value="4000000000000111"
      />
    );

    input = container.querySelector('input')!;

    expect(input.value).toBe('4000 0000 0000 0111');
  });

  test('should handle updating mask and value', () => {
    let defaultMask = '0000 0000 0000 0000';

    const { container, rerender } = render(
      <MaskedInput mask={defaultMask} value="" />
    );

    let input = container.querySelector('input')!;

    expect(input.value).toBe('____ ____ ____ ____');
    expect(input.placeholder).toBe('____ ____ ____ ____');

    rerender(<MaskedInput mask={'00/00/0000'} value="11221990" />);

    input = container.querySelector('input')!;

    expect(input.value).toBe('11/22/1990');
  });

  test('should remove leftover placeholder characters when switching to smaller mask', () => {
    let defaultMask = '0000 0000 0000 0000';
    let amexMask = '0000 000000 00000';
    let mask = defaultMask;
    let value = null;

    const { container, rerender } = render(
      <MaskedInput mask={mask} value="" />
    );

    let input = container.querySelector('input')!;

    expect(input.value).toBe('____ ____ ____ ____');
    expect(input.placeholder).toBe('____ ____ ____ ____');

    mask = amexMask;
    value = '1234 123456 12345';
    rerender(<MaskedInput mask={mask} value={value} />);

    input = container.querySelector('input')!;

    expect(input.value).toBe('1234 123456 12345');
  });

  test('should work with getFieldDecorator', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    let ref: FormInstance<any> | undefined;

    const Comp = ({ mask, initialValue }: any) => (
      <Form ref={(val) => (ref = val || undefined)}>
        <Form.Item
          label="Username"
          name="username"
          initialValue={initialValue}
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <MaskedInput mask={mask} />
        </Form.Item>
      </Form>
    );

    let { container } = render(
      <Comp mask={'00/00/0000'} initialValue={'33'} />
    );

    let input = container.querySelector('input')!;

    // expect(input.value).toBe('33/__/____');
    // expect(input.placeholder).toBe('__/__/____');
    // expect(ref?.getFieldValue('username')).toBe('33');

    act(() => {
      fireEvent.change(input, { target: { value: '1122334' } });
    });

    expect(input.value).toBe('11/22/334_');
    // expect(input.placeholder).toBe('__/__/____');

    expect(ref?.getFieldValue('username')).toBe('11/22/334_');
  });

  test('should include masked and unmaskedValue on change', () => {
    let onChange = jest.fn();

    let { container } = render(
      <MaskedInput mask={'00/00/0000'} value={'33'} onChange={onChange} />
    );

    let input = container.querySelector('input')!;

    act(() => {
      fireEvent.change(input, { target: { value: '1122334' } });
    });

    expect(onChange).toBeCalledWith(
      expect.objectContaining({
        unmaskedValue: '1122334',
        maskedValue: '11/22/334_',
      })
    );
  });
});
