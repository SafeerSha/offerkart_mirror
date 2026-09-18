# offerKart API Documentation

Base URL: `http://localhost:3000/api`

---

## 🌟 What's New

We have introduced location and industry-aware endpoints to provide personalized discovery lists for users:

### 1. Featured Offers API (Public User)
Returns featured promotional offers closest to the user's location coordinates.
```bash
curl -X GET "http://localhost:3000/api/user/offer/featured?latitude=9.9312&longitude=76.2673"
```
* **Query Parameters:**
  * `latitude` (number, optional): User latitude
  * `longitude` (number, optional): User longitude

### 2. Featured Shops API (Public User)
Returns a list of premium shops that have active offers, filtered by user location coordinates and/or industry type.
```bash
curl -X GET "http://localhost:3000/api/user/offer/shops?latitude=9.9312&longitude=76.2673&industryId=1"
```
* **Query Parameters:**
  * `latitude` (number, optional): User latitude
  * `longitude` (number, optional): User longitude
  * `industryId` (number/string, optional): Filter by industry ID

---

## 👥 Classification of APIs

### 🔹 Public User APIs
These endpoints do not require merchant authentication and are open to the general public.

#### Table of Contents - Public
- [Health Check](#health-check)
- [User Offers Catalog](#user-offers-catalog)
- [User Offer Products Catalog](#user-offer-products-catalog)
- [Featured Offers (New)](#featured-offers-new)
- [Featured Shops (New)](#featured-shops-new)
- [Proxy Image](#proxy-image)

#### [Health Check](#health-check)
##### Check API Health
```bash
curl -X GET "http://localhost:3000/api/health"
```
*Response:*
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "offerKart-api"
}
```

#### [User Offers Catalog](#user-offers-catalog)
##### Get All Offers
```bash
curl -X GET "http://localhost:3000/api/user/offer?shopId=123&page=1&limit=8&latitude=19.0760&longitude=72.8777&sort=latest"
```
*Query Parameters:*
| Parameter | Type | Description |
|-----------|------|-------------|
| shopId | string | (optional) Filter by shop ID |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 8) |
| latitude | number | (optional) User latitude |
| longitude | number | (optional) User longitude |
| sort | string | Sort: `latest`, `top`, `nearest`, `nearby` (default: `latest`) |

##### Get Offer Details
```bash
curl -X GET "http://localhost:3000/api/user/offer/{id}"
```

##### Get All Offer IDs (For static navigation)
```bash
curl -X GET "http://localhost:3000/api/user/offer/ids"
```

#### [User Offer Products Catalog](#user-offer-products-catalog)
##### Get Offer Products
```bash
curl -X GET "http://localhost:3000/api/user/offer/products?search=query&categoryId=1&subcategoryId=2&shopId=123&minPrice=100&maxPrice=1000&sort=newest&page=1&limit=20"
```
*Query Parameters:*
| Parameter | Type | Description |
|-----------|------|-------------|
| search | string | (optional) Search term |
| categoryId | string | (optional) Filter by category ID |
| subcategoryId | string | (optional) Filter by subcategory ID |
| shopId | string | (optional) Filter by shop ID |
| minPrice | number | (optional) Minimum price |
| maxPrice | number | (optional) Maximum price |
| sort | string | Sort: `newest`, `price_asc`, `price_desc`, `expiring_soon` (default: `newest`) |
| page | number | Page (default: 1) |
| limit | number | Limit (default: 20) |

#### [Featured Offers (New)](#featured-offers-new)
##### Get Featured Offers (Carousel)
```bash
curl -X GET "http://localhost:3000/api/user/offer/featured?latitude=9.9312&longitude=76.2673"
```

#### [Featured Shops (New)](#featured-shops-new)
##### Get Featured Shops (Circular Logos List)
```bash
curl -X GET "http://localhost:3000/api/user/offer/shops?latitude=9.9312&longitude=76.2673&industryId=1"
```

#### [Proxy Image](#proxy-image)
##### Get Proxied Image
```bash
curl -X GET "http://localhost:3000/api/proxy-image?url=https://images.unsplash.com/photo.jpg"
```

---

### 🔸 Business User APIs
These endpoints require merchant authentication (JWT Bearer Token in the `Authorization` header) and are used to manage shop data, products, offers, and access AI tools.

#### Table of Contents - Business
- [Authentication](#authentication)
- [Shops Management](#shops-management)
- [Branches Management](#branches-management)
- [Offers Management](#offers-management)
- [Offer Products Management](#offer-products-management)
- [Category Helpers](#category-helpers)
- [Image Management](#image-management)
- [AI Tagline & Colors Services](#ai-tagline--colors-services)
- [AI Vision OCR Service](#ai-vision-ocr-service)
- [Merchant Support Chat](#merchant-support-chat)
- [Cache Revalidation](#cache-revalidation-1)

#### [Authentication](#authentication)
##### Register Business User
```bash
curl -X POST "http://localhost:3000/api/backend/business/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name": "string", "email": "string", "password": "string"}'
```

##### Login Business User
```bash
curl -X POST "http://localhost:3000/api/backend/business/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "string", "password": "string"}'
```

#### [Shops Management](#shops-management)
##### Create Shop
```bash
curl -X POST "http://localhost:3000/api/backend/business/shop" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"shopName": "string", "address": "string"}'
```

##### Get All Shops
```bash
curl -X GET "http://localhost:3000/api/backend/business/shop" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

##### Get My Registered Shops
```bash
curl -X GET "http://localhost:3000/api/backend/business/shop/my-shops" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

##### Get Shop Details
```bash
curl -X GET "http://localhost:3000/api/backend/business/shop/{id}" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

##### Update Shop
```bash
curl -X PUT "http://localhost:3000/api/backend/business/shop/{id}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"shopName": "string", "address": "string"}'
```

#### [Branches Management](#branches-management)
##### Add Shop Branch
```bash
curl -X POST "http://localhost:3000/api/backend/business/shop/{shopId}/branches" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"branchName": "string", "address": "string", "latitude": 19.07, "longitude": 72.87}'
```

##### Get Shop Branches
```bash
curl -X GET "http://localhost:3000/api/backend/business/shop/{shopId}/branches" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

##### Get Branch Details
```bash
curl -X GET "http://localhost:3000/api/backend/business/shop/{shopId}/branches/{branchId}" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

##### Update Shop Branch
```bash
curl -X PUT "http://localhost:3000/api/backend/business/shop/{shopId}/branches/{branchId}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"branchName": "updated name"}'
```

##### Delete Shop Branch
```bash
curl -X DELETE "http://localhost:3000/api/backend/business/shop/{shopId}/branches/{branchId}" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### [Offers Management](#offers-management)
##### Create Offer
```bash
curl -X POST "http://localhost:3000/api/backend/business/offer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"offerName": "string", "shopId": 123}'
```

##### Get All Offers (Merchant Context)
```bash
curl -X GET "http://localhost:3000/api/backend/business/offer" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

##### Get Offer Details
```bash
curl -X GET "http://localhost:3000/api/backend/business/offer/{id}" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

##### Update Offer
```bash
curl -X PUT "http://localhost:3000/api/backend/business/offer/{id}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"offerName": "string", "description": "string"}'
```

##### Delete Offer
```bash
curl -X DELETE "http://localhost:3000/api/backend/business/offer/{id}" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

##### Toggle Offer Status (Inactivate/Activate)
```bash
curl -X PATCH "http://localhost:3000/api/backend/business/offer/inactivate/{id}" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### [Offer Products Management](#offer-products-management)
##### Create Offer Product
```bash
curl -X POST "http://localhost:3000/api/backend/business/offerproduct" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "shopId: 123" \
  -d '{"displayName": "string", "offerPrice": 0, "originalPrice": 0, "categoryId": 1, "imageUrl": "string"}'
```

##### Get All Offer Products
```bash
curl -X GET "http://localhost:3000/api/backend/business/offerproduct" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "shopId: 123"
```

##### Get Offer Product by ID
```bash
curl -X GET "http://localhost:3000/api/backend/business/offerproduct/{id}" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

##### Update Offer Product
```bash
curl -X PUT "http://localhost:3000/api/backend/business/offerproduct/{id}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "shopId: 123" \
  -d '{"displayName": "string", "offerPrice": 0, "originalPrice": 0, "categoryId": 1, "imageUrl": "string"}'
```

##### Delete Offer Product
```bash
curl -X DELETE "http://localhost:3000/api/backend/business/offerproduct/{id}" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

##### Toggle Offer Product Status
```bash
curl -X PATCH "http://localhost:3000/api/backend/business/offerproduct/inactivate/{id}" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### [Category Helpers](#category-helpers)
##### Get Categories
```bash
curl -X GET "http://localhost:3000/api/backend/business/category"
```

##### Get Category Subcategories
```bash
curl -X GET "http://localhost:3000/api/backend/business/category/{id}/subcategories"
```

#### [Image Management](#image-management)
##### Upload Image File (S3 Bucket)
```bash
curl -X POST "http://localhost:3000/api/backend/business/image/upload" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "folder=optional_folder"
```

##### Get All Uploaded Images
```bash
curl -X GET "http://localhost:3000/api/backend/business/image" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

##### Delete Uploaded Image
```bash
curl -X DELETE "http://localhost:3000/api/backend/business/image" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"url": "https://example.com/image.jpg"}'
```

#### [AI Tagline & Colors Services](#ai-tagline--colors-services)
##### Generate Taglines
```bash
curl -X POST "http://localhost:3000/api/ai" \
  -H "Content-Type: application/json" \
  -d '{"type": "taglines", "productName": "Product Name", "category": "Category", "tone": "exciting"}'
```

##### Generate Color Palette
```bash
curl -X POST "http://localhost:3000/api/ai" \
  -H "Content-Type: application/json" \
  -d '{"type": "palette", "imageUrl": "https://example.com/image.jpg"}'
```

#### [AI Vision OCR Service](#ai-vision-ocr-service)
##### Extract Product from Image/Text
```bash
curl -X POST "http://localhost:3000/api/ai/ocr" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"text": "OCR text content", "image": "https://example.com/image.jpg", "role": "product_extraction"}'
```

#### [Merchant Support Chat](#merchant-support-chat)
##### Post Message in Support Thread
```bash
curl -X POST "http://localhost:3000/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"messages": [{"role": "user", "content": "Hello!"}]}'
```

#### [Cache Revalidation](#cache-revalidation-1)
##### Revalidate Path or Tag
```bash
curl -X POST "http://localhost:3000/api/revalidate?secret=YOUR_REVALIDATION_SECRET&path=/offer/123"
```
Or with tag:
```bash
curl -X POST "http://localhost:3000/api/revalidate?secret=YOUR_REVALIDATION_SECRET&tag=products"
```

---

## Notes

- **Authentication**: Most business endpoints require a Bearer token in the `Authorization` header.
- **Shop ID**: Some endpoints accept an optional `shopId` header for merchant context.
- **Rate Limiting**: API endpoints are rate-limited (10 requests per minute per IP).
- **Upstream API**: Business endpoints proxy to an upstream backend at the configured `UPSTREAM_API_BASE_URL`.