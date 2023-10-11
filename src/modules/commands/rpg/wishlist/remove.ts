import { BaseProps } from "@customTypes/command";
import { getWishlistById, removeFromWishlist } from "api/controllers/WishlistsContorller";
import { createEmbed } from "commons/embeds";
import { DEFAULT_ERROR_TITLE, DEFAULT_SUCCESS_TITLE } from "helpers/constants/constants";
import loggers from "loggers";

export const removeWishlist = async ({ context, args, client, options }: BaseProps) => {
	try {
		const author = options.author;
		const id = Number(args.shift());
		if (!id || isNaN(id)) return;
		const embed = createEmbed(author, client).setTitle(DEFAULT_ERROR_TITLE);
		const wishlist = await getWishlistById({
			id,
			user_tag: author.id
		});
		if (!wishlist || wishlist.length <= 0) {
			embed.setDescription("We could not find this item on your wishlist. Please enter a valid ID");
			context.channel?.sendMessage(embed);
			return;
		}
		await removeFromWishlist({
			id: wishlist[0].id,
			user_tag: author.id
		});
		embed.setTitle(DEFAULT_SUCCESS_TITLE)
			.setDescription(`Successfully removed __${id}__ from wishlist`);
        
		context.channel?.sendMessage(embed);
		return;
	} catch (err) {
		loggers.error("commands.rpg.wishlist.remove.removeWishlist", err);
		return;
	}
};