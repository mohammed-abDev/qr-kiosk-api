const { put } = require("@vercel/blob");

const uploadToBlob = async (file) => {
  if (!file) {
    return null;
  }

  const filename = `products/${Date.now()}-${file.originalname}`;

  const blob = await put(filename, file.buffer, {
    access: "public",
    addRandomSuffix: true,
  });

  return blob.url;
};

module.exports = uploadToBlob;
