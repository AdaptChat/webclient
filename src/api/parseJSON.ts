// Taken from <https://github.com/sidorares/json-bigint/blob/master/lib/parse.js> under the Public Domain

// regexpxs extracted from
// (c) BSD-3-Clause
// https://github.com/fastify/secure-json-parse/graphs/contributors and https://github.com/hapijs/bourne/graphs/contributors

const suspectProtoRx = /(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])/;
const suspectConstructorRx = /(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)/;

// This is a function that can parse a JSON text, producing a JavaScript
// data structure. It is a simple, recursive descent parser. It does not use
// eval or regular expressions, so it can be used as a model for implementing
// a JSON parser in other languages.

// We are defining the function inside another function to avoid creating
// global variables.

let at: number, // The index of the current character
  ch: string | number, // The current character
  escapee = {
    '"': '"',
    '\\': '\\',
    '/': '/',
    b: '\b',
    f: '\f',
    n: '\n',
    r: '\r',
    t: '\t',
  },
  text: string,
  error = function (m: string) {
    // Call error when something is wrong.

    throw {
      name: 'SyntaxError',
      message: m,
      at: at,
      text: text,
    };
  },
  next = function(c?: string) {
    // If a c parameter is provided, verify that it matches the current character.

    if (c && c !== ch) {
      error("Expected '" + c + "' instead of '" + ch + "'");
    }

    // Get the next character. When there are no more characters,
    // return the empty string.

    ch = text.charAt(at);
    at += 1;
    return ch;
  },
  number = function() {
    // Parse a number value.

    let number,
      string = '';

    if (ch === '-') {
      string = '-';
      next('-');
    }
    while (ch >= '0' && ch <= '9') {
      string += ch;
      next();
    }
    if (ch === '.') {
      string += '.';
      while (next() && ch >= '0' && ch <= '9') {
        string += ch;
      }
    }
    if (ch === 'e' || ch === 'E') {
      string += ch;
      next();
      if (ch as string === '-' || ch as string === '+') {
        string += ch;
        next();
      }
      while (ch >= '0' && ch <= '9') {
        string += ch;
        next();
      }
    }
    number = +string;
    if (!isFinite(number)) {
      error('Bad number');
    } else {
      if (Number.isSafeInteger(number))
        return number
      else
        // Number with fractional part should be treated as number (double) including big integers in scientific notation, i.e 1.79e+308
        return /[.eE]/.test(string) ? number : BigInt(string);
    }
  },
  string = function () {
    // Parse a string value.
    let hex: number,
      i: number,
      string = '',
      uffff: number;

    // When parsing for string values, we must look for " and \ characters.

    if (ch === '"') {
      let startAt = at;
      while (next()) {
        if (ch === '"') {
          if (at - 1 > startAt) string += text.substring(startAt, at - 1);
          next();
          return string;
        }
        if (ch === '\\') {
          if (at - 1 > startAt) string += text.substring(startAt, at - 1);
          next();
          if (ch === 'u') {
            uffff = 0;
            for (i = 0; i < 4; i += 1) {
              hex = parseInt(next(), 16);
              if (!isFinite(hex)) {
                break;
              }
              uffff = uffff * 16 + hex;
            }
            string += String.fromCharCode(uffff);
          } else if (typeof escapee[ch] === 'string') {
            string += escapee[ch];
          } else {
            break;
          }
          startAt = at;
        }
      }
    }
    error('Bad string');
  },
  white = function () {
    // Skip whitespace.

    while (ch && ch <= ' ') {
      next();
    }
  },
  word = function () {
    // true, false, or null.

    switch (ch) {
      case 't':
        next('t');
        next('r');
        next('u');
        next('e');
        return true;
      case 'f':
        next('f');
        next('a');
        next('l');
        next('s');
        next('e');
        return false;
      case 'n':
        next('n');
        next('u');
        next('l');
        next('l');
        return null;
    }
    error("Unexpected '" + ch + "'");
  },
  value: () => any, // Placeholder for the value function.
  array = function () {
    // Parse an array value.
    const array: any[] = [];

    if (ch === '[') {
      next('[');
      white();
      if (ch as string === ']') {
        next(']');
        return array; // empty array
      }
      while (ch) {
        array.push(value());
        white();
        if (ch as string === ']') {
          next(']');
          return array;
        }
        next(',');
        white();
      }
    }
    error('Bad array');
  },
  object = function () {
    // Parse an object value.
    let key: string | undefined,
      object = Object.create(null);

    if (ch === '{') {
      next('{');
      white();
      if (ch as string === '}') {
        next('}');
        return object; // empty object
      }
      while (ch) {
        key = string();
        white();
        next(':');

        if (suspectProtoRx.test(key!))
          error('Object contains forbidden prototype property');
        else if (suspectConstructorRx.test(key!))
          error('Object contains forbidden constructor property');
        else
          object[key!] = value();

        white();
        if (ch as string === '}') {
          next('}');
          return object;
        }
        next(',');
        white();
      }
    }
    error('Bad object');
  };

value = function () {
  // Parse a JSON value. It could be an object, an array, a string, a number,
  // or a word.

  white();
  switch (ch) {
    case '{':
      return object();
    case '[':
      return array();
    case '"':
      return string();
    case '-':
      return number();
    default:
      return ch >= '0' && ch <= '9' ? number() : word();
  }
};

export function parseJSON(source: string) {
  text = source + '';
  at = 0;
  ch = ' ';
  const result = value();
  white();
  if (ch) {
    error('Syntax error');
  }

  return result;
}

export function stringifyJSON(json: any) {
  (BigInt.prototype as any).toJSON = function() {
    return this.toString();
  }
  return JSON.stringify(json);
}
