/**
 * Cloudflare Worker - 水印去除API
 */

// 导入工具函数
import { handleRemoveRequest } from './api/remove.js';
import { handleHealthCheck } from './api/health.js';
import { validateRequest, createResponse } from './utils/response.js';

// CORS配置
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

// 环境变量
const ENV = {
    REPLICATE_API_TOKEN: '',
    ALLOWED_ORIGINS: '*',
    RATE_LIMIT: '100', // 每分钟请求限制
    DEBUG_MODE: false,
};

/**
 * 处理OPTIONS请求（CORS预检）
 */
function handleOptionsRequest() {
    return new Response(null, {
        status: 204,
        headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
        },
    });
}

/**
 * 处理健康检查请求
 */
async function handleHealthRequest(request) {
    try {
        const healthData = await handleHealthCheck();
        return createResponse(200, healthData, CORS_HEADERS);
    } catch (error) {
        return createResponse(500, {
            success: false,
            error: 'Health check failed',
            details: error.message,
        }, CORS_HEADERS);
    }
}

/**
 * 处理API路由
 */
async function handleApiRequest(request, url) {
    const path = url.pathname;
    
    // 路由匹配
    if (path === '/api/remove' && request.method === 'POST') {
        return await handleRemoveRequest(request);
    }
    
    if (path === '/api/health' && request.method === 'GET') {
        return await handleHealthRequest(request);
    }
    
    // 未找到路由
    return createResponse(404, {
        success: false,
        error: 'Not Found',
        message: `Route ${path} not found`,
    }, CORS_HEADERS);
}

/**
 * Worker主处理函数
 */
export default {
    async fetch(request, env, ctx) {
        try {
            // 初始化环境变量
            Object.assign(ENV, env);
            
            const url = new URL(request.url);
            
            // 处理OPTIONS请求（CORS预检）
            if (request.method === 'OPTIONS') {
                return handleOptionsRequest();
            }
            
            // 验证请求
            const validation = await validateRequest(request, ENV);
            if (!validation.valid) {
                return createResponse(validation.status || 400, {
                    success: false,
                    error: validation.error,
                    message: validation.message,
                }, CORS_HEADERS);
            }
            
            // 处理API请求
            if (url.pathname.startsWith('/api')) {
                return await handleApiRequest(request, url);
            }
            
            // 处理根路径
            if (url.pathname === '/' || url.pathname === '') {
                return createResponse(200, {
                    success: true,
                    message: 'Watermark Remover API',
                    version: '1.0.0',
                    endpoints: {
                        remove: 'POST /api/remove',
                        health: 'GET /api/health',
                    },
                    documentation: 'https://github.com/wangsmart0421/watermark-remover',
                }, CORS_HEADERS);
            }
            
            // 未找到资源
            return createResponse(404, {
                success: false,
                error: 'Not Found',
                message: 'Resource not found',
            }, CORS_HEADERS);
            
        } catch (error) {
            console.error('Worker error:', error);
            
            return createResponse(500, {
                success: false,
                error: 'Internal Server Error',
                message: ENV.DEBUG_MODE ? error.message : 'An unexpected error occurred',
                timestamp: new Date().toISOString(),
            }, CORS_HEADERS);
        }
    },
};