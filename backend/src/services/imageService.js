/**
 * services/imageService.js — Upload/delete de imágenes con Cloudinary.
 * TODO: Implementar con Cloudinary SDK en Stage 3
 */
const imageService = {
    async uploadImage(file) {
        console.log('📸 [DEV] Image upload stub — returning placeholder URL');
        return 'https://via.placeholder.com/400x400/16213E/E94560?text=Product';
    },

    async deleteImage(publicId) {
        console.log(`📸 [DEV] Image delete stub — publicId: ${publicId}`);
    },
};

module.exports = imageService;
