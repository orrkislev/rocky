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
// let tokenData = {"tokenId":"17000000","hash":"0xf0464e4066c050c81081d626f1129e79f7b5cca7829545d412e76ea1393def7b"}