const { encode_int, decode_int } = require("./conversion");
const assert = require("assert");

const xy2hash = (x: bigint, y: bigint, dim: number) => {
  let d = 0n;
  let lvl = BigInt(dim >> 1);
  while (lvl > 0) {
    let rx = (x & lvl) > 0 ? 1n : 0n;
    let ry = (y & lvl) > 0 ? 1n : 0n;
    d += lvl * lvl * ((3n * rx) ^ ry);
    const r = rotate(lvl, x, y, rx, ry);
    x = r.x;
    y = r.y;
    lvl >>= 1n;
  }
  return d;
};

const hash2xy = (hashcode: number, dim: bigint) => {
  let x = 0n;
  let y = 0n;
  let lvl = 1n;
  let big = BigInt(hashcode);
  while (lvl < dim) {
    let rx = 1n & (big >> 1n);
    let ry = 1n & (big ^ rx);
    const r = rotate(lvl, x, y, rx, ry);
    x = r.x;
    y = r.y;
    x += lvl * rx;
    y += lvl * ry;
    big >>= 2n;
    lvl <<= 1n;
  }
  return { x: Number(x), y: Number(y) };
};

const rotate = (n: bigint, x: bigint, y: bigint, rx: bigint, ry: bigint) => {
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
  isCorrectBpc(bits_per_char);
  let bits = code.length * bits_per_char;
  isOverflowing(bits);
  let level = BigInt(bits) >> 1n;
  let dim = 1n << level;
  let code_int = decode_int(code, bits_per_char);
  const { x, y } = hash2xy(code_int, dim);
  const { lng, lat } = int2coord(x, y, Number(dim));
  const err = lvl_error(Number(level));
  return {
    lng: lng + err.lng,
    lat: lat + err.lat,
    lng_err: err.lng,
    lat_err: err.lat,
  };
};

const decode = (code: string, bits_per_char = 6) => {
  isCorrectBpc(bits_per_char);
  const { lng, lat } = decode_exactly(code, bits_per_char);
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
  isCorrectBpc(bits_per_char);
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
  isCorrectBpc(bits_per_char);
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
  isCorrectBpc(bits_per_char);
  assert(precision < 4, "Only precision less than 4 supported right now");
  const bits = precision * bits_per_char;
  const coordinates: [number, number][] = [];
  for (let i = 0; i < 1 << bits; i++) {
    const code = encode_int(i, bits_per_char).padStart(precision, "0");
    const { lng, lat } = decode_exactly(code, bits_per_char);
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

const isOverflowing = (bits: number) =>
  assert(
    bits < 64,
    "Over 64 bits not supported. Reduce 'precision' or 'bits_per_char' so their product is <= 64"
  );
const isCorrectBpc = (bpc: number) =>
  assert([2, 4, 6].includes(bpc), "bits_per_char must be 2, 4 or 6");

const encode = (
  lng: number,
  lat: number,
  precision = 10,
  bits_per_char = 6
) => {
  isCorrectBpc(bits_per_char);
  const bits = precision * bits_per_char;
  isOverflowing(bits);
  const level = bits >> 1;
  const dim = 1 << level;
  const { x, y } = coord2int(lng, lat, dim);
  const code = xy2hash(BigInt(x), BigInt(y), dim);
  return encode_int(code, bits_per_char).padStart(precision, "0");
};

export { encode, decode, decode_exactly, neighbours, hilbert_curve, rectangle };
