import { CardProps } from "@customTypes/cards";

type T = {
  difficultyIcon?: string;
  isSkin?: boolean;
  type: string;
};

export type CharacterCanvasProps = CardProps & T;

export type SingleCanvasReturnType = { createJPEGStream: () => string; };