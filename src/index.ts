
const Orderings = {
  UUp: {UpperRight: 1, LowerRight: 2, LowerLeft: 3, UpperLeft: 4},
  ULeft: {LowerLeft: 1, LowerRight: 2, UpperRight: 3, UpperLeft: 4},
  UDown: {LowerLeft: 1, UpperLeft: 2, UpperRight: 3, LowerRight: 4},
  URight: {UpperRight: 1, UpperLeft: 2, LowerLeft: 3, LowerRight: 4},
}

type OrderingKeys = "UUp" | "ULeft" | "UDown" | "URight";

const xy2hash = (x: number, y: number, dim: number) => {
  let d = 0
  let lvl = dim >> 1
  while (lvl > 0) {
    let rx = (x & lvl) > 0 ? 1 : 0
    let ry = (y & lvl) > 0 ? 1 : 0
    d += lvl * lvl * ((3 * rx) ^ ry)
    const r = rotate(lvl, x, y, rx, ry)
    x = r.x;
    y = r.y;
    lvl >>= 1
  }
  return d
}

const hash2xy = (hashcode: number, dim: number) => {
  let x = 0n
  let y = 0n;
  let lvl = 1n;
  let big = BigInt(hashcode);
  while (lvl < dim) {
    let rx = 1n & (big >> 1n)
    let ry = 1n & (big ^ rx)
    const r = bigrotate(lvl, x, y, rx, ry)
    x = r.x;
    y = r.y;
    x += lvl * rx;
    y += lvl * ry;
    big >>= 2n;
    lvl <<= 1n;
  }
  return {x: Number(x), y: Number(y)}
}

const rotate = (n: number, x: number, y: number, rx: number, ry: number) => {
  if (ry == 0) {
    if (rx == 1) {
      x = n - 1 - x
      y = n - 1 - y
    }
    return {x: y, y: x}
  }
  return {x, y} 
}
const bigrotate = (dn: bigint, x: bigint, y: bigint, rx: bigint, ry: bigint) => {
  if (ry === 0n) {
    if (rx === 1n) {
      x = dn - 1n - x
      y = dn - 1n - y
    }
    return {x: y, y: x}
  }
  return {x, y} 
}

type BaseNumber = 64 | 16 | 4
type Base = "Base64" | "Base16" | "Base4"

const IntConversion = {
  // https://stackoverflow.com/questions/6213227/fastest-way-to-convert-a-number-to-radix-64-in-javascript
    Base64 :
//   0       8       16      24      32      40      48      56     63
//   v       v       v       v       v       v       v       v      v
    "0123456789@ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz",
    Base16:
    "0123456789ABCDEF",
    Base4:
    "0123",
    // You have the freedom, here, to choose the glyphs you want for 
    // representing your base-64 numbers. The ASCII encoding guys usually
    // choose a set of glyphs beginning with ABCD..., but, looking at
    // your update #2, I deduce that you want glyphs beginning with 
    // 0123..., which is a fine choice and aligns the first ten numbers
    // in base 64 with the first ten numbers in decimal.

    // This cannot handle negative numbers and only works on the 
    //     integer part, discarding the fractional part.
    // Doing better means deciding on whether you're just representing
    // the subset of javascript numbers of twos-complement 32-bit integers 
    // or going with base-64 representations for the bit pattern of the
    // underlying IEEE floating-point number, or representing the mantissae
    // and exponents separately, or some other possibility. For now, bail
    fromNumber : function(number: number, base: BaseNumber) {
        if (isNaN(Number(number)) || number === null ||
            number === Number.POSITIVE_INFINITY)
            throw "The input is not valid";
        if (number < 0)
            throw "Can't represent negative numbers now";

        var rixit; // like 'digit', only in some non-decimal radix 
        var residual = Math.floor(number);
        var result = '';
        while (true) {
            rixit = residual % base
            // console.log("rixit : " + rixit);
            // console.log("result before : " + result);
            result = this[("Base" + base) as Base].charAt(rixit) + result;
            // console.log("result after : " + result);
            // console.log("residual before : " + residual);
            residual = Math.floor(residual / base);
            // console.log("residual after : " + residual);

            if (residual == 0)
                break;
            }
        return result;
    },

    toNumber : function(_rixits: string, base: BaseNumber) {
        var result = 0;
        // console.log("rixits : " + rixits);
        // console.log("rixits.split('') : " + rixits.split(''));
        let rixits = _rixits.split('');
        for (var e = 0; e < rixits.length; e++) {
            // console.log("Base64.indexOf(" + rixits[e] + ") : " + 
                // this.Base64.indexOf(rixits[e]));
            // console.log("result before : " + result);
            result = (result * base) + this[("Base" + base) as Base].indexOf(rixits[e]);
            // console.log("result after : " + result);
        }
        return result;
    }
}
const LAT_INTERVAL = [-90.0, 90.0]
const LNG_INTERVAL = [-180.0, 180.0]

const lvl_error = (level: number) => {
  const err = 1 / (1 << level);
  return {lng: 180 * err, lat: 90 * err};
};

const decode_exactly = (code: string, bits_per_char = 6) => {
  let bits = code.length * bits_per_char;
  let level = bits >> 1;
  let dim = 1 << level;
  let code_int = decode_int(code, bits_per_char);
  const {x, y} = hash2xy(code_int, dim);
  const {lng, lat} = int2coord(x, y, dim);
  const err = lvl_error(level);
  return {lng: lng + err.lng, lat: lat + err.lat, lng_err: err.lng, lat_err: err.lat};
};

const decode = (code: string, bits_per_char = 6) => {
  const {lng, lat, lng_err, lat_err} = decode_exactly(code, bits_per_char);
  return {lng, lat}
}


const int2coord = (x: number, y: number, dim: number) => {
  const lng = x / dim * 360 - 180;
  const lat = y / dim * 180 - 90;
  return {lng, lat}
}

const coord2int = (lng: number, lat: number, dim: number) => {
  const lat_y = (lat + LAT_INTERVAL[1]) / 180.0 * dim;
  const lng_x = (lng + LNG_INTERVAL[1]) / 360.0 * dim;
  return {x: Math.min(dim - 1, Math.floor(lng_x)), y: Math.min(dim - 1, Math.floor(lat_y))}
}
const encode_int = (n: number, bits_per_char = 6)  => {
  if (bits_per_char === 6) {
    return encode_int64(n)
  }
  if (bits_per_char === 4) {
    return encode_int16(n)
  }
  if (bits_per_char === 2) {
    return encode_int4(n)
  }
  return "";
}
const decode_int = (n: string, bits_per_char = 6)  => {
  if (bits_per_char === 6) {
    return decode_int64(n)
  }
  if (bits_per_char === 4) {
    return decode_int16(n)
  }
  if (bits_per_char === 2) {
    return decode_int4(n)
  }
  return 0;
}
const encode_int64 = (n: number) => {
  return (IntConversion.fromNumber(n, 64));
}
const encode_int16 = (n: number) => {
  return (IntConversion.fromNumber(n, 16));
}
const encode_int4 = (n: number) => {
  return (IntConversion.fromNumber(n, 4));
}
const decode_int64 = (n: string) => {
  return IntConversion.toNumber(n, 64);
}
const decode_int16 = (n: string) => {
  return IntConversion.toNumber(n, 16);
}
const decode_int4 = (n: string) => {
  return IntConversion.toNumber(n, 4);
}

const neighbours = (code: string, bits_per_char=6) => {
  const {lng, lat, lng_err, lat_err} = decode_exactly(code, bits_per_char);
  const precision = code.length;
  let north = lat + 2 * lat_err;
  let south = lat - 2 * lat_err;

  let east = lng + 2 * lng_err;
  if (east > 180) east -= 360;

  let west = lng - 2 * lng_err;
  if (west < -180) west += 360;

  const neighbours: {east: string, west: string, north?: string, south?: string,
    "north-east"?: string, "north-west"?: string, "south-east"?: string, "south-west"?: string } = {
    east: encode(east, lat, precision, bits_per_char),
    west: encode(west, lat, precision, bits_per_char),
  }

  if (north <= 90) {
    neighbours["north"] = encode(lng, north, precision, bits_per_char);
    neighbours["north-east"] = encode(east, north, precision, bits_per_char);
    neighbours["north-west"] = encode(west, north, precision, bits_per_char);
  }
  if (south >= -90) {
    neighbours["south"] = encode(lng, south, precision, bits_per_char);
    neighbours["south-east"] = encode(east, south, precision, bits_per_char);
    neighbours["south-west"] = encode(west, south, precision, bits_per_char);
  }
  return neighbours;
}

const rectangle = (code: string, bits_per_char=6) => {
  const {lng, lat, lng_err, lat_err} = decode_exactly(code, bits_per_char);
  return {
    type: "Feature",
    properties: {
      code,
      lng,
      lat,
      lng_err,
      lat_err,
      bits_per_char
    },
    bbox: [lng - lng_err, lat - lat_err, lng + lng_err, lat + lat_err],
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [lng - lng_err, lat - lat_err],
          [lng + lng_err, lat - lat_err],
          [lng + lng_err, lat + lat_err],
          [lng - lng_err, lat + lat_err],
          [lng - lng_err, lat - lat_err],
        ]
      ]
    }
  }
}

const hilbert_curve = (precision: number, bits_per_char=6) => {
  const bits = precision * bits_per_char;
  const coordinates: [number, number][] = []; 
  for (let i = 0; i < 1 << bits; i++) {
    const code = encode_int(i, bits_per_char).padStart(precision, '0');
    const {lng, lat, lng_err, lat_err} = decode_exactly(code, bits_per_char);
    coordinates.push([lng, lat]);
  }
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates
    }
  }
}

const encode = (lng: number, lat: number, precision = 10, bits_per_char = 6) => {
  let bits = precision * bits_per_char;
  let level = bits >> 1;
  let dim = 1 << level;

  const { x, y } = coord2int(lng, lat, dim)
  const code = xy2hash(x, y, dim);
  return encode_int(code, bits_per_char).padStart(precision, '0');
}

export {
  encode,
  decode,
  decode_exactly,
  neighbours,
  hilbert_curve
}
