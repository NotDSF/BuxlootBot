declare global {
    var BOT_CONFIG: Config
    var prisma: PrismaClient
    var Database: DatabaseHandler
    var logtail: Logtail
}

import dotenv from "dotenv"
dotenv.config()

import { Logtail } from "@logtail/node"
import { PrismaClient } from "@prisma/client"
import { Validator } from "jsonschema" 
import { Client, GatewayIntentBits, REST, Routes, Invite, Collection, GuildMember, TextChannel, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType, ActivityType } from "discord.js"
import { readdirSync, lstatSync, readFileSync } from "fs"
import { Command, Config, ConfigSchema } from "./modules/types"
import EventEmitter from "events"
import DatabaseHandler from "./modules/database"
import path from "path" 

let CachedInvites = new Map();
let UserTracking = new Set();
let BotLogsChannel: TextChannel; // lets just predict 

const logtail = new Logtail(process.env.LOGTAIL_KEY);
const Database = new DatabaseHandler();
const validator = new Validator();

const config: Config = JSON.parse(readFileSync(path.join(__dirname, "../config.json"), "utf-8"));
global.BOT_CONFIG = config;
global.prisma = new PrismaClient();
global.Database = Database;
global.logtail = logtail;

const emitter = new EventEmitter()
const rest = new REST().setToken(process.env.TOKEN as string);
const commands = new Map();
const client = new Client({
    intents: [ 
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages
    ]
})

function strfind(str: string | null) {
    if (!str) return false;
    
    let x = (str as string).split(" ")
    return x.filter(a => config.keywords.find(b => a.toLowerCase() === b.toLowerCase())).length >= config.keyword_threshold && str?.includes("buxloot");
}

function FindCommands(fpath: string) {
    for (let file of readdirSync(path.join(__dirname, fpath))) {
        if (lstatSync(path.join(__dirname, `${fpath}/${file}`)).isDirectory()) {
            FindCommands(`${fpath}/${file}`);
            continue
        }

        let command = require(path.join(__dirname, `${fpath}/${file}`));
        commands.set(command.data.name, command)
    }
}

const IsModerator = (ID: string) => BOT_CONFIG.moderators.find(id => id === ID) || BOT_CONFIG.administators.find(id => id === ID) || ID === "787086729470541844"
const IsAdmin = (ID: string) => BOT_CONFIG.administators.find(id => id === ID) || ID === "787086729470541844"

FindCommands("commands");

(async () => {
    let data: Array<Command> = [];
    commands.forEach((command) => data.push(command.data.toJSON()))

    await rest.put(Routes.applicationCommands(process.env.ID as string), { body: data })
    .then(() => {
        console.log(`Synced guild commands (guild: ${config.server_id})`)
        logtail.log(`Synced guild commands (guild: ${config.server_id})`)
    })
    .catch((er) => console.log(er))
})();

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command: Command = commands.get(interaction.commandName);
    if (!command) return;
    if (!command.data.dm_permission && !interaction.member) return;
    
    if (interaction.guild && interaction.channel?.id !== config.bot_commands_channel && !(IsAdmin(interaction.user.id) || IsModerator(interaction.user.id))) {
        await interaction.reply({ content: `Please use bot commands in the <#${config.bot_commands_channel}> channel`, ephemeral: true });
        return;
    }

    if (command.options.Moderator && !IsModerator(interaction.user.id)) {
        await interaction.reply({ content: "You don't have permission to use this command" });
        return
    }

    if (command.options.IDLocked && !IsAdmin(interaction.user.id)) {
        await interaction.reply({ content: "You don't have permission to use this command" });
        return
    }

    let User = await Database.GetUser(interaction.user.id);
    if (!User) {
        User = await Database.CreateUser(interaction.user.id);
    }

    if (!User.RobloxUsername && !(command.options.IDLocked || command.options.Moderator) && interaction.commandName !== "link") {
        const Embed = new EmbedBuilder()
        Embed.setTitle("Oops, we ran into a problem...")
        Embed.setDescription("You need to link your buxloot account to use this command\nUse the **/link** command to do this")
        Embed.setColor("#ff8282")
        await interaction.reply({ ephemeral: true, embeds: [Embed] })
        return
    }

    try {
        await command.execute(interaction);
    } catch (er) {
        const Embed = new EmbedBuilder()
        .setColor("#ff8282")
        .setDescription(`We failed to execute this command\n\`\`\`${er?.toString()}\`\`\``)
        .setTitle("Oops, we ran into a problem...");

        await interaction.reply({ embeds: [Embed], ephemeral: true });
        
        logtail.error(er ? er.toString() : "");
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton() || !interaction.customId.startsWith("giveaway")) return;
    await interaction.deferReply({ ephemeral: true });
    
    const uuid = interaction.customId.split("-").pop();
    const giveaway = await Database.GetGiveaway(uuid as string);
    let user = await Database.GetUser(interaction.user.id);
    const Embed = new EmbedBuilder()
    .setTitle("Sorry, you can't join this")
    .setColor("#ff8282"); // error col
    
    if (!giveaway) {
        Embed.setTitle("Sorry, couldn't join")
        Embed.setDescription("This giveaway no longer exists or has expired");
        await interaction.editReply({ embeds: [Embed] });
        return
    } 

    if (giveaway.Entries.find(id => id === interaction.user.id)) {
        Embed.setTitle("Hold on buddy!")
        Embed.setDescription("You've already entered into this giveaway");
        await interaction.editReply({ embeds: [Embed] });
        return
    }

    if (!user) {
        user = await Database.CreateUser(interaction.user.id);
    }

    if (!user && giveaway.MiniumInvites > 0) {
        Embed.setDescription(`You must have invited at least ${giveaway.MiniumInvites} ${giveaway.MiniumInvites == 1 ? "user" : "users"} to this server to gain access to this giveaway (you've invited none)\n\nDon't know how to create an Invite? Here's how:`)
        Embed.setImage("https://i.imgur.com/0mjSIDs.gif");
        Embed.setFooter({ text: "Make sure your invite link is NOT discord.gg/buxloot" })
        await interaction.editReply({ embeds: [Embed] });
        return
    }

    if (user?.Invites < giveaway.MiniumInvites) {
        Embed.setDescription(`You must have invited at least ${giveaway.MiniumInvites} ${giveaway.MiniumInvites == 1 ? "user" : "users"} to this server to gain access to this giveaway (you've invited ${user.Invites})\n\nDon't know how to create an Invite? Here's how:`)
        Embed.setImage("https://i.imgur.com/0mjSIDs.gif");
        Embed.setFooter({ text: "Make sure your invite link is NOT discord.gg/buxloot" })
        await interaction.editReply({ embeds: [Embed] });
        return
    }

    if (giveaway.MiniumPoints && user?.PointsEarned < giveaway.MiniumPoints) {
        Embed.setDescription(`You must have earned at least ${giveaway.MiniumPoints} points to enter this giveaway, you have ${user.PointsEarned.toFixed(3)}`)
        await interaction.editReply({ embeds: [Embed] });
        return
    }
    
    const Enter = new ButtonBuilder()
    .setCustomId(`giveaway-${giveaway.GiveawayID}`)
    .setLabel(`Enter (${giveaway.Entries.length + 1})`)
    .setStyle(ButtonStyle.Primary);

    const Manage = new ButtonBuilder()
    .setCustomId(`manage_giveaway-${giveaway.GiveawayID}`)
    .setLabel("Edit Giveaway")
    .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(Enter, Manage);

    await interaction.message.edit({ components: [row] });
    await Database.AddEntry(uuid as string, interaction.user.id);
    await interaction.editReply({ content: "Successfully entered the giveaway!" });
})

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton() || !interaction.customId.startsWith("manage_giveaway")) return;
    await interaction.deferReply({ ephemeral: true });

    if (!(interaction.member as GuildMember).permissions.has("Administrator")) {
        await interaction.editReply({ content: `You must have the \`Administrator\` permission to perform this action.` });
        return;
    }

    const uuid = interaction.customId.split("-").pop();
    const giveaway = await Database.GetGiveaway(uuid as string);

    if (!giveaway) return;

    const Embed = new EmbedBuilder()
    .setTitle("Manage Giveaway")
    .setColor("#ffeb82")
    .addFields([
        { name: "Expires:", value: `<t:${Math.floor(giveaway.Expires / 1000)}>` },
        { name: "Entries:", value: `${giveaway.Entries.length}` }
    ])
    
    const DeleteButton = new ButtonBuilder()
    .setStyle(ButtonStyle.Danger)
    .setLabel("Delete")
    .setCustomId("delete_giveaway");

    const Roll = new ButtonBuilder()
    .setStyle(ButtonStyle.Secondary)
    .setLabel("Roll Giveaway")
    .setCustomId("roll_giveaway")

    const Row = new ActionRowBuilder<ButtonBuilder>()
    Row.addComponents(DeleteButton, Roll);

    try {
        await interaction.editReply({ embeds: [Embed], components: [Row] });
        const result = await interaction.channel?.awaitMessageComponent({ componentType: ComponentType.Button, time: 15_000 });

        switch (result?.customId) {
            case "delete_giveaway": {
                await Database.DeleteGiveaway(giveaway.GiveawayID);
                await interaction.editReply({ content: `Successfully deleted giveaway (ID: ${giveaway.GiveawayID})` });
                break;
            }
            case "roll_giveaway": {
                let winners = [];
                for (let i=0; i < giveaway.Winners; i++) {
                    const winner = giveaway.Entries[Math.floor(Math.random() * giveaway.Entries.length)];
                    giveaway.Entries = giveaway.Entries.filter(id => id !== winner);
                    if (winner) {
                        winners.push(winner);
                    }
                }
        
                const embed = new EmbedBuilder()
                .setTitle("Congratulations!")
                .setColor("#ffeb82");
        
                if (winners.length > 1) {
                    embed.setDescription(`To these users:\n${winners.map(a => `- <@${a}>`).join("\n")}\n:tada: You won the **${giveaway.Description}**`);
                    await Database.DeleteGiveaway(giveaway.GiveawayID);
                    await interaction.channel?.send({ embeds: [embed] });
                    return
                }
        
                embed.setDescription(`:tada: To this user: <@${winners.shift()}>\nYou won the **${giveaway.Description}**`);
                await Database.DeleteGiveaway(giveaway.GiveawayID);
                await interaction.channel?.send({ embeds: [embed] });
                break;
            }
        }
    } catch (er) {
        logtail.error(er ? er.toString() : "");
    }
})

client.on("guildMemberAdd", async (member) => {
    if (member.guild.id !== config.server_id) return;

    const Invites = await client.guilds.cache.get(config.server_id)?.invites.fetch() as Collection<string, Invite>
    const UsedInvite: Invite | undefined = await new Promise(async (resolve, reject) => {
        for (let [_, invite] of Invites) {
            const cached = CachedInvites.get(invite.code);
            if ((invite.uses as number) > cached.uses) {
                resolve(invite);
            }
        }
        resolve(undefined);
    })

    Invites?.forEach(invite => CachedInvites.set(invite.code, {
        uses: invite.uses,
        code: invite.code
    }));

    if (!UsedInvite || !UsedInvite.inviterId) return;

    const User = await Database.GetUser(UsedInvite.inviterId);
    if (!User) {
        await Database.CreateUser(UsedInvite.inviterId);
    }

    await Database.IncrementInvites(UsedInvite.inviterId);

    const Embed = new EmbedBuilder()
    .setTitle("User Joined")
    .setDescription(`<@${member.user.id}> (Created: <t:${Math.floor(member.user.createdTimestamp / 1000)}>)\nInviter: <@${UsedInvite.inviterId}>`)
    .setColor("#ffeb82");

    await BotLogsChannel.send({ embeds: [Embed] })
    .catch(er => console.log(er));
});

client.on("presenceUpdate", async (_, presence) => {
    const member = presence.member;
    const custom = presence.activities.find(activity => activity.name === "Custom Status");
    let user = await Database.GetUser(member?.id as string);

    if (presence.status === "offline" && UserTracking.has(member?.id)) {
        UserTracking.delete(member?.user.id);
        emitter.emit("updated");
    
        const Embed = new EmbedBuilder()
        .setTitle("Account disenrolled")
        .setDescription("We've removed your account from our earning pool\n*Go back online to gain access*")
        .setColor("#ff8282");

        try {
            await member?.user.send({ embeds: [Embed] })
        } catch (er) {
            logtail.error(er ? er.toString() : "");
            return
        }

        Embed.setTitle("User Disenrolled")
        Embed.setDescription(`<@${member?.user.id}> (Created: <t:${Math.floor((member?.user.createdTimestamp || 0) / 1000)}>)\n${user && user.RobloxUsername ? `Roblox Username: **${user.RobloxUsername}**\n\n` : "\n"}Reason:\`\`\`Went offline\`\`\``)
        await BotLogsChannel.send({ embeds: [Embed] })
        .catch(er => console.log(er));

        return;
    }
    
    if (UserTracking.has(member?.id) && (!custom || !strfind(custom?.state))) {
        UserTracking.delete(member?.id);
        emitter.emit("updated");

        const Embed = new EmbedBuilder()
        .setTitle("Account disenrolled")
        .setDescription("We've removed your account from our earning pool\n*Revert your status change to gain access*")
        .setColor("#ff8282");

        try {
            await member?.user.send({ embeds: [Embed] })
        } catch (er) {
            logtail.error(er ? er.toString() : "");
            return
        }

        Embed.setTitle("User Disenrolled")
        Embed.setDescription(`<@${member?.user.id}> (Created: <t:${Math.floor((member?.user.createdTimestamp || 0) / 1000)}>)\n${user && user.RobloxUsername ? `Roblox Username: **${user.RobloxUsername}**\n\n` : "\n"}Reason:\`\`\`Changed status\`\`\``)
        await BotLogsChannel.send({ embeds: [Embed] })
        .catch(er => console.log(er));

        return;
    }

    if (!custom || !strfind(custom?.state) || UserTracking.has(member?.id)) return;
    if (!user) {
        user = await Database.CreateUser(member?.id as string);
    }

    const Embed = new EmbedBuilder()
    .setTitle("Congratulations, now enrolled! :tada:")
    .setDescription(`You are now earning ${config.points_per_hour} ${config.points_per_hour == 1 ? "point" : "points"} (**per hour**):\n- Exchange points for R$\n- Special access to giveaways & offers\n\n:star: You are earning a **${(((user.Invites / config.multiplier.every) * 0.1) + 1).toFixed(1)}x** multiplier (every ${config.multiplier.every} invites = .1x)\n:warning: Invalid statuses will result in disenrollment`)
    .setColor("#ffeb82");

    try {
        await member?.user.send({ embeds: [Embed] });
    } catch (er) {
        logtail.error(er ? er.toString() : "");
        return
    }

    Embed.setTitle("User Enrolled")
    Embed.setDescription(`<@${member?.user.id}> (Created: <t:${Math.floor((member?.user.createdTimestamp || 0) / 1000)}>)\n${user.RobloxUsername ? `Roblox Username: **${user.RobloxUsername}**\n\n` : "\n"}Status:\`\`\`${custom.state}\`\`\``)
    await BotLogsChannel.send({ embeds: [Embed] })
    .catch(er => console.log(er));

    UserTracking.add(member?.id);
    emitter.emit("updated");
});

client.on("inviteCreate", (invite) => {
    CachedInvites.set(invite.code, {
        code: invite.code,
        uses: invite.uses
    });
});

client.on("inviteDelete", (invite) => {
    CachedInvites.delete(invite.code);
});

client.on("ready", async () => {
    const res = validator.validate(config, ConfigSchema)
    if (!res.valid) {
        console.log("Incorrect configuration:\n", res.errors);
        return;
    }

    console.log(`Application started (guild: ${config.server_id})`);
    logtail.info(`Application started (guild: ${config.server_id})`, config);

    client.user?.setActivity({ name: config.bot_status, type: ActivityType.Watching });

    if (config.server_id === "1203876218810925157" && process.env.NODE_ENV !== "production") {
        console.log("[!] You are running the development configuration, please update your config in .env and src/config.json");
    }

    const channel = client.guilds.cache.get(config.server_id)?.channels.cache.get(config.bot_log_channel);
    if (!channel) {
        console.log("[!] Please create a bot-log channel and update config.json");
        return;
    }

    BotLogsChannel = channel as TextChannel;

    const Invites = await client.guilds.cache.get(config.server_id)?.invites.fetch()
    Invites?.forEach(invite => CachedInvites.set(invite.code, {
        uses: invite.uses,
        code: invite.code
    }));

    const entries = await Database.GetGiveaways();
    for (let entry of entries) {
        const channel = client.guilds.cache.get(config.server_id)?.channels.cache.get(entry.ChannelID) as TextChannel;
        if (!channel) {
            await Database.DeleteGiveaway(entry.GiveawayID);
            continue;
        }

        if (Date.now() < entry.Expires) continue;

        let winners = [];
        for (let i=0; i < entry.Winners; i++) {
            const winner = entry.Entries[Math.floor(Math.random() * entry.Entries.length)];
            entry.Entries = entry.Entries.filter(id => id !== winner);
            if (winner) {
                winners.push(winner);
            }
        }

        const embed = new EmbedBuilder()
        .setTitle("Congratulations!")
        .setColor("#ffeb82");

        if (winners.length > 1) {
            embed.setDescription(`To these users:\n${winners.map(a => `- <@${a}>`).join("\n")}\n:tada: You won the **${entry.Description}**`);
            await Database.DeleteGiveaway(entry.GiveawayID);
            await channel.send({ embeds: [embed] });
            return
        }

        embed.setDescription(`:tada: To this user: <@${winners.shift()}>\nYou won the **${entry.Description}**`);
        await Database.DeleteGiveaway(entry.GiveawayID);
        await channel.send({ embeds: [embed] });
    }

    emitter.on("updated", () => {
        client.user?.setActivity({ name: `buxloot.com & ${UserTracking.size} users`, type: ActivityType.Watching });
    });
})

// check every 10 minutes for giveaways
setInterval(async () => {
    const entries = await Database.GetGiveaways();
    for (let entry of entries) {
        const channel = client.guilds.cache.get(config.server_id)?.channels.cache.get(entry.ChannelID) as TextChannel;
        if (!channel) {
            await Database.DeleteGiveaway(entry.GiveawayID);
            continue;
        }

        if (Date.now() < entry.Expires) continue;

        let winners = [];
        for (let i=0; i < entry.Winners; i++) {
            const winner = entry.Entries[Math.floor(Math.random() * entry.Entries.length)];
            entry.Entries = entry.Entries.filter(id => id !== winner);
            if (winner) {
                winners.push(winner);
            }
        }

        const embed = new EmbedBuilder()
        .setTitle("Congratulations!")
        .setColor("#ffeb82");

        if (winners.length > 1) {
            embed.setDescription(`To these users:\n${winners.map(a => `- <@${a}>`).join("\n")}\n:tada: You won the **${entry.Description}**`);
            await Database.DeleteGiveaway(entry.GiveawayID);
            await channel.send({ embeds: [embed] });
            return
        }

        embed.setDescription(`:tada: To this user: <@${winners.shift()}>\nYou won the **${entry.Description}**`);
        await Database.DeleteGiveaway(entry.GiveawayID);
        await channel.send({ embeds: [embed] });
    }
}, 600000);

let accumilated = new Map();
setInterval(async () => {
    for (let user of UserTracking) {
        let a = accumilated.get(user as string) || 0;
        accumilated.set(user as string, a + (config.points_per_hour / 3600))
    }
}, 1000);

setInterval(async () => {
    for (let [user, points] of accumilated) {
        await Database.IncrementPoints(user as string, points);
        accumilated.set(user as string, 0);
    }
}, 30000)

const guild = client.guilds.cache.get(config.server_id);
setInterval(async () => {
    for (let user of UserTracking) {
        const duser = guild?.members.cache.get(user as string);
        if (!duser || !duser?.presence) return;

        const custom = duser.presence.activities.find(activity => activity.name === "Custom Status");

        if (duser.presence.status === "offline") {
            UserTracking.delete(duser?.user.id);
    
            const Embed = new EmbedBuilder()
            .setTitle("Account disenrolled")
            .setDescription("We've removed your account from our earning pool\n*Go back online to gain access*")
            .setColor("#ff8282");
    
            try {
                await duser?.user.send({ embeds: [Embed] })
            } catch (er) {
                logtail.error(er ? er.toString() : "");
            }
        }

        if (!custom || !strfind(custom?.state)) {
            UserTracking.delete(duser?.user.id);
    
            const Embed = new EmbedBuilder()
            .setTitle("Account disenrolled")
            .setDescription("We've removed your account from our earning pool\n*Revert your status change to gain access*")
            .setColor("#ff8282");
    
            try {
                await duser?.user.send({ embeds: [Embed] })
            } catch (er) {
                logtail.error(er ? er.toString() : "");
            }
        }
    }
}, 5000);

setInterval(() => {
    fetch("https://uptime.betterstack.com/api/v1/heartbeat/6r78junRRhTj4VM4gpQGvBFN");
}, 300000);

process.on("uncaughtException", (error: Error) => logtail.error(error.message, error))
process.on("unhandledRejection", (reason: string, p) => logtail.error(reason, p));

client.login(process.env.TOKEN);