const fileInput = document.getElementById("file-upload");
const uploadLink = document.getElementById("upload-link");
const copyButton = document.getElementById("copy-link");
const dropZone = document.querySelector(".border.border-2");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif"];

function isValidFile(file) {
const fileName = file.name.toLowerCase();
const extension = fileName.slice(fileName.lastIndexOf("."));

```
if (!ALLOWED_EXTENSIONS.includes(extension)) {
    alert("Only JPG, PNG and GIF images are allowed.");
    return false;
}

if (file.size > MAX_FILE_SIZE) {
    alert("The maximum file size is 5 MB.");
    return false;
}

return true;
```

}

function selectFile(file) {
if (!isValidFile(file)) {
fileInput.value = "";
return;
}

```
uploadFile(file);
```

}

async function uploadFile(file) {
const formData = new FormData();
formData.append("file", file);

```
uploadLink.value = "Uploading...";
copyButton.disabled = true;

try {
    const response = await fetch("/upload", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
    }

    const result = await response.text();

    uploadLink.value = result;
    copyButton.disabled = false;
} catch (error) {
    console.error(error);
    uploadLink.value = "Upload failed.";
}
```

}

fileInput.addEventListener("change", () => {
const file = fileInput.files[0];

```
if (file) {
    selectFile(file);
}
```

});

dropZone.addEventListener("dragover", (event) => {
event.preventDefault();
dropZone.classList.add("border-primary");
});

dropZone.addEventListener("dragleave", () => {
dropZone.classList.remove("border-primary");
});

dropZone.addEventListener("drop", (event) => {
event.preventDefault();
dropZone.classList.remove("border-primary");

```
const file = event.dataTransfer.files[0];

if (file) {
    selectFile(file);
}
```

});

copyButton.addEventListener("click", async () => {
if (!uploadLink.value) {
return;
}

```
try {
    await navigator.clipboard.writeText(uploadLink.value);

    copyButton.textContent = "Copied!";

    setTimeout(() => {
        copyButton.textContent = "Copy";
    }, 1500);
} catch (error) {
    console.error("Failed to copy:", error);
}
```

});
