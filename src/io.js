function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function saveTextFile({ contents, suggestedName, handle }) {
  if (handle) {
    const writable = await handle.createWritable();
    await writable.write(contents);
    await writable.close();
    return handle;
  }

  if ("showSaveFilePicker" in window) {
    const nextHandle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: "Hex map project",
          accept: {
            "application/json": [".json", ".hexmap.json"]
          }
        }
      ]
    });

    const writable = await nextHandle.createWritable();
    await writable.write(contents);
    await writable.close();
    return nextHandle;
  }

  triggerDownload(new Blob([contents], { type: "application/json" }), suggestedName);
  return null;
}

export async function saveBlobFile({ blob, suggestedName, handle }) {
  if (handle) {
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return handle;
  }

  if ("showSaveFilePicker" in window) {
    const nextHandle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: "PNG image",
          accept: {
            "image/png": [".png"]
          }
        }
      ]
    });

    const writable = await nextHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return nextHandle;
  }

  triggerDownload(blob, suggestedName);
  return null;
}

export async function openProjectFile(fallbackInput) {
  if ("showOpenFilePicker" in window) {
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: "Hex map project",
          accept: {
            "application/json": [".json", ".hexmap.json"]
          }
        }
      ]
    });

    if (!handle) {
      return null;
    }

    const file = await handle.getFile();
    return {
      file,
      handle
    };
  }

  return new Promise((resolve) => {
    const onChange = () => {
      const [file] = fallbackInput.files;
      fallbackInput.value = "";
      fallbackInput.removeEventListener("change", onChange);
      resolve(file ? { file, handle: null } : null);
    };

    fallbackInput.addEventListener("change", onChange, { once: true });
    fallbackInput.click();
  });
}

export async function pickCustomSymbolFile(fallbackInput) {
  return new Promise((resolve) => {
    const onChange = () => {
      const [file] = fallbackInput.files;
      fallbackInput.value = "";
      fallbackInput.removeEventListener("change", onChange);
      resolve(file || null);
    };

    fallbackInput.addEventListener("change", onChange, { once: true });
    fallbackInput.click();
  });
}

export function readFileAsText(file) {
  return file.text();
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read the selected file."));
    reader.readAsDataURL(file);
  });
}

export function sanitizeFileStem(fileName) {
  return fileName.replace(/\.[^.]+$/, "");
}
