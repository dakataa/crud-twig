import './alert.scss';
import modal from 'bootstrap/js/src/modal';

const Animation = {
	scale: 'scale',
	fade: 'fade'
};

const Icon = {
	success: import('./assets/icons/success.json'),
	denied: import('./assets/icons/denied.json'),
	warning: import('./assets/icons/warning.json'),
	info: import('./assets/icons/info.json'),
	confirm: import('./assets/icons/info.json')
};

const Size = {
	small: 'modal-sm',
	default: '',
	large: 'modal-lg',
	extraLarge: 'modal-xl'
}

class Alert {

	modalInstance;

	options = {
		title: 'Are you confirm?',
		text: null,
		icon: Icon.success,
		animation: Animation.scale,
		size: Size.small,
		actions: {
			confirm: {
				label: 'OK',
				classList: [
					'btn-primary'
				]
			},
			cancel: {
				label: 'Cancel',
				classList: [
					'btn-outline-secondary'
				]
			}
		},
		allowClose: false
	};

	constructor(options) {
		this.options = {
			...this.options,
			...(options || {})
		};
	}

	hide() {
		this.modalInstance?.hide();
	}

	show() {
		this.hide();

		return new Promise((resolve, reject) => {
			const modalElement = document.createElement('div');
			modalElement.classList.add(...['modal', 'modal-alert', this.options.animation].filter(v => v));
			modalElement.addEventListener('hidden.bs.modal', () => {
				this.modalInstance.dispose();
				this.modalInstance = null;
				modalElement.remove();
			})

			const modalDialogElement = document.createElement('div');
			modalDialogElement.classList.add(...['modal-dialog', 'modal-dialog-centered', this.options.size].filter(v => v));
			modalElement.append(modalDialogElement);

			const modalContentElement = document.createElement('div');
			modalContentElement.classList.add(...['modal-content']);
			modalDialogElement.append(modalContentElement);

			const modalBodyElement = document.createElement('div');
			modalBodyElement.classList.add(...['modal-body', 'd-flex', 'flex-column', 'align-items-center']);
			modalContentElement.append(modalBodyElement);

			document.body.append(modalElement);
			this.modalInstance = modal.getOrCreateInstance(modalElement, {
				backdrop: 'static'
			});

			if (this.options.allowClose) {
				modalElement.addEventListener('hidePrevented.bs.modal', (e) => {
					this.modalInstance.hide();
					reject();
				});
			}

			const iconElement = document.createElement('div');
			iconElement.classList.add(...['modal-alert-icon']);
			modalBodyElement.append(iconElement);

			if (this.options.icon) {
				import('lottie-web').then(({default: lottiePlayer}) => {

					const loadAnimation = (options) => lottiePlayer.loadAnimation({
						container: iconElement,
						renderer: 'svg',
						loop: false,
						autoplay: true,
						...(options || {}),
						rendererSettings: {
							preserveAspectRatio: 'xMidYMid meet'
						}
					});

					if (this.options.icon instanceof Promise) {
						this.options.icon.then((data) => loadAnimation({animationData: data}));
					} else {
						loadAnimation({path: this.options.icon});
					}
				});
			}

			const titleElement = document.createElement('h3');
			titleElement.textContent = this.options.title;
			titleElement.classList.add(...['modal-alert-title']);
			modalBodyElement.append(titleElement);

			if (this.options.text) {
				const textElement = document.createElement('p');
				textElement.classList.add(...['modal-alert-text']);
				textElement.textContent = this.options.text;
				modalBodyElement.append(textElement);
			}

			if (Object.keys(this.options.actions).length) {
				const actionsElement = document.createElement('div');
				actionsElement.classList.add(...['d-flex', 'flex-row', 'align-items']);
				modalBodyElement.append(actionsElement);

				Object.keys(this.options.actions).forEach((action) => {
					const {
						label,
						classList
					} = this.options.actions[action];
					const actionButtonElement = document.createElement('a');
					actionButtonElement.classList.add(...['btn', 'mx-2', ...(classList || ['btn-primary'])]);
					actionButtonElement.textContent = label || action.toString();
					actionButtonElement.addEventListener('click', () => {
						switch (action) {
							case 'cancel': {
								reject()
								break;
							}
							default: {
								resolve({
									action,
									isConfirmed: action === 'confirm'
								})
							}
						}

						this.modalInstance.hide();
					});
					actionsElement.append(actionButtonElement);
				});
			}

			this.modalInstance.show();
		});
	}
}


export {Animation, Icon, Size, Alert as default};
