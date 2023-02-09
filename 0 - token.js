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
tokenData = {hash: '0x8e80e6500f2192bdf3c797bed29f725addef733bcb6f7fadacd272299b885be8', tokenId: 'NaN'}