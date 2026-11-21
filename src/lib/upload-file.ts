export async function uploadFile(file: File) {
 
  const uploadResponse = await fetch("/api/media/upload-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    }),
  });

  const uploadData = await uploadResponse.json();

  if (!uploadResponse.ok || !uploadData.success) {
    throw new Error(
      uploadData.error?.message ?? "Could not create upload URL"
    );
  }

  const { uploadUrl, fileKey } = uploadData.data;


  const b2Response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!b2Response.ok) {
    throw new Error("File upload to storage failed");
  }

  
  const mediaResponse = await fetch("/api/media/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileKey,
      fileName: file.name,
    }),
  });

  const mediaData = await mediaResponse.json();

  if (!mediaResponse.ok || !mediaData.success) {
    throw new Error(
      mediaData.error?.message ?? "Could not save media"
    );
  }

  return mediaData.data as {
    id: string;
    type: "IMAGE" | "PDF";
    url: string;
  };
}