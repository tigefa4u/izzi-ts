import { ZoneProps } from "@customTypes/zones";
import { EmbedFieldData } from "discord.js";
import { titleCase } from "title-case";

export const createZoneList = (array: ZoneProps[]) => {
	const fields: EmbedFieldData[] = [];
	array.map((zone) => {
		fields.push({
			name: `Zone ${zone.location_id}`,
			value: `${titleCase(zone.name)} (${titleCase(zone.series)})`
		});
	});

	return fields;
};