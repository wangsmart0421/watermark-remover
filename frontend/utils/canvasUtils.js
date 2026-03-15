/**
 * Canvas工具函数
 */

class CanvasUtils {
    /**
     * 初始化Canvas
     * @param {string} canvasId - Canvas元素ID
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @returns {fabric.Canvas} Fabric.js Canvas实例
     */
    static initCanvas(canvasId, width = 800, height = 500) {
        const canvas = new fabric.Canvas(canvasId, {
            selection: false,
            backgroundColor: '#f9fafb',
            preserveObjectStacking: true
        });
        
        canvas.setWidth(width);
        canvas.setHeight(height);
        canvas.calcOffset();
        
        return canvas;
    }
    
    /**
     * 加载图片到Canvas
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     * @param {string} imageUrl - 图片URL或DataURL
     * @param {Object} options - 选项
     * @returns {Promise<fabric.Image>} 图片对象
     */
    static async loadImageToCanvas(canvas, imageUrl, options = {}) {
        return new Promise((resolve, reject) => {
            const defaultOptions = {
                scaleToWidth: canvas.width,
                scaleToHeight: canvas.height,
                centered: true,
                crossOrigin: 'anonymous',
                ...options
            };
            
            fabric.Image.fromURL(imageUrl, (img) => {
                // 清除Canvas
                canvas.clear();
                
                // 调整图片尺寸
                const scale = Math.min(
                    defaultOptions.scaleToWidth / img.width,
                    defaultOptions.scaleToHeight / img.height,
                    1
                );
                
                img.scale(scale);
                
                // 调整Canvas尺寸以适应图片
                if (defaultOptions.adjustCanvasSize) {
                    canvas.setWidth(img.width * scale);
                    canvas.setHeight(img.height * scale);
                }
                
                // 添加图片到Canvas
                canvas.add(img);
                
                // 居中显示
                if (defaultOptions.centered) {
                    canvas.centerObject(img);
                }
                
                canvas.renderAll();
                resolve(img);
                
            }, defaultOptions);
        });
    }
    
    /**
     * 创建矩形选择工具
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     * @param {Object} options - 选项
     * @returns {fabric.Rect} 矩形对象
     */
    static createRectSelection(canvas, options = {}) {
        const defaultOptions = {
            left: 100,
            top: 100,
            width: 100,
            height: 50,
            fill: 'rgba(239, 68, 68, 0.1)',
            stroke: '#ef4444',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: true,
            hasControls: true,
            hasBorders: true,
            lockRotation: true,
            ...options
        };
        
        const rect = new fabric.Rect(defaultOptions);
        canvas.add(rect);
        canvas.setActiveObject(rect);
        
        return rect;
    }
    
    /**
     * 创建画笔工具
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @param {number} radius - 半径
     * @param {Object} options - 选项
     * @returns {fabric.Circle} 圆形对象
     */
    static createBrushStroke(canvas, x, y, radius, options = {}) {
        const defaultOptions = {
            left: x - radius,
            top: y - radius,
            radius: radius,
            fill: 'rgba(239, 68, 68, 0.3)',
            stroke: '#ef4444',
            strokeWidth: 2,
            selectable: false,
            hasControls: false,
            hasBorders: false,
            ...options
        };
        
        const circle = new fabric.Circle(defaultOptions);
        canvas.add(circle);
        
        return circle;
    }
    
    /**
     * 获取选择区域的mask
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     * @param {fabric.Image} baseImage - 基础图片对象
     * @returns {Promise<string>} mask的DataURL
     */
    static async getSelectionMask(canvas, baseImage) {
        return new Promise((resolve) => {
            // 创建临时Canvas
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // 设置Canvas尺寸
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            
            // 绘制白色背景
            tempCtx.fillStyle = 'white';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // 绘制黑色选择区域
            tempCtx.fillStyle = 'black';
            
            const objects = canvas.getObjects();
            objects.forEach(obj => {
                if (obj !== baseImage) {
                    if (obj instanceof fabric.Rect) {
                        tempCtx.fillRect(obj.left, obj.top, obj.width, obj.height);
                    } else if (obj instanceof fabric.Circle) {
                        tempCtx.beginPath();
                        tempCtx.arc(
                            obj.left + obj.radius,
                            obj.top + obj.radius,
                            obj.radius,
                            0,
                            Math.PI * 2
                        );
                        tempCtx.fill();
                    }
                }
            });
            
            // 转换为DataURL
            const maskData = tempCanvas.toDataURL('image/png');
            resolve(maskData);
        });
    }
    
    /**
     * 清除所有选择标记
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     * @param {fabric.Image} baseImage - 基础图片对象（不会被清除）
     */
    static clearSelections(canvas, baseImage) {
        const objects = canvas.getObjects();
        
        objects.forEach(obj => {
            if (obj !== baseImage && 
                (obj instanceof fabric.Rect || obj instanceof fabric.Circle)) {
                canvas.remove(obj);
            }
        });
        
        canvas.renderAll();
    }
    
    /**
     * 检查是否有选择区域
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     * @param {fabric.Image} baseImage - 基础图片对象
     * @returns {boolean} 是否有选择区域
     */
    static hasSelection(canvas, baseImage) {
        const objects = canvas.getObjects();
        return objects.some(obj => 
            obj !== baseImage && 
            (obj instanceof fabric.Rect || obj instanceof fabric.Circle)
        );
    }
    
    /**
     * 获取Canvas的JSON状态
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     * @returns {string} JSON字符串
     */
    static getCanvasState(canvas) {
        return JSON.stringify(canvas.toJSON());
    }
    
    /**
     * 从JSON状态恢复Canvas
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     * @param {string} stateJson - JSON状态字符串
     */
    static restoreCanvasState(canvas, stateJson) {
        return new Promise((resolve) => {
            canvas.loadFromJSON(stateJson, () => {
                canvas.renderAll();
                resolve();
            });
        });
    }
    
    /**
     * 导出Canvas为图片
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     * @param {Object} options - 选项
     * @returns {string} 图片DataURL
     */
    static exportCanvasToImage(canvas, options = {}) {
        const defaultOptions = {
            format: 'png',
            quality: 1,
            multiplier: 1,
            ...options
        };
        
        return canvas.toDataURL(defaultOptions);
    }
    
    /**
     * 设置Canvas背景颜色
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     * @param {string} color - 颜色值
     */
    static setBackgroundColor(canvas, color) {
        canvas.backgroundColor = color;
        canvas.renderAll();
    }
    
    /**
     * 启用网格背景
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     * @param {number} gridSize - 网格大小
     * @param {string} color - 网格颜色
     */
    static enableGrid(canvas, gridSize = 20, color = 'rgba(0, 0, 0, 0.1)') {
        const gridPattern = document.createElement('canvas');
        const gridCtx = gridPattern.getContext('2d');
        
        gridPattern.width = gridSize;
        gridPattern.height = gridSize;
        
        gridCtx.strokeStyle = color;
        gridCtx.lineWidth = 1;
        
        // 绘制垂直线
        gridCtx.beginPath();
        gridCtx.moveTo(gridSize, 0);
        gridCtx.lineTo(gridSize, gridSize);
        gridCtx.stroke();
        
        // 绘制水平线
        gridCtx.beginPath();
        gridCtx.moveTo(0, gridSize);
        gridCtx.lineTo(gridSize, gridSize);
        gridCtx.stroke();
        
        const pattern = new fabric.Pattern({
            source: gridPattern,
            repeat: 'repeat'
        });
        
        canvas.setBackgroundColor(pattern, canvas.renderAll.bind(canvas));
    }
    
    /**
     * 禁用网格背景
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     */
    static disableGrid(canvas) {
        canvas.setBackgroundColor('#f9fafb', canvas.renderAll.bind(canvas));
    }
    
    /**
     * 添加水印文字
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     * @param {string} text - 水印文字
     * @param {Object} options - 选项
     */
    static addWatermarkText(canvas, text, options = {}) {
        const defaultOptions = {
            left: 50,
            top: 50,
            fontSize: 20,
            fill: 'rgba(0, 0, 0, 0.3)',
            selectable: false,
            hasControls: false,
            hasBorders: false,
            ...options
        };
        
        const watermark = new fabric.Text(text, defaultOptions);
        canvas.add(watermark);
        canvas.renderAll();
        
        return watermark;
    }
    
    /**
     * 添加水印图片
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     * @param {string} imageUrl - 水印图片URL
     * @param {Object} options - 选项
     */
    static async addWatermarkImage(canvas, imageUrl, options = {}) {
        return new Promise((resolve, reject) => {
            const defaultOptions = {
                left: 50,
                top: 50,
                opacity: 0.3,
                selectable: false,
                hasControls: false,
                hasBorders: false,
                ...options
            };
            
            fabric.Image.fromURL(imageUrl, (img) => {
                Object.assign(img, defaultOptions);
                canvas.add(img);
                canvas.renderAll();
                resolve(img);
            }, defaultOptions);
        });
    }
    
    /**
     * 获取Canvas中所有对象
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     * @returns {fabric.Object[]} 对象数组
     */
    static getAllObjects(canvas) {
        return canvas.getObjects();
    }
    
    /**
     * 获取Canvas中特定类型的对象
     * @param {fabric.Canvas} canvas - Fabric.js Canvas实例
     * @param {Function} type - 对象类型构造函数
     * @returns {fabric.Object[]} 对象数组
     */
    static getObjectsByType(canvas, type) {
        return canvas.getObjects().filter(obj => obj instanceof type);
    }
    
    /**
     * 设置对象不可选择
     * @param {fabric.Object} obj - Fabric对象
     */
    static makeUnselectable(obj) {
        obj.selectable = false;
        obj.hasControls = false;
        obj.hasBorders = false;
        obj.lockMovementX = true;
        obj.lockMovementY = true;
        obj.lockRotation = true;
        obj.lockScalingX = true;
        obj.lockScalingY = true;
    }
    
    /**
     * 设置对象可选择
     * @param {fabric.Object} obj - Fabric对象
     */
    static makeSelectable(obj) {
        obj.selectable = true;
        obj.hasControls = true;
        obj.hasBorders = true;
        obj.lockMovementX = false;
        obj.lockMovementY = false;
        obj.lockRotation = false;
        obj.lockScalingX = false;
        obj.lockScalingY = false;
    }
}

// 导出工具类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasUtils;
} else {
    window.CanvasUtils = CanvasUtils;
}