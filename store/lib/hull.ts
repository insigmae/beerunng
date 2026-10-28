// The thread sculpture: one object whose shadow is B on the back wall, R on the side wall and the ३ on
// the floor (the Gödel–Escher–Bach shadow trick). The lamp lights the back wall, your light the side wall;
// when both are lifted overhead they become one light and the floor shows the ३.
//
// Grid axes: x (X cells), y (Y cells, row 0 = top), z (Z cells, row 0 = far / back wall).
//   B is read on the back wall:  column = x,          row = y
//   R is read on the side wall:  column = Z - 1 - z,  row = y   (from inside the room, right is -z)
//   ३ is read on the floor:      column = x,          row = z   (turned 180°, read from overhead)
// With these orientations each shadow covers ~99% of its letter (measured; other layouts drop to ~80%).

export type Glyph = { w: number; h: number; ink: Uint8Array }; // row 0 = top

const SRC = 512;

/** Draw something white on black, crop to its ink, stretch it to fill a w × h grid. */
export function rasterize(draw: (ctx: CanvasRenderingContext2D, size: number) => void, w: number, h: number): Glyph {
  const big = document.createElement('canvas');
  big.width = big.height = SRC;
  const b = big.getContext('2d', { willReadFrequently: true })!;
  b.fillStyle = '#000';
  b.fillRect(0, 0, SRC, SRC);
  b.fillStyle = '#fff';
  draw(b, SRC);
  const px = b.getImageData(0, 0, SRC, SRC).data;
  let x0 = SRC, y0 = SRC, x1 = 0, y1 = 0;
  for (let y = 0; y < SRC; y++)
    for (let x = 0; x < SRC; x++)
      if (px[(y * SRC + x) * 4] > 127) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }

  const small = document.createElement('canvas');
  small.width = w; small.height = h;
  const s = small.getContext('2d', { willReadFrequently: true })!;
  s.fillStyle = '#000';
  s.fillRect(0, 0, w, h);
  // Stretch to the full box: the shadows only complete each other when every row and column holds ink.
  s.drawImage(big, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 0, 0, w, h);
  const d = s.getImageData(0, 0, w, h).data;
  const ink = new Uint8Array(w * h);
  for (let i = 0; i < ink.length; i++) ink[i] = d[i * 4] > 127 ? 1 : 0;
  return { w, h, ink };
}

/**
 * Carve the sculpture. Returns thread runs along x as [xCentre, y, z, length] in world units
 * (centred on the origin), plus how much of each letter its shadow covers (1 = all of it).
 */
export function carve(g: { B: Glyph; R: Glyph; T: Glyph }, cell: number) {
  const X = g.B.w, Y = g.B.h, Z = g.R.w;
  const inside = (i: number, j: number, k: number) =>
    g.B.ink[j * X + i] === 1 && g.R.ink[j * Z + (Z - 1 - k)] === 1 && g.T.ink[k * X + i] === 1;

  const runs: number[] = [];
  const hit = { B: new Uint8Array(X * Y), R: new Uint8Array(Z * Y), T: new Uint8Array(X * Z) };
  for (let j = 0; j < Y; j++) {
    const y = (Y / 2 - j - 0.5) * cell;
    for (let k = 0; k < Z; k++) {
      const z = (k - Z / 2 + 0.5) * cell;
      let start = -1;
      for (let i = 0; i <= X; i++) {
        const on = i < X && inside(i, j, k);
        if (on) {
          hit.B[j * X + i] = hit.R[j * Z + (Z - 1 - k)] = hit.T[k * X + i] = 1;
          if (start < 0) start = i;
        } else if (start >= 0) {
          runs.push(((start + i) / 2 - X / 2) * cell, y, z, (i - start) * cell);
          start = -1;
        }
      }
    }
  }
  const cover = (gl: Glyph, h: Uint8Array) => {
    let ink = 0, got = 0;
    for (let i = 0; i < gl.ink.length; i++) if (gl.ink[i]) { ink++; got += h[i]; }
    return got / ink;
  };
  return { runs: new Float32Array(runs), cover: { B: cover(g.B, hit.B), R: cover(g.R, hit.R), T: cover(g.T, hit.T) } };
}
