type BaseNumber = 64 | 16 | 4;
type Base = "Base64" | "Base16" | "Base4";

const IntConversion = {
  // https://stackoverflow.com/questions/6213227/fastest-way-to-convert-a-number-to-radix-64-in-javascript
  Base64:
    //   0       8       16      24      32      40      48      56     63
    //   v       v       v       v       v       v       v       v      v
    "0123456789@ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz",
  Base16: "0123456789ABCDEF",
  Base4: "0123",
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
  fromNumber: function (number: number, base: BaseNumber) {
    if (
      isNaN(Number(number)) ||
      number === null ||
      number === Number.POSITIVE_INFINITY
    )
      throw "The input is not valid";
    if (number < 0) throw "Can't represent negative numbers now";

    var rixit; // like 'digit', only in some non-decimal radix
    var residual = Math.floor(number);
    var result = "";
    while (true) {
      rixit = residual % base;
      // console.log("rixit : " + rixit);
      // console.log("result before : " + result);
      result = this[("Base" + base) as Base].charAt(rixit) + result;
      // console.log("result after : " + result);
      // console.log("residual before : " + residual);
      residual = Math.floor(residual / base);
      // console.log("residual after : " + residual);

      if (residual == 0) break;
    }
    return result;
  },

  toNumber: function (string: string, base: BaseNumber) {
    var result = 0;
    let chars = string.split("");
    for (var e = 0; e < chars.length; e++) {
      result = result * base + this[("Base" + base) as Base].indexOf(chars[e]);
    }
    return result;
  },
};
export const encode_int = (n: number, bits_per_char = 6) => {
  if (bits_per_char === 6) {
    return encode_int64(n);
  }
  if (bits_per_char === 4) {
    return encode_int16(n);
  }
  if (bits_per_char === 2) {
    return encode_int4(n);
  }
  return "";
};
export const decode_int = (n: string, bits_per_char = 6) => {
  if (bits_per_char === 6) {
    return decode_int64(n);
  }
  if (bits_per_char === 4) {
    return decode_int16(n);
  }
  if (bits_per_char === 2) {
    return decode_int4(n);
  }
  return 0;
};
const encode_int64 = (n: number) => {
  return IntConversion.fromNumber(n, 64);
};
const encode_int16 = (n: number) => {
  return IntConversion.fromNumber(n, 16);
};
const encode_int4 = (n: number) => {
  return IntConversion.fromNumber(n, 4);
};
const decode_int64 = (n: string) => {
  return IntConversion.toNumber(n, 64);
};
const decode_int16 = (n: string) => {
  return IntConversion.toNumber(n, 16);
};
const decode_int4 = (n: string) => {
  return IntConversion.toNumber(n, 4);
};
