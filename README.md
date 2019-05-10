# antd-mask-input

A [Ant Design Input](https://ant.design/components/input/) component for `<input>` masking, built on top of [inputmask-core](https://github.com/insin/inputmask-core).

## Install

### npm

```
npm install antd-mask-input --save
```

## Usage

Give `MaskedInput` a [`mask`](#mask-string):

```javascript
import React from 'react'
import MaskedInput from 'antd-mask-input'

class CreditCardDetails extends React.Component {
  state = {
    card: '',
    expiry: '',
    ccv: ''
  }

  _onChange = (e) => {
    this.setState({[e.target.name]: e.target.value})
  }

  render() {
    return <div className="CreditCardDetails">
      <label>
        Card Number:{' '}
        <MaskedInput mask="1111 1111 1111 1111" name="card" size="20" onChange={this._onChange}/>
      </label>
      <label>
        Expiry Date:{' '}
        <MaskedInput mask="11/1111" name="expiry" placeholder="mm/yyyy" onChange={this._onChange}/>
      </label>
      <label>
        CCV:{' '}
        <MaskedInput mask="111" name="ccv" onChange={this._onChange}/>
      </label>
    </div>
  }
}
```

Create some wrapper components if you have a masking configuration which will be reused:

```javascript
function CustomInput(props) {
  return <MaskedInput
    mask="1111-WW-11"
    placeholder="1234-WW-12"
    size="11"
    {...props}
    formatCharacters={{
      'W': {
        validate(char) { return /\w/.test(char ) },
        transform(char) { return char.toUpperCase() }
      }
    }}
  />
}
```

## Props

### `mask` : `string`

The masking pattern to be applied to the `<input>`.

See the [inputmask-core docs](https://github.com/insin/inputmask-core#pattern) for supported formatting characters.

### `onChange` : `(event: SyntheticEvent) => any`

A callback which will be called any time the mask's value changes.

This will be passed a `SyntheticEvent` with the input accessible via `event.target` as usual.

**Note:** this component currently calls `onChange` directly, it does not generate an `onChange` event which will bubble up like a regular `<input>` component, so you *must* pass an `onChange` if you want to get a value back out.

### `formatCharacters`: `Object`

Customised format character definitions for use in the pattern.

See the [inputmask-core docs](https://github.com/insin/inputmask-core#formatcharacters) for details of the structure of this object.

### `placeholderChar`: `string`

Customised placeholder character used to fill in editable parts of the pattern.

See the [inputmask-core docs](https://github.com/insin/inputmask-core#placeholderchar--string) for details.

### Other props

See [Ant Design Input](https://ant.design/components/input/)

## MIT Licensed
