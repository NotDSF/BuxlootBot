import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, TextChannel } from "discord.js";

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const channel = interaction.options.getChannel("channel", true);
        const description = interaction.options.getString("description", true);
        const hours = interaction.options.getNumber("hours", true);
        const invites = interaction.options.getNumber("invites", false);
        const points = interaction.options.getNumber("points", false);
        const winners = interaction.options.getNumber("winners", true);
        const uuid = crypto.randomUUID().replace(/-/g, "");

        const date = new Date()
        date.setHours(date.getHours() + hours);

        let requirements = [];
        if (invites || points) {
            if (invites) {
                requirements.push(`- ${invites} Discord Invites`);
            }

            if (points) {
                requirements.push(`- ${points} Points Earned`)
            }
        }

        const Embed = new EmbedBuilder()
        .setTitle("Buxloot | Giveaway :tada:")
        .setDescription(`Prize: **${description}** (**${winners}** ${winners > 1 ? "winners" : "winner"})\nEnds: <t:${Math.floor(date.getTime() / 1000)}>\nHost: <@${interaction.user.id}>`)
        .setColor("#ffeb82");

        if (requirements.length) {
            Embed.addFields({ name: "Entry Requirements", value: requirements.join("\n") });
        }

        const Enter = new ButtonBuilder()
        .setCustomId(`giveaway-${uuid}`)
        .setLabel("Enter")
        .setStyle(ButtonStyle.Primary);

        const Manage = new ButtonBuilder()
        .setCustomId(`manage_giveaway-${uuid}`)
        .setLabel("Edit Giveaway")
        .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(Enter, Manage);

        await Database.CreateGiveaway(uuid, invites || 0, winners, date.getTime(), channel.id, description, interaction.user.id, points as number | undefined);
        await (channel as TextChannel).send({ embeds: [Embed], components: [row] });
        await interaction.reply({ ephemeral: true, content: `Giveaway created!` });
    },
    options: { Moderator: true },
    data: new SlashCommandBuilder()
        .setName("creategiveaway")
        .setDescription("Create a giveaway")
        .addChannelOption(channel => channel.setName("channel").setDescription("Channel where your panel will be sent too").setRequired(true))
        .addNumberOption(nignog => nignog.setName("winners").setDescription("Amount of winners that can be drawn at the end of your giveaway").setRequired(true).setMinValue(0))
        .addStringOption(string => string.setName("description").setDescription("Giveaway description").setRequired(true))
        .addNumberOption(hours => hours.setName("hours").setDescription("Giveaway duration").setRequired(true).setMinValue(1))
        .addNumberOption(max => max.setName("invites").setDescription("Mimimum invites required to enter giveaway").setRequired(false).setMinValue(0))
        .addNumberOption(points => points.setName("points").setDescription("Mimimum points required to enter giveaway").setRequired(false).setMinValue(0))
        .setDMPermission(false)
}