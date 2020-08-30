# Hilbert geohashing in Node.js

This repo is basically interoperable Node.JS port of https://github.com/tammoippen/geohash-hilbert/  
Geohash a lng/lat coordinate using hilbert space filling curves.

To install: `npm install hilbert-geohash` (https://www.npmjs.com/package/hilbert-geohash)


Simple encode/decode:
```js
const { encode, decode } = require("hilbert-geohash");

encode(24, 61) // ZWSQ0WSQ0W

decode("ZWSQ0WSQ0W") // { lng: 24.000000078231096, lat: 60.99999996833503 }

```
---
Detailed usage:
```js
const { encode,
	decode,
	decode_exactly,
	hilbert_curve,
	neighbours,
	rectangle } = require("hilbert-geohash");


// encode(lng, lat, precision = 10, bits_per_char = 6)
encode(24, 61) // ZWSQ0WSQ0W

// decode(lng, lat, bits_per_char = 6)
decode("ZWSQ0WSQ0W") // { lng: 24.000000078231096, lat: 60.99999996833503 }

// decode_exactly(lng, lat, bits_per_char = 6)
decode_exactly("ZWSQ0WSQ0W") // {
			     //   lng: 24.000000078231096,
			     //   lat: 60.99999996833503,
			     //   lng_err: 1.6763806343078613e-7,
			     //   lat_err: 8.381903171539307e-8
			     // }

// neighbours(geohash, bits_per_char = 6)
neighbours("ZWSQ0WSQ0W"); // {
		          //   'east': 'ZWSQ0WSQ0X',
		          //   'west': 'ZWSQ0WSQ0o',
		          //   'north': 'ZWSQ0WSQ0i',
		          //   'north-east': 'ZWSQ0WSQ0h',
		          //   'north-west': 'ZWSQ0WSQ0n',
		          //   'south': 'ZWSQ0WSQ0V',
		          //   'south-east': 'ZWSQ0WSQ0Y',
		          //   'south-west': 'ZWSQ0WSQ0p'
		          // }

// rectangle(geohash, bits_per_char = 6)
rectangle("ZWSQ0WSQ0W") // {
			//   "type":"Feature",
			//   "properties": {
			//     "code": "ZWSQ0WSQ0W",
			//     "lng":  24.000000078231096,
			//     "lat":60.99999996833503,
			//     "lng_err":1.6763806343078613e-7,
			//     "lat_err":8.381903171539307e-8,
			//     "bits_per_char":6
			//   },
			//   "bbox": [
			//     23.999999910593033,
			//     60.999999884516,
			//     24.00000024586916,
			//     61.000000052154064
			//   ],
			//   "geometry": {
			//     "type": "Polygon",
			//     "coordinates": [
			//       [
			//         [23.999999910593033,60.999999884516],
			//         [24.00000024586916,60.999999884516],
			//         [24.00000024586916,61.000000052154064],
			//         [23.999999910593033,61.000000052154064],
			//         [23.999999910593033,60.999999884516]
			//       ]
			//     ]
			//   }
			// }

// hilbert_curve(precision, bits_per_char = 6)
hilbert_curve(1); // {
		  //   "type":"Feature",
		  //   "properties": {},
		  //   "geometry": {
		  //     "type":"LineString",
		  //     "coordinates": [
		  //       [-157.5,-78.75],
		  //       .
		  //       .
		  //       .
		  //       [157.5,-78.75]
		  //     ]
		  //   }
		  // }



```
