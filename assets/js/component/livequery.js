'use strict';

let listeners = [],
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver,
    observer = new MutationObserver(observe);

observer.observe(document, {
    childList: true,
    subtree: true
});

export default function ready(selector, fn) {
    let listener = {
        selector: selector,
        fn: fn
    };
    // Store the selector and callback to be monitored
    listeners.push(listener);
    // Check if the element is currently in the DOM
    updateListeners([listener]);
}

function observe(mutationsList) {
    mutationsList = mutationsList || [];
    let selectors = (listeners || []).map(function (e) {
        return e.selector;
    }).join(',')

    if (!selectors.length) {
        return;
    }

    if (mutationsList.length) {
        let hasMatch = false;
        mutationsList.forEach(function (mutationRecord) {
            if (mutationRecord.type === 'childList') {
                if (mutationRecord.target.matches(selectors) || mutationRecord.target.querySelector(selectors)) {
                    hasMatch = true;
                }
            }
        });

        if (!hasMatch) {
            return;
        }
    }

    updateListeners(listeners);
}

function updateListeners(list) {
    // Check the DOM for elements matching a stored selector
    (list || []).forEach(function (listener) {
        // Query for elements matching the specified selector
        document.querySelectorAll(listener.selector).forEach(function (element) {
            if ((element.ready || []).indexOf(listener.selector) === -1) {
                element.ready = element.ready || [];
                element.ready.push(listener.selector);
                // Invoke the callback with the element
                listener.fn.call(element, element);
            }
        });
    });
}

Node.prototype.liveQuery = ready;
