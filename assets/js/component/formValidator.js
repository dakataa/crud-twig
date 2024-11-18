import Requester, {RequestBodyType} from "@dakataa/requester";

(function () {
	window.onsubmit = submit;

	function submit(e) {
		if (!e.target.hasAttribute('data-ajax')) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		const form = e.target,
			method = form.method || 'POST',
			action = form.action || location.href,
			options = getFormOptions(form);

		// Form already submitted
		if (form.submitted) {
			return;
		}

		const toggleButtonLoader = (btn, force) => {
			if(btn.originalAttributes === undefined) {
				btn.originalAttributes = btn.attributes;
				btn.originalInnerHTML = btn.innerHTML;
			}

			const enabled = force !== undefined ? force : btn.hasAttribute('disabled');

			btn.classList.toggle('disabled', !enabled);
			btn.toggleAttribute('disabled', !enabled);

			if(!enabled) {
				let loader = document.createElement('span');
				loader.classList.add('loader');
				btn.innerHTML = '&nbsp';
				btn.appendChild(loader);
			} else {
				btn.innerHTML = btn.originalInnerHTML;
				// remove loader
				btn.querySelectorAll('.loader').forEach((i) => i.remove());
			}
		}

		const toggleForm = (form, force) => {
			new Set([
				...form.querySelectorAll('button[type="submit"]'),
				...document.querySelectorAll('button[type="submit"][form="' + form.name + '"]')
			]).forEach((btn) => toggleButtonLoader(btn, force));

			const submitted = force !== undefined ? force : form.submitted;
			form.submitted = !submitted;
		}

		toggleForm(form);

		const headers = {
			accept: 'application/json'
		};

		//Headers
		if (options.contentTarget) {
			headers['ajax-validator'] = 'html';
		}

		if (options.submit === true && options.callback === false) {
			headers['ajax-validator-submit'] = 'true';
		}

		if (options.callback === true) {
			headers['ajax-validator-callback'] = 'true';
		}

		form.dispatchEvent(new CustomEvent('start'));

		let response = null;
		(new Requester({
			headers: headers
		})).post(action, new FormData(form), RequestBodyType.FormData).then((r) => {
			response = r;
			return r.getData()
		}).then((data) => {
			switch (response.getHeaders().get('content-type')) {
				case 'application/json': {
					// Clear previous errors
					clearValidatorErrors();

					const processForm = (formNode, formView, options) => {
						let action = formNode.action || location.href;

						const updateForm = (formView) => {
							if (!formView.valid) {
								addError(formNode, formView.id, (formView.errors || []));
							}

							Object.values(formView.children || []).forEach((children) => {
								updateForm(children);
							})
						}

						options = options || getFormOptions(formNode);
						if (!formView.valid) {
							updateForm(formView)

							//Callback ERROR
							if (options.callbackErr) {
								if (typeof window[options.callbackErr] === 'function') {
									window[options.callbackErr].call(this, formView);
								}
							}

							formNode.dispatchEvent(new CustomEvent('error', {detail: formView}));

							// Enable buttons
							toggleForm(formNode, true);
						} else {
							let objectData = (formView.data || formView);

							try {
								const isSuccess = formNode.dispatchEvent(new CustomEvent('success', {
									detail: objectData,
									cancelable: true
								}));

								if (isSuccess) {
									if (data.redirect?.url !== undefined) {
										return document.location.href = data.redirect.url
									}

									document.onsubmit = null;
									formNode.submit();
								}
							} catch (e) {
								console.log('Error in event listener callback', e);
							}

						}
					}
					const formData = Object.values(data.form || {}).find((f) => f.view.full_name === form.name);

					if (formData) {
						processForm(form, formData.view, options);
					} else {
						toggleForm(form, true);
					}

					break;
				}
				case 'text/html': {
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
				}
			}

		}).catch((e) => {
			console.log('error', e)
			if (options.callbackError) {
				if (window[options.callbackError] !== undefined) {
					window[options.callbackError].call();
				}
			}

			form.dispatchEvent(new CustomEvent('error'));

			toggleForm(form, true);
		});
	}

	function getDataset(node) {
		const data = {};
		Object.keys(node.dataset).map(function (key) {
			const v = node.dataset[key];
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
			contentTarget: data.contentTarget,
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

	function addError(formNode, formFieldId, messages) {
		if (!messages.length) {
			return;
		}

		let nodes = formNode.querySelectorAll('[id=' + formFieldId + ']');
		const message = messages.map(m => m.message).join(' ');
		if (nodes.length) {
			const node = nodes[0];
			let errorMessageNode = formNode.querySelector('#' + node.id + '_error');

			nodes.forEach((n) => {
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

			const errorMsgNode = document.createElement('div');
			errorMsgNode.innerText = message;
			errorMsgsHolderNode.append(errorMsgNode);
		}
	}
})();
