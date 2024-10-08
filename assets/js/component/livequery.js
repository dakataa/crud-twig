'use strict';

const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
const observeSelectors = {};
const observeSelectorCallbacks = {};


export default function liveQuery(selector, callback) {
	const target = this;

	const triggerCallbacks = (target) => {
		(observeSelectors[target] || []).forEach((selector) => {
			const callback = observeSelectorCallbacks[target][selector];

			target.querySelectorAll(selector).forEach((element) => {
				if ((element.liveQueryReady || []).includes(selector) === false) {
					element.liveQueryReady = element.liveQueryReady || [];
					element.liveQueryReady.push(selector);

					// Invoke the callback with the element
					callback.call(element, element);
				}
			});
		})
	}
	const observer = new MutationObserver((mutationsList) => {
		if(observeSelectors[target] === undefined) {
			return;
		}

		const selectors = observeSelectors[target].join(',');
		let hasMatch = false;
		mutationsList.forEach(function (mutationRecord) {
			switch (mutationRecord.type) {
				case 'attributes':
				case 'childList': {
					hasMatch = mutationRecord.target.matches(selectors) || mutationRecord.target.querySelector(selectors);
					break;
				}
			}
		});

		if(!hasMatch) {
			return;
		}

		triggerCallbacks(target);
	});

	if(observeSelectors[target] === undefined) {
		observer.observe(target, {
			childList: true,
			subtree: true,
			attributes: true
		});
	}

	observeSelectors[target] = [...(observeSelectors[target] || []), selector].filter((value, index, array) => array.indexOf(value) === index);
	observeSelectorCallbacks[target] = {...(observeSelectorCallbacks[target] || {}), [selector]: callback};

	triggerCallbacks(target);
}

Node.prototype.liveQuery = liveQuery;
