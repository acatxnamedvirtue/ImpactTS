export class plusplusUtilsMath {
  static GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

  static TWOPI = Math.PI * 2;

  static HALFPI = Math.PI * 0.5;

  static clamp(n: number, min: number, max: number): number {
    return Math.min(Math.max(n, min), max);
  }

  static map(n: number, istart: number, istop: number, ostart: number, ostop: number): number {
    return ostart + (ostop - ostart) * ((n - istart) / (istop - istart));
  }

  static degreesToRadians(n: number): number {
    return (n / 180) * Math.PI;
  }

  static radiansToDegrees(n: number): number {
    return (n * 180) / Math.PI;
  }

  static almostEqual(a: number, b: number, threshold: number): boolean {
    if (a === b) return true;
    else {
      const d = b - a;

      return d > 0 ? d < threshold : d > -threshold;
    }
  }

  static oppositeSidesOfZero(a: number, b: number): boolean {
    return (a < 0 && b > 0) || (a > 0 && b < 0);
  }

  static direction(n: number): 0 | -1 | 1 {
    return n === 0 ? 0 : n < 0 ? -1 : 1;
  }

  static directionChange(a: number, b: number): boolean {
    return (a === 0 && b !== 0) || (a !== 0 && b === 0) || plusplusUtilsMath.oppositeSidesOfZero(a, b);
  }
}
