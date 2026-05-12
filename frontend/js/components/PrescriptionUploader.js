const PrescriptionUploader = {
    render(container, onSuccess) {
        container.innerHTML = `
            <div class="upload-container">
                <div class="upload-area" id="uploadArea">
                    <div class="upload-icon">📄</div>
                    <p>Drag & drop prescription here or click to browse</p>
                    <small>Supported: JPG, PNG, PDF (Max 5MB)</small>
                    <input type="file" id="fileInput" accept="image/*,application/pdf" style="display: none;">
                </div>
                <div id="uploadProgress" class="upload-progress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <span class="progress-text">0%</span>
                </div>
                <div id="uploadStatus"></div>
            </div>
        `;
        
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const progressDiv = document.getElementById('uploadProgress');
        const progressFill = progressDiv?.querySelector('.progress-fill');
        const progressText = progressDiv?.querySelector('.progress-text');
        const statusDiv = document.getElementById('uploadStatus');
        
        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) uploadFile(file);
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                uploadFile(e.target.files[0]);
            }
        });
        
        async function uploadFile(file) {
            // Validate file size
            if (file.size > 5 * 1024 * 1024) {
                statusDiv.innerHTML = '<div class="alert alert-danger">File too large. Max 5MB</div>';
                return;
            }
            
            const formData = new FormData();
            formData.append('prescription', file);
            const token = Storage.getToken();
            
            statusDiv.innerHTML = '<div class="alert alert-info">Uploading...</div>';
            progressDiv.style.display = 'block';
            
            try {
                const xhr = new XMLHttpRequest();
                
                // Track progress
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percent = (e.loaded / e.total) * 100;
                        progressFill.style.width = `${percent}%`;
                        progressText.textContent = `${Math.round(percent)}%`;
                    }
                });
                
                xhr.addEventListener('load', () => {
                    if (xhr.status === 200 || xhr.status === 201) {
                        const response = JSON.parse(xhr.responseText);
                        statusDiv.innerHTML = '<div class="alert alert-success">Prescription uploaded successfully!</div>';
                        if (onSuccess) onSuccess(response.data);
                        setTimeout(() => {
                            statusDiv.innerHTML = '';
                            progressDiv.style.display = 'none';
                            progressFill.style.width = '0%';
                            progressText.textContent = '0%';
                        }, 3000);
                    } else {
                        const error = JSON.parse(xhr.responseText);
                        throw new Error(error.message);
                    }
                });
                
                xhr.addEventListener('error', () => {
                    throw new Error('Network error');
                });
                
                xhr.open('POST', '/api/uploads/prescription');
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.send(formData);
                
            } catch (error) {
                statusDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
                progressDiv.style.display = 'none';
            }
        }
    }
};