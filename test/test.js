var WxCheckDomain = require('../index.js');
let checker = new WxCheckDomain('wxae883d2a66a6d334', '91a13cc75d69f78600532f7c14c68e3c');

(async function() {
    let result = await checker.check('http://www.epochtimes.com/');
    console.log('==== http://www.epochtimes.com/ ', result);

    let result1 = await checker.check('http://www.maimai.cn');
    console.log('==== http://www.maimai.cn/ ', result1);
})()
