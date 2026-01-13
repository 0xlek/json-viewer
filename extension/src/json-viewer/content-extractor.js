import jsonFormater from './jsl-format';
import extractJSON from './extract-json';

const TOKEN = (Math.random() + 1).toString(36).slice(2, 7);
const WRAP_START = `<wrap_${TOKEN}>`;
const WRAP_END = `</wrap_${TOKEN}>`;
const NUM_REGEX = /^-?\d+\.?\d*([eE]\+)?\d*$/g;
const ESCAPED_REGEX = "(-?\\d+\\.?\\d*([eE]\\+)?\\d*)";

const WRAP_REGEX = new RegExp(
  `^${WRAP_START}${ESCAPED_REGEX}${WRAP_END}$`, "g"
);

const REPLACE_WRAP_REGEX = new RegExp(
  `"${WRAP_START}${ESCAPED_REGEX}${WRAP_END}"`, "g"
);

function contentExtractor(pre, options) {
  return new Promise((resolve, reject) => {
    try {
      const rawJsonText = pre.textContent;
      const jsonExtracted = extractJSON(rawJsonText);
      const wrappedText = wrapNumbers(jsonExtracted);

      let jsonParsed = JSON.parse(wrappedText);
      if (options.addons.sortKeys) jsonParsed = sortByKeys(jsonParsed);

      let decodedJson = JSON.stringify(jsonParsed);
      decodedJson = decodedJson.replace(REPLACE_WRAP_REGEX, "$1");

      const jsonFormatted = normalize(jsonFormater(decodedJson, options.structure));
      const jsonText = normalize(rawJsonText).replace(normalize(jsonExtracted), jsonFormatted);
      resolve({jsonText, jsonExtracted: decodedJson});

    } catch(e) {
      reject(new Error('contentExtractor: ' + e.message));
    }
  });
}

function normalize(json) {
  return json.replace(/\$/g, '$$$$');
}

function sortByKeys(obj) {
  if (typeof obj !== 'object' || !obj) return obj;

  if (Array.isArray(obj)) {
    return obj.map(val => sortByKeys(val));
  }

  const sorted = {};
  Object.keys(obj).sort().forEach(key => {
    sorted[key] = sortByKeys(obj[key]);
  });

  return sorted;
}

function wrapNumbers(text) {
  let buffer = "";
  let numberBuffer = "";
  let isInString = false;
  let charIsEscaped = false;
  let isInNumber = false;
  let previous = "";

  for (let i = 0, len = text.length; i < len; i++) {
    const char = text[i];

    if (char === '"' && !charIsEscaped) {
      isInString = !isInString;
    }

    if (!isInString && !isInNumber && isCharInNumber(char, previous)) {
      isInNumber = true;
    }

    if (!isInString && isInNumber && isCharInString(char, previous)) {
      isInNumber = false;

      if (numberBuffer.match(NUM_REGEX)) {
        buffer += `"${WRAP_START}${numberBuffer}${WRAP_END}"`;
      } else {
        buffer += numberBuffer;
      }

      numberBuffer = "";
    }

    charIsEscaped = (char === '\\') ? !charIsEscaped : false;

    if (isInNumber) {
      numberBuffer += char;
    } else {
      buffer += char;
      previous = char;
    }
  }

  return buffer;
}

function isCharInNumber(char, previous) {
  return ('0' <= char && char <= '9') ||
         ('0' <= previous && previous <= '9' && (char === 'e' || char === 'E')) ||
         ((previous === 'e' || previous === 'E') && char === '+') ||
         char === '.' ||
         char === '-';
}

function isCharInString(char, previous) {
  return ('0' > char || char > '9') &&
         char !== 'e' &&
         char !== 'E' &&
         char !== '+' &&
         char !== '.' &&
         char !== '-';
}

export default contentExtractor;
