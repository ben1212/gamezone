// Generates deterministic 5x5 Bingo grid for a given Cartella ID (1-200)
export function generateCartellaGrid(cartellaId: number): number[][] {
  // Simple seeded pseudo-random number generator
  let seed = cartellaId * 9301 + 49297;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const pickN = (start: number, count: number, needed: number): number[] => {
    const nums: number[] = [];
    for (let i = start; i < start + count; i++) nums.push(i);
    // Shuffle
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }
    return nums.slice(0, needed);
  };

  const colB = pickN(1, 15, 5);
  const colI = pickN(16, 15, 5);
  const colN = pickN(31, 15, 4); // 4 numbers + 1 free space in middle
  const colG = pickN(46, 15, 5);
  const colO = pickN(61, 15, 5);

  const grid: number[][] = [];
  for (let r = 0; r < 5; r++) {
    const row: number[] = [
      colB[r],
      colI[r],
      r === 2 ? 0 : r > 2 ? colN[r - 1] : colN[r],
      colG[r],
      colO[r],
    ];
    grid.push(row);
  }

  return grid;
}
