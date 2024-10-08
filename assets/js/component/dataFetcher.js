'use strict';

import logger from "./logger";
import {checkElementVisibility} from '../utils/index'

let queue = {},
    request = {};

const methods = ['get', 'post', 'patch', 'delete'];
export default async function fetchUrl(url, container, mode, callback, callbackError, changeUrl, method, data, headers) {
    headers = headers || [];
    data = data || null;
    method = (method || 'get').toLowerCase();
    method = methods.indexOf(method) !== -1 ? method : methods[0];
    changeUrl = (changeUrl === true || changeUrl === 'true');
    container = container ? container instanceof Node ? container : document.querySelector(container) : null;

    //validate url
    const urlRegexp = /((ftp|http|https):\/\/)?(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@\-\/]))?/;
    if (!urlRegexp.test(url)) {
        return Promise.reject('Invalid Url');
    }

    if (queue[url] !== undefined) {
        if (request[url] instanceof AbortController) {
            // request[url].abort();
            delete request[url];
        }

        delete queue[url];
    }

    queue[url] = {
        container: container,
        mode: mode,
        callback: callback,
        callbackError: callbackError,
        changeUrl: changeUrl,
        method: method,
        data: data,
        headers: headers,
    };

    if (changeUrl && history.pushState) {
        let state = {dataFetcher: queue[url], url: url};
        if (document.location.href !== url) {
            history.pushState(state, '', url);
        } else {
            history.replaceState(state, '', null);
        }
    }

    if (typeof (document) !== "undefined") {
        document.querySelectorAll('[data-page-preloader]').forEach((e) => {
            e.hidden = false;
            e.classList.add('active');
        });
    }

    headers = headers.concat([
        {name: 'x-requested-with', value: 'XMLHttpRequest'}
    ]);

    switch (method) {
        case 'post': {
            //Send the proper header information along with the request
            headers.push({name: 'Content-type', value: 'application/x-www-form-urlencoded'});
        }
    }

    let allHeader = {};
    headers.forEach(function (header) {
        allHeader[header.name] = header.value;
    })

    if (typeof data === "object") {
        data = new URLSearchParams(data || '').toString();
    }

    request[url] = new AbortController();
    let contentType = null,
        status = 0,
        json = false,
		redirected = false;


    return await fetch(url,{
            method: method,
            headers: allHeader,
            body: data || null,
            signal: request[url].signal
        })
        .then(function (response) {
            delete request[url];

            status = response.status;
			redirected = response.redirected ? response.url : false;
            contentType = (response.headers.get('content-type') || 'text/html').split(';').shift();
            switch (contentType) {
                case 'application/json': {
                    json = true;
                    return response.json();
                }
            }

            return response.text();
        })
        .then(function (data) {
            if (typeof (document) !== "undefined") {
                document.querySelectorAll('[data-page-preloader]').forEach((e) => {
                    e.hidden = true;
                    e.classList.remove('active');
                });
            }

            // Delete from queue
            delete queue[url];

            switch (status) {
                case 200: {
                    if (container && !json) {
                        switch (mode) {
                            case 'replace':
                                let template = document.createElement('template');
                                template.innerHTML = data;
                                container.replaceWith(template.content);
                                break;
                            default:
                                container.innerHTML = data;
                        }
                    }

                    if (callback) {
                        if (typeof callback === 'function') {
                            callback(data, contentType);
                        } else if (window[callback] !== undefined) {
                            window[callback].call(this, data, container, contentType);
                        } else {
                            if (callback.indexOf('.') !== -1) {
                                let callbackSplit = callback.split('.'),
                                    callbackObject = callbackSplit[0],
                                    callbackFunc = callbackSplit[1];

                                if (window[callbackObject] !== undefined) {
                                    window[callbackObject][callbackFunc].call(this, data, container, contentType);
                                }

                            }
                        }
                    } else {
						if(redirected) {
							document.location.href = redirected;
							break;
						}
					}

                    // Start next request
                    let queueUrls = Object.keys(queue);
                    if (queueUrls.length) {
                        let nextUrl = queueUrls[0],
                            nextQueue = queue[nextUrl];


                        // return fetchUrl(nextUrl, nextQueue['container'], nextQueue['mode'], nextQueue['callback'], nextQueue.callbackError, nextQueue.changeUrl, nextQueue.method, nextQueue.data, nextQueue.headers);
                    }

                    break;
                }
                case 400:
                case 404:
                case 500: {
                    if (callbackError) {
                        if (typeof callbackError === 'function') {
                            callbackError(data, contentType);
                        } else if (window[callbackError] !== undefined) {
                            window[callbackError].call(this);
                        }
                    }


                    return Promise.reject([data, contentType]);
                }
            }

			container?.dispatchEvent(new CustomEvent('loaded'));

            return Promise.resolve([data, contentType]);
        })
        .catch(function (error) {

			container?.dispatchEvent(new CustomEvent('error'));

            delete request[url];
            if (callbackError) {
                if (typeof callbackError === 'function') {
                    callbackError(data, contentType);
                } else if (window[callbackError] !== undefined) {
                    window[callbackError].call(this);
                } else {
                    callbackError();
                }
            }
        });

};

if (typeof (document) !== "undefined") {
    // Load content with ajax on load
    document.liveQuery('[data-ajax-load]', (el) => {

        const loadData = () => {
            return fetchUrl(el.dataset.ajaxLoad, el, el.dataset.mode, el.dataset.callback, el.dataset.callbackError, el.dataset.changeUrl, el.dataset.method);
        }

        el.addEventListener('reload', loadData);

        checkElementVisibility(el)
            .then(() => {
                return new Promise((resolve, reject) => {
                    const isOk = element => {
                        if (element.dataset.ajaxLoad.search(/\w:\w/gi) === -1) {
                            resolve();
                            return;
                        }

                        setTimeout(() => isOk(element), 100);
                    }

                    isOk(el);
                });
            })
            .then(() => loadData())
            .then(() => {

            })
            .catch((error) => {
            });
    });

    document.liveQuery('[data-toggle="ajax"]', (el) => {
        el.addEventListener('click', function (e) {
            e.preventDefault();

            if (this.dataset.confirm) {
                if (!confirm(el.dataset.confirm)) {
                    return false;
                }
            }

            fetchUrl(el.href, el.dataset.target || null, el.dataset.mode || null, el.dataset.callback || null, el.dataset.callbackError || null, el.dataset.changeurl || false, el.dataset.method || null)
                .then(r => {
                })
                .catch((error) => {
                });

        });
    });
}

if (typeof (window) !== "undefined") {
    window.fetchUrl = fetchUrl;

    const dataFetcherFromUrl = e => {
        e = e || {};
        let historyState = e.state || {};
        if (historyState.dataFetcher === undefined || typeof historyState.dataFetcher !== 'object') {
            return;
        }
        const args = historyState.dataFetcher;

        fetchUrl(document.location.href, args.container, args.mode, args.callback, args.callbackError, false, args.method, args.data, args.headers)
            .then((data) => {

            })
            .catch(() => {
                logger.debug('Error');
            });
    };

    // Back on back button
    window.addEventListener('popstate', dataFetcherFromUrl);
}
