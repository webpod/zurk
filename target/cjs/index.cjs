"use strict";
const {
  __export,
  __toESM,
  __toCommonJS
} = require('./cjslib.cjs');


// src/main/ts/index.ts
var index_exports = {};
__export(index_exports, {
  $: () => $,
  buildCmd: () => import_util5.buildCmd,
  defaults: () => import_spawn2.defaults,
  exec: () => import_spawn2.exec,
  invoke: () => import_spawn2.invoke,
  zurk: () => import_zurk5.zurk
});
module.exports = __toCommonJS(index_exports);
var import_spawn2 = require("./spawn.cjs");

// src/main/ts/x.ts
var import_zurk4 = require("./zurk.cjs");
var import_util4 = require("./util.cjs");
var import_error = require("./error.cjs");

// src/main/ts/mixin/pipe.ts
var import_node_stream = require("stream");
var import_util = require("./util.cjs");
var import_spawn = require("./spawn.cjs");
var import_zurk = require("./zurk.cjs");
var pipeMixin = ($2, result, ctx) => (0, import_zurk.isZurkAny)(result) ? (0, import_util.assign)(result, {
  pipe(...args) {
    const [target, ...rest] = args;
    const { fulfilled, store, ee } = ctx;
    const from = new import_spawn.VoidStream();
    const sync = !("then" in result);
    const input = fulfilled ? fulfilled.stdout : from;
    const fill = () => {
      for (const chunk of store.stdout) {
        from.write(chunk);
      }
    };
    let _result;
    if ((0, import_zurk.isZurkAny)(target)) {
      target.ctx.input = input;
      _result = target;
    } else if (target instanceof import_node_stream.Writable) {
      _result = from.pipe(target);
    } else if ((0, import_util.isStringLiteral)(target, ...rest)) {
      _result = $2.apply({ input, sync }, args);
    } else {
      throw new Error("Unsupported pipe argument");
    }
    if (fulfilled) {
      fill();
      from.end();
    } else {
      const onStdout = (chunk) => from.write(chunk);
      ee.once("stdout", () => {
        fill();
        ee.on("stdout", onStdout);
      }).once("end", () => {
        ee.removeListener("stdout", onStdout);
        from.end();
      });
    }
    return _result;
  }
}) : result;

// src/main/ts/mixin/kill.ts
var import_node_process = __toESM(require("process"), 1);
var import_util2 = require("./util.cjs");
var import_zurk2 = require("./zurk.cjs");
var kill = (child, signal = "SIGTERM") => new Promise((resolve, reject) => {
  if (child) {
    child.on("exit", (code, signal2) => {
      resolve(signal2);
    });
    import_node_process.default.kill(-child.pid, signal);
  } else {
    reject(new Error("No child process to kill"));
  }
});
var killMixin = ($2, result, ctx) => (0, import_zurk2.isZurkAny)(result) ? (0, import_util2.assign)(result, {
  kill(signal) {
    return kill(ctx.child, signal);
  },
  abort(reason) {
    ctx.ac.abort(reason);
  }
}) : result;

// src/main/ts/mixin/timeout.ts
var import_node_process2 = __toESM(require("process"), 1);
var import_util3 = require("./util.cjs");
var import_zurk3 = require("./zurk.cjs");
var attachTimeout = (ctx, result) => {
  clearTimeout(ctx.timer);
  if (ctx.timeout === void 0) return;
  const kill2 = () => {
    const { child, timeoutSignal = "SIGTERM" } = ctx;
    if (result.kill) return result.kill(timeoutSignal);
    if (child == null ? void 0 : child.pid) import_node_process2.default.kill(child.pid, timeoutSignal);
  };
  ctx.timer = setTimeout(kill2, ctx.timeout);
};
var timeoutMixin = ($2, result, ctx) => {
  if ((0, import_zurk3.isZurkPromise)(result)) {
    (0, import_util3.assign)(result, {
      set timeoutSignal(timeoutSignal) {
        (0, import_util3.assign)(ctx, { timeoutSignal });
      },
      set timeout(timeout) {
        (0, import_util3.assign)(ctx, { timeout });
        attachTimeout(ctx, result);
      }
    });
    attachTimeout(ctx, result);
    (0, import_util3.pFinally)(result, () => clearTimeout(ctx.timer));
  }
  return result;
};

// src/main/ts/x.ts
var $ = function(pieces, ...args) {
  const self = this !== import_util4.g && this;
  const preset = self || {};
  preset.stack = preset.stack || (0, import_error.getCallerLocation)();
  if (pieces === void 0) return applyMixins($, preset);
  if ((0, import_util4.isStringLiteral)(pieces, ...args)) return ignite(preset, pieces, ...args);
  return (...args2) => $.apply(self ? (0, import_util4.assign)(self, pieces) : pieces, args2);
};
var ignite = (preset, pieces, ...args) => {
  const _quote = preset.quote || (preset.shell === false ? (arg) => arg : import_util4.quote);
  const cmd = (0, import_util4.buildCmd)(_quote, pieces, args);
  const input = (0, import_util4.parseInput)(preset.input);
  const run = cmd instanceof Promise ? (cb, ctx) => cmd.then((cmd2) => {
    ctx.cmd = cmd2;
    cb();
  }) : import_util4.immediate;
  const opts = (0, import_util4.assign)(preset, { cmd, run, input });
  return applyMixins($, opts);
};
var zurkMixin = ($2, target) => {
  if ((0, import_zurk4.isZurkAny)(target)) return target;
  const result = (0, import_zurk4.zurk)(target);
  return (0, import_util4.isPromiseLike)(result) ? (0, import_zurk4.zurkifyPromise)(
    result.then((r) => applyMixins($2, r, result)),
    result.ctx
  ) : result;
};
$.mixins = [zurkMixin, killMixin, pipeMixin, timeoutMixin];
var applyMixins = ($2, result, parent) => {
  let ctx = parent == null ? void 0 : parent.ctx;
  return $2.mixins.reduce((r, m) => {
    ctx = ctx || r.ctx;
    return m($2, r, ctx);
  }, result);
};

// src/main/ts/index.ts
var import_zurk5 = require("./zurk.cjs");
var import_util5 = require("./util.cjs");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  $,
  buildCmd,
  defaults,
  exec,
  invoke,
  zurk
});