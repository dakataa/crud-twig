(function () {
    const XMLHttpRequestSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
        this.addEventListener('loadend', responseHandler);
        return XMLHttpRequestSend.apply(this, arguments)
    };

    XMLHttpRequest.prototype.sendAndValidate = function (body, form, options) {
        this.addEventListener('loadend', (e) => validateResponse(e, form, options));
        return XMLHttpRequestSend.apply(this, arguments)
    };

    window.onsubmit = submit;

    function submit(e) {
        if (!e.target.hasAttribute('data-ajax')) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        let form = e.target,
            method = form.method || 'POST',
            action = form.action || location.href,
            options = getFormOptions(form);

        // Form already submitted
        if (form.dataset.submitted) {
            return;
        }

        // Disable buttons
        form.querySelectorAll('button[type="submit"]').forEach(function (btn) {
            btn.dataset.text = btn.innerHTML;
            btn.dataset.disabled = btn.disabled;
            btn.classList.add('disabled');
            btn.disabled = true;
            btn.innerHTML = '&nbsp;';

            let loader = document.createElement('span');
            loader.classList.add('loader');
            btn.appendChild(loader);
        });

        const buildFormData = function (form) {
            let items = [];
            form.querySelectorAll('input, select, textarea').forEach(function (node) {
                if (items[node.name] === undefined) {
                    items[node.name] = null;
                }

                switch (node.nodeName) {
                    case 'INPUT': {
                        switch (node.type) {
                            case 'radio':
                            case 'checkbox': {
                                if (!node.checked) {
                                    break;
                                }
                                items.push({name: node.name, value: node.value});
                                break;
                            }
                            case 'file': {

                                break;
                            }
                            default: {
                                items.push({name: node.name, value: node.value});
                            }
                        }

                        break;
                    }
                    case 'SELECT':
                    case 'TEXTAREA': {
                        items.push({name: node.name, value: node.value});
                        break;
                    }
                }
            });

            return items.map(function (i) {
                return i.name + '=' + encodeURIComponent(i.value).replace(/%20/g, '+');
            }).join('&');
        };

        let headers = [
            {name: 'x-requested-with', value: 'XMLHttpRequest'}
        ];

        let formData = window.FormData !== undefined ? new FormData(form) : buildFormData(form);

        //Headers
        if (options.contentTarget) {
            headers.push({name: 'ajax-validator', value: 'html'});
        }

        if (options.submit === true && options.callback === false) {
            headers.push({name: 'ajax-validator-submit', value: 'true'});
        }

        if (options.callback === true) {
            headers.push({name: 'ajax-validator-callback', value: 'true'})
        }

        form.dispatchEvent(new CustomEvent('start'));

        let xhr = new XMLHttpRequest();
        xhr.open(method, action, true);

        headers.forEach(function (header) {
            xhr.setRequestHeader(header.name, header.value);
        });

        xhr.onerror = function (e) {
            if (options.callbackError) {
                if (window[options.callbackError] !== undefined) {
                    window[options.callbackError].call();
                }
            }

            form.dispatchEvent(new CustomEvent('error'));
        };

        xhr.onloadend = function (e) {
            if (this.getResponseHeader('content-type') === 'application/json') {
                return false;
            }

            const responseContent = new DOMParser().parseFromString(this.response, 'text/html');
            if (!options.contentTarget) {
                responseContent.querySelectorAll('form').forEach(function (node) {
                    if (!node.hasAttribute('name')) {
                        return false;
                    }

                    let form = document.querySelector('form[name="' + node.name + '"]');
                    if (form) {
                        form.parentNode.removeChild(form).append(node);
                    }
                });
            } else {
                let contentElement = document.querySelector(options.contentTarget);
                if (contentElement) {
                    //Replace or Append Ajax Response content
                    let responseContentElement = responseContent.querySelector(options.contentTarget);
                    if (responseContentElement) {
                        contentElement.replaceWith(responseContentElement);
                    } else {
                        contentElement.replaceWith(responseContent);
                    }
                }
            }

            form.dispatchEvent(new CustomEvent('success'));

            //Callback
            if (options.callback) {
                if (window[options.callback] !== undefined) {
                    window[options.callback].call();
                }
            } else {
                document.open();
                document.write(this.response);
                document.close();
            }
        };

        form.dataset.submitted = 'true';
        xhr.sendAndValidate(formData, form, options);
    }

    const responseHandler = (e) => {
        if (!e.target.getResponseHeader("ajax-validator")) {
            return;
        }

        validateResponse(e);
    }


    const validateResponse = (e, formNode, options) => {
        let request = e.target;
        if (request.withCredentials) {
            return;
        }

        switch (request.getResponseHeader('content-type')) {
            case 'application/json': {
                // Clear previous errors
                clearValidatorErrors();

                let json;
                if (request.responseType === 'json') {
                    json = request.response;
                } else {
                    json = JSON.parse(request.response);
                }

                const processForm = (formNode, json, options) => {
                    let action = formNode.action || location.href,
                        formFieldId = formNode.name,
                        hasErrors = false;

                    options = options || getFormOptions(formNode);
                    if (json.errors && json.errors[formFieldId] && Object.keys(json.errors[formFieldId]).length) {
                        validatorError(formNode, formFieldId, json.errors[formFieldId]);
                        hasErrors = true;

                        //Callback ERROR
                        if (options.callbackErr) {
                            if (typeof window[options.callbackErr] === 'function') {
                                window[options.callbackErr].call(this, json);
                            }
                        }

                        formNode.dispatchEvent(new CustomEvent('error', {detail: json}));

                        // Enable buttons
                        formNode.querySelectorAll('button[type="submit"]').forEach(function (btn) {
                            let data = getDataset(btn);
                            btn.classList.remove('disabled');
                            btn.disabled = btn.dataset.disabled === 'true';
                            if (data.text) {
                                btn.innerHTML = data.text;
                            }

                            // remove loader
                            btn.querySelectorAll('.loader').forEach((i) => i.remove());
                        });

                        delete formNode.dataset.submitted;
                    } else {
                        let objectData = (json.data || json);
                        if (!options.callback) {
                            if (hasErrors === false && (options.refresh === true || options.submit === true)) {
                                if (action && options.submit === true) {
                                    document.onsubmit = null;
                                    formNode.submit();
                                } else if (options.refresh) {
                                    location.reload();
                                }
                            }
                        } else if (!hasErrors) {
                            if (window[options.callback] !== undefined) {
                                window[options.callback].call(this, objectData);
                            }
                        }

                        try {
                            formNode.dispatchEvent(new CustomEvent('success', {detail: objectData}));
                        } catch (e) {
                            console.log('Error in event listener callback');
                        }

                    }
                }

                if (formNode) {
                    processForm(formNode, json, options)
                } else {
                    if (json.errors === undefined) {
                        return;
                    }

                    for (let formFieldId in json.errors) {
                        let node = document.querySelector("[id^='" + formFieldId + "_']");
                        let formNode = node.parentNode;

                        while (formNode && formNode.tagName.search(/FORM|DOCUMENT/) === -1) {
                            formNode = formNode.parentNode;
                        }

                        if (!formNode || formNode.tagName !== 'FORM') {
                            return;
                        }

                        if (!json.errors.hasOwnProperty(formFieldId)) {
                            continue;
                        }

                        processForm(formNode, json, options)
                    }
                }
                break;
            }
            default: {

            }
        }
    }

    function getDataset(node) {
        let data = {};
        Object.keys(node.dataset).map(function (key) {
            let v = node.dataset[key];
            data[key] = v === 'true' ? true : v === 'false' ? false : v;
        });
        return data;
    }

    function getFormOptions(form) {
        let data = getDataset(form);
        return {
            refresh: (data.refresh === undefined) ? true : data.refresh,
            submit: (data.submit === undefined) ? true : data.submit,
            callback: (data.callback === undefined) ? false : ((window[data.callback] !== undefined) ? data.callback : false),
            callbackErr: (data.callbackError === undefined) ? false : ((window[data.callbackError] !== undefined) ? data.callbackError : false),
            alerts: (data.alerts === undefined) ? true : data.alerts,
            notices: (data.notices === undefined) ? true : data.notices,
            gotoError: (data.gotoError === undefined) ? true : data.gotoError,
            contentTarget: (data.contentTarget === undefined) ? false : data.contentTarget,
        };
    }

    function clearValidatorErrors() {
        document.querySelectorAll('.form-global-error-tag, .form-control-error-tag').forEach(function (node) {
            node.parentNode.removeChild(node);
        });

        document.querySelectorAll('.form-control-error').forEach(function (node) {
            node.classList.remove('form-control-error');
        });
    }

    function validatorError(formNode, formFieldId, messages) {
        for (let messagesKey in messages) {
            if (!messages.hasOwnProperty(messagesKey)) {
                continue;
            }

            let key = formFieldId + '_' + messagesKey,
                message = messages[messagesKey];

            if (typeof message == 'object') {
                validatorError(formNode, messagesKey, message);
                continue;
            }

            addError(formNode, key, message);
        }
    }

    function addError(formNode, formFieldId, message) {
        // let nodes = formNode.querySelectorAll('[id=' + formFieldId + '], input[type="checkbox"][id^=' + formFieldId + '], input[type="radio"][id^=' + formFieldId + ']');
        let nodes = formNode.querySelectorAll('[id=' + formFieldId + ']');

        if (nodes.length) {
            let node = nodes[0];
            let errorMessageNode = formNode.querySelector('#' + node.id + '_error');

            // Mark node as errors
            nodes.forEach(function (n) {
                n.classList.add('form-control-error');
            });

            if (!errorMessageNode) {
                errorMessageNode = document.createElement('div');
                errorMessageNode.id = node.id + '_error';
                errorMessageNode.textContent = message;

                switch (node.tagName.toLowerCase()) {
                    case 'input': {
                        switch (node.type) {
                            case 'radio':
                            case 'checkbox':
                                node.parentNode.parentNode.insertBefore(errorMessageNode, node.parentNode.nextSibling);
                                break;
                            default:
                                node.parentNode.insertBefore(errorMessageNode, node.nextSibling);
                                break;
                        }
                        break;
                    }
                    default: {
                        node.parentNode.insertBefore(errorMessageNode, node.nextSibling);

                        break;
                    }
                }
            }

            errorMessageNode.classList.add('form-control-error-tag');
            errorMessageNode.innerHTML = message;
        } else {
            // Unknown or global errors
            let errorMsgsHolderNode = formNode.querySelector('.form-global-error-tag');
            if (!errorMsgsHolderNode) {
                errorMsgsHolderNode = document.createElement('div');
                errorMsgsHolderNode.classList.add('form-global-error-tag');

                formNode.insertBefore(errorMsgsHolderNode, formNode.firstChild);
            }

            let errorMsgNode = document.createElement('div');
            errorMsgNode.innerText = message;
            errorMsgsHolderNode.append(errorMsgNode);
        }
    }
})();
