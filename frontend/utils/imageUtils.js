/**
 * 图片处理工具函数
 */

class ImageUtils {
    /**
     * 压缩图片
     * @param {string} dataUrl - 图片DataURL
     * @param {number} maxWidth - 最大宽度
     * @param {number} maxHeight - 最大高度
     * @param {number} quality - 图片质量 (0-1)
     * @returns {Promise<string>} 压缩后的DataURL
     */
    static async compressImage(dataUrl, maxWidth = 1024, maxHeight = 1024, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 计算缩放比例
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }
                
                // 设置Canvas尺寸
                canvas.width = width;
                canvas.height = height;
                
                // 绘制图片
                ctx.drawImage(img, 0, 0, width, height);
                
                // 转换为DataURL
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            
            img.onerror = reject;
            img.src = dataUrl;
        });
    }
    
    /**
     * 获取图片信息
     * @param {string} dataUrl - 图片DataURL
     * @returns {Promise<{width: number, height: number, size: number, type: string}>}
     */
    static async getImageInfo(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                // 计算文件大小（近似值）
                const base64 = dataUrl.split(',')[1];
                const size = Math.round((base64.length * 3) / 4);
                
                resolve({
                    width: img.width,
                    height: img.height,
                    size: size, // bytes
                    type: dataUrl.split(';')[0].split(':')[1],
                    aspectRatio: img.width / img.height
                });
            };
            
            img.onerror = reject;
            img.src = dataUrl;
        });
    }
    
    /**
     * 转换图片格式
     * @param {string} dataUrl - 原图片DataURL
     * @param {string} format - 目标格式 ('jpeg', 'png', 'webp')
     * @param {number} quality - 图片质量 (0-1)
     * @returns {Promise<string>} 转换后的DataURL
     */
    static async convertFormat(dataUrl, format = 'png', quality = 0.9) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.drawImage(img, 0, 0);
                
                let mimeType;
                switch (format.toLowerCase()) {
                    case 'jpeg':
                    case 'jpg':
                        mimeType = 'image/jpeg';
                        break;
                    case 'png':
                        mimeType = 'image/png';
                        break;
                    case 'webp':
                        mimeType = 'image/webp';
                        break;
                    default:
                        mimeType = 'image/png';
                }
                
                const convertedDataUrl = canvas.toDataURL(mimeType, quality);
                resolve(convertedDataUrl);
            };
            
            img.onerror = reject;
            img.src = dataUrl;
        });
    }
    
    /**
     * 裁剪图片
     * @param {string} dataUrl - 图片DataURL
     * @param {number} x - 起始x坐标
     * @param {number} y - 起始y坐标
     * @param {number} width - 裁剪宽度
     * @param {number} height - 裁剪高度
     * @returns {Promise<string>} 裁剪后的DataURL
     */
    static async cropImage(dataUrl, x, y, width, height) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = width;
                canvas.height = height;
                
                ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
                
                const croppedDataUrl = canvas.toDataURL('image/png');
                resolve(croppedDataUrl);
            };
            
            img.onerror = reject;
            img.src = dataUrl;
        });
    }
    
    /**
     * 调整图片大小
     * @param {string} dataUrl - 图片DataURL
     * @param {number} targetWidth - 目标宽度
     * @param {number} targetHeight - 目标高度
     * @param {boolean} keepAspectRatio - 是否保持宽高比
     * @returns {Promise<string>} 调整后的DataURL
     */
    static async resizeImage(dataUrl, targetWidth, targetHeight, keepAspectRatio = true) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                let width = targetWidth;
                let height = targetHeight;
                
                if (keepAspectRatio) {
                    const ratio = Math.min(targetWidth / img.width, targetHeight / img.height);
                    width = img.width * ratio;
                    height = img.height * ratio;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                // 使用高质量缩放
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                ctx.drawImage(img, 0, 0, width, height);
                
                const resizedDataUrl = canvas.toDataURL('image/png');
                resolve(resizedDataUrl);
            };
            
            img.onerror = reject;
            img.src = dataUrl;
        });
    }
    
    /**
     * 提取图片的base64数据
     * @param {string} dataUrl - 图片DataURL
     * @returns {string} base64数据
     */
    static extractBase64(dataUrl) {
        return dataUrl.replace(/^data:image\/\w+;base64,/, '');
    }
    
    /**
     * 创建DataURL
     * @param {string} base64 - base64数据
     * @param {string} mimeType - MIME类型
     * @returns {string} DataURL
     */
    static createDataUrl(base64, mimeType = 'image/png') {
        return `data:${mimeType};base64,${base64}`;
    }
    
    /**
     * 验证图片DataURL
     * @param {string} dataUrl - 图片DataURL
     * @returns {boolean} 是否有效
     */
    static isValidDataUrl(dataUrl) {
        const pattern = /^data:image\/(jpeg|png|gif|webp|bmp|svg\+xml);base64,[A-Za-z0-9+/]+=*$/;
        return pattern.test(dataUrl);
    }
    
    /**
     * 计算图片文件大小
     * @param {string} dataUrl - 图片DataURL
     * @returns {number} 文件大小（字节）
     */
    static calculateSize(dataUrl) {
        if (!dataUrl) return 0;
        
        const base64 = dataUrl.split(',')[1];
        if (!base64) return 0;
        
        // base64编码会增加约33%的大小
        return Math.round((base64.length * 3) / 4);
    }
    
    /**
     * 格式化文件大小
     * @param {number} bytes - 字节数
     * @returns {string} 格式化后的文件大小
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * 获取支持的图片格式
     * @returns {string[]} 支持的格式列表
     */
    static getSupportedFormats() {
        return ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];
    }
    
    /**
     * 检查浏览器是否支持WebP格式
     * @returns {Promise<boolean>} 是否支持WebP
     */
    static async checkWebPSupport() {
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            
            img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
        });
    }
}

// 导出工具类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImageUtils;
} else {
    window.ImageUtils = ImageUtils;
}