export function createHttpClient({ request, logger = console }) {
    function makeRequest(options) {
        return new Promise((resolve, reject) => {
            let cleanedUrl;
            try {
                const urlObj = new URL(options.url);
                urlObj.pathname = urlObj.pathname.replace(/\/+/g, '/');
                cleanedUrl = urlObj.toString();
                if (cleanedUrl.endsWith('/') && cleanedUrl.length > 8) {
                    cleanedUrl = cleanedUrl.slice(0, -1);
                }
            } catch {
                reject(new Error(`URL格式无效: "${options.url}"`));
                return;
            }

            const requestOptions = {
                method: options.method || 'GET',
                url: cleanedUrl,
                headers: options.headers || {},
                data: options.data,
                timeout: options.timeout || 3600000,
                onload: (response) => {
                    if (response.status >= 200 && response.status < 300) {
                        resolve(response);
                    } else {
                        reject(new Error(`API错误: ${response.status} ${response.statusText || ''}. Response: ${response.responseText.substring(0, 100)}`));
                    }
                },
                onerror: (error) => {
                    reject(new Error(`网络错误: ${error.details || '未知错误，可能是目标服务(ComfyUI/WebUI)未启动、地址错误或CORS策略问题'}`));
                },
                ontimeout: () => {
                    reject(new Error('请求超时'));
                },
            };

            if (options.responseType) {
                requestOptions.responseType = options.responseType;
            }

            request(requestOptions);
        });
    }

    async function makeRequestWithRetry(options, maxRetries = 3) {
        let lastError;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await makeRequest(options);
            } catch (error) {
                lastError = error;

                const noRetryPatterns = ['404', '401', '403', 'URL格式无效'];
                if (noRetryPatterns.some(pattern => error.message.includes(pattern))) {
                    throw error;
                }

                if (attempt < maxRetries - 1) {
                    const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
                    logger.log(`[AI Gen] 请求失败，${delay}ms后重试 (${attempt + 1}/${maxRetries})`, error.message);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        throw lastError;
    }

    return {
        makeRequest,
        makeRequestWithRetry,
    };
}
