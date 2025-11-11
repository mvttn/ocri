const BASE_URL = "http://3.25.114.124:8000/api";

export async function uploadImage(imageUri: string) {
  const form = new FormData();
  form.append("file", { uri: imageUri, name: "photo.jpg", type: "image/jpeg" } as unknown as Blob);

  const response = await fetch(`${BASE_URL}/ocr/`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form,
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(`Upload failed: ${response.status} ${bodyText}`);
  }

  return response.json();
}
