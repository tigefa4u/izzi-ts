import { AssetImageProps } from "@customTypes";
import { CardMetadataProps } from "@customTypes/cards";

export type SkinCollectionProps = {
    id: number;
    skin_id: number;
    user_tag: string;
    character_id: number;
    is_selected: boolean;
}

export type SkinProps = {
    id: number;
    filepath: string;
    name: string;
    is_difficulty: boolean;
    character_id: number;
    originalfilename: string;
    price: number;
    metadata: {
        jpeg: AssetImageProps;
        webp: AssetImageProps;
        isSpecial?: boolean;
        assets?: CardMetadataProps["assets"]
    };
}

export type ISkinCollection = SkinCollectionProps & Pick<SkinProps, "name" | "filepath" | "metadata">;