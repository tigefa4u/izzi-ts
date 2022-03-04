import axios from "axios";
import Cache from "cache";
import loggers from "loggers";

export async function request(url: string): Promise<any> {
	const key = "lb::" + url;
	let result = await Cache.get(key);
	if (result) result = JSON.parse(result);
	else {
		loggers.info("LB cache miss for: " + key);
		result = await axios
			.get(url)
			.then((res) => res.data.data)
			.catch((err) => {
				throw err;
			});
		if (result) await Cache.set(key, JSON.stringify(result));
	}
	return result;
}
