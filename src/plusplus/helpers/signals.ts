/* eslint-disable @typescript-eslint/ban-types */
export class plusplusSignal {
  _bindings: plusplusSignalBinding[] = [];
  _prevParams: any[] = null;
  memorize = false;
  _shouldPropagate = true;
  active = true;

  _registerListener(
    listener: Function,
    isOnce: boolean,
    listenerContext: any,
    priority?: number
  ): plusplusSignalBinding {
    const prevIndex = this._indexOfListener(listener, listenerContext);
    let binding;

    if (prevIndex !== -1) {
      binding = this._bindings[prevIndex];
      if (binding.isOnce() !== isOnce) {
        throw new Error(
          "You cannot add" +
            (isOnce ? "" : "Once") +
            "() then add" +
            (!isOnce ? "" : "Once") +
            "() the same listener without removing the relationship first."
        );
      }
    } else {
      binding = new plusplusSignalBinding(this, listener, isOnce, listenerContext, priority);
      this._addBinding(binding);
    }

    if (this.memorize && this._prevParams) {
      binding.execute(this._prevParams);
    }

    return binding;
  }

  _addBinding(binding: plusplusSignalBinding): void {
    //simplified insertion sort
    let n = this._bindings.length;
    do {
      --n;
    } while (this._bindings[n] && binding._priority <= this._bindings[n]._priority);
    this._bindings.splice(n + 1, 0, binding);
  }

  _indexOfListener(listener: Function, context: any): number {
    let n = this._bindings.length;
    let cur;
    while (n--) {
      cur = this._bindings[n];
      if (cur._listener === listener && cur.context === context) {
        return n;
      }
    }
    return -1;
  }

  has(listener: Function, context: any): boolean {
    return this._indexOfListener(listener, context) !== -1;
  }

  add(listener: Function, listenerContext: any, priority: number): plusplusSignalBinding {
    validateListener(listener, "add");
    return this._registerListener(listener, false, listenerContext, priority);
  }

  addOnce(listener: Function, listenerContext: any, priority?: number): plusplusSignalBinding {
    validateListener(listener, "addOnce");
    return this._registerListener(listener, true, listenerContext, priority);
  }

  remove(listener: Function, context: any): Function {
    validateListener(listener, "remove");

    const i = this._indexOfListener(listener, context);
    if (i !== -1) {
      this._bindings[i]._destroy(); //no reason to a SignalBinding exist if it isn't attached to a signal
      this._bindings.splice(i, 1);
    }
    return listener;
  }

  removeAll(): void {
    let n = this._bindings.length;
    while (n--) {
      this._bindings[n]._destroy();
    }
    this._bindings.length = 0;
  }

  getNumListeners(): number {
    return this._bindings.length;
  }

  halt(): void {
    this._shouldPropagate = false;
  }

  dispatch(...args: any[]) {
    this.dispatchSignal(args);
  }

  dispatchSignal(...params: any[]): void {
    if (!this.active) {
      return;
    }

    let n = this._bindings.length;

    if (this.memorize) {
      this._prevParams = params;
    }

    if (!n) {
      //should come after memorize
      return;
    }

    const bindings = this._bindings.slice(); //clone array in case add/remove items during dispatch
    this._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.

    //execute all callbacks until end of the list or until a callback returns `false` or stops propagation
    //reverse loop since listeners with higher priority will be added at the end of the list
    do {
      n--;
    } while (bindings[n] && this._shouldPropagate && bindings[n].execute(params) !== false);
  }

  forget(): void {
    this._prevParams = null;
  }

  dispose(): void {
    this.removeAll();
    delete this._bindings;
    delete this._prevParams;
  }

  toString(): string {
    return "[Signal active:" + this.active + " numListeners:" + this.getNumListeners() + "]";
  }
}

function validateListener(listener: any, fnName: string) {
  if (typeof listener !== "function") {
    throw new Error(`listener is a required param of ${fnName}() and should be a Function.`);
  }
}

class plusplusSignalBinding {
  _signal: plusplusSignal;
  _listener: Function;
  _isOnce: boolean;
  context: any;
  _priority: number;

  active = true;
  params: any[] = [];

  constructor(signal: plusplusSignal, listener: Function, isOnce: boolean, listenerContext: any, priority?: number) {
    this._signal = signal;
    this._listener = listener;
    this._isOnce = isOnce;
    this.context = listenerContext;
    this._priority = priority || 0;
  }

  execute(paramsArr: any[]): any {
    let handlerReturn;
    let params;

    if (this.active && !!this._listener) {
      params = this.params ? this.params.concat(paramsArr) : paramsArr;
      handlerReturn = this._listener.apply(this.context, params);
      if (this._isOnce) {
        this.detach();
      }
    }

    return handlerReturn;
  }

  detach(): Function {
    return this.isBound() ? this._signal.remove(this._listener, this.context) : null;
  }

  isBound(): boolean {
    return !!this._signal && !!this._listener;
  }

  isOnce(): boolean {
    return this._isOnce;
  }

  getListener(): Function {
    return this._listener;
  }

  getSignal(): plusplusSignal {
    return this._signal;
  }

  _destroy(): void {
    delete this._signal;
    delete this._listener;
    delete this.context;
  }

  toString(): string {
    return "[SignalBinding isOnce:" + this._isOnce + ", isBound:" + this.isBound() + ", active:" + this.active + "]";
  }
}
