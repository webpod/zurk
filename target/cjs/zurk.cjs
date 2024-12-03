"use strict";
const {
  __export,
  __toCommonJS,
  __publicField
} = require('./cjslib.cjs');


// src/main/ts/zurk.ts
var zurk_exports = {};
__export(zurk_exports, {
  ZURK: () => ZURK,
  ZURKPROXY: () => ZURKPROXY,
  getError: () => getError,
  isZurk: () => isZurk,
  isZurkAny: () => isZurkAny,
  isZurkPromise: () => isZurkPromise,
  isZurkProxy: () => isZurkProxy,
  zurk: () => zurk,
  zurkAsync: () => zurkAsync,
  zurkFactory: () => zurkFactory,
  zurkSync: () => zurkSync,
  zurkifyPromise: () => zurkifyPromise
});
module.exports = __toCommonJS(zurk_exports);
var import_spawn = require("./spawn.cjs");
var import_util = require("./util.cjs");
var ZURK = Symbol("Zurk");
var ZURKPROXY = Symbol("ZurkProxy");
var zurk = (opts) => opts.sync ? zurkSync(opts) : zurkAsync(opts);
var zurkAsync = (opts) => {
  const { promise, resolve, reject } = (0, import_util.makeDeferred)();
  const ctx = (0, import_spawn.normalizeCtx)(opts, {
    sync: false,
    callback(err, data) {
      ctx.error = ctx.nohandle ? err : getError(data);
      ctx.error && !ctx.nothrow ? reject(ctx.error) : resolve(zurkFactory(ctx));
    }
  });
  (0, import_spawn.invoke)(ctx);
  return zurkifyPromise(promise, ctx);
};
var zurkSync = (opts) => {
  let response;
  const ctx = (0, import_spawn.normalizeCtx)(opts, {
    sync: true,
    callback(err, data) {
      ctx.error = ctx.nohandle ? err : getError(data);
      if (ctx.error && !ctx.nothrow) throw ctx.error;
      response = zurkFactory(ctx);
    }
  });
  (0, import_spawn.invoke)(ctx);
  return response;
};
var zurkifyPromise = (target, ctx) => {
  if (isZurkProxy(target) || !(0, import_util.isPromiseLike)(target)) {
    return target;
  }
  const proxy = new Proxy(target, {
    get(target2, p, receiver) {
      if (p === ZURKPROXY) return ZURKPROXY;
      if (p === ZURK) return ZURK;
      if (p === "then") return target2.then.bind(target2);
      if (p === "catch") return target2.catch.bind(target2);
      if (p === "finally") return (cb) => proxy.then((0, import_spawn.asyncVoidCall)(cb), (0, import_spawn.asyncVoidCall)(cb));
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});