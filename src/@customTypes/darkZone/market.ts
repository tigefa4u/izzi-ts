import { CharacterStatProps } from "@customTypes/characters";

export type DarkZoneMarketProps = {
    id: number;
    collection: number;
    user_tag: string;
    price: number;
    stats: CharacterStatProps;
}

export type DzMarketCreateProps = Omit<DarkZoneMarketProps, "id"> | Omit<DarkZoneMarketProps, "id">[];
