import './component/livequery';

// Data Fetcher
window.loadDataFetcherModule = () => new Promise((resolve) => import('./component/dataFetcher').then(({default: dataFetcher}) => resolve(dataFetcher)));
document.liveQuery('[data-toggle="ajax"], [data-ajax-load]', function () {
	window.loadDataFetcherModule().then(() => {
	});
});

// Form Ajax Validator
window.loadAjaxValidatorModule = () => new Promise((resolve) => import('./component/ajaxValidator').then(({default: ajaxValidator}) => resolve(ajaxValidator)));
document.liveQuery('form[data-ajax]', () => function (el) {
	loadAjaxValidatorModule().then(() => {
		console.log('loaded ajax form');

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
document.liveQuery('[data-bs-toggle="modal"]', function (el) {
	el.addEventListener('click', (e) => {
		e.preventDefault();

		loadModalModule()
			.then(modal => {
				return loadDataFetcherModule().then(dataFetcher => {
					return loadModalDataFetcherModule().then(modalDataFetcher => {
						return new modalDataFetcher(modal, dataFetcher).load(el.dataset.target || el.getAttribute('href') || null, el.dataset || {});
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
