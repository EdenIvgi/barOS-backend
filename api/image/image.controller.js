import { imageStore } from '../../services/imageStore.service.js'

export async function uploadImage(req, res, next) {
    try {
        const { id } = await imageStore.saveImage(req.userDbName, req.body?.data)
        res.status(201).json({ url: `/api/image/${id}`, id })
    } catch (error) {
        next(error)
    }
}

export async function serveImage(req, res, next) {
    try {
        const image = await imageStore.openImage(req.userDbName, req.params.id)
        if (!image) return res.status(404).json({ error: 'Image not found' })

        res.set('Content-Type', image.contentType)
        res.set('Content-Length', String(image.size))
        // An id's bytes never change, so it can be cached hard. But the id only
        // resolves inside one bar's bucket, and devices get shared: without
        // Vary, a tablet that had shown one bar's photo would keep serving it
        // from cache after someone else logged in. Keying the cache on the
        // cookie keeps the long life and scopes it to the session.
        res.set('Cache-Control', 'private, max-age=31536000, immutable')
        res.set('Vary', 'Cookie')

        image.stream.on('error', next)
        image.stream.pipe(res)
    } catch (error) {
        next(error)
    }
}
