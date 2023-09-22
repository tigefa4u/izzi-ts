import { CharacterStatProps } from "@customTypes/characters";

export type ItemProps = {
    id: number;
	name: string;
	description: string;
	stats: CharacterStatProps;
	filepath: string;
	category: string[]
	price: number;
	created_at: Date;
}