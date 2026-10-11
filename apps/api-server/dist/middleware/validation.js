"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
function validate(schema) {
    return async (req, res, next) => {
        try {
            if (schema.body) {
                req.body = await schema.body.parseAsync(req.body);
            }
            if (schema.query) {
                req.query = await schema.query.parseAsync(req.query);
            }
            if (schema.params) {
                req.params = await schema.params.parseAsync(req.params);
            }
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const fieldErrors = err.errors.map((e) => ({
                    field: e.path.join('.'),
                    message: e.message,
                }));
                res.status(400).json({
                    success: false,
                    message: 'Input validation failed.',
                    code: 'VALIDATION_ERROR',
                    errors: fieldErrors,
                    requestId: req.headers['x-request-id'],
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            next(err);
        }
    };
}
//# sourceMappingURL=validation.js.map