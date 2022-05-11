import { CharacterCanvasProps } from "@customTypes/canvas";
import { createCanvas, loadImage, Canvas } from "canvas";
import loggers from "loggers";
import { CANVAS_DEFAULTS, elementTypeColors, ranksMeta } from "./constants";

export const createSingleCanvas: (
  card: Pick<
    CharacterCanvasProps,
    "filepath" | "difficultyIcon" | "type" | "isSkin" | "rank"
  >,
  isNotStar: boolean
) => Promise<Canvas | undefined> = async function (card, isNotStar = false) {
	try {
		const canvas = createCanvas(
			CANVAS_DEFAULTS.cardWidth,
			CANVAS_DEFAULTS.cardHeight
		);
		const borderCanvas = createCanvas(
			CANVAS_DEFAULTS.cardWidth,
			CANVAS_DEFAULTS.cardHeight
		);
		const starCanvas = createCanvas(
			CANVAS_DEFAULTS.iconWidth / 2,
			CANVAS_DEFAULTS.iconHeight / 2
		);
		const ctx = canvas.getContext("2d");
		// ctx.clearRect(0, 0, canvas.width, canvas.height);
		// ctx.fillStyle = "#000000";
		// ctx.fillRect(0, 0, canvas.width, canvas.height);
		const startTimer = loggers.startTimer(`Info canvas: path -> ${card.filepath}`);
		const image = await loadImage(card.filepath);
		const border = await loadImage("./assets/images/border.png");
		const borderCtx = borderCanvas.getContext("2d");
		const starPath = "./assets/images/star.png";
		const star = await loadImage(starPath);
		const starCtx = starCanvas.getContext("2d");
		return await new Promise((resolve) => {
			borderCtx.globalCompositeOperation = "source-in";
			borderCtx.fillStyle = elementTypeColors[card.type];
			borderCtx.fillRect(0, 0, borderCanvas.width, borderCanvas.height);
			borderCtx.drawImage(border, 0, 0, borderCanvas.width, borderCanvas.height);
			starCtx.drawImage(star, 0, 0, starCanvas.width, starCanvas.height);
			// starCtx = desaturate(starCtx, starCanvas);
			// starCtx = colorize(starCtx, starCanvas, starlen[card.rank].color);
			ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
			ctx.drawImage(borderCanvas, 0, 0, canvas.width, canvas.height);
			const num = 48,
				multiplier = 20;
			if (!isNotStar) {
				for (let i = 0; i < ranksMeta[card.rank].size; i++) {
					ctx.drawImage(
						starCanvas,
						i * num +
            canvas.width / 2 -
            multiplier * (ranksMeta[card.rank].size + 1),
						canvas.height - 150,
						num,
						num
					);
				}
			}
			loggers.endTimer(startTimer);
			resolve(canvas);
		});
	} catch (err) {
		loggers.error(
			"helpers.canvas.createSingleCanvas(): something went wrong",
			err
		);
		return;
	}
};
