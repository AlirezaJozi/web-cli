import { ZodError } from 'zod';

/**
 * میدل‌ور اعتبارسنجی با zod
 * استفاده: validate({ body: schema, query: schema, params: schema })
 * مقادیر parse شده جایگزین req می‌شوند (coerce و default اعمال می‌شود)
 */
export function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    try {
      if (params) req.params = params.parse(req.params);
      if (query) req.query = query.parse(req.query);
      if (body) req.body = body.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: err.issues[0]?.message || 'ورودی نامعتبر است',
          data: null,
        });
      }
      next(err);
    }
  };
}
