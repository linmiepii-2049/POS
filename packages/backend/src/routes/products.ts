import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { ProductService } from '../services/products.js';
import type { Env } from '../env.d.ts';
import {
  ProductQuerySchema,
  CreateProductRequestSchema,
  UpdateProductRequestSchema,
  ProductListResponseSchema,
  ProductDetailResponseSchema,
  ProductCreateResponseSchema,
  ProductUpdateResponseSchema,
  ProductDeleteResponseSchema,
  ErrorResponseSchema,
} from '../zod/products.js';

/**
 * 產品路由處理器
 */
export const productsRouter = new OpenAPIHono<{ Bindings: Env }>();

/**
 * GET /products - 取得產品列表
 */
const getProductsRoute = createRoute({
  method: 'get',
  path: '/products',
  tags: ['Products'],
  summary: '取得產品列表',
  description: '取得產品列表，支援分頁、排序、搜尋和篩選',
  operationId: 'Products_List',
  request: {
    query: ProductQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ProductListResponseSchema,
        },
      },
      description: '成功取得產品列表',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '請求參數錯誤',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '伺服器錯誤',
    },
  },
});

productsRouter.openapi(getProductsRoute, async (c) => {
  try {
    const query = c.req.valid('query');
    const productService = new ProductService(c.env.DB);
    
    const result = await productService.getProducts(query);
    
    return c.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得產品列表時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得產品列表時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /products/categories - 取得產品分類列表
 */
const getProductCategoriesRoute = createRoute({
  method: 'get',
  path: '/products/categories',
  tags: ['Products'],
  summary: '取得產品分類列表',
  description: '取得所有產品分類',
  operationId: 'Products_GetCategories',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().describe('操作是否成功'),
            data: z.array(z.string()).describe('分類列表'),
            timestamp: z.string().describe('回應時間戳'),
          }),
        },
      },
      description: '成功取得產品分類列表',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '伺服器錯誤',
    },
  },
});

productsRouter.openapi(getProductCategoriesRoute, async (c) => {
  try {
    const productService = new ProductService(c.env.DB);
    
    const categories = await productService.getCategories();
    
    return c.json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得產品分類列表時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得產品分類列表時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /products/:id - 取得產品詳細資訊
 */
const getProductByIdRoute = createRoute({
  method: 'get',
  path: '/products/{id}',
  tags: ['Products'],
  summary: '取得產品詳細資訊',
  description: '根據產品 ID 取得詳細資訊',
  operationId: 'Products_Get',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('產品 ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ProductDetailResponseSchema,
        },
      },
      description: '成功取得產品詳細資訊',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '產品不存在',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '伺服器錯誤',
    },
  },
});

productsRouter.openapi(getProductByIdRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const productService = new ProductService(c.env.DB);
    
    const product = await productService.getProductById(id);
    
    if (!product) {
      return c.json({
        success: false,
        error: '產品不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    return c.json({
      success: true,
      data: product,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得產品詳細資訊時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得產品詳細資訊時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * POST /products - 建立產品
 */
const createProductRoute = createRoute({
  method: 'post',
  path: '/products',
  tags: ['Products'],
  summary: '建立產品',
  description: '建立新的產品',
  operationId: 'Products_Create',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateProductRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: ProductCreateResponseSchema,
        },
      },
      description: '成功建立產品',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '請求參數錯誤',
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'SKU 已存在',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '伺服器錯誤',
    },
  },
});

productsRouter.openapi(createProductRoute, async (c) => {
  try {
    const data = c.req.valid('json');
    const productService = new ProductService(c.env.DB);
    
    // 檢查 SKU 是否已存在
    if (await productService.isSkuExists(data.sku)) {
      return c.json({
        success: false,
        error: 'SKU 已存在',
        timestamp: new Date().toISOString(),
      }, 409);
    }
    
    const product = await productService.createProduct(data);
    
    return c.json({
      success: true,
      data: product,
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (error) {
    console.error('建立產品時發生錯誤:', error);
    return c.json({
      success: false,
      error: '建立產品時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * PUT /products/:id - 更新產品
 */
const updateProductRoute = createRoute({
  method: 'put',
  path: '/products/{id}',
  tags: ['Products'],
  summary: '更新產品',
  description: '更新產品資訊',
  operationId: 'Products_Update',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('產品 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateProductRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ProductUpdateResponseSchema,
        },
      },
      description: '成功更新產品',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '請求參數錯誤',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '產品不存在',
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: 'SKU 已存在',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '伺服器錯誤',
    },
  },
});

productsRouter.openapi(updateProductRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    
    console.log('=== 更新產品請求 ===');
    console.log('產品 ID:', id);
    console.log('請求數據:', JSON.stringify(data, null, 2));
    
    const productService = new ProductService(c.env.DB);
    
    // 檢查產品是否存在
    const existingProduct = await productService.getProductById(id);
    if (!existingProduct) {
      console.log('產品不存在:', id);
      return c.json({
        success: false,
        error: '產品不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    // 檢查 SKU 是否已存在（如果更新了 SKU）
    if (data.sku && await productService.isSkuExists(data.sku, id)) {
      console.log('SKU 已存在:', data.sku);
      return c.json({
        success: false,
        error: 'SKU 已存在',
        timestamp: new Date().toISOString(),
      }, 409);
    }
    
    const product = await productService.updateProduct(id, data);
    
    if (!product) {
      console.log('更新產品失敗');
      return c.json({
        success: false,
        error: '更新產品失敗',
        timestamp: new Date().toISOString(),
      }, 500);
    }
    
    console.log('產品更新成功:', product);
    return c.json({
      success: true,
      data: product,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('更新產品時發生錯誤:', error);
    const err = error as Error;
    console.error('錯誤詳情:', err.message);
    console.error('錯誤堆疊:', err.stack);
    return c.json({
      success: false,
      error: '更新產品時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * DELETE /products/:id - 刪除產品
 */
const deleteProductRoute = createRoute({
  method: 'delete',
  path: '/products/{id}',
  tags: ['Products'],
  summary: '刪除產品',
  description: '刪除產品（僅限無訂單記錄的產品）',
  operationId: 'Products_Delete',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('產品 ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: ProductDeleteResponseSchema,
        },
      },
      description: '成功刪除產品',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '產品不存在',
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '無法刪除有訂單記錄的產品',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '伺服器錯誤',
    },
  },
});

productsRouter.openapi(deleteProductRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const productService = new ProductService(c.env.DB);
    
    const success = await productService.deleteProduct(id);
    
    if (!success) {
      return c.json({
        success: false,
        error: '產品不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    return c.json({
      success: true,
      message: '產品已成功刪除',
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('刪除產品時發生錯誤:', error);
    
    if (error instanceof Error && error.message.includes('無法刪除有訂單記錄的產品')) {
      return c.json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }, 409);
    }
    
    return c.json({
      success: false,
      error: '刪除產品時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});


