const { encode_int, decode_int } = require("./conversion");
const assert = require("assert");
const Orderings = {
  UUp: { UpperRight: 1, LowerRight: 2, LowerLeft: 3, UpperLeft: 4 },
  ULeft: { LowerLeft: 1, LowerRight: 2, UpperRight: 3, UpperLeft: 4 },
  UDown: { LowerLeft: 1, UpperLeft: 2, UpperRight: 3, LowerRight: 4 },
  URight: { UpperRight: 1, UpperLeft: 2, LowerLeft: 3, LowerRight: 4 },
};

type OrderingKeys = "UUp" | "ULeft" | "UDown" | "URight";

const xy2hash = (x: number, y: number, dim: number) => {
  let d = 0;
  let lvl = dim >> 1;
  while (lvl > 0) {
    let rx = (x & lvl) > 0 ? 1 : 0;
    let ry = (y & lvl) > 0 ? 1 : 0;
    d += lvl * lvl * ((3 * rx) ^ ry);
    const r = rotate(lvl, x, y, rx, ry);
    x = r.x;
    y = r.y;
    lvl >>= 1;
  }
  return d;
};

const hash2xy = (hashcode: number, dim: number) => {
  let x = 0n;
  let y = 0n;
  let lvl = 1n;
  let big = BigInt(hashcode);
  while (lvl < dim) {
    let rx = 1n & (big >> 1n);
    let ry = 1n & (big ^ rx);
    const r = bigrotate(lvl, x, y, rx, ry);
    x = r.x;
    y = r.y;
    x += lvl * rx;
    y += lvl * ry;
    big >>= 2n;
    lvl <<= 1n;
  }
  return { x: Number(x), y: Number(y) };
};

const rotate = (n: number, x: number, y: number, rx: number, ry: number) => {
  if (ry == 0) {
    if (rx == 1) {
      x = n - 1 - x;
      y = n - 1 - y;
    }
    return { x: y, y: x };
  }
  return { x, y };
};

const bigrotate = (n: bigint, x: bigint, y: bigint, rx: bigint, ry: bigint) => {
  if (ry === 0n) {
    if (rx === 1n) {
      x = n - 1n - x;
      y = n - 1n - y;
    }
    return { x: y, y: x };
  }
  return { x, y };
};

const LAT_INTERVAL = [-90.0, 90.0];
const LNG_INTERVAL = [-180.0, 180.0];

const lvl_error = (level: number) => {
  const err = 1 / (1 << level);
  return { lng: 180 * err, lat: 90 * err };
};

const decode_exactly = (code: string, bits_per_char = 6) => {
  let bits = code.length * bits_per_char;
  isOverflowing(bits);
  let level = bits >> 1;
  let dim = 1 << level;
  let code_int = decode_int(code, bits_per_char);
  const { x, y } = hash2xy(code_int, dim);
  const { lng, lat } = int2coord(x, y, dim);
  const err = lvl_error(level);
  return {
    lng: lng + err.lng,
    lat: lat + err.lat,
    lng_err: err.lng,
    lat_err: err.lat,
  };
};

const decode = (code: string, bits_per_char = 6) => {
  const { lng, lat, lng_err, lat_err } = decode_exactly(code, bits_per_char);
  return { lng, lat };
};

const int2coord = (x: number, y: number, dim: number) => {
  const lng = (x / dim) * 360 - 180;
  const lat = (y / dim) * 180 - 90;
  return { lng, lat };
};

const coord2int = (lng: number, lat: number, dim: number) => {
  const lat_y = ((lat + LAT_INTERVAL[1]) / 180.0) * dim;
  const lng_x = ((lng + LNG_INTERVAL[1]) / 360.0) * dim;
  return {
    x: Math.min(dim - 1, Math.floor(lng_x)),
    y: Math.min(dim - 1, Math.floor(lat_y)),
  };
};

const neighbours = (code: string, bits_per_char = 6) => {
  const { lng, lat, lng_err, lat_err } = decode_exactly(code, bits_per_char);
  const precision = code.length;
  let north = lat + 2 * lat_err;
  let south = lat - 2 * lat_err;

  let east = lng + 2 * lng_err;
  if (east > 180) east -= 360;

  let west = lng - 2 * lng_err;
  if (west < -180) west += 360;

  const neighbours: {
    east: string;
    west: string;
    north?: string;
    south?: string;
    "north-east"?: string;
    "north-west"?: string;
    "south-east"?: string;
    "south-west"?: string;
  } = {
    east: encode(east, lat, precision, bits_per_char),
    west: encode(west, lat, precision, bits_per_char),
  };

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
};

const rectangle = (code: string, bits_per_char = 6) => {
  const { lng, lat, lng_err, lat_err } = decode_exactly(code, bits_per_char);
  return {
    type: "Feature",
    properties: {
      code,
      lng,
      lat,
      lng_err,
      lat_err,
      bits_per_char,
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
        ],
      ],
    },
  };
};

const hilbert_curve = (precision: number, bits_per_char = 6) => {
  if (precision > 3) {
    throw new PrecisionError(
      "Higher precision than 3 not supported right now."
    );
  }
  const bits = precision * bits_per_char;
  const coordinates: [number, number][] = [];
  for (let i = 0; i < 1 << bits; i++) {
    const code = encode_int(i, bits_per_char).padStart(precision, "0");
    const { lng, lat, lng_err, lat_err } = decode_exactly(code, bits_per_char);
    coordinates.push([lng, lat]);
  }
  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
};

class PrecisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

const isOverflowing = (bits: number) => {
  if (bits > 64) {
    throw new PrecisionError("Overflow. Reduce 'precision' or 'bits_per_char'");
  }
};

const encode = (
  lng: number,
  lat: number,
  precision = 10,
  bits_per_char = 6
) => {
  const bits = precision * bits_per_char;
  isOverflowing(bits);
  const level = bits >> 1;
  const dim = 1 << level;
  const { x, y } = coord2int(lng, lat, dim);
  const code = xy2hash(x, y, dim);
  return encode_int(code, bits_per_char).padStart(precision, "0");
};

export { encode, decode, decode_exactly, neighbours, hilbert_curve };
