import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { MaskedInput } from '../src';

const stories = storiesOf('Components', module);

stories.add('MaskedInput', () => (
  <>
    <MaskedInput mask={'(11)1111-1111'} />
  </>
));
