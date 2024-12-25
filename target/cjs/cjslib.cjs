Object.getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors || function(obj) {
  if (obj === null || obj === void 0) throw new TypeError("Cannot convert undefined or null to object");
  const protoPropDescriptor = Object.getOwnPropertyDescriptor(obj, "__proto__");
  const descriptors = protoPropDescriptor ? { ["__proto__"]: protoPropDescriptor } : {};
  for (const name of Object.getOwnPropertyNames(obj)) {
    descriptors[name] = Object.getOwnPropertyDescriptor(obj, name);
  }
  return descriptors;
};

Object.entries = Object.entries || function (obj) {
  return Object.keys(obj).map((key) => [key, obj[key]]);
};

Object.fromEntries = Object.fromEntries || function (entries) {
  return [...entries].reduce((obj, [key, val]) => {
    obj[key] = val;
    return obj;
  }, {});
};


var __defProp = Object.defineProperty;

var __getOwnPropDesc = Object.getOwnPropertyDescriptor;

var __getOwnPropNames = Object.getOwnPropertyNames;

var __hasOwnProp = Object.prototype.hasOwnProperty;

var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};

var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

var __create = Object.create;

var __getProtoOf = Object.getPrototypeOf;

var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

var __defProps = Object.defineProperties;

var __getOwnPropDescs = Object.getOwnPropertyDescriptors;

var __getOwnPropSymbols = Object.getOwnPropertySymbols;

var __propIsEnum = Object.prototype.propertyIsEnumerable;

var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;

var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};

var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));

var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

module.exports = {
  __defProp,
  __getOwnPropDesc,
  __getOwnPropNames,
  __hasOwnProp,
  __export,
  __copyProps,
  __toCommonJS,
  __create,
  __getProtoOf,
  __toESM,
  __defProps,
  __getOwnPropDescs,
  __getOwnPropSymbols,
  __propIsEnum,
  __defNormalProp,
  __spreadValues,
  __spreadProps,
  __reExport,
  __async,
  __publicField
};
