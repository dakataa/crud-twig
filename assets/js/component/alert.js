const alert = ({title, text, icon, actions, allowClose}) => {
	title = title || 'Are you confirm?';
	allowClose = allowClose || false;

	actions = {
		confirm: {
			label: 'OK',
			classList: []
		},
		...(actions || {})
	};

	if(!allowClose) {
		actions = {
			...actions,
			cancel: {
				label: 'Cancel'
			}
		}
	}

	const htmlTemplate = `
		  <div class="modal-dialog modal-dialog-centered">
			<div class="modal-content">
			  <div class="modal-body d-flex flex-column align-items-center">
			  </div>
			</div>
		  </div>
	`;

	const modalElement = document.createElement('div');
	modalElement.innerHTML = htmlTemplate;
	modalElement.classList.add('modal');

	return new Promise((resolve, reject) => {
		import("bootstrap/js/src/modal").then(({default: modal}) => {
			document.body.append(modalElement);
			const modalInstance = modal.getOrCreateInstance(modalElement, {
				backdrop: 'static'
			});

			if(allowClose) {
				modalElement.addEventListener('hidePrevented.bs.modal', (e) => {
					modalInstance.hide();
					reject();
				});
			}

			const modalBody = modalElement.querySelector('.modal-body');
			const titleElement = document.createElement('h5');
			titleElement.textContent = title;
			titleElement.classList.add(...['modal-title']);
			modalBody.append(titleElement);

			if(text) {
				const textElement = document.createElement('p');
				textElement.textContent = text;
				modalBody.append(textElement);
			}

			if(Object.keys(actions).length) {
				const actionsElement = document.createElement('div');
				actionsElement.classList.add(...['d-flex', 'flex-row', 'align-items']);
				modalBody.append(actionsElement);

				Object.keys(actions).forEach((action) => {
					const {
						label,
						classList
					} = actions[action];
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

						modalInstance.hide();
					});
					actionsElement.append(actionButtonElement);
				});
			}

			modalInstance.show();
		});
	})
}


export default alert;
