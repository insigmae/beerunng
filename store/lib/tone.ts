// Is this point of the screen over a Pine Grove section? Header and cursor flip to Off-white there.
export const onDark = (x: number, y: number) =>
  document.elementsFromPoint(x, y).some((el) => (el as HTMLElement).dataset?.tone === 'dark');
