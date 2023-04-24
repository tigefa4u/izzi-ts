import DiskStorage from "diskStorage";
import loggers from "loggers";

// let cache: Map<string, {
//     image: Image;
//     time: number;
// }> = new Map();
// setInterval(() => {
// 	for (const [ key, val ] of cache.entries()) {
// 		if (val.time < Date.now() - (1000 * 60 * 60)) { // last used more than 1 hour ago
// 			cache.delete(key);
// 		}
// 	}
// }, 1000 * 60 * 10);

const tableName = "imagecache";
const dbname = "imagecache";
const disk = new DiskStorage(dbname, tableName);
disk.createTable([ "id string", "image blob", "metadata blob", "time timestamp" ]);

export const getImage = (id: string) => {
	try {
		return disk.getById(id);
	} catch (err) {
		loggers.error("imageCache.getImage: FAILED for ID: " + id, err);
		return;
	}
};

export const setImage = (id: string, image: Buffer, extras = {}) => {
	try {
		return disk.insert({
			id,
			image,
			time: Date.now(),
			// metadata: extras
		});
	} catch (err) {
		loggers.error("imageCache.setImage: FAILED for ID: " + id, err);
		return;
	}
};

export const delImage = (id:  string) => {
	try {
		return disk.deleteById(id);
	} catch (err) {
		loggers.error("imageCache.delImage: FAILED for ID: " + id, err);
		return;
	}
};

export const clear = () => {
	try {
		return disk.flashall();
	} catch (err) {
		loggers.error("imageCache.clear: FAILED", err);
		return;
	} 
};