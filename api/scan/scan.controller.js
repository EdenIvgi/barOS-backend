import { productScanService } from '../../services/productScan.service.js'

export async function scanProduct(req, res, next) {
    try {
        const product = await productScanService.scanProduct(req.body?.data, req.body?.categories)
        res.json(product)
    } catch (error) {
        // A photograph of something that is not a drink is an ordinary outcome of
        // pointing a camera, not a failure worth logging as one. It carries a code
        // so the client can say the one thing that is actually useful here.
        if (error?.code === 'not_a_drink') {
            return res.status(422).json({ error: error.message, code: 'not_a_drink' })
        }
        next(error)
    }
}

export function scanStatus(req, res) {
    res.json({ isConfigured: productScanService.isConfigured() })
}
