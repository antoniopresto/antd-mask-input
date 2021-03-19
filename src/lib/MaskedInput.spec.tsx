import test from 'ava';
import React from 'react';
import ReactDOM from 'react-dom';
import Adapter from 'enzyme-adapter-react-16';
import { configure, mount } from 'enzyme';
import MaskedInput, { MaskedInputProps } from './MaskedInput';
import { Form } from 'antd';
import { WrappedFormUtils } from 'antd/lib/form/Form';

require('jsdom-global/register');

configure({ adapter: new Adapter() });

test.beforeEach(() => {
  ReactDOM.unmountComponentAtNode(document.body);
  document.body.innerText = '';
});

function mountComponent(props: Partial<MaskedInputProps>) {
  const component = React.createElement(MaskedInput, props as any);
  return mount(component);
}

test('should require mask', t => {
  t.throws(() => {
    mountComponent({});
  }, 'InputMask: you must provide a pattern.');
});

test('should handle a masking workflow', t => {
  const input = mountComponent({ mask: '11/11', value: '123' }).getDOMNode<
    HTMLInputElement
  >();
  t.is(input.className, 'ant-input');
  t.is(input.value, '12/3_');
  t.is(input.placeholder, '__/__');
});

test('should handle updating mask', t => {
  let defaultMask = '1111 1111 1111 1111';
  let amexMask = '1111 111111 11111';

  let component = mountComponent({ mask: defaultMask });
  let input = component.getDOMNode<HTMLInputElement>();

  t.deepEqual(input.value, '');
  t.is(input.placeholder, '____ ____ ____ ____');
  t.deepEqual(input.selectionStart, 0);

  component.setProps({ mask: amexMask });
  component.update();

  t.is(input.placeholder, '____ ______ _____');
  t.deepEqual(input.value, '');
  t.deepEqual(input.selectionStart, 0);
});

test('should handle updating value', t => {
  let ref: MaskedInput = null;
  let defaultMask = '1111 1111 1111 1111';

  function render(props: MaskedInputProps) {
    ReactDOM.render(
      React.createElement(MaskedInput, { ...props, ref: r => (ref = r) }),
      document.body
    );
  }

  render({ mask: defaultMask, value: '' });
  let input: HTMLInputElement = ReactDOM.findDOMNode(ref);

  // initial state
  t.deepEqual(input.value, '');

  t.deepEqual(input.placeholder, '____ ____ ____ ____');
  t.deepEqual(input.selectionStart, 0);

  // update value
  render({ mask: defaultMask, value: '4111111111111111' });
  input = ReactDOM.findDOMNode(ref);

  // initial state
  t.deepEqual(input.value, '4111 1111 1111 1111');
});

test('should handle updating mask and value', t => {
  let ref: MaskedInput = null;
  let defaultMask = '1111 1111 1111 1111';

  function render(props: MaskedInputProps) {
    ReactDOM.render(
      React.createElement(MaskedInput, { ...props, ref: r => (ref = r) }),
      document.body
    );
  }

  render({ mask: defaultMask, value: '' });
  let input: HTMLInputElement = ReactDOM.findDOMNode(ref);

  // initial state
  t.deepEqual(input.value, '');

  t.deepEqual(input.placeholder, '____ ____ ____ ____');
  t.deepEqual(input.selectionStart, 0);

  // update value
  render({ mask: defaultMask, value: '4111111111111111' });
  input = ReactDOM.findDOMNode(ref);

  t.deepEqual(input.value, '4111 1111 1111 1111');

  render({ mask: '11/11/1111', value: '25091989' });
  input = ReactDOM.findDOMNode(ref);

  t.deepEqual(ref.state._Input.state.value, '25/09/1989');
  t.deepEqual(input.value, '25/09/1989');
});

test('should remove leftover placeholder characters when switching to smaller mask', t => {
  let ref = null;
  let defaultMask = '1111 1111 1111 1111';
  let amexMask = '1111 111111 11111';
  let mask = defaultMask;
  let value = null;

  function render() {
    ReactDOM.render(
      React.createElement(MaskedInput, { mask, value, ref: r => (ref = r) }),
      document.body
    );
  }

  render();
  let input = ReactDOM.findDOMNode(ref);

  // initial state
  t.deepEqual(input.value, '');
  t.deepEqual(input.placeholder, '____ ____ ____ ____');
  t.deepEqual(input.maxLength, 19);
  t.deepEqual(input.selectionStart, 0);

  mask = amexMask;
  value = '1234 123456 12345';
  render();
  input = ReactDOM.findDOMNode(ref);

  // initial state
  t.deepEqual(input.value, '1234 123456 12345');
  t.deepEqual(input.maxLength, 17);
});

test('cleans props from input', t => {
  let ref = null;
  let defaultMask = '1111 1111 1111 1111';

  function render(props: MaskedInputProps) {
    ReactDOM.render(
      React.createElement(MaskedInput, { ...props, ref: r => (ref = r) }),
      document.body
    );
  }

  render({
    mask: defaultMask,
    value: '',
    placeholderChar: 'X',
    formatCharacters: { A: null }
  });

  let input = ReactDOM.findDOMNode(ref);
  t.deepEqual(input.getAttribute('placeholderChar'), null);
  t.deepEqual(input.getAttribute('formatCharacters'), null);
});

test('should handle updating multiple values', t => {
  let ref = null;
  let defaultMask = '1111 1111 1111 1111';
  const mastercard = '5555555555554444';
  const visa = '4111111111111111';

  function render(props: MaskedInputProps) {
    ReactDOM.render(
      React.createElement(MaskedInput, { ...props, ref: r => (ref = r) }),
      document.body
    );
  }

  render({ mask: defaultMask, value: '' });
  let input = ReactDOM.findDOMNode(ref);

  // initial state
  t.deepEqual(input.value, '');
  t.deepEqual(input.placeholder, '____ ____ ____ ____');
  t.deepEqual(input.maxLength, 19);

  // update mask and value
  render({ mask: defaultMask, value: visa });
  input = ReactDOM.findDOMNode(ref);

  // initial state
  t.deepEqual(input.value, '4111 1111 1111 1111');
  t.deepEqual(input.maxLength, 19);

  // update mask and value
  render({ mask: defaultMask, value: mastercard });
  input = ReactDOM.findDOMNode(ref);

  // initial state
  t.deepEqual(input.value, '5555 5555 5555 4444');
  t.deepEqual(input.maxLength, 19);
});

test('should work with getFieldDecoretor', t => {
  let el = mount(<MyForm mask={'11/11/1111'} />);
  let inputComponent = el.find('input');
  let input = inputComponent.getDOMNode<HTMLInputElement>();

  // initial state
  t.deepEqual(input.value, '');
  t.deepEqual(input.placeholder, '__/__/____');
  t.deepEqual(input.maxLength, 10);

  inputComponent.simulate('change', { target: { value: '2509190' } });
  input = inputComponent.getDOMNode<HTMLInputElement>();

  t.deepEqual(input.value, '25/09/190_');
  t.deepEqual(input.placeholder, '__/__/____');
  t.deepEqual(input.maxLength, 10);

  t.deepEqual(el.find('input').get(0).props.value, '25/09/190_');
});

class CustomComponent extends React.Component<{
  form: WrappedFormUtils<any>;
  mask: string;
}> {
  componentDidMount() {
    // To disabled submit button at the beginning.
    this.props.form.validateFields();
  }

  state = {};

  handleSubmit = (e: any) => {
    e.preventDefault();
    this.props.form.validateFields((error, values) => {
      this.setState({ error, values });
    });
  };

  render() {
    const { getFieldDecorator } = this.props.form;

    return (
      <form onSubmit={this.handleSubmit}>
        {getFieldDecorator('masked', {
          rules: [{ required: true, message: 'fill' }]
        })(<MaskedInput mask={this.props.mask} />)}
      </form>
    );
  }
}

const MyForm = Form.create({ name: 'horizontal_login' })(
  CustomComponent
) as any;
