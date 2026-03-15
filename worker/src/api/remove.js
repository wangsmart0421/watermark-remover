/**
 * 去除水印API处理
 */

import { callReplicateAPI } from '../utils/replicate.js';
import { validateImageData, processImageData } from '../utils/image.js';
import { createResponse } from '../utils/response.js';

// CORS头
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * 处理去除水印请求
 */
export async function handleRemoveRequest(request) {
    const startTime = Date.now();
    
    try {
        // 解析请求体
        const requestData = await request.json();
        
        // 验证请求数据
        const validation = validateRemoveRequest(requestData);
        if (!validation.valid) {
            return createResponse(400, {
                success: false,
                error: 'Validation Error',
                message: validation.message,
                processingTime: Date.now() - startTime,
            }, CORS_HEADERS);
        }
        
        const { image: imageBase64, mask: maskBase64 } = requestData;
        
        // 处理图片数据
        const processedImage = await processImageData(imageBase64);
        const processedMask = await processImageData(maskBase64);
        
        // 调用Replicate API
        const replicateResult = await callReplicateAPI(
            processedImage.dataUrl,
            processedMask.dataUrl,
            {
                model: 'lama',
                device: 'cuda',
                timeout: 30000, // 30秒超时
            }
        );
        
        const processingTime = Date.now() - startTime;
        
        // 返回成功响应
        return createResponse(200, {
            success: true,
            result: replicateResult,
            processingTime,
            imageInfo: {
                originalSize: processedImage.size,
                processedSize: replicateResult.length,
                format: 'png',
            },
            timestamp: new Date().toISOString(),
        }, CORS_HEADERS);
        
    } catch (error) {
        console.error('Remove watermark error:', error);
        
        const processingTime = Date.now() - startTime;
        
        // 根据错误类型返回不同的状态码
        let statusCode = 500;
        let errorMessage = 'Internal Server Error';
        
        if (error.message.includes('timeout')) {
            statusCode = 504;
            errorMessage = 'Processing timeout';
        } else if (error.message.includes('invalid') || error.message.includes('validation')) {
            statusCode = 400;
            errorMessage = error.message;
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
            statusCode = 429;
            errorMessage = 'Rate limit exceeded';
        } else if (error.message.includes('authentication') || error.message.includes('token')) {
            statusCode = 401;
            errorMessage = 'Authentication failed';
        }
        
        return createResponse(statusCode, {
            success: false,
            error: errorMessage,
            details: process.env.DEBUG_MODE ? error.message : undefined,
            processingTime,
            timestamp: new Date().toISOString(),
        }, CORS_HEADERS);
    }
}

/**
 * 验证去除水印请求
 */
function validateRemoveRequest(data) {
    // 检查数据是否存在
    if (!data) {
        return {
            valid: false,
            message: 'Request body is required',
        };
    }
    
    // 检查图片数据
    if (!data.image || typeof data.image !== 'string') {
        return {
            valid: false,
            message: 'Image data is required and must be a base64 string',
        };
    }
    
    // 检查mask数据
    if (!data.mask || typeof data.mask !== 'string') {
        return {
            valid: false,
            message: 'Mask data is required and must be a base64 string',
        };
    }
    
    // 验证base64格式
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    
    if (!base64Regex.test(data.image.replace(/^data:image\/\w+;base64,/, ''))) {
        return {
            valid: false,
            message: 'Invalid image base64 format',
        };
    }
    
    if (!base64Regex.test(data.mask.replace(/^data:image\/\w+;base64,/, ''))) {
        return {
            valid: false,
            message: 'Invalid mask base64 format',
        };
    }
    
    // 检查数据大小（限制为5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    const imageSize = Math.floor((data.image.length * 3) / 4);
    const maskSize = Math.floor((data.mask.length * 3) / 4);
    
    if (imageSize > maxSize) {
        return {
            valid: false,
            message: `Image size (${formatBytes(imageSize)}) exceeds maximum allowed size (5MB)`,
        };
    }
    
    if (maskSize > maxSize) {
        return {
            valid: false,
            message: `Mask size (${formatBytes(maskSize)}) exceeds maximum allowed size (5MB)`,
        };
    }
    
    return {
        valid: true,
    };
}

/**
 * 格式化字节大小
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 处理去除水印请求（兼容旧版本）
 */
export default {
    async fetch(request) {
        return await handleRemoveRequest(request);
    },
};