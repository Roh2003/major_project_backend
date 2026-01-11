import { Router } from 'express';
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  incrementDownload,
  getResourceStats
} from '@/controllers/resource.controller';

const router = Router();

// ---- Resource Routes ----
router.get('/', getAllResources);              // Get all resources with optional filters
router.get('/stats', getResourceStats);        // Get resource statistics
router.get('/:id', getResourceById);           // Get a single resource by ID
router.post('/', createResource);              // Create a new resource
router.patch('/:id', updateResource);          // Update a resource
router.delete('/:id', deleteResource);         // Delete a resource
router.post('/:id/download', incrementDownload); // Increment download count

export default router;