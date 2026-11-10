import {URL_API} from "./URL";

export const getCustomerImageUrl = (customerCode: string): string => {
    return `${URL_API}/images_nhanvien/${customerCode}.jpg`;
}
export const getProductImageUrl = (productId: string): string => {
    return `${URL_API}/product_images/${productId}.jpg`;
}
