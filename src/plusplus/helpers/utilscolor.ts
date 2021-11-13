import { ig } from "../../impact/impact";

export type RGBA = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export class plusplusUtilsColor {
  static hexToRGBA(hex: number): RGBA {
    hex = Math.floor(hex);

    return {
      r: ((hex >> 24) & 255) / 255,
      g: ((hex >> 16) & 255) / 255,
      b: ((hex >> 8) & 255) / 255,
      a: (hex & 255) / 255,
    };
  }

  static RGBAToHex(r: number, g: number, b: number, a: number): number {
    return ((r * 255) << 24) ^ ((g * 255) << 16) ^ ((b * 255) << 8) ^ ((a * 255) << 0);
  }

  static RGBToHex(r: number, g: number, b: number): number {
    return ((r * 255) << 16) ^ ((g * 255) << 8) ^ ((b * 255) << 0);
  }

  static CSSToRGBA = (function () {
    const canvas = ig.$new("canvas") as HTMLCanvasElement;
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");

    return function (color: string, alpha: string) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);

      const data = ctx.getImageData(0, 0, 1, 1).data;

      return {
        r: data[0] / 255,
        g: data[1] / 255,
        b: data[2] / 255,
        a: alpha,
      };
    };
  })();

  static RGBAToCSS(r: number, g: number, b: number, a: number): string {
    return "rgba(" + ((r * 255) | 0) + "," + ((g * 255) | 0) + "," + ((b * 255) | 0) + "," + a + ")";
  }

  static RGBToCSS(r: number, g: number, b: number): string {
    return "rgb(" + ((r * 255) | 0) + "," + ((g * 255) | 0) + "," + ((b * 255) | 0) + ")";
  }

  static linearGradient(minX: number, minY: number, maxX: number, maxY: number, colors: any[]): CanvasGradient {
    const gradient = ig.system.context.createLinearGradient(minX, minY, maxX, maxY);
    const pctPerStop = 1 / (colors.length - 1);

    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      let style;

      if (typeof color === "object") {
        if (typeof color.a !== "undefined") {
          style = plusplusUtilsColor.RGBAToCSS(color.r, color.g, color.b, color.a);
        } else {
          style = plusplusUtilsColor.RGBToCSS(color.r, color.g, color.b);
        }
      } else {
        style = color;
      }

      gradient.addColorStop(i * pctPerStop, style);
    }

    return gradient;
  }

  static radialGradient(radius: number, colors: any[]): CanvasGradient {
    const gradient = ig.system.context.createRadialGradient(radius, radius, 0, radius, radius, radius);
    const pctPerStop = 1 / (colors.length - 1);

    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      let style;

      if (typeof color === "object") {
        if (typeof color.a !== "undefined") {
          style = plusplusUtilsColor.RGBAToCSS(color.r, color.g, color.b, color.a);
        } else {
          style = plusplusUtilsColor.RGBToCSS(color.r, color.g, color.b);
        }
      } else {
        style = color;
      }

      gradient.addColorStop(i * pctPerStop, style);
    }

    return gradient;
  }
}
