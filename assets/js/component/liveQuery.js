'use strict';

const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
const observeSelectors = {};
const observeSelectorCallbacks = {};

export default function liveQuery(selector, callback) {
	const target = this;
	target.liveQueryId ??= ('id' + Math.round(Math.random() * Number.MAX_SAFE_INTEGER));

	const triggerCallbacks = (target) => {
		(observeSelectors[target.liveQueryId] || []).forEach((selector) => {
			const callback = observeSelectorCallbacks[target.liveQueryId][selector];

			target.querySelectorAll(selector).forEach((element) => {
				if (((element.liveQueryReady || {})[target.liveQueryId] || []).includes(selector) === false) {
					element.liveQueryReady = {
						...element.liveQueryReady,
						[target.liveQueryId]: [...((element.liveQueryReady || {})[target.liveQueryId] || []), selector]
					};

					// Invoke the callback with the element
					callback.call(element, element);
				}
			});
		})
	}

	if (observeSelectors[target.liveQueryId] === undefined) {
		const observer = new MutationObserver((mutationsList) => {
			if (observeSelectors[target.liveQueryId] === undefined) {
				return;
			}

			const selectors = observeSelectors[target.liveQueryId].join(',');
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

			if (!hasMatch) {
				return;
			}

			triggerCallbacks(target);
		});

		observer.observe(target, {
			childList: true,
			subtree: true,
			attributes: true
		});
	}

	observeSelectors[target.liveQueryId] = [
		...(observeSelectors[target.liveQueryId] || []),
		selector
	].filter((value, index, array) => array.indexOf(value) === index);

	observeSelectorCallbacks[target.liveQueryId] = {
		...(observeSelectorCallbacks[target.liveQueryId] || {}),
		[selector]: callback
	};

	triggerCallbacks(target);
}

Node.prototype.liveQuery = liveQuery;
