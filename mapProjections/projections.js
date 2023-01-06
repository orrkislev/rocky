function coordToVector(lat, long, radius) {
    const x = -radius * cos(lat) * cos(long)
    const y = radius * sin(lat)
    const z = radius * cos(lat) * sin(long)
    return V(x, y, z)
}

function vectorToCoord(x, y, z) {
    const lat = asin(y / sqrt(x * x + y * y + z * z))
    const long = atan2(z, x)
    return { lat, long }
}

const azimuthalProjection = {
    name: 'azimuthal',
    toPlane: (lat, log) => {
        let r = map(lat, -90, 90, 0, 1)
        r = easeOutQuad(r) / 2
        const a = map(log, -180, 180, 0, 360)
        const x = r * cos(a)
        const y = r * sin(a)
        return new Point(x, y)
    },
    toSphere: (x, y) => {
        x *= -1
        let r = sqrt(x * x + y * y) * 2
        r = easeOutQuad_reverse(r) / 2
        const a = atan2(y, x)
        if (r > .5 || !r) return null
        const lat = map(r, 0, .5, -90, 90)
        const long = a
        return new Point(lat, long)
    }
}

const cylindricProjection = {
    name: 'cylindric',
    toPlane: (lat, log) => {
        const x = map(log, -180, 180, -.5, .5)
        const y = map(lat, -90, 90, -.5, .5)
        return new Point(x, y)
    },
    toSphere: (x, y) => {
        const lat = map(y, -.5, .5, -90, 90)
        const long = map(x, -.5, .5, -180, 180)
        return new Point(lat, long)
    }
}

const conicProjection = {
    name: 'conic',
    toPlane: (lat, log) => {
        let r = map(lat, -90, 90, 0, 1)
        r = easeOutQuad(r)
        r = map(r, 0, 1, .05, .5)
        const a = map(log, -180, 180, -20, 200)
        const x = r * cos(a)
        const y = r * sin(a) * 1.5 - .25
        return new Point(x, y)
    },
    toSphere: (x, y) => {
        x *= -1
        y = (y + .25) / 1.5
        let r = sqrt(x * x + y * y)
        r = map(r, .05, .5, 0, 1)
        r = easeOutQuad_reverse(r)
        const lat = map(r, 0, 1, -90, 90)

        if (r < .0 || !r) return null

        const a = ((atan2(y, x) + 360) % 360)
        let long = null
        if (a < 200) long = map(a, -20, 200, -180, 180)
        if (a > 340) long = map(a - 360, -20, 200, -180, 180)
        if (!long) return null
        return new Point(lat, long)
    }
}

const vanDerGrintenProjection = {
    name: 'vanDerGrinten',
    toPlane: (lat, lon) => {
        const phi = radians(lat),
            lambda = radians(lon)
        if (!phi) return new Point(lambda, 0);
        var phi0 = abs(phi);
        if (!lambda || phi0 === halfPi) return new Point(0, phi);
        var B = phi0 / halfPi,
            B2 = B * B,
            C = (8 * B - B2 * (B2 + 2) - 5) / (2 * B2 * (B - 1)),
            C2 = C * C,
            BC = B * C,
            B_C2 = B2 + C2 + 2 * BC,
            B_3C = B + 3 * C,
            lambda0 = lambda / halfPi,
            lambda1 = lambda0 + 1 / lambda0,
            D = sign(abs(lambda) - halfPi) * sqrt(lambda1 * lambda1 - 4),
            D2 = D * D,
            F = B_C2 * (B2 + C2 * D2 - 1) + (1 - B2) * (B2 * (B_3C * B_3C + 4 * C2) + 12 * BC * C2 + 4 * C2 * C2),
            x1 = (D * (B_C2 + C2 - 1) + 2 * sqrt(F)) / (4 * B_C2 + D2);

        let x = sign(lambda) * halfPi * x1
        let y = sign(phi) * halfPi * sqrt(1 + D * abs(x1) - x1 * x1)
        x = map(x, -pi, pi, -.5, .5)
        y = map(y, -halfPi, halfPi, -.4, .4)
        return new Point(x, y)
    },
    toSphere: (origx, origy) => {
        x = map(origx, -.5, .5, -pi, pi)
        y = map(origy, -.4, .4, -halfPi, halfPi)
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
        lat = map(lat, -halfPi, halfPi, -90, 90)
        lon = map(lon, -pi, pi, -180, 180)
        if (!lat || !lon) return null
        if (abs(lat) > 90 || abs(lon) > 180) return null
        return new Point(lat, lon);
    }
}

const naturalEarthProjection = {
    name: 'naturalEarth',
    toPlane: (lat, lon) => {
        const phi = radians(lat),
            lambda = radians(lon)

        var phi2 = phi * phi, phi4 = phi2 * phi2, phi6 = phi2 * phi4;
        let x = lambda * (0.84719 - 0.13063 * phi2 + phi6 * phi6 * (-0.04515 + 0.05494 * phi2 - 0.02326 * phi4 + 0.00331 * phi6))
        let y = phi * (1.01183 + phi4 * phi4 * (-0.02625 + 0.01926 * phi2 - 0.00396 * phi4))
        x = map(x, -pi, pi, -.5, .5)
        y = map(y, -halfPi, halfPi, -.5, .5)
        return new Point(x, y)
    },
    toSphere: (origx, origy) => {
        if (abs(origy) > .45) return null
        x = map(origx, -.5, .5, -pi, pi)
        y = map(origy, -.5, .5, -halfPi, halfPi)
        var phi = y, i = 25, delta, phi2, phi4, phi6;
        do {
            phi2 = phi * phi; phi4 = phi2 * phi2;
            phi -= delta = ((phi * (1.01183 + phi4 * phi4 * (-0.02625 + 0.01926 * phi2 - 0.00396 * phi4))) - y) /
                (1.01183 + phi4 * phi4 * ((9 * -0.02625) + (11 * 0.01926) * phi2 + (13 * -0.00396) * phi4));
        } while (abs(delta) > epsilon2 && --i > 0);
        phi2 = phi * phi; phi4 = phi2 * phi2; phi6 = phi2 * phi4;

        let lon = x / (0.84719 - 0.13063 * phi2 + phi6 * phi6 * (-0.04515 + 0.05494 * phi2 - 0.02326 * phi4 + 0.00331 * phi6)),
            lat = phi
        lat = map(lat, -halfPi, halfPi, -90, 90)
        lon = map(lon, -pi, pi, -180, 180)
        if (abs(lat) > 90 || abs(lon) > 180) return null
        return new Point(lat, lon);
    }
}

const doubleAzimuthalProjection = {
    name: 'doubleAzimuthal',
    ratio:2,
    toPlane: (lat, lon) => {
        if (lon == 0) return null
        let y = map(lat, -90, 90, -1, 1)
        let w = sqrt(1 - abs(y) ** 2) / 2
        let x = sign(lon) / 2 + map(abs(lon), 0, 180, -w, w)
        return new Point(x / 2, y / 2)
    },
    toSphere: (x, y) => {
        x *= 2
        y *= 2
        // let lat = map(y, -1, 1, -90, 90)
        const lat = y * 90
        const w = sqrt(1 - abs(y) ** 2) / 2
        let lon = 200
        lon = map(abs(x), .5 - w, .5 + w, 0, 180)
        if (lon > 180 || lon < 0) return null
        if (abs(lat) > 90 || abs(lon) > 180) return null
        lon *= sign(x)
        return new Point(lat, lon);
    }
}

const azimuthalEqualAreaProjection = {
    name: 'azimuthalEqualArea',
    toPlane: (lat, lon) => {
        const phi = radians(lat),
            lambda = radians(lon)
        var z = sqrt(phi * phi + lambda * lambda),
            c = 2 * asin(z / 2),
            sc = sin(c),
            cc = cos(c);
        let x = atan2(phi * sc, z * cc),
            y = asin(z && lambda * sc / z)
        x = map(x, -pi, pi, -.5, .5)
        y = map(y, -halfPi, halfPi, -.4, .4)
        return new Point(x, y)
    },

    toSphere: (origx, origy) => {
        const x = map(origx, -.5, .5, -pi, pi)
        const y = map(origy, -.4, .4, -halfPi, halfPi)
        const z = sqrt(x * x + y * y),
            c = 2 * asin(z / 2),
            sc = sin(c),
            cc = cos(c);
        let lon = atan2(x * sc, z * cc),
            lat = asin(z && y * sc / z)
        if (abs(lat) > 90 || abs(lon) > 180) return null
        if (!lat && !lon) return null
        return new Point(lat, lon);
    },
}