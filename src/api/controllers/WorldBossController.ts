import { ResponseWithPagination } from "@customTypes";
import {
	CreateWorldBossBattleProps,
	WorldBossBattleProps,
} from "@customTypes/raids/worldBoss";
import { PAGE_FILTER } from "helpers/constants";
import { paginationForResult, paginationParams } from "helpers/pagination";
import loggers from "loggers";
import * as WorldBossBattles from "../models/WorldBossBattles";
import * as Raids from "../models/Raids";
import { RaidCreateProps } from "@customTypes/raids";

export const createWorldBossBattle = async (
	data: CreateWorldBossBattleProps
) => {
	try {
		loggers.info("Create world boss battle with data: " + JSON.stringify(data));
		return WorldBossBattles.create(data);
	} catch (err) {
		loggers.error(
			"api.controllers.WorldBossController.createWorldBossBattle: ERROR",
			err
		);
		return;
	}
};

export const getWorldBossBattles = async (
	params: { user_tag?: string; fromDate?: Date },
	filter = PAGE_FILTER
): Promise<ResponseWithPagination<WorldBossBattleProps[]> | undefined> => {
	try {
		const result = await WorldBossBattles.get(
			params,
			await paginationParams({
				currentPage: filter.currentPage,
				perPage: filter.perPage,
			})
		);

		const pagination = await paginationForResult({
			data: result,
			query: filter,
		});
		return {
			data: result,
			metadata: pagination,
		};
	} catch (err) {
		loggers.error(
			"controllers.WorldBossController.getWorldBossBattles: ERROR",
			err
		);
		return;
	}
};

export const createWorldBoss = async (data: RaidCreateProps) => {
	try {
		data.is_world_boss = true;
		loggers.info("Creating world boss with data: " + JSON.stringify(data));
		return Raids.create(data);
	} catch (err) {
		loggers.error("controllers.WorldBossController.createWorldBoss: ERROR", err);
		return;
	}
};

export const getWorldBoss = async () => {
	try {
		return Raids.getWorldBoss();
	} catch (err) {
		loggers.error("controllers.WorldBossController.getWorldBoss: ERROR", err);
		return;
	}
};