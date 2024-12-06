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

// src/main/ts/error.ts
var EXIT_CODES = {
  2: "Misuse of shell builtins",
  126: "Invoked command cannot execute",
  127: "Command not found",
  128: "Invalid exit argument",
  129: "Hangup",
  130: "Interrupt",
  131: "Quit and dump core",
  132: "Illegal instruction",
  133: "Trace/breakpoint trap",
  134: "Process aborted",
  135: 'Bus error: "access to undefined portion of memory object"',
  136: 'Floating point exception: "erroneous arithmetic operation"',
  137: "Kill (terminate immediately)",
  138: "User-defined 1",
  139: "Segmentation violation",
  140: "User-defined 2",
  141: "Write to pipe with no one reading",
  142: "Signal raised by alarm",
  143: "Termination (request to terminate)",
  145: "Child process terminated, stopped (or continued*)",
  146: "Continue if stopped",
  147: "Stop executing temporarily",
  148: "Terminal stop signal",
  149: 'Background process attempting to read from tty ("in")',
  150: 'Background process attempting to write to tty ("out")',
  151: "Urgent data available on socket",
  152: "CPU time limit exceeded",
  153: "File size limit exceeded",
  154: 'Signal raised by timer counting virtual time: "virtual timer expired"',
  155: "Profiling timer expired",
  157: "Pollable event",
  159: "Bad syscall"
};
var ERRNO_CODES = {
  0: "Success",
  1: "Not super-user",
  2: "No such file or directory",
  3: "No such process",
  4: "Interrupted system call",
  5: "I/O error",
  6: "No such device or address",
  7: "Arg list too long",
  8: "Exec format error",
  9: "Bad file number",
  10: "No children",
  11: "No more processes",
  12: "Not enough core",
  13: "Permission denied",
  14: "Bad address",
  15: "Block device required",
  16: "Mount device busy",
  17: "File exists",
  18: "Cross-device link",
  19: "No such device",
  20: "Not a directory",
  21: "Is a directory",
  22: "Invalid argument",
  23: "Too many open files in system",
  24: "Too many open files",
  25: "Not a typewriter",
  26: "Text file busy",
  27: "File too large",
  28: "No space left on device",
  29: "Illegal seek",
  30: "Read only file system",
  31: "Too many links",
  32: "Broken pipe",
  33: "Math arg out of domain of func",
  34: "Math result not representable",
  35: "File locking deadlock error",
  36: "File or path name too long",
  37: "No record locks available",
  38: "Function not implemented",
  39: "Directory not empty",
  40: "Too many symbolic links",
  42: "No message of desired type",
  43: "Identifier removed",
  44: "Channel number out of range",
  45: "Level 2 not synchronized",
  46: "Level 3 halted",
  47: "Level 3 reset",
  48: "Link number out of range",
  49: "Protocol driver not attached",
  50: "No CSI structure available",
  51: "Level 2 halted",
  52: "Invalid exchange",
  53: "Invalid request descriptor",
  54: "Exchange full",
  55: "No anode",
  56: "Invalid request code",
  57: "Invalid slot",
  59: "Bad font file fmt",
  60: "Device not a stream",
  61: "No data (for no delay io)",
  62: "Timer expired",
  63: "Out of streams resources",
  64: "Machine is not on the network",
  65: "Package not installed",
  66: "The object is remote",
  67: "The link has been severed",
  68: "Advertise error",
  69: "Srmount error",
  70: "Communication error on send",
  71: "Protocol error",
  72: "Multihop attempted",
  73: "Cross mount point (not really error)",
  74: "Trying to read unreadable message",
  75: "Value too large for defined data type",
  76: "Given log. name not unique",
  77: "f.d. invalid for this operation",
  78: "Remote address changed",
  79: "Can   access a needed shared lib",
  80: "Accessing a corrupted shared lib",
  81: ".lib section in a.out corrupted",
  82: "Attempting to link in too many libs",
  83: "Attempting to exec a shared library",
  84: "Illegal byte sequence",
  86: "Streams pipe error",
  87: "Too many users",
  88: "Socket operation on non-socket",
  89: "Destination address required",
  90: "Message too long",
  91: "Protocol wrong type for socket",
  92: "Protocol not available",
  93: "Unknown protocol",
  94: "Socket type not supported",
  95: "Not supported",
  96: "Protocol family not supported",
  97: "Address family not supported by protocol family",
  98: "Address already in use",
  99: "Address not available",
  100: "Network interface is not configured",
  101: "Network is unreachable",
  102: "Connection reset by network",
  103: "Connection aborted",
  104: "Connection reset by peer",
  105: "No buffer space available",
  106: "Socket is already connected",
  107: "Socket is not connected",
  108: "Can't send after socket shutdown",
  109: "Too many references",
  110: "Connection timed out",
  111: "Connection refused",
  112: "Host is down",
  113: "Host is unreachable",
  114: "Socket already connected",
  115: "Connection already in progress",
  116: "Stale file handle",
  122: "Quota exceeded",
  123: "No medium (in tape drive)",
  125: "Operation canceled",
  130: "Previous owner died",
  131: "State not recoverable"
};
function getErrnoMessage(errno) {
  return ERRNO_CODES[-errno] || "Unknown error";
}
function getExitCodeInfo(exitCode) {
  return EXIT_CODES[exitCode];
}
var formatExitMessage = (code, signal, stderr, from) => {
  let message = `exit code: ${code}`;
  if (code != 0 || signal != null) {
    message = `${stderr || "\n"}    at ${from}`;
    message += `
    exit code: ${code}${getExitCodeInfo(code) ? " (" + getExitCodeInfo(code) + ")" : ""}`;
    if (signal != null) {
      message += `
    signal: ${signal}`;
    }
  }
  return message;
};
var formatErrorMessage = (err, from) => {
  return `${err.message}
    errno: ${err.errno} (${getErrnoMessage(err.errno)})
    code: ${err.code}
    at ${from}`;
};

// src/main/ts/zurk.ts
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
  if (data.error)
    return new Error(formatErrorMessage(data.error, data.stack));
  if (data.status || data.signal)
    return new Error(formatExitMessage(data.status, data.signal, data.stderr, data.stack));
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
  get stack() {
    return this.ctx.stack;
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
