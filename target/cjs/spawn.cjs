"use strict";
const {
  __spreadValues,
  __spreadProps,
  __export,
  __reExport,
  __toESM,
  __toCommonJS
} = require('./cjslib.cjs');


// src/main/ts/spawn.ts
var spawn_exports = {};
__export(spawn_exports, {
  VoidStream: () => VoidStream,
  buildSpawnOpts: () => buildSpawnOpts,
  createStore: () => createStore,
  defaults: () => defaults,
  exec: () => exec,
  invoke: () => invoke,
  normalizeCtx: () => normalizeCtx,
  processInput: () => processInput,
  toggleListeners: () => toggleListeners
});
module.exports = __toCommonJS(spawn_exports);
var cp = __toESM(require("child_process"), 1);
var import_node_process = __toESM(require("process"), 1);
var import_node_events = __toESM(require("events"), 1);
var import_node_stream = require("stream");
var import_util = require("./util.cjs");
__reExport(spawn_exports, require("./util.cjs"), module.exports);
var defaults = {
  get id() {
    return (0, import_util.randomId)();
  },
  cmd: "",
  get cwd() {
    return import_node_process.default.cwd();
  },
  sync: false,
  args: [],
  input: null,
  env: import_node_process.default.env,
  get ee() {
    return new import_node_events.default();
  },
  get ac() {
    return import_util.g.AbortController && new AbortController();
  },
  get signal() {
    var _a;
    return (_a = this.ac) == null ? void 0 : _a.signal;
  },
  on: {},
  detached: import_node_process.default.platform !== "win32",
  shell: true,
  spawn: cp.spawn,
  spawnSync: cp.spawnSync,
  spawnOpts: {},
  get store() {
    return createStore();
  },
  callback: import_util.noop,
  get stdin() {
    return new VoidStream();
  },
  get stdout() {
    return new VoidStream();
  },
  get stderr() {
    return new VoidStream();
  },
  stdio: ["pipe", "pipe", "pipe"],
  run: import_util.immediate,
  stack: ""
};
var normalizeCtx = (...ctxs) => (0, import_util.assign)(
  __spreadProps(__spreadValues({}, defaults), {
    get signal() {
      var _a;
      return (_a = this.ac) == null ? void 0 : _a.signal;
    }
  }),
  ...ctxs
);
var processInput = (child, input) => {
  if (input && child.stdin && !child.stdin.destroyed) {
    if (input instanceof import_node_stream.Stream) {
      input.pipe(child.stdin);
    } else {
      child.stdin.write(input);
      child.stdin.end();
    }
  }
};
var VoidStream = class extends import_node_stream.Transform {
  _transform(chunk, _, cb) {
    this.emit("data", chunk);
    cb();
  }
};
var buildSpawnOpts = ({ spawnOpts, stdio, cwd, shell, input, env, detached, signal }) => __spreadProps(__spreadValues({}, spawnOpts), {
  env,
  cwd,
  stdio,
  shell,
  input,
  windowsHide: true,
  detached,
  signal
});
var toggleListeners = (pos, ee, on = {}) => {
  for (const [name, listener] of Object.entries(on)) {
    ee[pos](name, listener);
  }
  if (pos === "on")
    ee.once("end", () => toggleListeners("off", ee, on));
};
var createStore = () => ({
  stdout: [],
  stderr: [],
  stdall: []
});
var invoke = (c) => {
  var _a, _b;
  const now = Date.now();
  const stdio = [c.stdin, c.stdout, c.stderr];
  try {
    if (c.sync) {
      toggleListeners("on", c.ee, c.on);
      const opts = buildSpawnOpts(c);
      const result = c.spawnSync(c.cmd, c.args, opts);
      c.ee.emit("start", result, c);
      if (((_a = result.stdout) == null ? void 0 : _a.length) > 0) {
        c.store.stdout.push(result.stdout);
        c.store.stdall.push(result.stdout);
        c.stdout.write(result.stdout);
        c.ee.emit("stdout", result.stdout, c);
      }
      if (((_b = result.stderr) == null ? void 0 : _b.length) > 0) {
        c.store.stderr.push(result.stderr);
        c.store.stdall.push(result.stderr);
        c.stderr.write(result.stderr);
        c.ee.emit("stderr", result.stderr, c);
      }
      c.callback(null, c.fulfilled = __spreadProps(__spreadValues({}, result), {
        get stdout() {
          return c.store.stdout.join("");
        },
        get stderr() {
          return c.store.stderr.join("");
        },
        get stdall() {
          return c.store.stdall.join("");
        },
        stdio,
        duration: Date.now() - now,
        ctx: c
      }));
      c.ee.emit("end", c.fulfilled, c);
    } else {
      c.run(() => {
        var _a2, _b2, _c;
        toggleListeners("on", c.ee, c.on);
        let error = null;
        const opts = buildSpawnOpts(c);
        const child = c.spawn(c.cmd, c.args, opts);
        const onAbort = (event) => {
          if (opts.detached && child.pid) {
            try {
              import_node_process.default.kill(-child.pid);
            } catch (e) {
              child.kill();
            }
          }
          c.ee.emit("abort", event, c);
        };
        c.child = child;
        c.ee.emit("start", child, c);
        (_a2 = opts.signal) == null ? void 0 : _a2.addEventListener("abort", onAbort);
        processInput(child, c.input || c.stdin);
        (_b2 = child.stdout) == null ? void 0 : _b2.on("data", (d) => {
          c.store.stdout.push(d);
          c.store.stdall.push(d);
          c.ee.emit("stdout", d, c);
        }).pipe(c.stdout);
        (_c = child.stderr) == null ? void 0 : _c.on("data", (d) => {
          c.store.stderr.push(d);
          c.store.stdall.push(d);
          c.ee.emit("stderr", d, c);
        }).pipe(c.stderr);
        child.once("error", (e) => {
          error = e;
          c.ee.emit("err", error, c);
        }).once("exit", () => {
          var _a3, _b3;
          (_a3 = child.stdout) == null ? void 0 : _a3.destroy();
          (_b3 = child.stderr) == null ? void 0 : _b3.destroy();
        }).once("close", (status, signal) => {
          var _a3;
          c.fulfilled = {
            error,
            status,
            signal,
            get stdout() {
              return c.store.stdout.join("");
            },
            get stderr() {
              return c.store.stderr.join("");
            },
            get stdall() {
              return c.store.stdall.join("");
            },
            stdio,
            duration: Date.now() - now,
            ctx: c
          };
          (_a3 = opts.signal) == null ? void 0 : _a3.removeEventListener("abort", onAbort);
          c.callback(error, c.fulfilled);
          c.ee.emit("end", c.fulfilled, c);
        });
      }, c);
    }
  } catch (error) {
    c.callback(
      error,
      c.fulfilled = {
        error,
        status: null,
        signal: null,
        stdout: "",
        stderr: "",
        stdall: "",
        stdio,
        duration: Date.now() - now,
        ctx: c
      }
    );
    c.ee.emit("err", error, c);
    c.ee.emit("end", c.fulfilled, c);
  }
  return c;
};
var exec = (ctx) => invoke(normalizeCtx(ctx));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = Object.assign({
  VoidStream,
  buildSpawnOpts,
  createStore,
  defaults,
  exec,
  invoke,
  normalizeCtx,
  processInput,
  toggleListeners,
}, require("./util.cjs")))