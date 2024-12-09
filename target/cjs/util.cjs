"use strict";
const {
  __spreadValues,
  __export,
  __toESM,
  __toCommonJS,
  __async
} = require('./cjslib.cjs');


// src/main/ts/util.ts
var util_exports = {};
__export(util_exports, {
  assign: () => assign,
  asyncVoidCall: () => asyncVoidCall,
  buildCmd: () => buildCmd,
  g: () => g,
  immediate: () => immediate,
  isPromiseLike: () => isPromiseLike,
  isStringLiteral: () => isStringLiteral,
  makeDeferred: () => makeDeferred,
  noop: () => noop,
  pFinally: () => pFinally,
  parseInput: () => parseInput,
  quote: () => quote,
  randomId: () => randomId,
  substitute: () => substitute
});
module.exports = __toCommonJS(util_exports);
var import_node_stream = require("stream");
var import_node_process = __toESM(require("process"), 1);
var import_node_buffer = require("buffer");
var g = !import_node_process.default.versions.deno && global || globalThis;
var immediate = g.setImmediate || ((f) => g.setTimeout(f, 0));
var noop = () => {
};
var asyncVoidCall = (cb) => () => __async(void 0, null, function* () {
  yield cb();
});
var randomId = () => Math.random().toString(36).slice(2);
var makeDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { resolve, reject, promise };
};
var isPromiseLike = (value) => typeof (value == null ? void 0 : value.then) === "function";
var isStringLiteral = (pieces, ...rest) => {
  var _a;
  return (pieces == null ? void 0 : pieces.length) > 0 && ((_a = pieces.raw) == null ? void 0 : _a.length) === pieces.length && // Object.isFrozen(pieces) &&
  rest.length + 1 === pieces.length;
};
var assign = (target, ...extras) => Object.defineProperties(target, extras.reduce((m, extra) => __spreadValues(__spreadValues({}, m), Object.fromEntries(Object.entries(Object.getOwnPropertyDescriptors(extra)).filter(([, v]) => !Object.prototype.hasOwnProperty.call(v, "value") || v.value !== void 0))), {}));
var quote = (arg) => {
  if (/^[\w./:=@-]+$/i.test(arg) || arg === "") {
    return arg;
  }
  return `$'` + arg.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\f/g, "\\f").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t").replace(/\v/g, "\\v").replace(/\0/g, "\\0") + `'`;
};
var buildCmd = (quote2, pieces, args, subs = substitute) => {
  if (args.some(isPromiseLike))
    return Promise.all(args).then((args2) => buildCmd(quote2, pieces, args2));
  let cmd = pieces[0], i = 0;
  while (i < args.length) {
    const s = Array.isArray(args[i]) ? args[i].map((x) => quote2(subs(x))).join(" ") : quote2(subs(args[i]));
    cmd += s + pieces[++i];
  }
  return cmd;
};
var substitute = (arg) => typeof (arg == null ? void 0 : arg.stdout) === "string" ? arg.stdout.replace(/\n$/, "") : `${arg}`;
var parseInput = (input) => {
  if (typeof input === "string" || input instanceof import_node_buffer.Buffer || input instanceof import_node_stream.Stream) return input;
  if (typeof (input == null ? void 0 : input.stdout) === "string") return input.stdout;
  if (input == null ? void 0 : input.ctx) return parseInput(input.ctx.stdout);
  return null;
};
var pFinally = (p, cb) => {
  var _a;
  return ((_a = p.finally) == null ? void 0 : _a.call(p, asyncVoidCall(cb))) || p.then(asyncVoidCall(cb), asyncVoidCall(cb));
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  assign,
  asyncVoidCall,
  buildCmd,
  g,
  immediate,
  isPromiseLike,
  isStringLiteral,
  makeDeferred,
  noop,
  pFinally,
  parseInput,
  quote,
  randomId,
  substitute
});