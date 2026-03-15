/**
 * 响应工具函数
 */

/**
 * 创建标准响应
 */
export function createResponse(status, data, headers = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    };
    
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...defaultHeaders,
            ...headers,
        },
    });
}

/**
 * 验证请求
 */
export async function validateRequest(request, env) {
    // 检查请求方法
    const allowedMethods = ['GET', 'POST', 'OPTIONS'];
    if (!allowedMethods.includes(request.method)) {
        return {
            valid: false,
            status: 405,
            error: 'Method Not Allowed',
            message: `Method ${request.method} not allowed`,
        };
    }
    
    // 检查Content-Type（对于POST请求）
    if (request.method === 'POST') {
        const contentType = request.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
            return {
                valid: false,
                status: 415,
                error: 'Unsupported Media Type',
                message: 'Content-Type must be application/json',
            };
        }
    }
    
    // 检查请求大小限制
    const contentLength = request.headers.get('Content-Length');
    if (contentLength) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (parseInt(contentLength) > maxSize) {
            return {
                valid: false,
                status: 413,
                error: 'Payload Too Large',
                message: `Request size exceeds ${formatBytes(maxSize)} limit`,
            };
        }
    }
    
    // 检查CORS来源
    const origin = request.headers.get('Origin');
    if (origin && env.ALLOWED_ORIGINS !== '*') {
        const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
        if (!allowedOrigins.includes(origin) && !allowedOrigins.includes('*')) {
            return {
                valid: false,
                status: 403,
                error: 'Forbidden',
                message: 'Origin not allowed',
            };
        }
    }
    
    // 检查速率限制（简单实现）
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = `rate_limit:${clientIP}`;
    
    // 这里可以集成更复杂的速率限制逻辑
    // 例如使用Cloudflare KV存储
    
    return {
        valid: true,
    };
}

/**
 * 格式化错误响应
 */
export function createErrorResponse(error, status = 500) {
    const errorResponse = {
        success: false,
        error: 'Internal Server Error',
        timestamp: new Date().toISOString(),
    };
    
    if (error instanceof Error) {
        errorResponse.error = error.name;
        errorResponse.message = error.message;
        
        // 在开发模式下包含堆栈跟踪
        if (process.env.DEBUG_MODE) {
            errorResponse.stack = error.stack;
        }
    } else if (typeof error === 'string') {
        errorResponse.error = 'Error';
        errorResponse.message = error;
    } else if (error && typeof error === 'object') {
        Object.assign(errorResponse, error);
    }
    
    return createResponse(status, errorResponse);
}

/**
 * 格式化成功响应
 */
export function createSuccessResponse(data, status = 200) {
    const successResponse = {
        success: true,
        timestamp: new Date().toISOString(),
        ...data,
    };
    
    return createResponse(status, successResponse);
}

/**
 * 创建分页响应
 */
export function createPaginatedResponse(data, page, limit, total) {
    return createSuccessResponse({
        data,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    });
}

/**
 * 创建文件下载响应
 */
export function createFileResponse(filename, content, contentType = 'application/octet-stream') {
    const headers = {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': '*',
    };
    
    return new Response(content, {
        status: 200,
        headers,
    });
}

/**
 * 创建重定向响应
 */
export function createRedirectResponse(url, permanent = false) {
    return new Response(null, {
        status: permanent ? 308 : 307,
        headers: {
            'Location': url,
            'Access-Control-Allow-Origin': '*',
        },
    });
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
 * 验证JSON请求体
 */
export async function validateJsonBody(request) {
    try {
        const text = await request.text();
        
        // 检查是否为空
        if (!text.trim()) {
            return {
                valid: false,
                error: 'Request body is empty',
            };
        }
        
        // 解析JSON
        const data = JSON.parse(text);
        
        return {
            valid: true,
            data,
        };
        
    } catch (error) {
        return {
            valid: false,
            error: 'Invalid JSON format',
            details: error.message,
        };
    }
}

/**
 * 设置缓存头
 */
export function setCacheHeaders(headers, maxAge = 3600) {
    return {
        ...headers,
        'Cache-Control': `public, max-age=${maxAge}`,
        'Expires': new Date(Date.now() + maxAge * 1000).toUTCString(),
    };
}

/**
 * 设置无缓存头
 */
export function setNoCacheHeaders(headers) {
    return {
        ...headers,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
    };
}