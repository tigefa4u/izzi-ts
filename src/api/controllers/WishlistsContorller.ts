import { ResponseWithPagination } from "@customTypes";
import { PageProps } from "@customTypes/pagination";
import {
	WishlistCreateProps, WishlistParamProps, WishlistProps, WishlistUpdateParamProps, WishlistUpdateProps 
} from "@customTypes/wishlist";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as Wishlist from "../models/Wishlists";

export const getWishlist = async (
	params: WishlistParamProps & { name?: string | string[]; },
	filter: PageProps
): Promise<ResponseWithPagination<WishlistProps[]> | undefined> => {
	try {
		const result = await Wishlist.getAll(params, await paginationParams({
			perPage: filter.perPage,
			currentPage: filter.currentPage 
		}));
		const pagination = await paginationForResult({
			data: result,
			query: filter
		});
		return {
			data: result,
			metadata: pagination
		};
	} catch (err) {
		loggers.error("api.controllers.WishlistsController.getWishlist: ERROR", err);
		return;
	}
};

export const createWishlist = (data: WishlistCreateProps) => {
	try {
		return Wishlist.create(data);
	} catch (err) {
		loggers.error("api.controllers.WishlistsController.createWishlist: ERROR", err);
		return;
	}
};

export const updateWishlist = (params: WishlistUpdateParamProps, data: WishlistUpdateProps) => {
	try {
		return Wishlist.update(params, data);
	} catch (err) {
		loggers.error("api.controllers.WishlistsController.updateWishlist: ERROR", err);
		return;
	} 
};

export const removeFromWishlist = (params: WishlistUpdateParamProps) => {
	try {
		return Wishlist.del(params);
	} catch (err) {
		loggers.error("api.controllers.WishlistsController.removeFromWishlist: ERROR", err);
		return;
	}  
};

export const getWishlistBySkinId = (params: { user_tag: string; skin_id: number; }) => {
	try {
		return Wishlist.get(params);
	} catch (err) {
		loggers.error("api.controllers.WishlistsController.getWishlistBySkinId: ERROR", err);
		return;
	}
};

export const getWishlistById = (params: { id: number; user_tag: string; }) => {
	try {
		return Wishlist.get(params);
	} catch (err) {
		loggers.error("api.controllers.WishlistsController.getWishlistById: ERROR", err);
		return;
	}
};