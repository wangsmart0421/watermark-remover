/**
 * 健康检查API
 */

import { checkReplicateAPI } from '../utils/replicate.js';

// CORS头
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * 处理健康检查请求
 */
export async function handleHealthCheck() {
    const startTime = Date.now();
    
    try {
        // 检查Replicate API连接
        const replicateStatus = await checkReplicateAPI();
        
        // 获取系统信息
        const systemInfo = await getSystemInfo();
        
        const responseTime = Date.now() - startTime;
        
        return {
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            responseTime,
            services: {
                replicate: replicateStatus,
                worker: 'healthy',
            },
            system: systemInfo,
            version: '1.0.0',
        };
        
    } catch (error) {
        console.error('Health check error:', error);
        
        const responseTime = Date.now() - startTime;
        
        return {
            success: false,
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            responseTime,
            services: {
                replicate: {
                    status: 'unhealthy',
                    error: error.message,
                },
                worker: 'healthy',
            },
            error: 'Service dependency failed',
            version: '1.0.0',
        };
    }
}

/**
 * 获取系统信息
 */
async function getSystemInfo() {
    return {
        environment: process.env.NODE_ENV || 'production',
        region: process.env.REGION || 'unknown',
        memory: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE || 'unknown',
        runtime: 'Cloudflare Workers',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
}

/**
 * 健康检查端点（兼容旧版本）
 */
export default {
    async fetch(request) {
        try {
            const healthData = await handleHealthCheck();
            
            return new Response(JSON.stringify(healthData), {
                status: healthData.success ? 200 : 503,
                headers: {
                    ...CORS_HEADERS,
                    'Content-Type': 'application/json',
                },
            });
            
        } catch (error) {
            console.error('Health check endpoint error:', error);
            
            return new Response(JSON.stringify({
                success: false,
                status: 'unhealthy',
                error: 'Health check failed',
                timestamp: new Date().toISOString(),
            }), {
                status: 503,
                headers: {
                    ...CORS_HEADERS,
                    'Content-Type': 'application/json',
                },
            });
        }
    },
};