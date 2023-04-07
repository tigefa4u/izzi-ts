import { AuthorProps, ChannelProp } from "@customTypes";
import {
	BattleProcessProps, BattleStats, PrepareBattleDescriptionProps, RPGBattleCardDetailProps, Simulation 
} from "@customTypes/adventure";
import { CollectionCardInfoProps } from "@customTypes/collections";
import { UserProps } from "@customTypes/users";
import { Message, MessageEmbed } from "discord.js";

export type BattleTransactionProps = {
    result: {
      isVictory: boolean;
      simulation?: Simulation;
      attachments?: (CollectionCardInfoProps | undefined)[];
    };
    card: RPGBattleCardDetailProps;
    enemyCard: CollectionCardInfoProps;
    author: AuthorProps;
    multiplier: number;
    channel: ChannelProp;
    user: UserProps;
  };

export type AbilityProcDescriptionProps = PrepareBattleDescriptionProps & {
    isPlayerFirst: boolean;
    round: number;
    description: string;
    isDescriptionOnly: boolean;
    card: BattleProcessProps["card"];
    message?: Message;
    embed?: MessageEmbed;
    isItem?: boolean;
}

export type AbilityProcReturnType = {
    playerStats: BattleStats;
    opponentStats: BattleStats;
    damageDiff?: number;
    playerDamageDiff?: number;
    abilityDamage?: number;
}

export type ItemProcReturnType = {
    playerStats: BattleStats;
    opponentStats: BattleStats;
    damageDiff?: number;
    itemDamage?: number;
    basePlayerStats: BattleStats;
}

export type AbilityProcMapProps = {
    wrecker: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    misdirection: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    restriction: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    surge: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "balancing strike": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    chronobreak: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "dragon rage": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    berserk: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    evasion: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    blizzard: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    frost: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    exhaust: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "rapid fire": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    dominator: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    crusher: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "presence of mind": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "point blank": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    precision: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    electrocute: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    sleep: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "elemental strike": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "spell book": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "tornado": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    lifesteal: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    revitalize: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    guardian: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    predator: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "toxic screen": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "time bomb": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    eclipse: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "future sight": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "killer instincts": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "bone plating": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "dream eater": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "fighting spirit": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "harbinger of death": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "last stand": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "defensive strike": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    "lightning shield": (params: BattleProcessProps) => AbilityProcReturnType | undefined;
    leer: (params: BattleProcessProps) => AbilityProcReturnType | undefined;
}

export type ItemProcMapProps = {
    "duskblade of draktharr": (params: BattleProcessProps) => ItemProcReturnType | undefined;
    "youmuu's ghostblade": (params: BattleProcessProps) => ItemProcReturnType | undefined;
    "black cleaver": (params: BattleProcessProps) => ItemProcReturnType | undefined;
    thornmail: (params: BattleProcessProps) => ItemProcReturnType | undefined;
    bloodthirster: (params: BattleProcessProps) => ItemProcReturnType | undefined;
    "navori quickblades": (params: BattleProcessProps) => ItemProcReturnType | undefined;
    stormrazor: (params: BattleProcessProps) => ItemProcReturnType | undefined;
    desolator: (params: BattleProcessProps) => ItemProcReturnType | undefined;
    "sapphire's staff": (params: BattleProcessProps) => ItemProcReturnType | undefined;
    "seeker's armguard": (params: BattleProcessProps) => ItemProcReturnType | undefined;
    "guardian angel":(params: BattleProcessProps) => ItemProcReturnType | undefined;
    "kraken slayer":(params: BattleProcessProps) => ItemProcReturnType | undefined;
    "lunar wand":(params: BattleProcessProps) => ItemProcReturnType | undefined;
    "farsight orb":(params: BattleProcessProps) => ItemProcReturnType | undefined;
    "staff of medana":(params: BattleProcessProps) => ItemProcReturnType | undefined;
    "skull basher":(params: BattleProcessProps) => ItemProcReturnType | undefined;
    "agnus scepter":(params: BattleProcessProps) => ItemProcReturnType | undefined;
    "vampire's blade":(params: BattleProcessProps) => ItemProcReturnType | undefined;
}