/** Minimum password length */
export const MIN_PASSWORD_LENGTH = 8;

/** Validate a password meets complexity requirements.
 *  Returns null if valid, or an error message string. */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
  }
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra mayúscula';
  }
  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra minúscula';
  }
  if (!/\d/.test(password)) {
    return 'La contraseña debe incluir al menos un número';
  }
  return null;
}

/** Human-readable hint for password input placeholders */
export const PASSWORD_HINT = 'Min. 8 car., mayúsc., minúsc. y número';
