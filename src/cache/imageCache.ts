import { Image } from "canvas";
import loggers from "loggers";

const cache: Map<string, {
    image: Image;
    time: number;
}> = new Map();
setInterval(() => {
	for (const [ key, val ] of cache.entries()) {
		if (val.time < Date.now() - (1000 * 60 * 60 * 5)) { // last used more than 5 hour ago
			cache.delete(key);
		}
	}
}, 1000 * 60 * 10);

export const getImage = (id: number) => {
	try {
		return cache.get("image-cache::" + id);
	} catch (err) {
		loggers.error("imageCache.getImage: FAILED for ID: " + id, err);
		return;
	}
};

export const setImage = (id: number, image: Image) => {
	try {
		return cache.set("image-cache::" + id, {
			image,
			time: Date.now()
		});
	} catch (err) {
		loggers.error("imageCache.setImage: FAILED for ID: " + id, err);
		return;
	}
};

export const delImage = (id:  number) => {
	try {
		return cache.delete("image-cache::" + id);
	} catch (err) {
		loggers.error("imageCache.delImage: FAILED for ID: " + id, err);
		return;
	}
};