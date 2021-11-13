import { Bounds, plusplusUtilsIntersection } from "./utilsintersection";
import { Vector2 } from "./utilsvector2";

export class plusplusUtilsDraw {
  static pixelFillPolygon(
    context: CanvasRenderingContext2D,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    vertices: Vector2[],
    r: number,
    g: number,
    b: number,
    a: number,
    add: boolean,
    boundsVertices: Bounds,
    stabilize?: boolean
  ): void {
    minX |= 0;
    minY |= 0;

    // find bounding box of vertices

    let fminX, fminY, fmaxX, fmaxY;

    if (boundsVertices) {
      fminX = boundsVertices.minX | 0;
      fminY = boundsVertices.minY | 0;
      fmaxX = Math.ceil(boundsVertices.maxX);
      fmaxY = Math.ceil(boundsVertices.maxY);
    } else {
      fminX = minX;
      fminY = minY;
      fmaxX = Math.ceil(maxX);
      fmaxY = Math.ceil(maxY);
    }

    let imageX, imageY, width, height;

    // extra 1 is for stability with rounding

    if (stabilize !== false) {
      imageX = fminX - minX - 1;
      imageY = fminY - minY - 1;
      width = fmaxX - fminX + 1;
      height = fmaxY - fminY + 1;
    } else {
      imageX = fminX - minX;
      imageY = fminY - minY;
      width = fmaxX - fminX;
      height = fmaxY - fminY;
    }

    const r255 = (r * 255) | 0;
    const g255 = (g * 255) | 0;
    const b255 = (b * 255) | 0;
    const a255 = (a * 255) | 0;

    // draw inside vertices

    const shape = context.getImageData(imageX, imageY, width, height);

    if (add === true) {
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          if (plusplusUtilsIntersection.pointInPolygon(x + fminX, y + fminY, vertices)) {
            const index = (x + y * width) * 4;

            shape.data[index] += r255;
            shape.data[index + 1] += g255;
            shape.data[index + 2] += b255;
            shape.data[index + 3] += a255;
          }
        }
      }
    } else {
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          if (plusplusUtilsIntersection.pointInPolygon(x + fminX, y + fminY, vertices)) {
            const index = (x + y * width) * 4;

            shape.data[index] = r255;
            shape.data[index + 1] = g255;
            shape.data[index + 2] = b255;
            shape.data[index + 3] = a255;
          }
        }
      }
    }

    context.putImageData(shape, imageX, imageY);
  }

  static fillPolygon(
    context: CanvasRenderingContext2D,
    vertices: Vector2[],
    offsetX: number,
    offsetY: number,
    scale: number
  ): void {
    offsetX = offsetX || 0;
    offsetY = offsetY || 0;
    scale = scale || 1;

    let vertex = vertices[0];

    context.beginPath();
    context.moveTo((vertex.x + offsetX) * scale, (vertex.y + offsetY) * scale);

    for (let i = 1; i < vertices.length; i++) {
      vertex = vertices[i];
      context.lineTo((vertex.x + offsetX) * scale, (vertex.y + offsetY) * scale);
    }

    context.fill();
  }

  static fillRoundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.quadraticCurveTo(x + width, y, x + width, y + radius);
    context.lineTo(x + width, y + height - radius);
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    context.lineTo(x + radius, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();

    context.fill();
  }

  static pixelFillRoundedRect(
    context: CanvasRenderingContext2D,
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    r: number,
    g: number,
    b: number,
    a: number,
    precision: number,
    add: boolean,
    stabilize: boolean
  ): void {
    if (typeof precision === "undefined") {
      precision = Math.round(radius * 0.25);
    }

    const anglePerVertex = (Math.PI * 0.5) / (precision + 1);

    const addCornerVertices = function (cx: number, cy: number, angle: number) {
      for (let i = 0; i < precision; i++) {
        angle += anglePerVertex;

        vertices.push({
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
        });
      }
    };

    // define vertices to approximate shape

    const vertices: Vector2[] = [];

    // top edge

    vertices.push({
      x: x + radius,
      y: y,
    });
    vertices.push({
      x: x + width - radius,
      y: y,
    });

    // top right corner

    if (precision > 0) {
      addCornerVertices(x + width - radius, y + radius, Math.PI * 1.5);
    }

    // right edge

    vertices.push({
      x: x + width,
      y: y + radius,
    });
    vertices.push({
      x: x + width,
      y: y + height - radius,
    });

    // bottom right corner

    if (precision > 0) {
      addCornerVertices(x + width - radius, y + height - radius, 0);
    }

    // bottom edge

    vertices.push({
      x: x + width - radius,
      y: y + height,
    });
    vertices.push({
      x: x + radius,
      y: y + height,
    });

    // bottom left corner

    if (precision > 0) {
      addCornerVertices(x + radius, y + height - radius, Math.PI * 0.5);
    }

    // left edge

    vertices.push({
      x: x,
      y: y + height - radius,
    });
    vertices.push({
      x: x,
      y: y + radius,
    });

    // top left corner

    if (precision > 0) {
      addCornerVertices(x + radius, y + radius, Math.PI);
    }

    plusplusUtilsDraw.pixelFillPolygon(
      context,
      minX,
      minY,
      maxX,
      maxY,
      vertices,
      r,
      g,
      b,
      a,
      add,
      plusplusUtilsIntersection.bounds(x, y, width, height),
      stabilize
    );
  }
}
