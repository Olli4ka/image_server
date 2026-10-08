const imagesContainer = document.getElementById("images-container");


async function loadImages() {
    try {
        const response = await fetch("/images-list");

        if (!response.ok) {
            throw new Error(`Failed to load images: ${response.status}`);
        }

        const images = await response.json();

        renderImages(images);
    } catch (error) {
        console.error(error);

        imagesContainer.innerHTML = `
            <div class="alert alert-danger">
                Failed to load images.
            </div>
        `;
    }
}


function renderImages(images) {
    if (images.length === 0) {
        imagesContainer.innerHTML = `
            <div class="alert alert-info">
                No images uploaded yet.
            </div>
        `;

        return;
    }

    imagesContainer.innerHTML = `
        <div class="table-responsive">
            <table class="table images-table mb-0">
                <thead>
                    <tr>
                        <th>Preview</th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Uploaded</th>
                        <th>Delete</th>
                    </tr>
                </thead>

                <tbody>
                    ${images.map((image) => `
                        <tr>
                            <td>
                                <img
                                    src="/images/${image.filename}"
                                    alt="${image.original_name}"
                                    class="preview"
                                >
                            </td>

                            <td>
                                ${image.original_name}
                            </td>

                            <td>
                                ${image.file_type.toUpperCase()}
                            </td>

                            <td>
                                ${formatFileSize(image.size)}
                            </td>

                            <td>
                                ${formatDate(image.upload_time)}
                            </td>

                            <td>
                                <button
                                    type="button"
                                    class="btn delete-button"
                                    onclick="deleteImage(${image.id})"
                                    title="Delete"
                                >
                                    <img
                                        src="/static/img/delete.png"
                                        alt="Delete"
                                        class="delete-icon"
                                    >
                                </button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}


function formatFileSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}


function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}


async function deleteImage(imageId) {
    const confirmed = confirm(
        "Are you sure you want to delete this image?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`/images/${imageId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error(`Delete failed: ${response.status}`);
        }

        await loadImages();
    } catch (error) {
        console.error(error);

        alert("Failed to delete image.");
    }
}

loadImages();
