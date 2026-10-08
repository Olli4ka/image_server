const imagesContainer = document.getElementById("images-container");

let currentPage = 1;
const perPage = 10;

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

function renderPagination(page, perPage, total) {
    const totalPages = Math.ceil(total / perPage);

    if (totalPages <= 1) {
        return;
    }

    imagesContainer.insertAdjacentHTML(
        "beforeend",
        `
            <nav class="mt-4" aria-label="Images pagination">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${page === 1 ? "disabled" : ""}">
                        <button
                            class="page-link"
                            onclick="loadImages(${page - 1})"
                            ${page === 1 ? "disabled" : ""}
                        >
                            Previous
                        </button>
                    </li>

                    ${Array.from({ length: totalPages }, (_, index) => {
                        const pageNumber = index + 1;

                        return `
                            <li class="page-item ${pageNumber === page ? "active" : ""}">
                                <button
                                    class="page-link"
                                    onclick="loadImages(${pageNumber})"
                                >
                                    ${pageNumber}
                                </button>
                            </li>
                        `;
                    }).join("")}

                    <li class="page-item ${page === totalPages ? "disabled" : ""}">
                        <button
                            class="page-link"
                            onclick="loadImages(${page + 1})"
                            ${page === totalPages ? "disabled" : ""}
                        >
                            Next
                        </button>
                    </li>
                </ul>
            </nav>
        `
    );
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

        await loadImages(currentPage);
    } catch (error) {
        console.error(error);
        alert("Failed to delete image.");
    }
}

loadImages();
