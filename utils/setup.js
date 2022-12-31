function initP5(webgl = false, ratio) {
    if (ratio){
        if (windowWidth < windowHeight * ratio) {
            createCanvas(windowWidth, windowWidth / ratio, webgl ? WEBGL : null)
        } else {
            createCanvas(windowHeight * ratio, windowHeight, webgl ? WEBGL : null)
        }
    } else {
        canvas = createCanvas(windowWidth, windowHeight, webgl ? 'webgl' : 'p2d');
    }
    setAttributes('willReadFrequently', true);
    PS = width / 650
    noiseSeed(round_random(1000))
    angleMode(DEGREES)
    V = createVector

    paper.setup();
}
