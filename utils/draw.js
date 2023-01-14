allDots = 0
async function drawDotXY(x, y) {
    allDots++
    if (allDots % 1000 == 0) await timeout()
    line(x, y, x, y)
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}