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
// tokenData = {hash: '0x4b56f540dee1c867df3fc0295d2bc6ec3d8791f8bd1e229633be049e470449bb', tokenId: 'NaN'}