
class PathCreator {
    constructor(w, h, pathType) {
        if (!pathType) pathType = choose(Object.values(PathCreator.pathTypes))
        print('lines', pathType.name)
        this.w = w; this.h = h; this.pathType = pathType

        this.pathType.init(this)

        this.segmentLength = this.w * random(0.001, .01)
        print('segmentLength', this.segmentLength)
        this.pathLengths = choose([null, random(50, 300)])
    }

    createPath(startingPoint) {
        let pos = startingPoint || p(random(this.w), random(this.h))

        this.pathType.initPath(this)

        const path = new Path()
        const l = this.pathLengths || random(50, 300)
        while (path.length < l) {
            const dir = this.pathType.getDirection(this, pos)
            pos = pos.add(dir)
            path.add(pos.x, pos.y)
        }
        path.smooth()
        return path
    }

    static pathTypes = {
        noiseField: {
            name: 'noise field',
            init: pathCreator => pathCreator.noiseScale = pathCreator.w * random(0.02, 0.2),
            initPath: () => { },
            getDirection: (pathCreator, pos) => {
                const n = noise(1000 + pos.x / pathCreator.noiseScale, 1000 + pos.y / pathCreator.noiseScale)
                return pointFromAngle(n * 360, random(pathCreator.segmentLength))
            }
        }, randomWalker: {
            name: 'random walker',
            init: () => { },
            initPath: () => { },
            getDirection: (pathCreator, pos) => pointFromAngle(random(360), pathCreator.segmentLength * random(10))
        }, straightLines: {
            name: 'straight lines',
            init: () => { },
            initPath: pathCreator => pathCreator.direction = random(360),
            getDirection: (pathCreator, pos) => pointFromAngle(pathCreator.direction, random(pathCreator.segmentLength))
        }
    }

}




class PointGenerator {
    constructor(w, h, generatorType, data){
        this.generatorType = generatorType ||choose(Object.values(PointGenerator.generatorTypes))
        this.w = w; this.h = h

        this.generatorType.init(this)
        print('points', this.generatorType.name)
        if (data) this.data = data
    }
    getPoint() {
        return this.generatorType.getPoint(this)
    }


    static generatorTypes = {
        random: {
            name: 'random',
            init: () => { },
            getPoint: (pointGenerator) => p(pointGenerator.w * random(), pointGenerator.h * random())
        },
        grid: {
            name: 'grid',
            init: (pointGenerator) => {
                pointGenerator.data = pointGenerator.w * random(.02, .1)
            },
            getPoint: (pointGenerator) => {
                let y = round_random(0, pointGenerator.h / pointGenerator.data)
                let x = round_random(0, pointGenerator.w / pointGenerator.data)
                return p(x * pointGenerator.data, y * pointGenerator.data)
            }
        },
        hexGrid: {
            name: 'hex grid',
            init: (pointGenerator) => {
                pointGenerator.data = pointGenerator.w * random(.02, .1)
            },
            getPoint: (pointGenerator) => {
                let y = round_random(0, pointGenerator.h / pointGenerator.data)
                let x = round_random(0, pointGenerator.w / pointGenerator.data)
                if (y % 2 == 0) x -= .5
                return p(x * pointGenerator.data, y * pointGenerator.data)
            }
        },
        distribution: {
            name: 'distribution',
            init: (pointGenerator) => {
                pointGenerator.data = pointGenerator.w * random(.1, .5)
                pointGenerator.points = []
            },
            getPoint: (pointGenerator) => {
                if (pointGenerator.points.length == 0) {
                    pointGenerator.points.push(p(random(pointGenerator.w), random(pointGenerator.h)))
                    return pointGenerator.points[0]
                }
                let tries = 0
                while (tries < 100) {
                    const pos = p(random(pointGenerator.w), random(pointGenerator.h))
                    for (const pos2 of pointGenerator.points) {
                        if (pos.getDistance(pos2) < pointGenerator.data) {
                            tries++
                            continue
                        }
                    }
                    pointGenerator.points.push(pos)
                    return pos
                }
            }
        }
    }
}