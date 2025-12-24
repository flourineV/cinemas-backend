import type { Request, Response } from 'express';
import { Router } from 'express';
import SupabaseService from '../services/cloud/SupabaseService.js';

const router = Router();
/**
 * @swagger
 * tags:
 *   name: Supabase
 *   description: File storage and presigned URL management
 */
/**
 * @swagger
 * /api/showtimes/supabase/presigned-url:
 *   get:
 *     summary: Generate a presigned URL for file upload/download
 *     tags: [Supabase]
 *     parameters:
 *       - in: query
 *         name: fileName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the file for which to generate a presigned URL
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: "https://your-project.supabase.co/storage/v1/object/sign/uploads/file.png?token=..."
 *       400:
 *         description: fileName is required
 *       500:
 *         description: Failed to generate signed URL or internal server error
 */
// GET /api/showtimes/storage/presigned-url?fileName=...
router.get('/presigned-url', async (req: Request, res: Response) => {
  const { fileName } = req.query as { fileName?: string };
  if (!fileName) {
    return res.status(400).json({ error: 'fileName is required' });
  }

  try {
    const url = await SupabaseService.generatePresignedUrl(fileName);
    if (!url) {
      return res.status(500).json({ error: 'Failed to generate signed URL' });
    }
    return res.json({ url });
  } catch (err: any) {
    console.error('Error generating signed URL', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
