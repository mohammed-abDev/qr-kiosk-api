const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowed = /jpg|jpeg|png|webp/;
    const ext = allowed.test(file.originalname.toLowerCase());

    if (ext) {
      cb(null, true);
    } else {
      cb(new Error("Images only!"));
    }
  },
});

module.exports = upload;
