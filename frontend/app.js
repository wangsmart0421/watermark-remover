/**
 * 水印去除工具 - 主逻辑文件
 */

class WatermarkRemover {
    constructor() {
        // 初始化属性
        this.canvas = null;
        this.fabricCanvas = null;
        this.image = null;
        this.originalImageData = null;
        
        // 工具状态
        this.currentTool = 'rect';
        this.isDrawing = false;
        this.brushSize = 15;
        
        // 历史记录
        this.history = [];
        this.historyIndex = -1;
        
        // API配置
        this.apiEndpoint = 'https://watermark-remover.your-domain.workers.dev/api/remove';
        
        // 初始化
        this.init();
    }
    
    /**
     * 初始化应用
     */
    init() {
        console.log('初始化水印去除工具...');
        
        // 初始化Canvas
        this.initCanvas();
        
        // 绑定事件
        this.bindEvents();
        
        // 更新UI状态
        this.updateUI();
        
        console.log('应用初始化完成');
    }
    
    /**
     * 初始化Canvas
     */
    initCanvas() {
        const canvasElement = document.getElementById('canvas');
        if (!canvasElement) {
            console.error('Canvas元素未找到');
            return;
        }
        
        // 创建Fabric.js Canvas
        this.fabricCanvas = new fabric.Canvas('canvas', {
            selection: false,
            backgroundColor: '#f9fafb'
        });
        
        // 设置Canvas尺寸
        this.setCanvasSize(800, 500);
        
        // 禁用右键菜单
        canvasElement.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    /**
     * 设置Canvas尺寸
     */
    setCanvasSize(width, height) {
        this.fabricCanvas.setWidth(width);
        this.fabricCanvas.setHeight(height);
        this.fabricCanvas.calcOffset();
    }
    
    /**
     * 绑定事件
     */
    bindEvents() {
        // 上传区域事件
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('imageUpload');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('border-blue-400');
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('border-blue-400');
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('border-blue-400');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleImageUpload(files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageUpload(e.target.files[0]);
            }
        });
        
        // 工具按钮事件
        document.getElementById('rectTool').addEventListener('click', () => this.setTool('rect'));
        document.getElementById('brushTool').addEventListener('click', () => this.setTool('brush'));
        document.getElementById('clearBtn').addEventListener('click', () => this.clearSelection());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        
        // 画笔大小控制
        const brushSizeInput = document.getElementById('brushSize');
        const brushSizeValue = document.getElementById('brushSizeValue');
        
        brushSizeInput.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            brushSizeValue.textContent = `${this.brushSize}px`;
        });
        
        // 操作按钮事件
        document.getElementById('removeBtn').addEventListener('click', () => this.removeWatermark());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        
        // 结果区域按钮
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadResult());
        document.getElementById('processAgainBtn').addEventListener('click', () => this.processAgain());
        
        // 错误重试按钮
        document.getElementById('retryBtn').addEventListener('click', () => this.retry());
        
        // Canvas事件
        this.bindCanvasEvents();
    }
    
    /**
     * 绑定Canvas事件
     */
    bindCanvasEvents() {
        if (!this.fabricCanvas) return;
        
        // 鼠标按下事件
        this.fabricCanvas.on('mouse:down', (opt) => {
            if (!this.image) return;
            
            const pointer = this.fabricCanvas.getPointer(opt.e);
            
            if (this.currentTool === 'brush') {
                this.isDrawing = true;
                this.drawBrush(pointer.x, pointer.y);
            } else if (this.currentTool === 'rect') {
                this.startRectSelection(pointer.x, pointer.y);
            }
        });
        
        // 鼠标移动事件
        this.fabricCanvas.on('mouse:move', (opt) => {
            if (!this.image || !this.isDrawing) return;
            
            const pointer = this.fabricCanvas.getPointer(opt.e);
            
            if (this.currentTool === 'brush') {
                this.drawBrush(pointer.x, pointer.y);
            }
        });
        
        // 鼠标抬起事件
        this.fabricCanvas.on('mouse:up', () => {
            this.isDrawing = false;
            
            if (this.currentTool === 'rect' && this.rectStart) {
                this.finishRectSelection();
            }
            
            // 保存历史状态
            this.saveHistory();
        });
    }
    
    /**
     * 处理图片上传
     */
    async handleImageUpload(file) {
        try {
            // 验证文件
            if (!this.validateImageFile(file)) {
                this.showError('文件格式错误', '请上传 JPG、PNG 或 WebP 格式的图片，且大小不超过 5MB');
                return;
            }
            
            // 显示加载状态
            this.showLoading('正在加载图片...');
            
            // 读取图片
            const imageUrl = await this.readImageFile(file);
            
            // 加载到Canvas
            await this.loadImageToCanvas(imageUrl);
            
            // 更新UI
            this.updateUI();
            this.hideLoading();
            
            // 更新步骤指示器
            this.updateStepIndicator(2);
            
        } catch (error) {
            console.error('图片上传失败:', error);
            this.showError('图片加载失败', error.message);
            this.hideLoading();
        }
    }
    
    /**
     * 验证图片文件
     */
    validateImageFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!validTypes.includes(file.type)) {
            return false;
        }
        
        if (file.size > maxSize) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 读取图片文件
     */
    readImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('文件读取失败'));
            
            reader.readAsDataURL(file);
        });
    }
    
    /**
     * 加载图片到Canvas
     */
    async loadImageToCanvas(imageUrl) {
        return new Promise((resolve, reject) => {
            fabric.Image.fromURL(imageUrl, (img) => {
                // 清除Canvas
                this.fabricCanvas.clear();
                
                // 保存原始图片
                this.image = img;
                this.originalImageData = imageUrl;
                
                // 调整图片尺寸以适应Canvas
                const scale = Math.min(
                    800 / img.width,
                    500 / img.height,
                    1
                );
                
                img.scale(scale);
                
                // 居中显示
                this.fabricCanvas.setWidth(img.width * scale);
                this.fabricCanvas.setHeight(img.height * scale);
                this.fabricCanvas.add(img);
                this.fabricCanvas.centerObject(img);
                this.fabricCanvas.renderAll();
                
                // 更新Canvas信息
                this.updateCanvasInfo();
                
                // 重置历史记录
                this.history = [];
                this.historyIndex = -1;
                this.saveHistory();
                
                resolve();
            }, {
                crossOrigin: 'anonymous'
            });
        });
    }
    
    /**
     * 设置当前工具
     */
    setTool(tool) {
        this.currentTool = tool;
        
        // 更新按钮状态
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (tool === 'rect') {
            document.getElementById('rectTool').classList.add('active');
            this.setupRectTool();
        } else if (tool === 'brush') {
            document.getElementById('brushTool').classList.add('active');
            this.setupBrushTool();
        }
        
        // 显示/隐藏画笔大小控制
        const brushSizeControl = document.getElementById('brushSizeControl');
        brushSizeControl.style.display = tool === 'brush' ? 'flex' : 'none';
    }
    
    /**
     * 设置矩形工具
     */
    setupRectTool() {
        this.fabricCanvas.selection = true;
        this.fabricCanvas.defaultCursor = 'crosshair';
        
        // 清除现有选择
        this.clearSelection();
    }
    
    /**
     * 设置画笔工具
     */
    setupBrushTool() {
        this.fabricCanvas.selection = false;
        this.fabricCanvas.defaultCursor = 'crosshair';
    }
    
    /**
     * 开始矩形选择
     */
    startRectSelection(x, y) {
        this.rectStart = { x, y };
        
        // 创建矩形
        this.selectionRect = new fabric.Rect({
            left: x,
            top: y,
            width: 0,
            height: 0,
            fill: 'rgba(239, 68, 68, 0.1)',
            stroke: '#ef4444',
            strokeWidth: 2,
            strokeDashArray: [5, 5],
            selectable: false
        });
        
        this.fabricCanvas.add(this.selectionRect);
    }
    
    /**
     * 完成矩形选择
     */
    finishRectSelection() {
        if (!this.selectionRect) return;
        
        // 确保矩形有最小尺寸
        if (this.selectionRect.width < 10 || this.selectionRect.height < 10) {
            this.fabricCanvas.remove(this.selectionRect);
            this.selectionRect = null;
            this.rectStart = null;
            return;
        }
        
        // 保存选择
        this.saveHistory();
        this.rectStart = null;
    }
    
    /**
     * 绘制画笔
     */
    drawBrush(x, y) {
        const brush = new fabric.Circle({
            left: x - this.brushSize / 2,
            top: y - this.brushSize / 2,
            radius: this.brushSize / 2,
            fill: 'rgba(239, 68, 68, 0.3)',
            stroke: '#ef4444',
            strokeWidth: 2,
            selectable: false
        });
        
        this.fabricCanvas.add(brush);
        this.fabricCanvas.renderAll();
    }
    
    /**
     * 清除选择
     */
    clearSelection() {
        // 移除所有选择标记
        const objects = this.fabricCanvas.getObjects();
        objects.forEach(obj => {
            if (obj !== this.image && 
                (obj instanceof fabric.Rect || obj instanceof fabric.Circle)) {
                this.fabricCanvas.remove(obj);
            }
        });
        
        this.selectionRect = null;
        this.saveHistory();
    }
    
    /**
     * 保存历史状态
     */
    saveHistory() {
        // 只保存最近20个状态
        if (this.history.length >= 20) {
            this.history.shift();
        }
        
        // 清除重做历史
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // 保存当前状态
        const state = this.fabricCanvas.toJSON();
        this.history.push(state);
        this.historyIndex = this.history.length - 1;
        
        // 更新撤销/重做按钮状态
        this.updateUndoRedoButtons();
    }
    
    /**
     * 撤销
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.loadHistoryState(this.history[this.historyIndex]);
        }
    }
    
    /**
     * 重做
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.loadHistoryState(this.history[this.historyIndex]);
        }
    }
    
    /**
     * 加载历史状态
     */
    loadHistoryState(state) {
        this.fabricCanvas.loadFromJSON(state, () => {
            this.fabricCanvas.renderAll();
            this.updateUndoRedoButtons();
        });
    }
    
    /**
     * 更新撤销/重做按钮状态
     */
    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        undoBtn.disabled = this.historyIndex <= 0;
        redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }
    
    /**
     * 去除水印
     */
    async removeWatermark() {
        try {
            // 验证是否有图片
            if (!this.image) {
                this.showError('请先上传图片', '请上传需要处理的图片');
                return;
            }
            
            // 验证是否有选择区域
            if (!this.hasSelection()) {
                this.showError('请选择水印区域', '使用矩形或画笔工具选择需要去除的水印区域');
                return;
            }
            
            // 显示进度
            this.showProgress();
            
            // 生成mask
            const maskData = await this.generateMask();
            
            // 获取图片数据
            const imageData = this.fabricCanvas.toDataURL({
                format: 'png',
                quality: 1
            });
            
            // 调用API
            const result = await this.callRemoveAPI(imageData, maskData);
            
            // 显示结果
            this.showResult(result);
            
        } catch (error) {
            console.error('去除水印失败:', error);
            this.showError('处理失败', error.message);
            this.hideProgress();
        }
    }
    
    /**
     * 检查是否有选择区域
     */
    hasSelection() {
        const objects = this.fabricCanvas.getObjects();
        return objects.some(obj => 
            obj !== this.image && 
            (obj instanceof fabric.Rect || obj instanceof fabric.Circle)
        );
    }
    
    /**
     * 生成mask
     */
    async generateMask() {
        return new Promise((resolve) => {
            // 创建临时Canvas
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            // 设置Canvas尺寸
            tempCanvas.width = this.fabricCanvas.width;
            tempCanvas.height = this.fabricCanvas.height;
            
            // 绘制白色背景
            tempCtx.fillStyle = 'white';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // 绘制黑色选择区域
            tempCtx.fillStyle = 'black';
            
            const objects = this.fabricCanvas.getObjects();
            objects.forEach(obj => {
                if (obj !== this.image) {
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
     * 调用去除水印API
     */
    async callRemoveAPI(imageData, maskData) {
        // 显示处理进度
        this.updateProgress(30, '正在上传图片...');
        
        // 准备数据
        const cleanImageData = imageData.replace(/^data:image\/\w+;base64,/, '');
        const cleanMaskData = maskData.replace(/^data:image\/\w+;base64,/, '');
        
        const requestData = {
            image: cleanImageData,
            mask: cleanMaskData
        };
        
        this.updateProgress(50, '正在调用AI处理...');
        
        try {
            // 调用API
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            this.updateProgress(80, '正在处理结果...');
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || '处理失败');
            }
            
            this.updateProgress(100, '处理完成');
            
            return data.result;
            
        } catch (error) {
            console.error('API调用失败:', error);
            throw error;
        }
    }
    
    /**
     * 显示进度
     */
    showProgress() {
        document.getElementById('progressSection').classList.remove('hidden');
        document.getElementById('removeBtn').disabled = true;
        this.updateProgress(0, '准备中...');
    }
    
    /**
     * 更新进度
     */
    updateProgress(percent, text) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const progressPercent = document.getElementById('progressPercent');
        
        progressFill.style.width = `${percent}%`;
        progressText.textContent = text;
        progressPercent.textContent = `${percent}%`;
    }
    
    /**
     * 隐藏进度
     */
    hideProgress() {
        document.getElementById('progressSection').classList.add('hidden');
        document.getElementById('removeBtn').disabled = false;
    }
    
    /**
     * 显示结果
     */
    showResult(resultImageData) {
        // 隐藏进度
        this.hideProgress();
        
        // 显示结果区域
        document.getElementById('resultSection').classList.remove('hidden');
        
        // 显示原图和处理结果
        document.getElementById('originalImage').src = this.originalImageData;
        document.getElementById('resultImage').src = `data:image/png;base64,${resultImageData}`;
        
        // 更新步骤指示器
        this.updateStepIndicator(4);
    }
    
    /**
     * 下载结果
     */
    downloadResult() {
        const resultImage = document.getElementById('resultImage');
        const link = document.createElement('a');
        
        link.href = resultImage.src;
        link.download = `watermark-removed-${Date.now()}.png`;
        link.click();
    }
    
    /**
     * 再次处理
     */
    processAgain() {
        // 隐藏结果区域
        document.getElementById('resultSection').classList.add('hidden');
        
        // 重置到选择步骤
        this.updateStepIndicator(2);
    }
    
    /**
     * 重置应用
     */
    reset() {
        // 清除Canvas
        this.fabricCanvas.clear();
        this.image = null;
        this.originalImageData = null;
        
        // 重置历史
        this.history = [];
        this.historyIndex = -1;
        
        // 隐藏结果和错误区域
        document.getElementById('resultSection').classList.add('hidden');
        document.getElementById('errorSection').classList.add('hidden');
        
        // 重置Canvas尺寸
        this.setCanvasSize(800, 500);
        
        // 更新UI
        this.updateUI();
        this.updateStepIndicator(1);
    }
    
    /**
     * 重试
     */
    retry() {
        document.getElementById('errorSection').classList.add('hidden');
        this.removeWatermark();
    }
    
    /**
     * 显示错误
     */
    showError(title, message) {
        document.getElementById('errorTitle').textContent = title;
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorSection').classList.remove('hidden');
        
        // 隐藏进度
        this.hideProgress();
    }
    
    /**
     * 显示加载状态
     */
    showLoading(message) {
        // 这里可以添加加载动画
        console.log('加载中:', message);
    }
    
    /**
     * 隐藏加载状态
     */
    hideLoading() {
        // 这里可以移除加载动画
        console.log('加载完成');
    }
    
    /**
     * 更新UI状态
     */
    updateUI() {
        const removeBtn = document.getElementById('removeBtn');
        const canvasInfo = document.getElementById('canvasInfo');
        
        if (this.image) {
            removeBtn.disabled = false;
            canvasInfo.textContent = `图片尺寸: ${this.image.width} × ${this.image.height}`;
        } else {
            removeBtn.disabled = true;
            canvasInfo.textContent = '等待图片上传...';
        }
        
        // 更新撤销/重做按钮
        this.updateUndoRedoButtons();
    }
    
    /**
     * 更新Canvas信息
     */
    updateCanvasInfo() {
        if (!this.image) return;
        
        const canvasInfo = document.getElementById('canvasInfo');
        canvasInfo.textContent = `图片尺寸: ${Math.round(this.image.width * this.image.scaleX)} × ${Math.round(this.image.height * this.image.scaleY)}`;
    }
    
    /**
     * 更新步骤指示器
     */
    updateStepIndicator(step) {
        const steps = document.querySelectorAll('.step');
        const stepNumbers = document.querySelectorAll('.step-number');
        
        // 重置所有步骤
        steps.forEach((stepEl, index) => {
            const stepNumber = stepNumbers[index];
            
            if (index < step) {
                // 已完成步骤
                stepNumber.classList.remove('bg-gray-300', 'text-gray-600');
                stepNumber.classList.add('bg-blue-500', 'text-white');
                stepEl.querySelector('span').classList.remove('text-gray-500');
                stepEl.querySelector('span').classList.add('text-gray-800');
            } else if (index === step) {
                // 当前步骤
                stepNumber.classList.remove('bg-gray-300', 'text-gray-600');
                stepNumber.classList.add('bg-blue-100', 'text-blue-600', 'border', 'border-blue-300');
                stepEl.querySelector('span').classList.remove('text-gray-500');
                stepEl.querySelector('span').classList.add('text-blue-600', 'font-medium');
            } else {
                // 未完成步骤
                stepNumber.classList.remove('bg-blue-500', 'bg-blue-100', 'text-white', 'text-blue-600', 'border', 'border-blue-300');
                stepNumber.classList.add('bg-gray-300', 'text-gray-600');
                stepEl.querySelector('span').classList.remove('text-gray-800', 'text-blue-600', 'font-medium');
                stepEl.querySelector('span').classList.add('text-gray-500');
            }
        });
    }
    
    /**
     * 设置API端点
     */
    setApiEndpoint(endpoint) {
        this.apiEndpoint = endpoint;
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.watermarkRemover = new WatermarkRemover();
    
    // 开发模式：使用本地API端点
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.watermarkRemover.setApiEndpoint('http://localhost:8787/api/remove');
    }
    
    console.log('Watermark Remover 已加载');
});