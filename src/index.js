"use strict";
const Orderings = {
    UUp: { UpperRight: 1, LowerRight: 2, LowerLeft: 3, UpperLeft: 4 },
    ULeft: { LowerLeft: 1, LowerRight: 2, UpperRight: 3, UpperLeft: 4 },
    UDown: { LowerLeft: 1, UpperLeft: 2, UpperRight: 3, LowerRight: 4 },
    URight: { UpperRight: 1, UpperLeft: 2, LowerLeft: 3, LowerRight: 4 },
};
const xy2hash = (x, y, dim) => {
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
const rotate = (n, x, y, rx, ry) => {
    if (ry == 0) {
        if (rx == 1) {
            x = n - 1 - x;
            y = n - 1 - y;
        }
        return { x: y, y: x };
    }
    return { x, y };
};
const Base64 = {
    // https://stackoverflow.com/questions/6213227/fastest-way-to-convert-a-number-to-radix-64-in-javascript
    _Rixits: 
    //   0       8       16      24      32      40      48      56     63
    //   v       v       v       v       v       v       v       v      v
    "0123456789@ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz",
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
    fromNumber: function (number) {
        if (isNaN(Number(number)) || number === null ||
            number === Number.POSITIVE_INFINITY)
            throw "The input is not valid";
        if (number < 0)
            throw "Can't represent negative numbers now";
        var rixit; // like 'digit', only in some non-decimal radix 
        var residual = Math.floor(number);
        var result = '';
        while (true) {
            rixit = residual % 64;
            // console.log("rixit : " + rixit);
            // console.log("result before : " + result);
            result = this._Rixits.charAt(rixit) + result;
            // console.log("result after : " + result);
            // console.log("residual before : " + residual);
            residual = Math.floor(residual / 64);
            // console.log("residual after : " + residual);
            if (residual == 0)
                break;
        }
        return result;
    },
    toNumber: function (rixits) {
        var result = 0;
        // console.log("rixits : " + rixits);
        // console.log("rixits.split('') : " + rixits.split(''));
        rixits = rixits.split('');
        for (var e = 0; e < rixits.length; e++) {
            // console.log("_Rixits.indexOf(" + rixits[e] + ") : " + 
            // this._Rixits.indexOf(rixits[e]));
            // console.log("result before : " + result);
            result = (result * 64) + this._Rixits.indexOf(rixits[e]);
            // console.log("result after : " + result);
        }
        return result;
    }
};
const LAT_INTERVAL = [-90.0, 90.0];
const LNG_INTERVAL = [-180.0, 180.0];
const coord2int = (lng, lat, dim) => {
    const lat_y = (lat + LAT_INTERVAL[1]) / 180.0 * dim;
    const lng_x = (lng + LNG_INTERVAL[1]) / 360.0 * dim;
    return { x: Math.min(dim - 1, Math.floor(lng_x)), y: Math.min(dim - 1, Math.floor(lat_y)) };
};
const encode_int = (n, bits_per_char = 6) => {
    if (bits_per_char === 6) {
        return encode_int64(n);
    }
    return "";
};
const encode_int64 = (n) => {
    return (Base64.fromNumber(n));
};
const encode = (lng, lat, precision = 10, bits_per_char = 6) => {
    let bits = precision * bits_per_char;
    let level = bits >> 1;
    let dim = 1 << level;
    const { x, y } = coord2int(lng, lat, dim);
    const code = xy2hash(x, y, dim);
    console.log(code);
    return encode_int(code, bits_per_char); //.padStart(precision, '0');
};
console.log(encode(-4.200263151025215, 52.037478999999976, 8));
console.log("??");
console.log(encode(6.957036, 50.941291, 10));
