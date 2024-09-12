import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js"

type CommandOptions = {
    Moderator?: Boolean
    IDLocked?: Boolean
}

type Multipler = {
    every: number,
    multiply: number
}

export type GetRequestData = {
    code: number,
    body?: any
}

export type Command = {
    execute: (interaction: ChatInputCommandInteraction<CacheType>) => Promise<any>,
    options: CommandOptions,
    data: SlashCommandBuilder
}

export type User = {
    id: string
    DiscordID: string
    Invites: number
    Points: number
    Withdrew: number
    PointsEarned: number
    RobloxUsername: string | null
}

export type Giveaway = {
    id: string
    GiveawayID: string
    Entries: Array<string>
    Expires: number
    MiniumInvites: number
    ChannelID: string
    MiniumPoints: number | null
    Description: string
    Winners: number
    Host: string
}

export type Config = {
    points_per_hour: number,
    server_id: string,
    keywords: Array<string>,
    multiplier: Multipler,
    keyword_threshold: number,
    minimum_withdrawal: number,
    bot_status: string,
    moderators: Array<string>,
    administators: Array<string>,
    bot_commands_channel: string,
    withdraw_log_channel: string,
    bot_log_channel: string
}

export type PromocodeData = {
    Uses: Array<String>
    MaxUses: number,
    Expires: number | null,
    Reward: number,
    Code: string
}

export const ConfigSchema = {
    type: "object",
    properties: {
        "server_id": { type: "string", required: true },
        "bot_status": { type: "string", required: true },
        "bot_commands_channel": { type: "string", required: true },
        "withdraw_log_channel": { type: "string", required: true },
        "bot_log_channel": { type: "string", required: true },
        "points_per_hour": { type: "number", required: true },
        "keyword_threshold": { type: "number", required: true },
        "minimum_withdrawal": { type: "number", required: true },
        "multiplier": {
            type: "object",
            properties: {
                "every": { type: "number", required: true },
                "multiply": { type: "number", required: true }
            },
            required: true
        },
        "moderators": { type: "array", items: { type: "string" }, required: true },
        "administators": { type: "array", items: { type: "string" }, required: true }
    }
}