// src/main/ts/index.ts
import { invoke, exec, defaults } from "./spawn.mjs";

// src/main/ts/x.ts
import {
  zurk,
  zurkifyPromise,
  isZurkAny as isZurkAny3
} from "./zurk.mjs";
import {
  isPromiseLike,
  isStringLiteral as isStringLiteral2,
  assign as assign4,
  quote,
  buildCmd,
  parseInput,
  g,
  immediate
} from "./util.mjs";

// src/main/ts/error.ts
function getCallerLocation(err = new Error("zurk error")) {
  return getCallerLocationFromString(err.stack);
}
function getCallerLocationFromString(stackString = "unknown") {
  var _a;
  return ((_a = stackString.split(/^\s*(at\s)?/m).filter((s) => s == null ? void 0 : s.includes(":"))[2]) == null ? void 0 : _a.trim()) || stackString;
}

// src/main/ts/mixin/pipe.ts
import { Writable } from "node:stream";
import { assign, isStringLiteral } from "./util.mjs";
import { VoidStream } from "./spawn.mjs";
import { isZurkAny } from "./zurk.mjs";
var pipeMixin = ($2, result, ctx) => isZurkAny(result) ? assign(result, {
  pipe(...args) {
    const [target, ...rest] = args;
    const { fulfilled, store, ee } = ctx;
    const from = new VoidStream();
    const sync = !("then" in result);
    const input = fulfilled ? fulfilled.stdout : from;
    const fill = () => {
      for (const chunk of store.stdout) {
        from.write(chunk);
      }
    };
    let _result;
    if (isZurkAny(target)) {
      target.ctx.input = input;
      _result = target;
    } else if (target instanceof Writable) {
      _result = from.pipe(target);
    } else if (isStringLiteral(target, ...rest)) {
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
import process from "node:process";
import { assign as assign2 } from "./util.mjs";
import { isZurkAny as isZurkAny2 } from "./zurk.mjs";
var kill = (child, signal = "SIGTERM") => new Promise((resolve, reject) => {
  if (child) {
    child.on("exit", (code, signal2) => {
      resolve(signal2);
    });
    process.kill(-child.pid, signal);
  } else {
    reject(new Error("No child process to kill"));
  }
});
var killMixin = ($2, result, ctx) => isZurkAny2(result) ? assign2(result, {
  kill(signal) {
    return kill(ctx.child, signal);
  },
  abort(reason) {
    ctx.ac.abort(reason);
  }
}) : result;

// src/main/ts/mixin/timeout.ts
import process2 from "node:process";
import { assign as assign3, pFinally } from "./util.mjs";
import { isZurkPromise } from "./zurk.mjs";
var attachTimeout = (ctx, result) => {
  clearTimeout(ctx.timer);
  if (ctx.timeout === void 0) return;
  const kill2 = () => {
    const { child, timeoutSignal = "SIGTERM" } = ctx;
    if (result.kill) return result.kill(timeoutSignal);
    if (child == null ? void 0 : child.pid) process2.kill(child.pid, timeoutSignal);
  };
  ctx.timer = setTimeout(kill2, ctx.timeout);
};
var timeoutMixin = ($2, result, ctx) => {
  if (isZurkPromise(result)) {
    assign3(result, {
      set timeoutSignal(timeoutSignal) {
        assign3(ctx, { timeoutSignal });
      },
      set timeout(timeout) {
        assign3(ctx, { timeout });
        attachTimeout(ctx, result);
      }
    });
    attachTimeout(ctx, result);
    pFinally(result, () => clearTimeout(ctx.timer));
  }
  return result;
};

// src/main/ts/x.ts
var $ = function(pieces, ...args) {
  const self = this !== g && this;
  const preset = self || {};
  preset.stack = preset.stack || getCallerLocation();
  if (pieces === void 0) return applyMixins($, preset);
  if (isStringLiteral2(pieces, ...args)) return ignite(preset, pieces, ...args);
  return (...args2) => $.apply(self ? assign4(self, pieces) : pieces, args2);
};
var ignite = (preset, pieces, ...args) => {
  const cmd = buildCmd(preset.quote || quote, pieces, args);
  const input = parseInput(preset.input);
  const run = cmd instanceof Promise ? (cb, ctx) => cmd.then((cmd2) => {
    ctx.cmd = cmd2;
    cb();
  }) : immediate;
  const opts = assign4(preset, { cmd, run, input });
  return applyMixins($, opts);
};
var zurkMixin = ($2, target) => {
  if (isZurkAny3(target)) return target;
  const result = zurk(target);
  return isPromiseLike(result) ? zurkifyPromise(
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
import { zurk as zurk2 } from "./zurk.mjs";
import { buildCmd as buildCmd2 } from "./util.mjs";
export {
  $,
  buildCmd2 as buildCmd,
  defaults,
  exec,
  invoke,
  zurk2 as zurk
};
