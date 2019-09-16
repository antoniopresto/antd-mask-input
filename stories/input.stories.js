import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { MaskedInput } from '../src';

const stories = storiesOf('Components', module);

stories.add('MaskedInput', () => <MaskedInput mask={'111.111.111-11'} />);
