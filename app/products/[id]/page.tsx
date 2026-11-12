// Re-export dynamic product page for /products/[id] URL path parity
export { default, getProductByIdOrSlug, dynamic, dynamicParams, revalidate } from '../../product/[id]/page';
