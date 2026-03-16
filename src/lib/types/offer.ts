export interface Offer {
    id: number | string;
    shopName: string;
    offerName: string;
    image: any;
    category: string;
    location: string;
    validFrom: string;
    validTo: string;
    discount: string;
    rating: number;
    branchIds?: (number | string)[];
    branchNames?: string[];
}
