"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendPaginated = sendPaginated;
function sendSuccess(res, data, statusCode = 200, message) {
    const payload = {
        success: true,
        data,
        message,
        requestId: res.req.headers['x-request-id'] || undefined,
        timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(payload);
}
function sendPaginated(res, items, pagination, statusCode = 200) {
    const payload = {
        success: true,
        data: {
            items,
            pagination,
        },
        requestId: res.req.headers['x-request-id'] || undefined,
        timestamp: new Date().toISOString(),
    };
    res.status(statusCode).json(payload);
}
//# sourceMappingURL=response.js.map