export const CLOUDINARY_CLOUD_NAME = 'dgsrmkie3';
export const CLOUDINARY_API_KEY = '453835575713169';
export const CLOUDINARY_API_SECRET = 'NoMm7ZLV61oIh19ymyygApRGEpE';
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export async function generateSignature(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const signString = sortedKeys.map(k => `${k}=${params[k]}`).join('&') + apiSecret;
  const encoder = new TextEncoder();
  const data = encoder.encode(signString);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function deleteFromCloudinary(fileUrl) {
  if (!fileUrl) return;
  try {
    const matches = fileUrl.match(/\/v\d+\/(.+)$/);
    if (!matches || !matches[1]) return;
    
    // public_id usually doesn't need file extension to be deleted, especially for 'image' resource type.
    let publicId = matches[1].replace(/\.[^/.]+$/, "");
    publicId = decodeURIComponent(publicId); // handles any URI encoded characters

    const timestamp = Math.round(Date.now() / 1000);
    const signatureParams = { public_id: publicId, timestamp };
    
    const signature = await generateSignature(signatureParams, CLOUDINARY_API_SECRET);
    
    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('signature', signature);
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    console.log("Cloudinary deletion response:", data);
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
  }
}
