import './component/livequery';
import {checkElementVisibility} from "./utils";

// Alert
window.loadAlertModule = () => new Promise((resolve) => import('@dakataa/bootstrap-alert').then(({default: Alert, Animation, Icon, Size}) => resolve({Alert, Animation, Icon, Size})));

// Data Fetcher
window.loadDataFetcherModule = () => new Promise((resolve) => import('./component/dataFetcher').then(({default: dataFetcher}) => resolve(dataFetcher)));

document.liveQuery('[data-ajax-load]', function (el) {
	window.loadDataFetcherModule().then((dataFetcher) => {
		const loadData = (targetEl, formEl) => {
			let url = targetEl.dataset.ajaxLoad;
			let data = null;
			let method = targetEl.dataset.method;
			if(formEl instanceof HTMLFormElement) {
				url = formEl.hasAttribute('action') ? formEl.action : url;
				method = (formEl.method || method).toUpperCase();
				data = new FormData(formEl);
			}

			return dataFetcher(url, targetEl, targetEl.dataset.mode, targetEl.dataset.callback, targetEl.dataset.callbackError, targetEl.dataset.changeUrl, method, data);
		}

		document.addEventListener('submit', (e) => {
			if(!el.contains(e.target) || !e.target.matches(el.dataset.searchForm)) {
				return;
			}

			e.preventDefault();
			loadData(el, e.target);
		});

		el.addEventListener('reload', (e) => {
			loadData(e.target)
		});

		checkElementVisibility(el)
			.then(() => new Promise((resolve, reject) => {
				const isOk = element => {
					if (element.dataset.ajaxLoad.search(/\w:\w/gi) === -1) {
						resolve();
						return;
					}

					setTimeout(() => isOk(element), 100);
				}

				isOk(el);
			}))
			.then(() => loadData(el))
			.catch((error) => {
				console.log('error', error);
			});

	});
});

window.loadAlertModule().then(({Alert, Animation, Icon, Size}) => {
	document.liveQuery('[data-toggle="ajax"]', function (el) {
		window.loadDataFetcherModule().then((dataFetcher) => {
			el.addEventListener('click', function (e) {
				e.preventDefault();

				const update = () => fetchUrl(
					el.href, el.dataset.target || null,
					el.dataset.mode || null,
					el.dataset.callback || null,
					el.dataset.callbackError || null,
					el.dataset.changeurl || false,
					el.dataset.method || null
				).then((data) => {
					const event = new CustomEvent('ajax.loaded', {
						detail: {
							target: el,
							data: data
						}
					});

					el.dispatchEvent(event);
					document.dispatchEvent(event);
				}).catch(e => {
					const event = new CustomEvent('ajax.error', {
						detail: {
							target: el,
							error: e
						}
					});

					el.dispatchEvent(event);
					document.dispatchEvent(event);
				});

				if (this.dataset.confirm) {
					new Alert({
						title: this.dataset.confirm || 'Confirm',
						text: this.dataset.confirmText || null,
						animation: Animation.scale,
						icon: Icon.info,
						size: Size.default,
						actions: {
							cancel: {
								label: 'Cancel',
								classList: ['btn-outline-primary']
							},
							confirm: {
								label: 'Confirm',
							}
						}
					})
						.show()
						.then(() => {
							update();
						});
				} else {
					update();
				}
			});
		});
	});
});

// Form Ajax Validator
window.loadAjaxValidatorModule = () => new Promise((resolve) => import('./component/formValidator').then(({default: ajaxValidator}) => resolve(ajaxValidator)));

document.liveQuery('form[data-ajax]', (el) => {
	loadAjaxValidatorModule().then(() => {

	});
});


// Bootstrap Tabs
window.loadTabModule = () => new Promise((resolve) => import('bootstrap').then(({Tab: tab}) => resolve(tab)));
document.liveQuery('[data-bs-toggle="tab"]', function (el) {
	loadTabModule().then(() => {

	});
});

// Bootstrap Collapse
window.loadCollapseModule = () => new Promise((resolve) => import("bootstrap").then(({Collapse: collapse}) => resolve(collapse)));
document.liveQuery('[data-bs-toggle="collapse"]', function (el) {
	loadCollapseModule().then((Collapse) => {
		Collapse.getOrCreateInstance(el);

		const eventHandler = () => {
			window.dispatchEvent(new Event('resize'));
			document.dispatchEvent(new Event('scroll'));
		};

		el.addEventListener('shown.bs.collapse', eventHandler);
		el.addEventListener('hidden.bs.collapse', eventHandler);
	});
});

// Bootstrap Download
window.loadDropdownModule = () => new Promise((resolve) => import("bootstrap").then(({Dropdown: dropdown}) => resolve(dropdown)));
document.liveQuery('[data-bs-toggle="dropdown"]', (el) => loadDropdownModule().then((dropdown) => {}));

// Bootstrap Modal
window.loadModalModule = () => new Promise((resolve) => import("bootstrap").then(({Modal: modal}) => resolve(modal)));
window.loadModalDataFetcherModule = () => new Promise((resolve) => import('./component/modal.dataFetcher').then(({default: dataFetcher}) => resolve(dataFetcher)));
document.liveQuery('[data-toggle="modal"]', function (el) {
	el.addEventListener('click', (e) => {
		e.preventDefault();

		loadModalModule()
			.then(modal => {
				return loadDataFetcherModule().then(dataFetcher => {
					return loadModalDataFetcherModule().then(modalDataFetcher => {
						return new modalDataFetcher(modal, dataFetcher).load(el.dataset.target || el.getAttribute('href') || null, el.dataset || {}, el);
					});
				});
			});
	})
});

window.closeModal = function () {
	let modalElement = document.querySelector('.modal.show');
	if (modalElement) {
		loadModalModule().then((modal) => {
			let modalInstance = modal.getInstance(modalElement);
			if (modalInstance) {
				modalInstance.hide();
			}
		})
		return true;
	}
	return false;
}

// Bootstrap Tooltip
window.loadTooltipModule = () => new Promise((resolve) => import('bootstrap').then(({Tooltip: tooltip}) => resolve(tooltip)));
document.liveQuery('[data-bs-toggle="tooltip"]', (el) => window.loadTooltipModule().then((Tooltip) => {
	new Tooltip.getOrCreateInstance(el, {
		boundary: 'window'
	});
}));
