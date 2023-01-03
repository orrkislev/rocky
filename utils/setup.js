function initP5(webgl = false, ratio) {
    if (ratio) {
        if (windowWidth < windowHeight * ratio) {
            createCanvas(round(windowWidth), round(windowWidth / ratio), webgl ? WEBGL : null)
        } else {
            createCanvas(round(windowHeight * ratio), round(windowHeight), webgl ? WEBGL : null)
        }
    } else {
        canvas = createCanvas(windowWidth, windowHeight, webgl ? 'webgl' : 'p2d');
    }
    setAttributes('willReadFrequently', true);
    PS = width / 1000
    noiseSeed(round_random(1000))
    angleMode(DEGREES)
    V = createVector

    paper.setup();

}

function preload() {
    initShaders()
}

function initShaders() {
    swirlShader = loadShader('shaders/shader.vert', 'shaders/swirl.frag')
    voronoiShader = loadShader('shaders/shader.vert', 'shaders/voronoi.frag')
}
