const PrescriptionsPage = {
    async render(container) {
        if (!Storage.isLoggedIn()) {
            router.navigateTo('/login');
            return;
        }
       const uploadContainer = document.getElementById('upload-container');
        if (uploadContainer) {
            PrescriptionUploader.render(uploadContainer, (uploadedData) => {
                console.log('Upload successful:', uploadedData);
                this.loadPrescriptions(); // Refresh the list
            });
        } 
        
        const user = Storage.getUser();
        
        container.innerHTML = `
            <div class="container" style="padding: 2rem 0;">
                <h1>Prescriptions</h1>
                
                <div class="card" style="background: white; padding: 2rem; border-radius: var(--border-radius); box-shadow: var(--shadow); margin-bottom: 2rem;">
                    <h3>Upload New Prescription</h3>
                    <div id="upload-area" class="prescription-uploader">
                        <div class="upload-placeholder">
                            <span>📄</span>
                            <p>Click or drag to upload prescription</p>
                            <small>Supported formats: JPG, PNG, PDF (Max 5MB)</small>
                        </div>
                        <input type="file" id="prescription-file" accept="image/*,application/pdf" style="display: none;">
                    </div>
                    <div id="upload-status"></div>
                </div>
                
                <h3>Your Prescription History</h3>
                <div id="prescriptions-list">
                    <div class="loading-spinner">Loading...</div>
                </div>
            </div>
        `;
        
        this.setupUploader();
        await this.loadPrescriptions();
    },
    
    setupUploader() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('prescription-file');
        
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = 'var(--primary-color)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#ddd';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ddd';
            const file = e.dataTransfer.files[0];
            if (file) this.uploadFile(file);
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) this.uploadFile(e.target.files[0]);
        });
    },
    
    async uploadFile(file) {
        const statusDiv = document.getElementById('upload-status');
        const formData = new FormData();
        formData.append('prescription', file);
        
        statusDiv.innerHTML = '<div class="alert alert-info">Uploading...</div>';
        
        try {
            const result = await PrescriptionsAPI.upload(formData);
            statusDiv.innerHTML = '<div class="alert alert-success">Prescription uploaded successfully!</div>';
            setTimeout(() => { statusDiv.innerHTML = ''; }, 3000);
            await this.loadPrescriptions();
        } catch (error) {
            statusDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        }
    },
    
    async loadPrescriptions() {
        const container = document.getElementById('prescriptions-list');
        
        try {
            const response = await PrescriptionsAPI.getMyPrescriptions();
            const prescriptions = response.data;
            
            if (prescriptions.length === 0) {
                container.innerHTML = '<p>No prescriptions uploaded yet.</p>';
                return;
            }
            
            container.innerHTML = `
                <div class="prescriptions-grid" style="display: flex; flex-direction: column; gap: 1rem;">
                    ${prescriptions.map(p => this.renderPrescription(p)).join('')}
                </div>
            `;
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger">Error loading prescriptions: ${error.message}</div>`;
        }
    },
    
    renderPrescription(prescription) {
        const statusColors = {
            pending: 'warning',
            reviewing: 'info',
            approved: 'success',
            rejected: 'danger',
            dispensed: 'success'
        };
        
        return `
            <div class="prescription-card" style="background: white; border-radius: var(--border-radius); padding: 1rem; box-shadow: var(--shadow);">
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <strong>Uploaded:</strong> ${helpers.formatDateTime(prescription.created_at)}
                        <br>
                        <strong>Status:</strong> 
                        <span class="badge badge-${statusColors[prescription.status]}">${prescription.status}</span>
                        ${prescription.pharmacist_name ? `<br><strong>Reviewed by:</strong> ${prescription.pharmacist_name}` : ''}
                    </div>
                    <a href="${prescription.image_url}" target="_blank" class="btn btn-outline">View Prescription</a>
                </div>
                ${prescription.pharmacist_notes ? `
                    <div style="margin-top: 1rem; padding: 0.5rem; background: var(--light-color); border-radius: var(--border-radius);">
                        <strong>Pharmacist Notes:</strong>
                        <p>${prescription.pharmacist_notes}</p>
                    </div>
                ` : ''}
                ${prescription.rejection_reason ? `
                    <div style="margin-top: 1rem; padding: 0.5rem; background: #f8d7da; border-radius: var(--border-radius);">
                        <strong>Rejection Reason:</strong>
                        <p>${prescription.rejection_reason}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }
};
