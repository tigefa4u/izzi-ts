import { CardProps } from "@customTypes/cards";

export type CharacterStatProps = {
    vitality: number;
    strength: number;
    defense: number;
    dexterity: number;
    intelligence: number;
    evasion: number;
    accuracy: number;
    precision: number;
    critical: number;
}

export type CharacterProps = {
    id: number;
    name: string;
    type: string;
	stats: CharacterStatProps;
	passive_id: number;
	created_at: string;
	updated_at: string;
}

export type CharacterDetailsProps = CharacterProps & {
    abilityname: string;
    abilitydescription: string;
    is_passive: boolean;
}

export type CharactersReturnType = CharacterDetailsProps[] | [];

type IgnoreCharacterProps = "created_at" | "updated_at" | "passive_id" | "stats"

export type CharacterParams = Omit<Partial<CharacterProps>, IgnoreCharacterProps>

export type CharacterCardProps = CharacterDetailsProps & CardProps;

export type CharacterPriceListProps = {
    id: number;
    character_id: number;
    rank_id: number;
    average_market_price: number;
    metadata?: Record<string, unknown>;
};

export type CharacterPriceListCreateProps = Omit<CharacterPriceListProps, "id"> | Omit<CharacterPriceListProps, "id">[];