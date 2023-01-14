projections = [
  (x, y) => {
    x *= -1
    let r = sqrt(x * x + y * y) * 2
    r = easeOutQuad_reverse(r) / 2
    const a = atan2(y, x)
    if (r > .5 || !r) return null

    const lat = r * 180 - 90;
    const long = a
    return V(lat, long)
  }, (x, y) => {
    const lat = y * 180
    const long = x * 360
    if (abs(lat) > 90 || abs(long) > 180) return null
    return V(lat, long)
  }, (x, y) => {
    x *= -1
    y = (y + .25) / 1.5
    let r = sqrt(x * x + y * y)
    r = (r - 0.05) / 0.45
    r = easeOutQuad_reverse(r)
    const lat = r * 180 - 90

    if (r < .0 || !r) return null

    const a = ((atan2(y, x) + 360) % 360)
    let long = null
    if (a < 200) long = ((a + 20) / 220) * 360 - 180
    if (a > 340) long = ((a - 340) / 220) * 360 - 180
    if (!long) return null
    return V(lat, long)
  }, (origx, origy) => {
    x = origx * pi * 2
    y = origy * halfPi * 2.5
    var delta;
    var sy = sign(y);
    y = abs(y) / pi;
    var x1 = sign(x) * x / halfPi,
      D = (x1 * x1 - 1 + 4 * y * y) / abs(x1),
      D2 = D * D,
      B = y * (2 - (y > 0.5 ? min(y, abs(x)) : 0)),
      r = x * x + y * y,
      i = 50;
    do {
      var B2 = B * B,
        C = (8 * B - B2 * (B2 + 2) - 5) / (2 * B2 * (B - 1)),
        C_ = (3 * B - B2 * B - 10) / (2 * B2 * B),
        C2 = C * C,
        BC = B * C,
        B_C = B + C,
        B_C2 = B_C * B_C,
        B_3C = B + 3 * C,
        F = B_C2 * (B2 + C2 * D2 - 1) + (1 - B2) * (B2 * (B_3C * B_3C + 4 * C2) + C2 * (12 * BC + 4 * C2)),
        F_ = -2 * B_C * (4 * BC * C2 + (1 - 4 * B2 + 3 * B2 * B2) * (1 + C_) + C2 * (-6 + 14 * B2 - D2 + (-8 + 8 * B2 - 2 * D2) * C_) + BC * (-8 + 12 * B2 + (-10 + 10 * B2 - D2) * C_)),
        sqrtF = sqrt(F),
        f = D * (B_C2 + C2 - 1) + 2 * sqrtF - x1 * (4 * B_C2 + D2),
        f_ = D * (2 * C * C_ + 2 * B_C * (1 + C_)) + F_ / sqrtF - 8 * B_C * (D * (-1 + C2 + B_C2) + 2 * sqrtF) * (1 + C_) / (D2 + 4 * B_C2);
      B -= delta = f / f_;
    } while (delta * r * r > epsilon && --i > 0);

    let lon = sign(x) * (sqrt(D * D + 4) + D) * pi / 4
    let lat = sy * halfPi * B
    lat = (lat / halfPi) * 90
    lon = (lon / pi) * 180
    if (!lat || !lon) return null
    if (abs(lat) > 90 || abs(lon) > 180) return null
    return V(lat, lon);
  }, (origx, origy) => {
    if (abs(origy) > .45) return null
    x = origx * pi * 2
    y = origy * halfPi * 2
    var phi = y, i = 25, delta, phi2, phi4, phi6;
    do {
      phi2 = phi * phi; phi4 = phi2 * phi2;
      phi -= delta = ((phi * (1.01183 + phi4 * phi4 * (-0.02625 + 0.01926 * phi2 - 0.00396 * phi4))) - y) /
        (1.01183 + phi4 * phi4 * ((9 * -0.02625) + (11 * 0.01926) * phi2 + (13 * -0.00396) * phi4));
    } while (abs(delta) > epsilon2 && --i > 0);
    phi2 = phi * phi; phi4 = phi2 * phi2; phi6 = phi2 * phi4;

    let lon = x / (0.84719 - 0.13063 * phi2 + phi6 * phi6 * (-0.04515 + 0.05494 * phi2 - 0.02326 * phi4 + 0.00331 * phi6)),
      lat = phi
    lat = (lat / halfPi) * 90
    lon = (lon / pi) * 180
    if (abs(lat) > 90 || abs(lon) > 180) return null
    return V(lat, lon);
  }, (x, y) => {
    x *= 2
    y *= 2
    const lat = y * 90
    const w = sqrt(1 - abs(y) ** 2) / 2
    let lon = 200
    lon = map(abs(x), .5 - w, .5 + w, 0, 180)
    if (lon > 180 || lon < 0) return null
    if (abs(lat) > 90 || abs(lon) > 180) return null
    lon *= sign(x)
    return V(lat, lon);
  }, (origx, origy) => {
    const x = origx * pi * 2
    const y = origy * halfPi * 2.5
    const z = sqrt(x * x + y * y),
      c = 2 * asin(z / 2),
      sc = sin(c),
      cc = cos(c);
    let lon = atan2(x * sc, z * cc),
      lat = asin(z && y * sc / z)
    if (abs(lat) > 90 || abs(lon) > 180) return null
    if (!lat && !lon) return null
    return V(lat, lon);
  },
]












function ellipticJi(u, v, m) {
  var a, b, c;
  if (!u) {
    b = ellipticJ(v, 1 - m);
    return [
      [0, b[0] / b[1]],
      [1 / b[1], 0],
      [b[2] / b[1], 0]
    ];
  }
  a = ellipticJ(u, m);
  if (!v) return [[a[0], 0], [a[1], 0], [a[2], 0]];
  b = ellipticJ(v, 1 - m);
  c = b[1] * b[1] + m * a[0] * a[0] * b[0] * b[0];
  return [
    [a[0] * b[2] / c, a[1] * a[2] * b[0] * b[1] / c],
    [a[1] * b[1] / c, -a[0] * a[2] * b[0] * b[2] / c],
    [a[2] * b[1] * b[2] / c, -m * a[0] * a[1] * b[0] / c]
  ];
}

function ellipticJ(u, m) {
  var ai, b, phi, t, twon;
  if (m < epsilon) {
    t = sin(u);
    b = cos(u);
    ai = m * (u - t * b) / 4;
    return [
      t - ai * b,
      b + ai * t,
      1 - m * t * t / 2,
      u - ai
    ];
  }
  if (m >= 1 - epsilon) {
    ai = (1 - m) / 4;
    b = cosh(u);
    t = tanh(u);
    phi = 1 / b;
    twon = b * sinh(u);
    return [
      t + ai * (twon - u) / (b * b),
      phi - ai * t * phi * (twon - u),
      phi + ai * t * phi * (twon + u),
      2 * atan(exp(u)) - halfPi + ai * (twon - u) / b
    ];
  }

  var a = [1, 0, 0, 0, 0, 0, 0, 0, 0],
    c = [sqrt(m), 0, 0, 0, 0, 0, 0, 0, 0],
    i = 0;
  b = sqrt(1 - m);
  twon = 1;

  while (abs(c[i] / a[i]) > epsilon && i < 8) {
    ai = a[i++];
    c[i] = (ai - b) / 2;
    a[i] = (ai + b) / 2;
    b = sqrt(ai * b);
    twon *= 2;
  }

  phi = twon * a[i] * u;
  do {
    t = c[i] * sin(b = phi) / a[i];
    phi = (asin(t) + phi) / 2;
  } while (--i);

  return [sin(phi), t = cos(phi), t / cos(phi - b), phi];
}

function ellipticFi(phi, psi, m) {
  var r = abs(phi),
    i = abs(psi),
    sinhPsi = sinh(i);
  if (r) {
    var cscPhi = 1 / sin(r),
      cotPhi2 = 1 / (tan(r) * tan(r)),
      b = -(cotPhi2 + m * (sinhPsi * sinhPsi * cscPhi * cscPhi) - 1 + m),
      c = (m - 1) * cotPhi2,
      cotLambda2 = (-b + sqrt(b * b - 4 * c)) / 2;
    return [
      ellipticF(atan(1 / sqrt(cotLambda2)), m) * sign(phi),
      ellipticF(atan(sqrt((cotLambda2 / cotPhi2 - 1) / m)), 1 - m) * sign(psi)
    ];
  }
  return [
    0,
    ellipticF(atan(sinhPsi), 1 - m) * sign(psi)
  ];
}

function ellipticF(phi, m) {
  if (!m) return phi;
  if (m === 1) return log(tan(phi / 2 + quarterPi));
  var a = 1,
    b = sqrt(1 - m),
    c = sqrt(m);
  for (var i = 0; abs(c) > epsilon; i++) {
    if (phi % pi) {
      var dPhi = atan(b * tan(phi) / a);
      if (dPhi < 0) dPhi += pi;
      phi += dPhi + ~~(phi / pi) * pi;
    } else phi += phi;
    c = (a + b) / 2;
    b = sqrt(a * b);
    c = ((a = c) - b) / 2;
  }
  return phi / (pow(2, i) * a);
}










var abs = Math.abs;
var atan = Math.atan;
var atan2 = Math.atan2;
var ceil = Math.ceil;
var cos = Math.cos;
var exp = Math.exp;
var floor = Math.floor;
var log = Math.log;
var max = Math.max;
var min = Math.min;
var pow = Math.pow;
var round = Math.round;
var sign = Math.sign || function (x) { return x > 0 ? 1 : x < 0 ? -1 : 0; };
var sin = Math.sin;
var tan = Math.tan;

var epsilon = 1e-6;
var epsilon2 = 1e-12;
var pi = Math.PI;
var halfPi = pi / 2;
var quarterPi = pi / 4;
var sqrt1_2 = Math.SQRT1_2;
var sqrt2 = sqrt(2);
var sqrtPi = sqrt(pi);
var tau = pi * 2;
var degrees = 180 / pi;
var radians = pi / 180;

function sinci(x) {
  return x ? x / Math.sin(x) : 1;
}

function asin(x) {
  return x > 1 ? halfPi : x < -1 ? -halfPi : Math.asin(x);
}

function acos(x) {
  return x > 1 ? 0 : x < -1 ? pi : Math.acos(x);
}

function sqrt(x) {
  return x > 0 ? Math.sqrt(x) : 0;
}

function tanh(x) {
  x = exp(2 * x);
  return (x - 1) / (x + 1);
}

function sinh(x) {
  return (exp(x) - exp(-x)) / 2;
}

function cosh(x) {
  return (exp(x) + exp(-x)) / 2;
}

function arsinh(x) {
  return log(x + sqrt(x * x + 1));
}

function arcosh(x) {
  return log(x + sqrt(x * x - 1));
}