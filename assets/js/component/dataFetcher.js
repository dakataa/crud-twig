'use strict';

import logger from "./logger";
import Requester, {RequestBodyType} from "@dakataa/requester";

Requester.defaults = {
	baseURL: document.location.href
};

let queue = {},
	request = {};

export default async function fetchUrl(url, container, mode, callback, callbackError, changeUrl, method, requestData, headers) {
	headers = headers || [];
	requestData = requestData || null;
	method = (method || 'get').toUpperCase();
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
		data: requestData,
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

	request[url] = new AbortController();
	let contentType = null,
		status = 0,
		json = false,
		redirected = false;

	let response = null;
	return (new Requester({
		headers: allHeader
	})).fetch({
		url,
		method,
		body: ['POST', 'PUT'].includes(method) ? requestData : null,
		query: ['GET'].includes(method) ? requestData : null,
		signal: request[url]?.signal}).then((r) => {
		response = r;
		return r.getData()
	}).then((data) => {
			delete request[url];

			status = response.status;
			redirected = response.redirected ? response.url : false;
			contentType = (response.getHeaders().get('content-type') || 'text/html').split(';').shift();
			json = contentType === 'application/json';

			return data;
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
								const template = document.createElement('template');
								template.innerHTML = data;
								container.replaceWith(template.content);
								break;
							default:
								container.innerHTML = data;
						}

					} else {

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
							if (redirected) {
								document.location.href = redirected;
								break;
							}
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
