# antd-mask-input

An [Ant Design Input](https://ant.design/components/input/) component for `<input>` masking, built on top of [imask](https://imask.js.org/guide.html).

> The version 2.0.0 Requires antd >= 4.19.0 - for previous versions use the version `0.1.15`

## Install

### npm

```
npm install antd-mask-input --save
```

## Usage

```ts
stories.add('Phone', () => (
  <>
    <MaskedInput
      mask={
        //  https://imask.js.org/guide.html#masked-pattern
        '+55(00)0000-0000'
      }
    />
  </>
));

stories.add('AMEX', () => (
  <>
    <MaskedInput mask={'0000 000000 00000'} />
  </>
));

const DynamicPhone = (props: any) => {
  const cellphoneMask = '(00) 0 0000-0000';
  const phoneMask = '(00) 0000-0000';

  // always memoize dynamic masks
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
```

## Props

### `mask`

```ts
type MaskType = string | RegExp | Date | Number; // See the https://imask.js.org/guide.html
```

### `onChange`

```ts
onChange: (
  event: SyntheticEvent & { maskedValue: string; unmaskedValue: string }
) => any;
```

### `maskOptions`:

see the type `InputMaskOptions`

### Other antd props

See [Ant Design Input](https://ant.design/components/input/)

### Other mask options

See [Imask options](https://imask.js.org/guide.html).

Note that this package is not intended to be fully compatible with imask, but the options are almost the same.

## MIT Licensed
