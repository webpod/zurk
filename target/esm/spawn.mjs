// src/main/ts/spawn.ts
import * as cp from "node:child_process";
import process from "node:process";
import EventEmitter from "node:events";
import { Stream, Transform } from "node:stream";
import { assign, noop, randomId, g, immediate } from "./util.mjs";
export * from "./util.mjs";
var defaults = {
  get id() {
    return randomId();
  },
  cmd: "",
  get cwd() {
    return process.cwd();
  },
  sync: false,
  args: [],
  input: null,
  env: process.env,
  get ee() {
    return new EventEmitter();
  },
  get ac() {
    return g.AbortController && new AbortController();
  },
  get signal() {
    var _a;
    return (_a = this.ac) == null ? void 0 : _a.signal;
  },
  on: {},
  detached: process.platform !== "win32",
  shell: true,
  spawn: cp.spawn,
  spawnSync: cp.spawnSync,
  spawnOpts: {},
  get store() {
    return createStore();
  },
  callback: noop,
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
  run: immediate,
  stack: ""
};
var normalizeCtx = (...ctxs) => assign(
  {
    ...defaults,
    get signal() {
      var _a;
      return (_a = this.ac) == null ? void 0 : _a.signal;
    }
  },
  ...ctxs
);
var processInput = (child, input) => {
  if (input && child.stdin && !child.stdin.destroyed) {
    if (input instanceof Stream) {
      input.pipe(child.stdin);
    } else {
      child.stdin.write(input);
      child.stdin.end();
    }
  }
};
var VoidStream = class extends Transform {
  _transform(chunk, _, cb) {
    this.emit("data", chunk);
    cb();
  }
};
var buildSpawnOpts = ({ spawnOpts, stdio, cwd, shell, input, env, detached, signal }) => ({
  ...spawnOpts,
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
  const push = (kind, data) => {
    c.store[kind].push(data);
    c.store.stdall.push(data);
    c.ee.emit(kind, data, c);
    c.ee.emit("stdall", data, c);
  };
  try {
    if (c.sync) {
      toggleListeners("on", c.ee, c.on);
      const opts = buildSpawnOpts(c);
      const r = c.spawnSync(c.cmd, c.args, opts);
      c.ee.emit("start", r, c);
      if (((_a = r.stdout) == null ? void 0 : _a.length) > 0) {
        c.stdout.write(r.stdout);
        push("stdout", r.stdout);
      }
      if (((_b = r.stderr) == null ? void 0 : _b.length) > 0) {
        c.stderr.write(r.stderr);
        push("stderr", r.stderr);
      }
      c.callback(null, c.fulfilled = {
        ...r,
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
      });
      c.ee.emit("end", c.fulfilled, c);
    } else {
      c.run(() => {
        var _a2, _b2, _c;
        toggleListeners("on", c.ee, c.on);
        let error = null;
        let aborted = false;
        const opts = buildSpawnOpts(c);
        const child = c.spawn(c.cmd, c.args, opts);
        const onAbort = (event) => {
          if (opts.detached && child.pid) {
            try {
              process.kill(-child.pid);
            } catch {
              child.kill();
            }
          }
          aborted = true;
          c.ee.emit("abort", event, c);
        };
        c.child = child;
        c.ee.emit("start", child, c);
        (_a2 = opts.signal) == null ? void 0 : _a2.addEventListener("abort", onAbort);
        processInput(child, c.input || c.stdin);
        (_b2 = child.stdout) == null ? void 0 : _b2.on("data", (d) => {
          push("stdout", d);
        }).pipe(c.stdout);
        (_c = child.stderr) == null ? void 0 : _c.on("data", (d) => {
          push("stderr", d);
        }).pipe(c.stderr);
        child.once("error", (e) => {
          error = e;
          c.ee.emit("err", error, c);
        }).once("exit", () => {
          var _a3, _b3;
          if (aborted) {
            (_a3 = child.stdout) == null ? void 0 : _a3.destroy();
            (_b3 = child.stderr) == null ? void 0 : _b3.destroy();
          }
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
export {
  VoidStream,
  buildSpawnOpts,
  createStore,
  defaults,
  exec,
  invoke,
  normalizeCtx,
  processInput,
  toggleListeners
};
