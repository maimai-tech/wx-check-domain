'use strict';

const Storage = require('node-storage');
const request = require('request');
const querystring = require('querystring');

/**
 * @param {String} appid 在公众平台上申请得到的appid
 * @param {String} appsecret 在公众平台上申请得到的app secret
 * @param {String} path 存储access_token的路径，默认store/access_token
 */
class Checker {
    constructor(appid, appsecret, path) {
        this.appid = appid;
        this.appsecret = appsecret;
        this.store = new Storage('store/access_token');
        this.expires_in = 7200;
    }
    /**
     * 根据appid和app appsecret来获取acess_token
     * return @param {String} 
     */
    async getAccessToken() {
        let query = {
            appid: this.appid,
            secret: this.appsecret,
            grant_type: 'client_credential'
        };
      
        let url = `https://api.weixin.qq.com/cgi-bin/token?${querystring.stringify(query)}`;
        return await this.request(url);
    }
    /**
     * 存储token
     * @param {String} token 
     * @param {String} expires_in 在多少秒内过期，目前是7200秒
     */
    saveToken(token, expires_in) {
        this.store.put('deeply.nested', { access_token: token, expires: (new Date()).getTime() + expires_in * 1000 });
    }
    // 获取token
    getToken() {
        return { ...this.store.get('deeply.nested') };
    }
    /**
     * 检查url是否被封禁
     * @param {String} req_url 检查的url
     */
    async check(req_url) {
        try {
            const { access_token, expires } = this.getToken();
            // 为了避免acess_token过期，将阈值提前10分钟，否则重新获得token
            const paddingTime = 10 * 60 * 1000;
            if (typeof expires !== 'undefined' && ((new Date()).getTime() + paddingTime < expires)) {
                this.access_token = access_token;
            } else {
                const data = await this.getAccessToken();
                this.access_token = data.access_token;
                this.saveToken(this.access_token, data.expires_in);
            }

            let url = await this.createShortUrl(req_url);
            return await this.checkDomainBanned(url);
        } catch(err) {}
    }
    /**
     * 通过微信api生成短链
     * @param {String} req_url 待检测url
     */
    async createShortUrl(req_url) {
        var requestData = {
            "access_token": this.access_token,
            "action": "long2short",
            "long_url": req_url
        }
        const url = `https://api.weixin.qq.com/cgi-bin/shorturl?access_token=${this.access_token}`;
        let body = await this.request(url, {
            method: "POST",
            json: true,
            headers: {
                "content-type": "application/json",
            },
            body: requestData
        });

        return body && body.short_url;
    }
    request(url, options = {}) {
        return new Promise(function(resolve, reject) {
            request(url, options, function(error, response, body) {
                if (!error) {
                    try {
                        let json = {};
                        if (typeof body === 'string') {
                            json = JSON.parse(body);
                        } else if (typeof body === 'object') {
                            json = body;
                        }
                        resolve(json);
                    } catch(err) {
                        reject(err);
                    }
                }
            })
        });
    }
    /**
     * 根据重定向之后的host是否为weixin110.qq.com来检测url是否被微信封禁
     * @param {String} url 待检测短链接url
     */
    checkDomainBanned(url) {
        return new Promise(function (resolve, reject) {
            return request(url, function(err, res, body) {
                if (!err) {
                    if (res && res.request && res.request.uri && res.request.uri.host === 'weixin110.qq.com') {
                        resolve({ code: -1, msg: 'banned' });
                    } else {
                        resolve({ code: 0, msg: 'ok' });
                    }
                } else {
                    reject(err);
                }
            })
        })
    }
}

module.exports = Checker;