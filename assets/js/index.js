import './component/livequery';
import {checkElementVisibility} from "./utils";
import {Animation, Icon, Size} from "./component/alert/alert";

// Alert
window.loadAlertModule = () => new Promise((resolve) => import('./component/alert/alert').then(({default: alert}) => resolve(alert)));

// Data Fetcher
window.loadDataFetcherModule = () => new Promise((resolve) => import('./component/dataFetcher').then(({default: dataFetcher}) => resolve(dataFetcher)));

document.liveQuery('[data-ajax-load]', function (el) {
	window.loadDataFetcherModule().then((dataFetcher) => {
		console.log('load dataFetcher');
		const loadData = () => {
			console.log('load', el.dataset.ajaxLoad);
			return dataFetcher(el.dataset.ajaxLoad, el, el.dataset.mode, el.dataset.callback, el.dataset.callbackError, el.dataset.changeUrl, el.dataset.method);
		}

		el.addEventListener('reload', loadData);

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
			.then(loadData)
			.catch((error) => {
				console.log('error', error);
			});

	});
});

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
			);

			if (this.dataset.confirm) {
				window
					.loadAlertModule()
					.then((Alert) => new Alert({
						title: 'Confirm',
						text: 'Do you want to delete this item?',
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
					}).show())
					.then(update)
			} else {
				update();
			}
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
window.loadTabModule = () => new Promise((resolve) => import('bootstrap/js/src/tab').then(({default: tab}) => resolve(tab)));
document.liveQuery('[data-bs-toggle="tab"]', function (el) {
	loadTabModule().then(() => {

	});
});

// Bootstrap Collapse
window.loadCollapseModule = () => new Promise((resolve) => import("bootstrap/js/src/collapse").then(({default: collapse}) => resolve(collapse)));
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
window.loadDropdownModule = () => new Promise((resolve) => import("bootstrap/js/src/dropdown").then(({default: dropdown}) => resolve(dropdown)));
document.liveQuery('[data-bs-toggle="dropdown"]', (el) => loadDropdownModule().then((Dropdown) => {
}));

// Bootstrap Modal
window.loadModalModule = () => new Promise((resolve) => import("bootstrap/js/src/modal").then(({default: modal}) => resolve(modal)));
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
window.loadTooltipModule = () => new Promise((resolve) => import('bootstrap/js/src/tooltip').then(({default: tooltip}) => resolve(tooltip)));
document.liveQuery('[data-bs-toggle="tooltip"]', (el) => window.loadTooltipModule().then((Tooltip) => {
	new Tooltip.getOrCreateInstance(el, {
		boundary: 'window'
	});
}));
