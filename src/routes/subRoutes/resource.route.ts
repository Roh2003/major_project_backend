import { Router } from 'express';
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  incrementDownload,
  getResourceStats
} from "../../controllers/resource.controller";
import { authAdmin, authAdminOrUser } from '../../middlewares/auth';

const router = Router();

// ---- Resource Routes ----
router.get('/',authAdminOrUser,getAllResources);              // Get all resources with optional filters
router.get('/stats',authAdminOrUser, getResourceStats);        // Get resource statistics
router.get('/:id',authAdminOrUser, getResourceById);           // Get a single resource by ID
router.post('/',authAdmin,createResource);              // Create a new resource
router.patch('/:id',authAdmin,updateResource);          // Update a resource
router.delete('/:id',authAdmin,deleteResource);         // Delete a resource
router.post('/:id/download',authAdminOrUser,incrementDownload); // Increment download count

export default router;