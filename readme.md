# 检测域名被微信封禁


## 安装
```
npm i wx-check-domain
```

## 使用
```
var WxCheckDomain = require('wx-check-domain');

let checker = new WxCheckDomain('your app id ', 'your app secret', 'access_token save path');
let result = await checker.check('http://www.epochtimes.com/');
console.log('==== http://www.somebannedsites.com/ ', result); // { code: -1, msg: 'banned' }

let result1 = await checker.check('http://www.maimai.cn');
console.log('==== http://www.maimai.cn/ ', result1); // { code: 0, msg: 'ok' }
```

## CHANGELOG
v1.0.0
* 检测是否被微信封禁
* 本地存储access_token
