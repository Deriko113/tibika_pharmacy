const Modal = {
    create() {
        const modalDiv = document.createElement('div');
        modalDiv.className = 'modal';
        modalDiv.id = 'global-modal';
        modalDiv.innerHTML = `
            <div class="modal-content">
                <div id="modal-body"></div>
                <button class="btn btn-secondary close-modal">Close</button>
            </div>
        `;
        document.body.appendChild(modalDiv);
        
        const closeBtn = modalDiv.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => this.hide());
        
        modalDiv.addEventListener('click', (e) => {
            if (e.target === modalDiv) this.hide();
        });
        
        this.modal = modalDiv;
    },
    
    show(content) {
        if (!this.modal) this.create();
        const body = this.modal.querySelector('#modal-body');
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            body.innerHTML = '';
            body.appendChild(content);
        }
        this.modal.classList.add('active');
    },
    
    hide() {
        if (this.modal) {
            this.modal.classList.remove('active');
        }
    },
    
    setContent(content) {
        const body = this.modal.querySelector('#modal-body');
        if (typeof content === 'string') {
            body.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            body.innerHTML = '';
            body.appendChild(content);
        }
    }
};