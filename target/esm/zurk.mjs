var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main/ts/zurk.ts
import {
  invoke,
  normalizeCtx,
  asyncVoidCall
} from "./spawn.mjs";
import {
  isPromiseLike,
  makeDeferred
} from "./util.mjs";
var ZURK = Symbol("Zurk");
var ZURKPROXY = Symbol("ZurkProxy");
var zurk = (opts) => opts.sync ? zurkSync(opts) : zurkAsync(opts);
var zurkAsync = (opts) => {
  const { promise, resolve, reject } = makeDeferred();
  const ctx = normalizeCtx(opts, {
    sync: false,
    callback(err, data) {
      ctx.error = ctx.nohandle ? err : getError(data);
      ctx.error && !ctx.nothrow ? reject(ctx.error) : resolve(zurkFactory(ctx));
    }
  });
  invoke(ctx);
  return zurkifyPromise(promise, ctx);
};
var zurkSync = (opts) => {
  let response;
  const ctx = normalizeCtx(opts, {
    sync: true,
    callback(err, data) {
      ctx.error = ctx.nohandle ? err : getError(data);
      if (ctx.error && !ctx.nothrow) throw ctx.error;
      response = zurkFactory(ctx);
    }
  });
  invoke(ctx);
  return response;
};
var zurkifyPromise = (target, ctx) => {
  if (isZurkProxy(target) || !isPromiseLike(target))
    return target;
  const proxy = new Proxy(target, {
    get(target2, p, receiver) {
      if (p === ZURKPROXY) return ZURKPROXY;
      if (p === ZURK) return ZURK;
      if (p === "then") return target2.then.bind(target2);
      if (p === "catch") return target2.catch.bind(target2);
      if (p === "finally") return (cb) => proxy.then(asyncVoidCall(cb), asyncVoidCall(cb));
      if (p === "stdio") return ctx.stdio;
      if (p === "ctx") return ctx;
      if (p === "child") return ctx.child;
      if (p === "on") return function(name, cb) {
        ctx.ee.on(name, cb);
        return proxy;
      };
      if (p in target2) return Reflect.get(target2, p, receiver);
      return target2.then((v) => Reflect.get(v, p, receiver));
    }
  });
  return proxy;
};
var getError = (data) => {
  if (data.error) return data.error;
  if (data.status) return new Error(`Command failed with exit code ${data.status}`);
  if (data.signal) return new Error(`Command failed with signal ${data.signal}`);
  return null;
};
var isZurkAny = (o) => (o == null ? void 0 : o[ZURK]) === ZURK;
var isZurk = (o) => isZurkAny(o) && !(o instanceof Promise);
var isZurkPromise = (o) => isZurkAny(o) && o instanceof Promise;
var isZurkProxy = (value) => (value == null ? void 0 : value[ZURKPROXY]) === ZURKPROXY;
var zurkFactory = (ctx) => new Zurk(ctx);
var _a;
_a = ZURK;
var Zurk = class {
  constructor(ctx) {
    __publicField(this, _a, ZURK);
    __publicField(this, "ctx");
    this.ctx = ctx;
  }
  on(name, cb) {
    this.ctx.ee.on(name, cb);
    return this;
  }
  get child() {
    return this.ctx.child;
  }
  get status() {
    var _a2, _b;
    return (_b = (_a2 = this.ctx.fulfilled) == null ? void 0 : _a2.status) != null ? _b : null;
  }
  get signal() {
    var _a2, _b;
    return (_b = (_a2 = this.ctx.fulfilled) == null ? void 0 : _a2.signal) != null ? _b : null;
  }
  get error() {
    return this.ctx.error;
  }
  get stderr() {
    var _a2;
    return ((_a2 = this.ctx.fulfilled) == null ? void 0 : _a2.stderr) || "";
  }
  get stdout() {
    var _a2;
    return ((_a2 = this.ctx.fulfilled) == null ? void 0 : _a2.stdout) || "";
  }
  get stdall() {
    var _a2;
    return ((_a2 = this.ctx.fulfilled) == null ? void 0 : _a2.stdall) || "";
  }
  get stdio() {
    return [
      this.ctx.stdin,
      this.ctx.stdout,
      this.ctx.stderr
    ];
  }
  get duration() {
    var _a2, _b;
    return (_b = (_a2 = this.ctx.fulfilled) == null ? void 0 : _a2.duration) != null ? _b : 0;
  }
  toString() {
    return this.stdall.trim();
  }
  valueOf() {
    return this.stdall.trim();
  }
};
export {
  ZURK,
  ZURKPROXY,
  getError,
  isZurk,
  isZurkAny,
  isZurkPromise,
  isZurkProxy,
  zurk,
  zurkAsync,
  zurkFactory,
  zurkSync,
  zurkifyPromise
};
