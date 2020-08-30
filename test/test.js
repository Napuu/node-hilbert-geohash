const { assert, expect } = require('chai');
const rewire = require('rewire');
const { decode, decode_exactly, encode } = require('../lib/index.js');
const { decode_int, encode_int } = require('../lib/conversion.js');
const index = rewire('../lib/index.js');

const lvl_error = index.__get__("lvl_error");

const rand_lng = () => Math.random() * 360 - 180;
const rand_lat = () => Math.random() * 180 - 90;

describe('hilbert', function () {

  describe('decode empty hash', function () {
    for (let i = 2; i <= 6; i += 2) {
      it('should work (bits_per_char = ' + i + ')', function () {
        const decoded = decode('', i);
        assert(decoded.lng === 0);
        assert(decoded.lat === 0);
      });
    }
  });

  describe('encode + decode', () => {
    for (let precision = 1; precision <= 10; precision++) {
      for (let bpc = 2; bpc <= 6; bpc += 2) {
        for (let i = 0; i < 100; i++) {
          const lngIn = rand_lng();
          const latIn = rand_lat();
          const code = encode(lngIn, latIn, precision, bpc);
          const { lng, lat, lng_err, lat_err } = decode_exactly(code, bpc);
          expect(lng).be.closeTo(lngIn, Math.abs(lng_err))
        }
      }
    }
  });

  describe('lvl_error', function () {
    const wholeWorldErr = lvl_error(0);
    it('should work with whole world', () => {
      assert(wholeWorldErr.lng == 180);
      assert(wholeWorldErr.lat == 90);
    });

    let lng_err = 180;
    let lat_err = 90;
    it('should halve error while increasing level', () => {
      for (let lvl = 1; lvl <= 30; lvl++) {
        lng_err /= 2;
        lat_err /= 2;
        const err = lvl_error(lvl);
        assert(err.lng == lng_err);
        assert(err.lat == lat_err);
      }
    });

  });

});


describe('conversion', () => {
  it('encode/decode with random integers', () => {
    for (let bpc = 2; bpc <= 6; bpc += 2) {
      for (let i = 0; i < 100; i++) {
        const rand = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);;
        const code = encode_int(rand, bpc);
        assert(code != rand);
        assert(rand == decode_int(code, bpc));
      }
    }
  }); 
});
