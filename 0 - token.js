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


// let tokenData = genTokenData()
let tokenData = {"tokenId":"17000000","hash":"0x659faac3bf06950f6f1604811936d6f35a74d2b5047bcc46a1dc961b57bb0c34"}
// let tokenData = {hash: '0xae853e338bab336fef7a9175ed1cfeaf94265ffe9c8242d8e65e65f89f002440', tokenId: 'NaN'}