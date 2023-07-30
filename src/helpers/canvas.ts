import {
	CharacterCanvasProps,
	SingleCanvasReturnType,
} from "@customTypes/canvas";
import { CollectionCardInfoProps } from "@customTypes/collections";
import * as ImageCache from "cache/imageCache";
import { createCanvas, loadImage, Canvas, Image } from "canvas";
import loggers from "loggers";
import { CANVAS_DEFAULTS } from "./constants";

export const createSingleCanvas: (
  card: Pick<
    CharacterCanvasProps,
    "filepath" | "difficultyIcon" | "type" | "isSkin" | "rank" | "metadata"
  >,
  isNotStar: boolean
) => Promise<Canvas | undefined> = async function (card, isNotStar = false) {
	try {
		// load precomputed images directly
		let filepath = card.filepath;
		if (card.metadata?.assets) {
			filepath = card.metadata.assets.medium.filepath;
		}

		const canvas = createCanvas(
			CANVAS_DEFAULTS.cardWidth,
			CANVAS_DEFAULTS.cardHeight
		);
		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = "#2f3136";
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		const cachedImage = await _loadFromCache(filepath, { prefix: "single-image" });
		let image = cachedImage?.image;
		if (!image) {
			image = await _fetchAndSaveToCache(filepath, canvas.width, canvas.height, 
				{ prefix: "single-image", });

			loggers.info(`[Path] loading filepath -> ${filepath}`);
		}
		// console.log("loaded", image);

		/**
		 * This will show an image `claim now` hiding the stars.
		 * And is only used for card drops
		 */
		let claimNowImage: Image;
		const imgW = 180;
		const imgH = 48;
		if (isNotStar) {
			const claimNowPath = "./assets/images/claim-now-gradient.png";
			const claimNowText = await _loadFromCache(claimNowPath, { prefix: "" });
			let claimNowImage = claimNowText?.image;
			if (!claimNowImage) {
				claimNowImage = await _fetchAndSaveToCache(claimNowPath, imgW, imgH, { prefix: "" });
			}
		}

		return new Promise((resolve) => {
			ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

			if (isNotStar && claimNowImage) {
				// to center on X axis
				const dx = (canvas.width / 2) - (imgW / 2);
				const dy = canvas.height - 100;
				ctx.drawImage(claimNowImage, dx, dy, imgW, imgH);
			}
			resolve(canvas);
			// return {
			// 	createJPEGStream() {
			// 		return filepath;
			// 	},
			// };
		});
	} catch (err) {
		loggers.error("helpers.canvas.createSingleCanvas: ERROR", err);
		return;
	}
};

const _fetchAndSaveToCache = async (
	path: string,
	width: number,
	height: number,
	extras: { prefix?: string; }
) => {
	// load the path and draw on canvas to convert it into
	// buffer to be stored in disk cache
	const canvas = createCanvas(width, height);
	const ctx = canvas.getContext("2d");

	const data = await loadImage(path).catch((err) => {
		loggers.error(
			"canvas.createBattleCanvas._fetchAndSaveToCache: ERROR Unable to load filepath -> " +
        path,
			err
		);
		throw err;
	});
	ctx.drawImage(data, 0, 0, width, height);
	const blob = canvas.toBuffer("image/jpeg");
	ImageCache.setImage(
		`${extras.prefix && extras.prefix !== "" ? `${extras.prefix}-${path}` : path}`,
		blob,
		// { path }
	);

	// return the loaded Image to be drawn in the wrapper ctx
	return data;
};

async function _loadFromCache(path: string, extras: { prefix?: string; }): Promise<
  | undefined
  | {
      image: Image;
      time: number;
    }
> {
	const result = ImageCache.getImage(`${extras.prefix && extras.prefix !== "" ? `${extras.prefix}-${path}` : path}`);
	if (!result) {
		return;
	}
	loggers.info("BATTLE_CANVAS_CACHE_HIT: ", path);
	const buffer = Buffer.from(result.image);

	// load the buffer to be drawn on canvas
	const img = await loadImage(buffer).catch((err) => {
		loggers.error(
			"canvas.createBattleCanvas._loadFromCache: ERROR Unable to load filepath -> " +
	    path,
			err
		);
		throw err;
	});
	return {
		image: img,
		time: result.time,
	};
}

export const createBattleCanvas = async (
	cards: (
    | Pick<
        CollectionCardInfoProps,
        "filepath" | "type" | "rank" | "id" | "metadata"
      >
    | undefined
  )[],
	extras?: {
    isSingleRow: boolean;
    version?: "small" | "medium" | "default";
    isRaid?: boolean;
  }
): Promise<Canvas | undefined> => {
	if (!Array.isArray(cards)) return;
	const canvas = createCanvas(
		CANVAS_DEFAULTS.width,
		extras?.isSingleRow ? CANVAS_DEFAULTS.height / 2 : CANVAS_DEFAULTS.height
	);
	const ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#2f3136";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	if (!extras?.isSingleRow) {
		const path = "./assets/images/background.jpeg";
		const cachedBg = await _loadFromCache(path, { prefix: "" });
		let bgPath = cachedBg?.image;
		if (!bgPath) {
			bgPath = await _fetchAndSaveToCache(path, canvas.width, canvas.height, 
				{ prefix: "", });
		}
		ctx.drawImage(bgPath, 0, 0, canvas.width, canvas.height);
	}
	try {
		const dh = extras?.isSingleRow ? canvas.height : canvas.height / 2;
		// const border = await loadImage("./assets/images/border.png");
		// const borderCanvas = createCanvas(
		// 	CANVAS_DEFAULTS.cardWidth,
		// 	CANVAS_DEFAULTS.cardHeight
		// );
		// const borderCtx = borderCanvas.getContext("2d");
		// borderCtx.drawImage(border, 0, 0, borderCanvas.width, borderCanvas.height);
		// borderCtx.globalCompositeOperation = "source-in";
		// const path = "./assets/images/star.png";
		// const star = await loadImage(path);
		// const starCanvas = createCanvas(
		// 	CANVAS_DEFAULTS.iconWidth,
		// 	CANVAS_DEFAULTS.iconHeight
		// );
		const startTimer = loggers.startTimer("Battle canvas: ");
		const images = await Promise.all(
			cards.map(async (card) => {
				if (card) {
					const startImageTimer = loggers.startTimer("[Image] Path: ");
					// load precomputed images with border and stars
					let filepath = card?.filepath;
					const version =
            extras?.version || (extras?.isSingleRow ? "medium" : "small");
					if (card.metadata?.assets && card.metadata.assets[version]) {
						filepath = card.metadata.assets[version].filepath;
					}
					startImageTimer.message = startImageTimer.message + " -> " + filepath;
					const cachedImage = await _loadFromCache(filepath, 
						{ prefix: extras?.isSingleRow ? "single-row" : "" });
					let image = cachedImage?.image;
					if (!image) {
						startImageTimer.message =
              startImageTimer.message + " -> loading image from url";
						image = await _fetchAndSaveToCache(filepath, canvas.width / 3, dh, 
							{ prefix: extras?.isSingleRow ? "single-row" : "", });
					} else {
						startImageTimer.message =
              startImageTimer.message + " -> loading from cache";
					}
					loggers.endTimer(startImageTimer);
					return {
						id: card.id,
						image,
					};
				}
			})
		).then((res) =>
			res.reduce((acc, r) => {
				if (r) {
					acc[r.id] = r;
				}
				return acc;
			}, {} as { [key: string]: { id: number; image: Image } })
		);
		return new Promise((resolve) => {
			for (let i = 0; i < cards.length; i++) {
				const card = cards[i];
				if (!card) continue;

				const dy = extras?.isSingleRow
					? 0
					: (canvas.height / 2) * Math.floor(i / 3);

				const dx = (canvas.width / 3) * (i % 3);
				// if (!extras?.isSingleRow && i >= 3 && cards[i - 1] && extras?.isRaid) {
				// 	dx = canvas.width / 3 * (i % 3) + (canvas.width / 6);
				// }
				ctx.drawImage(images[card.id].image, dx, dy, canvas.width / 3, dh);
			}
			loggers.endTimer(startTimer);
			resolve(canvas);
		});
	} catch (err) {
		loggers.error("helpers.adventure.createBattleCanvas: ERROR", err);
		return;
	}
};
