import { Request, Response } from 'express';
import prisma from '../prisma';
import { sendResponse } from '../utils/responseUtils';

/**
 * Get all resources with optional filtering
 */
export const getAllResources = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;

    const where: any = {};

    // Filter by category if provided
    if (category && category !== 'all') {
      where.category = (category as string).toUpperCase();
    }

    // Search by title or description
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    sendResponse(res, true, resources, 'Resources fetched successfully', 200);
  } catch (error) {
    console.error('Get all resources error:', error);
    sendResponse(res, false, null, 'Failed to fetch resources', 500);
  }
};

/**
 * Get a single resource by ID
 */
export const getResourceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const resource = await prisma.resource.findUnique({
      where: { id: Number(id) }
    });

    if (!resource) {
      sendResponse(res, false, null, 'Resource not found', 404);
      return;
    }

    sendResponse(res, true, resource, 'Resource fetched successfully', 200);
  } catch (error) {
    console.error('Get resource by ID error:', error);
    sendResponse(res, false, null, 'Failed to fetch resource', 500);
  }
};

/**
 * Create a new resource
 */
export const createResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      category,
      type,
      url,
      size,
      uploadedBy
    } = req.body;

    if (!title || !category || !type || !url) {
      sendResponse(res, false, null, 'Title, category, type, and URL are required', 400);
      return;
    }

    // Validate category
    const validCategories = ['DOCUMENT', 'VIDEO', 'IMAGE', 'OTHER'];
    const upperCategory = category.toUpperCase();
    
    if (!validCategories.includes(upperCategory)) {
      sendResponse(res, false, null, 'Invalid category. Must be DOCUMENT, VIDEO, IMAGE, or OTHER', 400);
      return;
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        description,
        category: upperCategory,
        type: type.toUpperCase(),
        url,
        size,
        uploadedBy: uploadedBy || 'Admin',
        downloads: 0
      }
    });

    sendResponse(res, true, resource, 'Resource created successfully', 201);
  } catch (error) {
    console.error('Create resource error:', error);
    sendResponse(res, false, null, 'Failed to create resource', 500);
  }
};

/**
 * Update a resource
 */
export const updateResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    const allowedFields = [
      'title',
      'description',
      'category',
      'type',
      'url',
      'size',
      'uploadedBy'
    ];

    const dataToUpdate: Record<string, any> = {};

    allowedFields.forEach((field) => {
      if (updateFields.hasOwnProperty(field)) {
        let value = updateFields[field];
        
        // Convert category and type to uppercase
        if (field === 'category' || field === 'type') {
          value = value.toUpperCase();
        }
        
        dataToUpdate[field] = value;
      }
    });

    if (Object.keys(dataToUpdate).length === 0) {
      sendResponse(res, false, null, 'No valid fields provided for update', 400);
      return;
    }

    // Validate category if being updated
    if (dataToUpdate.category) {
      const validCategories = ['DOCUMENT', 'VIDEO', 'IMAGE', 'OTHER'];
      if (!validCategories.includes(dataToUpdate.category)) {
        sendResponse(res, false, null, 'Invalid category. Must be DOCUMENT, VIDEO, IMAGE, or OTHER', 400);
        return;
      }
    }

    const updatedResource = await prisma.resource.update({
      where: { id: Number(id) },
      data: dataToUpdate
    });

    sendResponse(res, true, updatedResource, 'Resource updated successfully', 200);
  } catch (error: any) {
    console.error('Update resource error:', error);
    
    if (error.code === 'P2025') {
      sendResponse(res, false, null, 'Resource not found', 404);
      return;
    }
    
    sendResponse(res, false, null, 'Failed to update resource', 500);
  }
};

/**
 * Delete a resource
 */
export const deleteResource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.resource.delete({
      where: { id: Number(id) }
    });

    sendResponse(res, true, null, 'Resource deleted successfully', 200);
  } catch (error: any) {
    console.error('Delete resource error:', error);
    
    if (error.code === 'P2025') {
      sendResponse(res, false, null, 'Resource not found', 404);
      return;
    }
    
    sendResponse(res, false, null, 'Failed to delete resource', 500);
  }
};

/**
 * Increment download count for a resource
 */
export const incrementDownload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const resource = await prisma.resource.update({
      where: { id: Number(id) },
      data: {
        downloads: {
          increment: 1
        }
      }
    });

    sendResponse(res, true, resource, 'Download count incremented', 200);
  } catch (error: any) {
    console.error('Increment download error:', error);
    
    if (error.code === 'P2025') {
      sendResponse(res, false, null, 'Resource not found', 404);
      return;
    }
    
    sendResponse(res, false, null, 'Failed to increment download count', 500);
  }
};

/**
 * Get resource statistics
 */
export const getResourceStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const [total, documents, videos, images, totalDownloads] = await Promise.all([
      prisma.resource.count(),
      prisma.resource.count({ where: { category: 'DOCUMENT' } }),
      prisma.resource.count({ where: { category: 'VIDEO' } }),
      prisma.resource.count({ where: { category: 'IMAGE' } }),
      prisma.resource.aggregate({
        _sum: {
          downloads: true
        }
      })
    ]);

    const stats = {
      total,
      documents,
      videos,
      images,
      totalDownloads: totalDownloads._sum.downloads || 0
    };

    sendResponse(res, true, stats, 'Resource statistics fetched successfully', 200);
  } catch (error) {
    console.error('Get resource stats error:', error);
    sendResponse(res, false, null, 'Failed to fetch resource statistics', 500);
  }
};
