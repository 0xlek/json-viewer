function repeat(s, count) {
  return new Array(count + 1).join(s);
}

function getSizeOfArray(jsonString, startingPosition) {
  let currentPosition = startingPosition + 1;
  let inString = false;
  let numOpened = 1;
  try {
    while (numOpened > 0 && currentPosition < jsonString.length) {
      const currentChar = jsonString.charAt(currentPosition)
      switch (currentChar) {
        case '[':
          if (!inString) {
            numOpened++;
          }
          break;
        case ']':
          if (!inString) {
            numOpened--;
          }
          break;
        case '"':
          inString = !inString;
          break;
      }
      currentPosition++;
    }
    return JSON.parse(jsonString.substring(startingPosition, currentPosition)).length;
  } catch (err) {
    return null;
  }
}

function formatJson(json, options) {
  options = options || {};
  const tabSize = options.tabSize || 2;
  const indentCStyle = options.indentCStyle || false;
  const showArraySize = (typeof options.showArraySize !== "undefined" ? Boolean(options.showArraySize) : false);
  let tab = "";
  for (let ts = 0; ts < tabSize; ts++) {
    tab += " ";
  }

  let i = 0;
  let il = 0;
  let newJson = "";
  let indentLevel = 0;
  let inString = false;
  let currentChar = null;

  for (i = 0, il = json.length; i < il; i += 1) {
    currentChar = json.charAt(i);

    switch (currentChar) {
      case '{':
      case '[':
        if (!inString) {
          if (indentCStyle) newJson += "\n" + repeat(tab, indentLevel);
          if (currentChar === "[") {
            if (showArraySize) {
              const arraySize = getSizeOfArray(json, i);
              if (arraySize !== null) {
                newJson += `Array[${arraySize}]`;
              }
            }
          }
          newJson += currentChar;
          newJson += "\n" + repeat(tab, indentLevel + 1);
          indentLevel += 1;
        } else {
          newJson += currentChar;
        }
        break;
      case '}':
      case ']':
        if (!inString) {
          indentLevel -= 1;
          newJson += "\n" + repeat(tab, indentLevel) + currentChar;
        } else {
          newJson += currentChar;
        }
        break;
      case ',':
        if (!inString) {
          newJson += ",\n" + repeat(tab, indentLevel);
        } else {
          newJson += currentChar;
        }
        break;
      case ':':
        if (!inString) {
          newJson += ": ";
        } else {
          newJson += currentChar;
        }
        break;
      case ' ':
      case "\n":
      case "\t":
        if (inString) {
          newJson += currentChar;
        }
        break;
      case '"':
        if (i === 0) {
          inString = true;
        } else if (json.charAt(i - 1) !== '\\' || (json.charAt(i - 1) == '\\' && json.charAt(i - 2) == '\\')) {
          inString = !inString;
        }
        newJson += currentChar;
        break;
      default:
        newJson += currentChar;
        break;
    }
  }

  return newJson;
}

export default formatJson;
