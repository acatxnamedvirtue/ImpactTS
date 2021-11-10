export class igMap {
  tilesize = 8;
  width = 1;
  height = 1;
  pxWidth = 1;
  pxHeight = 1;
  data: number[][] = [];
  name: string;

  constructor(tilesize: number, data: number[][]) {
    this.tilesize = tilesize;
    this.data = data;
    this.height = this.data?.length;
    this.width = this.data?.[0]?.length;

    this.pxWidth = this.width * this.tilesize;
    this.pxHeight = this.height * this.tilesize;
  }

  getTile(x: number, y: number): number {
    const tx = Math.floor(x / this.tilesize);
    const ty = Math.floor(y / this.tilesize);

    return this.data?.[ty]?.[tx] ?? 0;
  }

  setTile(x: number, y: number, tile: number): void {
    const tx = Math.floor(x / this.tilesize);
    const ty = Math.floor(y / this.tilesize);

    if (tx >= 0 && tx < this.width && ty >= 0 && ty < this.height) {
      this.data[ty][tx] = tile;
    }
  }
}
