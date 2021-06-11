import * as React from 'react';
import useForm from './';
import { act } from 'react-dom/test-utils';
import attachEventListeners from './logic/attachEventListeners';
import getFieldsValues from './logic/getFieldsValues';
import findRemovedFieldAndRemoveListener from './logic/findRemovedFieldAndRemoveListener';
import validateWithSchema from './logic/validateWithSchema';
import validateField from './logic/validateField';
import onDomRemove from './utils/onDomRemove';
import { mount } from 'enzyme';

jest.mock('./utils/onDomRemove');
jest.mock('./logic/findRemovedFieldAndRemoveListener');
jest.mock('./logic/validateField');
jest.mock('./logic/attachEventListeners');
jest.mock('./logic/getFieldsValues');
jest.mock('./logic/validateWithSchema');

const TestHook = ({ callback }) => {
  const { errors } = callback();
  return errors ? <div>errors</div> : null;
};

const testComponent = callback => {
  mount(<TestHook callback={callback} />);
};

let hookForm;
let hookFormWithValidationSchema;

describe('useForm', () => {
  beforeEach(() => {
    testComponent(() => {
      hookForm = useForm();
      return hookForm;
    });

    testComponent(() => {
      hookFormWithValidationSchema = useForm({
        mode: 'onSubmit',
        validationSchema: {},
      });
      return hookFormWithValidationSchema;
    });

    jest.resetAllMocks();
  });

  describe('register', () => {
    it('should return undefined when ref is undefined', () => {
      expect(hookForm.register(undefined)).toBeUndefined();
    });

    it('should return undefined when ref name is missing', () => {
      expect(hookForm.register({ type: 'input' }, {})).toBeUndefined();
    });

    it('should register field and call attachEventListeners method', () => {
      hookForm.register({ type: 'input', name: 'test' });
      expect(attachEventListeners).toBeCalledWith({
        field: {
          mutationWatcher: undefined,
          ref: {
            name: 'test',
            type: 'input',
          },
        },
        isRadio: false,
        validateAndStateUpdate: expect.any(Function),
      });
      expect(onDomRemove).toBeCalled();
    });

    it('should register field for radio type and call attachEventListeners method', () => {
      hookForm.register({ type: 'radio', name: 'test' });
      expect(attachEventListeners).toBeCalledWith({
        field: {
          mutationWatcher: undefined,
          ref: {
            name: 'test',
            type: 'radio',
          },
        },
        isRadio: true,
        validateAndStateUpdate: expect.any(Function),
      });
      expect(onDomRemove).toBeCalled();
    });
  });

  describe('watch', () => {
    it('should watch individual input', () => {
      expect(hookForm.watch('test')).toBeUndefined();
      // @ts-ignore
      getFieldsValues.mockImplementation((_, name) => {
        if (name === 'test') {
          return 'data';
        }
      });
      expect(hookForm.watch('test')).toBe('data');
    });

    it('should watch array of inputs', () => {
      expect(hookForm.watch(['test', 'test1'])).toBeUndefined();
      // @ts-ignore
      getFieldsValues.mockImplementation((_, name) => {
        if (name && name.includes('test1') && name.includes('test')) {
          return ['data1', 'data2'];
        }
      });
      expect(hookForm.watch(['test', 'test1'])).toEqual(['data1', 'data2']);
    });

    it('should watch every fields', () => {
      expect(hookForm.watch()).toBeUndefined();
      // @ts-ignore
      getFieldsValues.mockImplementation((_, name) => {
        if (name === undefined) {
          return ['data1', 'data2'];
        }
      });
      expect(hookForm.watch()).toEqual(['data1', 'data2']);
    });
  });

  describe('unSubscribe', () => {
    it('should remove all reference when mode change', () => {
      hookForm.register({ type: 'input', name: 'test' });
      hookForm.register({
        type: 'radio',
        name: 'test1',
        options: [{ type: 'radio', name: 'test3' }, { type: 'radio', name: 'test4' }],
      });
      expect(attachEventListeners).toBeCalledWith({
        field: {
          mutationWatcher: undefined,
          ref: {
            name: 'test',
            type: 'input',
          },
        },
        isRadio: false,
        validateAndStateUpdate: expect.any(Function),
      });
      hookForm.register({ type: 'input', name: 'test' });
      act(() => {
        hookForm.unSubscribe();
      });
      expect(findRemovedFieldAndRemoveListener).toBeCalled();
      hookForm.register({ type: 'input', name: 'test' });
      expect(attachEventListeners).toBeCalledTimes(3);
    });
  });

  describe('handleSubmit', () => {
    it('should invoke the callback when validation pass', async () => {
      const callback = jest.fn();
      const preventDefault = jest.fn();
      const persist = jest.fn();
      await hookForm.handleSubmit(callback)({
        preventDefault,
        persist,
      });
      expect(callback).toBeCalled();
    });

    it('should not invoke callback when there are errors', async () => {
      hookForm.register({ value: '', type: 'input', name: 'test' }, { required: true });
      const callback = jest.fn();
      // @ts-ignore
      validateField.mockImplementation(async () => {
        return { test: { type: 'test' } };
      });
      const test = hookForm.handleSubmit(callback);
      await test({
        preventDefault: () => {},
        persist: () => {},
      });
      expect(callback).not.toBeCalled();
    });
  });

  describe('handleSubmit with validationSchema', () => {
    it('should invoke callback when error not found', async () => {
      hookFormWithValidationSchema.register({ value: '', type: 'input', name: 'test' }, { required: true });
      const callback = jest.fn();
      // @ts-ignore
      getFieldsValues.mockImplementation(async () => {
        return { test: 'test' };
      });
      // @ts-ignore
      validateWithSchema.mockImplementation(async () => {
        return {};
      });
      await hookFormWithValidationSchema.handleSubmit(callback)({
        preventDefault: () => {},
        persist: () => {},
      });
      expect(callback).toBeCalled();
    });
  });
});
