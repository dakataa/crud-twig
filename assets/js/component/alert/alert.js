import './alert.scss';

const Animation = {
	scale: 'scale',
	fade: 'fade',
};

const Icon = {
	success: 'Success',
	denied: 'Denied',
	alert: 'Alert',
	confirm: 'Confirm'
};

class Alert {

	modalInstance;

	options = {
		title: 'Are you confirm?',
		text: null,
		icon: Icon.alert,
		animation: Animation.scale,
		actions: {
			confirm: {
				label: 'OK',
				classList: []
			},
			cancel: {
				label: 'Cancel'
			}
		},
		allowClose: false,
		template: `
		  <div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
			  <div class="modal-body d-flex flex-column align-items-center">
			  </div>
			</div>
		  </div>`
	};

	construct(options) {
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

		const modalElement = document.createElement('div');
		modalElement.innerHTML = this.options.template;
		modalElement.classList.add(...['modal', 'modal-alert', this.options.animation].filter(v => v));
		modalElement.addEventListener('hidden.bs.modal', () => {
			this.modalInstance.dispose();
			this.modalInstance = null;
		})

		return new Promise((resolve, reject) => {
			import("bootstrap/js/src/modal").then(({default: modal}) => {
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

				const modalBody = modalElement.querySelector('.modal-body');
				const titleElement = document.createElement('h5');
				titleElement.textContent = this.options.title;
				titleElement.classList.add(...['modal-title']);
				modalBody.append(titleElement);

				if (this.options.text) {
					const textElement = document.createElement('p');
					textElement.textContent = this.options.text;
					modalBody.append(textElement);
				}

				if (Object.keys(this.options.actions).length) {
					const actionsElement = document.createElement('div');
					actionsElement.classList.add(...['d-flex', 'flex-row', 'align-items']);
					modalBody.append(actionsElement);

					Object.keys(this.options.actions).forEach((action) => {
						const {
							label,
							classList
						} = this.options.actions[action];
						const actionButtonElement = document.createElement('a');
						actionButtonElement.classList.add(...['mx-2', 'btn', ...(classList || ['btn-default'])]);
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
		})
	}
}


export {Animation, Alert as default};
