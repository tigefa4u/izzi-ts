import {
	CharacterCanvasProps,
	SingleCanvasReturnType,
} from "@customTypes/canvas";
import { CardMetadataProps } from "@customTypes/cards";
import { CollectionCardInfoProps } from "@customTypes/collections";
import Cache from "cache";
import * as ImageCache from "cache/imageCache";
import { createCanvas, loadImage, Canvas, Image } from "canvas";
import loggers from "loggers";
import { CANVAS_DEFAULTS, elementTypeColors, ranksMeta } from "./constants";

export const createSingleCanvas: (
  card: Pick<
    CharacterCanvasProps,
    "filepath" | "difficultyIcon" | "type" | "isSkin" | "rank" | "metadata"
  >,
  isNotStar: boolean
) => SingleCanvasReturnType | undefined = function (
	card,
	isNotStar = false
) {
	try {
		// load precomputed images directly
		let filepath = card.filepath;
		if (card.metadata?.assets) {
			filepath = card.metadata.assets.default.filepath;
		}
		// let image: any = ImageCache.getImage(filepath);
		// if (!image) {
		// 	const res = await loadImage(filepath);
		// 	image = { image: res };
		// 	ImageCache.setImage(filepath, res);
		// }
		loggers.info(`[Path] loading filepath -> ${filepath}`);
		return {
			createJPEGStream() {
				return filepath;
			},
		};
		// const canvas = createCanvas(
		// 	CANVAS_DEFAULTS.cardWidth,
		// 	CANVAS_DEFAULTS.cardHeight
		// );
		// const borderCanvas = createCanvas(
		// 	CANVAS_DEFAULTS.cardWidth,
		// 	CANVAS_DEFAULTS.cardHeight
		// );
		// const starCanvas = createCanvas(
		// 	CANVAS_DEFAULTS.iconWidth / 2,
		// 	CANVAS_DEFAULTS.iconHeight / 2
		// );
		// const ctx = canvas.getContext("2d");
		// ctx.clearRect(0, 0, canvas.width, canvas.height);
		// ctx.fillStyle = "#000000";
		// ctx.fillRect(0, 0, canvas.width, canvas.height);
		// const startTimer = loggers.startTimer(`Info canvas: path -> ${filepath}`);
		// const image = await loadImage(filepath);
		// ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

		// const border = await loadImage("./assets/images/border.png");
		// const borderCtx = borderCanvas.getContext("2d");
		// const starPath = "./assets/images/star.png";
		// const star = await loadImage(starPath);
		// const starCtx = starCanvas.getContext("2d");
		// return await new Promise((resolve) => {
		// 	borderCtx.globalCompositeOperation = "source-in";
		// 	borderCtx.fillStyle = elementTypeColors[card.type];
		// 	borderCtx.fillRect(0, 0, borderCanvas.width, borderCanvas.height);
		// 	borderCtx.drawImage(border, 0, 0, borderCanvas.width, borderCanvas.height);
		// 	starCtx.drawImage(star, 0, 0, starCanvas.width, starCanvas.height);
		// 	// starCtx = desaturate(starCtx, starCanvas);
		// 	// starCtx = colorize(starCtx, starCanvas, starlen[card.rank].color);
		// 	ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
		// 	ctx.drawImage(borderCanvas, 0, 0, canvas.width, canvas.height);
		// 	const num = 48,
		// 		multiplier = 20;
		// 	if (!isNotStar) {
		// 		for (let i = 0; i < ranksMeta[card.rank].size; i++) {
		// 			ctx.drawImage(
		// 				starCanvas,
		// 				i * num +
		//     canvas.width / 2 -
		//     multiplier * (ranksMeta[card.rank].size + 1),
		// 				canvas.height - 150,
		// 				num,
		// 				num
		// 			);
		// 		}
		// 	}
		// 	loggers.endTimer(startTimer);
		// 	resolve(canvas);
		// });
	} catch (err) {
		loggers.error("helpers.canvas.createSingleCanvas: ERROR", err);
		return;
	}
};

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
  }
): Promise<Canvas | undefined> => {
	if (!Array.isArray(cards)) return;
	const canvas = createCanvas(
		CANVAS_DEFAULTS.width,
		extras?.isSingleRow ? CANVAS_DEFAULTS.height / 2 : CANVAS_DEFAULTS.height
	);
	const ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#000000";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	if (!extras?.isSingleRow) {
		const cachedBg = ImageCache.getImage("battle-bg") || {} as {
			image: Image;
			time: number;
		};
		let bgPath = cachedBg.image;
		if (!bgPath) {
			bgPath = await loadImage("./assets/images/background.jpg");
		}
		ImageCache.setImage("battle-bg", bgPath);
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
					const cachedImage = ImageCache.getImage(filepath) || {} as {
						image: Image;
						time: number;
					};
					let image = cachedImage?.image;
					if (!image) {
						startImageTimer.message = startImageTimer.message + " -> loading image from url";
						image = await loadImage(filepath).catch((err) => {
							loggers.error(
								"canvas.createBattleCanvas: ERROR Unable to load filepath -> " +
                  				filepath,
								err
							);
							throw err;
						});
					} else {
						startImageTimer.message = startImageTimer.message + " -> loading from cache";
					}
					ImageCache.setImage(filepath, image);
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
		return await new Promise((resolve) => {
			for (let i = 0; i < cards.length; i++) {
				const card = cards[i];
				if (!card) continue;

				const dy = extras?.isSingleRow
					? 0
					: (canvas.height / 2) * Math.floor(i / 3);

				ctx.drawImage(
					images[card.id].image,
					(canvas.width / 3) * (i % 3),
					dy,
					canvas.width / 3,
					dh
				);

				// 	const starIconPosition = extras?.isSingleRow
				// 		? dh - 150
				// 		: dh * Math.floor(i / 3) + 220 * 3.7;
				// 	const starCtx = starCanvas.getContext("2d");
				// 	starCtx.drawImage(star, 0, 0, starCanvas.width, starCanvas.height);
				// 	borderCtx.fillStyle = elementTypeColors[cards[i]?.type || ""];
				// 	borderCtx.fillRect(0, 0, borderCanvas.width, borderCanvas.height);
				// 	const filepath = cards[i]?.filepath;
				// 	const id = cards[i]?.id || 0;
				// 	startTimer.message = startTimer.message + "path: -> " + filepath;
				// 	if (filepath) {
				// 		ctx.drawImage(
				// 			images[id].image,
				// 			(canvas.width / 3) * (i % 3),
				// 			dy,
				// 			canvas.width / 3,
				// 			dh
				// 		);
				// 		ctx.drawImage(
				// 			borderCanvas,
				// 			(canvas.width / 3) * (i % 3),
				// 			dy,
				// 			canvas.width / 3,
				// 			dh
				// 		);
				// 		for (let j = 0; j < (ranksMeta[cards[i]?.rank || ""] || {}).size; j++) {
				// 			ctx.drawImage(
				// 				starCanvas,
				// 				j * 48 +
				//   canvas.width / 3 / 2 +
				//   (canvas.width / 3) * (i % 3) -
				//   20 * ((ranksMeta[cards[i]?.rank || ""] || {}).size + 1),
				// 				starIconPosition,
				// 				48,
				// 				48
				// 			);
				// 		}
				// 	}
			}
			loggers.endTimer(startTimer);
			resolve(canvas);
		});
	} catch (err) {
		loggers.error("helpers.adventure.createBattleCanvas: ERROR", err);
		return;
	}
};
