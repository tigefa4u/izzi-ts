import { CardProps } from "@customTypes/cards";
import { CharacterCardProps, } from "@customTypes/characters";

type T = {
  difficultyIcon?: string;
  isSkin?: boolean;
  type: string;
};

export type CharacterCanvasProps = CardProps & T;
