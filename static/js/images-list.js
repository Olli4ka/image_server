const imagesContainer = document.getElementById("images-container");

let currentPage = 1;


async function loadImages(page = 1) {
    try {
        const response = await fetch(`/images-list?page=${page}`);

        if (!response.ok) {
            throw new Error(`Failed to load images: ${response.status}`);
        }

        const data = await response.json();

        currentPage = data.page;

        renderImages(data.images);
        renderPagination(data.page, data.per_page, data.total);
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
                        <th>Original Name</th>
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

                            <td>${image.original_name}</td>
                            <td>${image.filename}</td>
                            <td>${image.file_type.toUpperCase()}</td>
                            <td>${formatFileSize(image.size)}</td>
                            <td>${formatDate(image.upload_time)}</td>

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


function renderPagination(page, perPage, total) {
    const totalPages = Math.ceil(total / perPage);

    let paginationContainer = document.getElementById("pagination-container");

    if (!paginationContainer) {
        paginationContainer = document.createElement("div");
        paginationContainer.id = "pagination-container";
        imagesContainer.after(paginationContainer);
    }

    if (totalPages <= 1) {
        paginationContainer.innerHTML = "";
        return;
    }

    paginationContainer.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mt-4">
            <span class="text-muted">
                Page ${page} of ${totalPages} (${total} images)
            </span>

            <div class="btn-group" role="group" aria-label="Image pagination">
                <button
                    type="button"
                    class="btn btn-outline-primary"
                    ${page <= 1 ? "disabled" : ""}
                    onclick="loadImages(${page - 1})"
                >
                    Previous
                </button>

                <button
                    type="button"
                    class="btn btn-outline-primary"
                    ${page >= totalPages ? "disabled" : ""}
                    onclick="loadImages(${page + 1})"
                >
                    Next
                </button>
            </div>
        </div>
    `;
}


async function deleteImage(id) {
    if (!confirm("Are you sure you want to delete this image?")) {
        return;
    }

    try {
        const response = await fetch(`/images/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error(`Delete failed: ${response.status}`);
        }

        await loadImages(currentPage);
    } catch (error) {
        console.error("Failed to delete image:", error);
        alert("Failed to delete image. Please try again.");
    }
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


loadImages();
