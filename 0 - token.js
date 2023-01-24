function genTokenData(projectNum) {
    let data = {};
    let hash = "0x";
    for (var i = 0; i < 64; i++) {
        hash += Math.floor(Math.random() * 16).toString(16);
    }
    data.hash = hash;
    data.tokenId = (projectNum * 1000000 + Math.floor(Math.random() * 1000)).toString();
    return data;
}


let tokenData = genTokenData()
// let tokenData = {"tokenId":"17000000","hash":"0x8c114b1c0adf1d7fbdcae0bd85d35ce2d6161e8df9999327bf3d1458d3ee0a70"}
// let tokenData = {hash: '0xae853e338bab336fef7a9175ed1cfeaf94265ffe9c8242d8e65e65f89f002440', tokenId: 'NaN'}