class ModalDataFetcher {
    modal;
    dataFetcher;
    modalRequest;
    static modalBreadcrumb = [];

    constructor(modal, dataFetcher) {
        this.modal = modal;
        this.dataFetcher = dataFetcher;
    }

    load(target, settings) {
        if (!target) {
            return;
        }
        settings = {...(settings || {})};
        let modalElement = null;
        try {
            modalElement = document.querySelector(target);
        } catch (e) {
        }
        settings = settings || {};
        settings.keyboard = settings.keyboard === 'true';
        settings.backdrop = settings.backdrop ?? 'static';

        const preloader = document.querySelector('[data-page-preloader]');
        if (preloader) {
            preloader.classList.remove('active');
            preloader.hidden = true;
        }

        if (modalElement) {
            this.modal.getOrCreateInstance(modalElement).show();
        } else {
            let size = settings.size || 'large',
                sizeClass = null;
            switch (size) {
                case 'full':
                    sizeClass = "modal-full";
                    break;
                case 'large':
                    sizeClass = "modal-lg";
                    break;
                case 'medium':
                    sizeClass = "modal-md";
                    break;
                case 'small':
                    sizeClass = "modal-sm";
                    break;
            }

            //Show preloader
            if (preloader) {
                preloader.classList.add('active')
                preloader.hidden = false;
            }
            this.dataFetcher(target, null, null, null, null, false, settings.method || null, null, [
                {
                    name: 'modal-dialog',
                    value: 'yes'
                },
            ]).then(([response, contentType]) => {
                if (!['text/html'].includes(contentType)) {
                    return Promise.reject('Invalid content type');
                }

                document.querySelectorAll('.modal.show').forEach((el) => {
                    // if (settings.reopenParent) {
                    //     el.dispatchEvent(new Event('addParent'));
                    // }

                    let modalInstance = this.modal.getInstance(el);
                    if (modalInstance) {
                        el.manuallyClosed = true;
                        el.dispatchEvent(new Event('addParent'));
                        this.modal.getInstance(el).hide();
                    }
                });

                let modalElement = document.createElement('div');
                modalElement.classList.add('modal');
                modalElement.data = {url: target, settings: settings};

                let modalDialogElement = document.createElement('div');
                modalDialogElement.classList.add('modal-dialog')
                modalElement.append(modalDialogElement);
                if (sizeClass) {
                    modalDialogElement.classList.add(sizeClass)
                }
                const template = document.createRange().createContextualFragment(response);
                if (template.querySelector('.modal-dialog')) {
                    let modalDialog = template.querySelector('.modal-dialog');
                    if (sizeClass) {
                        modalDialog.classList.add(sizeClass)
                    }
                    modalDialogElement.replaceWith(modalDialog);
                } else {
                    let modalDialogContentElement = document.createElement('div');
                    modalDialogContentElement.classList.add('modal-content')
                    modalDialogElement.append(modalDialogContentElement);
                    let modalDialogContentBodyElement = document.createElement('div');
                    modalDialogContentBodyElement.classList.add('modal-body');
                    modalDialogContentElement.append(modalDialogContentBodyElement);
                    modalDialogContentBodyElement.append(template)
                }
                modalElement.initState = {url: document.location.href, state: window.history.state || {}};
                const modalInstance = this.modal.getOrCreateInstance(modalElement, settings);
                const hideModalOnPopState = () => {
                    if (!window.history.state || !window.history.state.modal) {
                        modalInstance.hide();
                    }
                }
                modalElement.addEventListener('addParent', (e) => {
                    if(modalElement.data) {
                        ModalDataFetcher.modalBreadcrumb.push(modalElement.data);
                    }
                })
                modalElement.addEventListener('show.bs.modal', (e) => {
                    // Change current url
                    if (settings.changeUrl !== undefined && settings.changeUrl) {
                        window.addEventListener('popstate', hideModalOnPopState);
                        let state = Object.assign({}, window.history.state || {}, {
                            modal: true,
                            url: target,
                            settings: settings
                        });
                        // Add new state for new modal with variable modal to true
                        window.history.pushState(state, '', target);
                    }
                });

                modalElement.addEventListener('hide.bs.modal', (e) => {
                    // Back to previous url
                    window.removeEventListener('popstate', hideModalOnPopState);
                    if (settings.changeUrl !== undefined && settings.changeUrl) {
                        let initState = modalElement.initState || {};
                        window.history.replaceState(Object.assign({modal: false}, initState.state || {}), '', initState.url || document.location.href.split('#')[0]);
                    }

                    //Open Modal with new Url on close event
                    if (settings.oncloseOpen) {
                        let nextUrl = settings.oncloseOpen;
                        delete settings.oncloseOpen;
                        this.load(nextUrl, settings);
                    }

                    //Reopen parent
                    if (!(e.target.manuallyClosed ?? false) && ModalDataFetcher.modalBreadcrumb.length) {
                        let parentModal = ModalDataFetcher.modalBreadcrumb[ModalDataFetcher.modalBreadcrumb.length - 1];

                        this.load(parentModal.url, parentModal.settings);
                        //remove last breadcrumb
                        ModalDataFetcher.modalBreadcrumb.splice(-1, 1);
                    }
                    e.target.remove();
                })
                if (settings.class !== undefined) {
                    modalElement.classList.add(settings.class);
                }
                modalInstance.show();
            }).catch((error) => {
                console.log('error', error);
            });
        }
    }
}

export default ModalDataFetcher;