import { describe, it, expect } from 'vitest';
import { validatePassword, MIN_PASSWORD_LENGTH } from './passwordValidation';

describe('validatePassword', () => {
  it('rejects passwords shorter than minimum length', () => {
    expect(validatePassword('Ab1')).toContain(`${MIN_PASSWORD_LENGTH}`);
    expect(validatePassword('Abc1234')).toContain(`${MIN_PASSWORD_LENGTH}`);
  });

  it('rejects passwords without uppercase', () => {
    expect(validatePassword('abcdefg1')).toContain('mayúscula');
  });

  it('rejects passwords without lowercase', () => {
    expect(validatePassword('ABCDEFG1')).toContain('minúscula');
  });

  it('rejects passwords without a digit', () => {
    expect(validatePassword('Abcdefgh')).toContain('número');
  });

  it('accepts a valid password', () => {
    expect(validatePassword('Abcdefg1')).toBeNull();
    expect(validatePassword('StrongPass99')).toBeNull();
  });
});
