import * as fs from "fs";
import * as path from "path";
import { WMData } from "../../impact/game";

export function save(_path: string, data: string): boolean {
  const root = "./";
  if (_path && data) {
    if (/\.json$/.test(_path)) {
      fs.writeFileSync(path.join(root, _path), data);
      return true;
    } else {
      console.error("File must have a .json suffix");
      return false;
    }
  } else {
    console.error("No data or path specified. Path: " + _path + " Data: " + data);
    return false;
  }
}
