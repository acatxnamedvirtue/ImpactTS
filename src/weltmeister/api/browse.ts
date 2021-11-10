import * as path from "path";
import * as fs from "fs";

export type BrowseResult = {
  parent: string | boolean;
  dirs: string[];
  files: string[];
};

export function browse(dir = "", type: "scripts" | "images"): BrowseResult {
  const types = {
    scripts: [".json"],
    images: [".png", ".gif", ".jpg", ".jpeg"],
  };
  const result: BrowseResult = { parent: false, dirs: [], files: [] };

  const filter = type && types[type] ? types[type] : false;

  result.parent = dir !== "" ? dir.substring(0, dir.lastIndexOf("/")) : false;

  if (dir[dir.length - 1] === "/") dir = dir.substring(0, dir.length - 1);
  dir += "/";
  const dirpath = path.normalize(dir);

  let stats;
  const files = fs.readdirSync(dirpath);
  for (const i in files) {
    stats = fs.statSync(dirpath + files[i]);
    if (stats.isDirectory()) {
      result.dirs.push(dir + files[i]);
    } else if (stats.isFile()) {
      if (filter) {
        if (filter.indexOf(path.extname(files[i])) >= 0) {
          result.files.push(dir + files[i]);
        }
      } else {
        result.files.push(dir + files[i]);
      }
    }
  }

  result.files.sort(function (a, b) {
    if (a.toUpperCase() < b.toUpperCase()) {
      return -1;
    } else {
      return 1;
    }
  });

  return result;
}
