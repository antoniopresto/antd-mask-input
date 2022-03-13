import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { MaskedInput, IMask } from '../src';
import { Form } from 'antd';
import { MaskType } from '../src/lib/MaskedInput';

const stories = storiesOf('Components', module);

const cellphoneMask = '(00) 0 0000-0000';
const phoneMask = '(00) 0000-0000';

const DynamicPhone = (props: any) => {
  // always memoize not string masks
  const mask = React.useMemo(
    () => [
      {
        mask: cellphoneMask,
        lazy: false,
      },
      {
        mask: phoneMask,
        lazy: false,
      },
    ],
    []
  );

  return (
    <MaskedInput
      {...props}
      mask={mask}
      maskOptions={{
        dispatch: function (appended, dynamicMasked) {
          const isCellPhone = dynamicMasked.unmaskedValue[2] === '9';
          return dynamicMasked.compiledMasks[isCellPhone ? 0 : 1];
        },
      }}
    />
  );
};

stories.add('Dynamic Mask', () => <DynamicPhone />);

stories.add('RGB', () => {
  const mask = React.useMemo<MaskType>(() => {
    return [
      {
        mask: 'RGB,RGB,RGB',
        blocks: {
          RGB: {
            mask: IMask.MaskedRange,
            from: 0,
            to: 255,
          },
        },
      },
      {
        mask: /^#[0-9a-f]{0,6}$/i,
      },
    ];
  }, []);

  return (
    <>
      <MaskedInput mask={mask} />
    </>
  );
});

//  https://imask.js.org/guide.html#masked-pattern
const DUMB_IP_MASK = '0[0][0].0[0][0].0[0][0].0[0][0]';

stories.add('IP', () => (
  <MaskedInput
    mask={DUMB_IP_MASK}
    value="192.16.1.5" //
  />
));

stories.add('Phone', () => (
  <>
    <MaskedInput mask={'+55(00)0000-0000'} />
  </>
));

stories.add('AMEX', () => (
  <>
    <MaskedInput mask={'0000 000000 00000'} />
  </>
));

window.formRef = {};

stories.add('Form', () => (
  <Form ref={(val) => (window.formRef = val)}>
    <Form.Item
      label="Username"
      name="username"
      initialValue={'123'}
      rules={[{ required: true, message: 'Please input your username!' }]}
    >
      <DynamicPhone />
    </Form.Item>

    <button>Go</button>
  </Form>
));

declare global {
  interface Window {
    formRef: any;
  }
}
