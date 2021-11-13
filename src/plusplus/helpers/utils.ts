/* eslint-disable @typescript-eslint/ban-types */
import { plusplusConfig } from "../core/config";

export class plusplusUtils {
  static type(o: any): string {
    return o === null ? o + "" : Object.prototype.toString.call(o).slice(8, -1).toLowerCase();
  }

  static isNumber(n: any): boolean {
    return !isNaN(n) && isFinite(n) && typeof n !== "boolean";
  }

  static toArray(target?: any): any[] {
    return target ? (Array.isArray(target) !== true ? [target] : target) : [];
  }

  static toNotArray(target: any, index?: number): any {
    return Array.isArray(target) === true ? target[index || 0] : target;
  }

  static arrayCautiousAdd<T>(target: T[], element: T): T[] {
    const index = target.indexOf(element);

    if (index === -1) {
      target.push(element);
    }

    return target;
  }

  static arrayCautiousAddMulti(target: any[], elements: any): any[] {
    const elementsArray = plusplusUtils.toArray(elements);

    for (let i = 0; i < elementsArray.length; i++) {
      const element = elementsArray[i];

      if (element !== target) {
        const index = target.indexOf(element);

        if (index === -1) {
          target.push(element);
        }
      }
    }

    return target;
  }

  static arrayCautiousRemove(target: any[], element: any): any[] {
    const index = target.indexOf(element);

    if (index !== -1) {
      target.splice(index, 1);
    }

    return target;
  }

  static arrayCautiousRemoveMulti(target: any[], elements: any): any[] {
    const elementsArray = plusplusUtils.toArray(elements);

    for (let i = 0; i < elementsArray.length; i++) {
      const element = elements[i];

      if (element !== target) {
        const index = target.indexOf(element);

        if (index !== -1) {
          target.splice(index, 1);
        }
      }
    }

    return target;
  }

  static forEach(array: any[], callback: Function, args: any[]): void {
    for (let i = 0; i < array.length; i++) {
      callback.apply(array[i], args);
    }
  }

  static indexOfValue(array: any[], value: any): any {
    for (let i = 0; i < array.length; i++) {
      if (value === array[i]) {
        return i;
      }
    }

    return -1;
  }

  static indexOfProperty(array: any[], property: any, value: any): number {
    for (let i = 0; i < array.length; i++) {
      if (value === array[i][property]) {
        return i;
      }
    }

    return -1;
  }

  static indexOfProperties(array: any[], properties: any[], values: any[]): number {
    for (let i = 0; i < array.length; i++) {
      const obj = array[i];
      let missing = false;

      for (let j = 0; j < properties.length; j++) {
        if (values[j] !== obj[properties[j]]) {
          missing = true;
          break;
        }
      }

      if (missing !== true) {
        return i;
      }
    }

    return -1;
  }

  static throttle(callback: Function, delay: any, trailing: boolean): (...params: any[]) => void {
    let timeoutId: NodeJS.Timeout;
    let timeLast = 0;

    if (plusplusUtils.isNumber(delay) !== true) {
      delay = plusplusConfig.DURATION_THROTTLE;
    }

    function throttled(...params: any[]): void {
      const elapsed = Date.now() - timeLast;

      function execute() {
        timeLast = Date.now();
        callback.apply(this, params);
      }

      if (elapsed > delay) {
        timeoutId && clearTimeout(timeoutId);

        execute();
      } else if (trailing !== false) {
        timeoutId && clearTimeout(timeoutId);

        timeoutId = setTimeout(execute, delay - elapsed);
      }
    }

    return throttled;
  }

  static debounce(callback: Function, delay: any): () => void {
    let timeoutId: NodeJS.Timeout;

    if (plusplusUtils.isNumber(delay) !== true) {
      delay = plusplusConfig.DURATION_THROTTLE;
    }

    function debounced(...params: any[]) {
      timeoutId && clearTimeout(timeoutId);

      timeoutId = setTimeout(function () {
        callback.apply(this, params);
      }, delay);
    }

    return debounced;
  }

  // max value for type flags

  static MAX_TYPE = Math.pow(2, 32);

  static getType(classObject: any, names: string, typeListName?: string): any {
    typeListName = typeListName || "TYPE";

    let types = classObject[typeListName];
    const typeLastName = typeListName + "_LAST";
    let type;

    // setup types

    if (!classObject[typeLastName] || !types) {
      classObject[typeLastName] = 1;
      types = classObject[typeListName] = {};
    }

    // get type

    names = names.toUpperCase();
    type = types[names];

    // create type

    if (!type) {
      type = 0;

      const typeLast = classObject[typeLastName];
      const namesList = names.split(" ");

      for (let i = 0; i < namesList.length; i++) {
        const name = namesList[i];
        let typeNext = types[name];

        if (!typeNext) {
          if (typeLast >= plusplusUtils.MAX_TYPE) {
            throw new TypeError("Bitwise flag out of range / above 32 bits!");
          }

          // these types are bitwise flags
          // multiply last type by 2 each time to avoid false positives

          typeNext = types[name] = typeLast;
          classObject[typeLastName] = typeLast * 2;
        }

        // add to total type

        type |= typeNext;
      }

      // lets not recalculate that again

      types[names] = type;
    }

    return type;
  }

  static addType(classObject: any, entity: any, property: string, names: string, typeListName?: string): void {
    entity[property] |= plusplusUtils.getType(classObject, names, typeListName);
  }
}
