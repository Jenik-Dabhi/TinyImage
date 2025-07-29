document.addEventListener('DOMContentLoaded', () => {
    const uploadContainer = document.getElementById('uploadContainer');
    const fileUpload = document.getElementById('fileUpload');
    const resultsSection = document.getElementById('resultsSection');
    const fileList = document.getElementById('fileList');
    const processingBarContainer = document.getElementById('processingBarContainer');
    const processedCountSpan = document.getElementById('processedCount');
    const totalCountSpan = document.getElementById('totalCount');
    const progressBar = document.getElementById('progressBar');
    const progressPercentageSpan = document.getElementById('progressPercentage');
    const processingFilesList = document.getElementById('processingFilesList');
    const resultsActions = document.getElementById('resultsActions');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const clearBtn = document.getElementById('clearBtn');
    const summaryCard = document.getElementById('summaryCard');
    const uploadSection = document.querySelector('.upload-section'); // Get the upload section

    let filesToProcess = [];
    let processedFiles = [];
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;

    // Simulate file compression (client-side)
    // In a real application, this would involve sending files to a server
    // and receiving compressed versions.
    async function compressFile(file) {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Simulate compression: reduce dimensions or quality
                    const maxWidth = 800; // Max width for compressed image
                    const maxHeight = 600; // Max height for compressed image
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress image data (e.g., to JPEG with lower quality)
                    // For PNG and PDF, we'll just simulate size reduction.
                    let compressedBlob;
                    let compressedSize;
                    let fileType = file.type;

                    if (fileType.startsWith('image/jpeg')) {
                        canvas.toBlob((blob) => {
                            compressedBlob = blob;
                            compressedSize = blob.size;
                            resolve({ originalFile: file, compressedBlob, compressedSize });
                        }, 'image/jpeg', 0.7); // 70% quality
                    } else if (fileType.startsWith('image/png')) {
                         canvas.toBlob((blob) => {
                            compressedBlob = blob;
                            compressedSize = blob.size * 0.5; // Simulate 50% reduction for PNG
                            resolve({ originalFile: file, compressedBlob, compressedSize });
                        }, 'image/png', 0.7);
                    } else if (fileType === 'application/pdf') {
                        // For PDF, we simulate a size reduction without actual processing
                        compressedSize = file.size * 0.6; // Simulate 40% reduction for PDF
                        resolve({ originalFile: file, compressedBlob: file, compressedSize }); // For PDF, we keep original blob for download simulation
                    } else if (fileType.startsWith('image/webp')) {
                         canvas.toBlob((blob) => {
                            compressedBlob = blob;
                            compressedSize = blob.size * 0.8; // Simulate 20% reduction for WebP
                            resolve({ originalFile: file, compressedBlob, compressedSize });
                        }, 'image/webp', 0.8);
                    } else {
                        // Fallback for other file types: no compression, just resolve
                        compressedSize = file.size;
                        resolve({ originalFile: file, compressedBlob: file, compressedSize });
                    }
                };
            };
            reader.readAsDataURL(file);
        });
    }

    // Function to format file size for display
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Handle file selection
    fileUpload.addEventListener('change', async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        // Reset previous state
        filesToProcess = files;
        processedFiles = [];
        totalOriginalSize = 0;
        totalOptimizedSize = 0;
        fileList.innerHTML = '';
        processingFilesList.innerHTML = '';
        summaryCard.innerHTML = '';
        resultsActions.style.display = 'none';

        // Show processing bar and hide upload section
        uploadSection.classList.add('processing'); // Add processing class to dim/disable
        processingBarContainer.style.display = 'block';
        resultsSection.style.display = 'block'; // Make sure the whole results section is visible

        totalCountSpan.textContent = files.length;
        processedCountSpan.textContent = 0;
        progressBar.style.width = '0%';
        progressPercentageSpan.textContent = '0%';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            totalOriginalSize += file.size;

            const processingFileItem = document.createElement('div');
            processingFileItem.classList.add('processing-file-item');
            processingFileItem.innerHTML = `
                <img src="${file.type.startsWith('image/') ? URL.createObjectURL(file) : 'default-file-icon.png'}" alt="${file.name}">
                <div class="processing-file-info">
                    <span class="processing-file-name">${file.name}</span>
                    <span class="processing-file-size">${formatBytes(file.size)}</span>
                </div>
                <span class="processing-status">Optimizing...</span>
            `;
            processingFilesList.appendChild(processingFileItem);

            // Simulate a delay for processing
            await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000)); // 0.5 to 1.5 seconds

            const result = await compressFile(file);
            processedFiles.push(result);
            totalOptimizedSize += result.compressedSize;

            // Update processing bar
            processedCountSpan.textContent = processedFiles.length;
            const progress = (processedFiles.length / filesToProcess.length) * 100;
            progressBar.style.width = `${progress}%`;
            progressPercentageSpan.textContent = `${Math.round(progress)}%`;

            // Remove from processing list and add to results list
            processingFilesList.removeChild(processingFileItem);
            displayCompressedFile(result);
        }

        // All files processed
        uploadSection.classList.remove('processing'); // Remove processing class
        processingBarContainer.style.display = 'none'; // Hide the processing bar
        resultsActions.style.display = 'flex'; // Show download/clear buttons
        updateSummary();
    });

    // Function to display a single compressed file
    function displayCompressedFile(fileResult) {
        const originalFile = fileResult.originalFile;
        const compressedSize = fileResult.compressedSize;
        const originalSize = originalFile.size;
        const reduction = ((originalSize - compressedSize) / originalSize) * 100;

        const fileItem = document.createElement('div');
        fileItem.classList.add('file-item');
        fileItem.innerHTML = `
            <div class="file-item-left">
                <img src="${originalFile.type.startsWith('image/') ? URL.createObjectURL(originalFile) : 'default-file-icon.png'}" alt="${originalFile.name}">
                <div class="file-info">
                    <span class="file-name">${originalFile.name}</span>
                    <span class="original-size">Original: ${formatBytes(originalSize)}</span>
                </div>
            </div>
            <div class="optimization-details">
                <span class="optimization-percentage">-${reduction.toFixed(1)}%</span>
                <span class="optimized-size">${formatBytes(compressedSize)}</span>
                <div class="download-icon-container">
                    <img src="images/download1.png" alt="Download" class="download-individual" data-file-index="${processedFiles.indexOf(fileResult)}">
                </div>
            </div>
        `;
        fileList.appendChild(fileItem);
    }

    // Function to update the summary card
    function updateSummary() {
        const totalReduction = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100;
        summaryCard.innerHTML = `
            <p>File compressed successfully!</p>
            <p>Total Original Size: <strong>${formatBytes(totalOriginalSize)}</strong></p>
            <p>Total Optimized Size: <strong>${formatBytes(totalOptimizedSize)}</strong></p>
            <p>Overall Reduction: <strong>-${totalReduction.toFixed(1)}%</strong></p>
        `;
    }

    // Handle individual file download
    fileList.addEventListener('click', async (event) => {
        if (event.target.classList.contains('download-individual')) {
            const index = event.target.dataset.fileIndex;
            const fileResult = processedFiles[index];
            if (fileResult && fileResult.compressedBlob) {
                // Use FileSaver.js to save the file
                saveAs(fileResult.compressedBlob, `compressed_${fileResult.originalFile.name}`);
            } else if (fileResult && fileResult.originalFile.type === 'application/pdf') {
                // For PDF, we just download the original, as client-side PDF compression is complex.
                // In a real scenario, the 'compressedBlob' would be the actual compressed PDF from the server.
                saveAs(fileResult.originalFile, `compressed_${fileResult.originalFile.name}`);
            }
        }
    });

    // Handle download all button
    downloadAllBtn.addEventListener('click', async () => {
        if (processedFiles.length === 0) return;

        const zip = new JSZip();
        for (const fileResult of processedFiles) {
            if (fileResult.compressedBlob) {
                zip.file(`compressed_${fileResult.originalFile.name}`, fileResult.compressedBlob);
            } else if (fileResult.originalFile.type === 'application/pdf') {
                zip.file(`compressed_${fileResult.originalFile.name}`, fileResult.originalFile);
            }
        }

        zip.generateAsync({ type: "blob" })
            .then(function(content) {
                saveAs(content, "tinyImage_compressed_files.zip");
            });
    });

    // Handle clear all button
    clearBtn.addEventListener('click', () => {
        filesToProcess = [];
        processedFiles = [];
        totalOriginalSize = 0;
        totalOptimizedSize = 0;
        fileList.innerHTML = '';
        summaryCard.innerHTML = '';
        resultsActions.style.display = 'none';
        uploadSection.classList.remove('processing', 'hidden'); // Ensure upload section is fully visible and enabled
        resultsSection.style.display = 'none'; // Hide the results section again
        processingFilesList.innerHTML = ''; // Clear processing list as well
    });

    // Handle drag and drop for the upload area
    uploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadContainer.style.borderColor = '#579600'; // Highlight on drag over
    });

    uploadContainer.addEventListener('dragleave', () => {
        uploadContainer.style.borderColor = '#616778'; // Revert on drag leave
    });

    uploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadContainer.style.borderColor = '#616778'; // Revert on drop
        const droppedFiles = Array.from(e.dataTransfer.files);
        fileUpload.files = createFileList(droppedFiles); // Set dropped files to the input
        const changeEvent = new Event('change');
        fileUpload.dispatchEvent(changeEvent); // Trigger change event
    });

    // Helper to create a FileList object from an array of files for drag and drop
    function createFileList(files) {
        const dataTransfer = new DataTransfer();
        files.forEach(file => dataTransfer.items.add(file));
        return dataTransfer.files;
    }
});
