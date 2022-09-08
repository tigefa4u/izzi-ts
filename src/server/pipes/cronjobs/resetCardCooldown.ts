import { getCollectionsOnCooldown, updateCollection } from "api/controllers/CollectionsController";
import Cache from "cache";

const resetCardCooldown = async () => {
	try {
		const cardsOnCooldown = await getCollectionsOnCooldown();
		if (!cardsOnCooldown) return;
		const ids = await Promise.all(cardsOnCooldown.map(async (card) => {
			let item = await Cache.get("card-cd::" + card.id) as any;
			if (item) {
				item = JSON.parse(item);
				const { cooldownEndsAt } = item;
				const remainingTime =
            (cooldownEndsAt - new Date().getTime()) / 1000 / 60;
				const remainingHours = Math.floor(remainingTime / 60);
				const remainingMinutes = Math.floor(remainingTime % 60);
				if (remainingHours <= 0 && remainingMinutes <= 0) {
					return card.id;
				}
			} else {
				return card.id;
			}
		}));
		const idsToUpdate = ids.map(Number).filter(Number);
		if (idsToUpdate.length > 0) {
			await updateCollection({ ids: idsToUpdate }, { is_on_cooldown: false });
		}
	} catch (err) {
		// pass
	}
};

const boot = async () => {
	await resetCardCooldown();
	process.exit(1);
};

boot();