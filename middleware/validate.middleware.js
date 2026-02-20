/**
 * Returns an Express middleware that validates req.body fields.
 *
 * Schema example:
 *   { username: { required: true }, password: { required: true, minLength: 4 } }
 */
export function validate(schema) {
    return (req, res, next) => {
        const errors = []

        for (const [field, rules] of Object.entries(schema)) {
            const val = req.body[field]
            const isEmpty = val === undefined || val === null || String(val).trim() === ''

            if (rules.required && isEmpty) {
                errors.push(`${field} is required`)
                continue
            }

            if (!isEmpty) {
                if (rules.minLength && String(val).trim().length < rules.minLength) {
                    errors.push(`${field} must be at least ${rules.minLength} characters`)
                }
                if (rules.maxLength && String(val).trim().length > rules.maxLength) {
                    errors.push(`${field} must be at most ${rules.maxLength} characters`)
                }
                if (rules.isNumber && isNaN(Number(val))) {
                    errors.push(`${field} must be a number`)
                }
                if (rules.isArray && !Array.isArray(val)) {
                    errors.push(`${field} must be an array`)
                }
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ error: 'Validation failed', details: errors })
        }

        next()
    }
}
