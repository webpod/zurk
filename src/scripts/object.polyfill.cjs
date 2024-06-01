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
