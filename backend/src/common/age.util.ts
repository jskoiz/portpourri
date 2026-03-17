/**
 * Calculates age in whole years from a birthdate.
 * Returns null when the input is null or undefined.
 */
export function calculateAge(birthdate: Date | string | null | undefined): number | null {
  if (!birthdate) return null;
  const bd = typeof birthdate === 'string' ? new Date(birthdate) : birthdate;
  const today = new Date();
  let age = today.getFullYear() - bd.getFullYear();
  const m = today.getMonth() - bd.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) {
    age--;
  }
  return age;
}
