type BaseNumber = 64 | 16 | 4;
type Base = "Base64" | "Base16" | "Base4";

const IntConversion = {
  // https://stackoverflow.com/questions/6213227/fastest-way-to-convert-a-number-to-radix-64-in-javascript
  Base64: "0123456789@ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz",
  Base16: "0123456789ABCDEF",
  Base4: "0123",
  fromNumber: function (number: bigint, base: BaseNumber) {
    let residual = number;
    let result = "";
    while (true) {
      const digit = Number(BigInt(residual) % BigInt(base));
      result = this[("Base" + base) as Base].charAt(digit) + result;
      residual = BigInt(residual) / BigInt(base);
      if (residual == 0n) break;
    }
    return result;
  },
  toNumber: function (string: string, base: BaseNumber) {
    var result = 0n;
    let chars = string.split("");
    for (var e = 0; e < chars.length; e++) {
      result =
        result * BigInt(base) +
        BigInt(this[("Base" + base) as Base].indexOf(chars[e]));
    }
    return result;
  },
};

export const encode_int = (n: bigint, bits_per_char = 6): string => {
  if (bits_per_char === 6) {
    return IntConversion.fromNumber(n, 64);
  }
  if (bits_per_char === 4) {
    return IntConversion.fromNumber(n, 16);
  }
  if (bits_per_char === 2) {
    return IntConversion.fromNumber(n, 4);
  }
  return "";
};

export const decode_int = (n: string, bits_per_char = 6): bigint => {
  if (bits_per_char === 6) {
    return IntConversion.toNumber(n, 64);
  }
  if (bits_per_char === 4) {
    return IntConversion.toNumber(n, 16);
  }
  if (bits_per_char === 2) {
    return IntConversion.toNumber(n, 4);
  }
  return 0n;
};
