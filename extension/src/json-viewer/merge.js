function merge() {
  const obj = {};
  const il = arguments.length;

  if (il === 0) {
    return obj;
  }

  for (let i = 0; i < il; i++) {
    for (const key in arguments[i]) {
      if (arguments[i].hasOwnProperty(key)) {
        obj[key] = arguments[i][key];
      }
    }
  }
  return obj;
}

export default merge;
