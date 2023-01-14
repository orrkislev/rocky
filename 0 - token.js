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

// tokenData = { 
//     "tokenId": "105000005", 
//     "hash": "0xacc833ab3681f6b48f31cf4c0b295cc77880bf5bf80137b455acdf539bb76ac9" 
// }

// let tokenData = {"tokenId":"105000001","hash":"0x5e630052cc861cbed3928913322dfe979ce845eb118152f21dcb551e90b5b181"}
// let tokenData = {"tokenId":"105000056","hash":"0x942f86dc03a96530ba428eed453ac0b7df92fdd450d5f05fb735b4407aec0ed5"}