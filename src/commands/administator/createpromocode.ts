import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, TextChannel } from "discord.js";

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const code   = interaction.options.getString("code", true);
        const reward = interaction.options.getNumber("reward", true);
        const uses   = interaction.options.getNumber("uses", true);
        const hours  = interaction.options.getNumber("hours", false);
        const date   = new Date();
        date.setHours(date.getHours() + (hours || 0));

        await Database.CreatePromocode(reward, code, uses, (hours ? date.getTime() : undefined));
        const Embed = new EmbedBuilder()
        .setTitle("Promocode created!")
        .setColor("#ffeb82")
        .setDescription(`Code: **${code}** (Max Uses: **${uses}**)\nReward: **${reward} R$**${hours ? `\nExpires: <t:${Math.floor(date.getTime() / 1000)}>` : ""}`);
        return interaction.reply({ embeds: [Embed], ephemeral: true });
    },
    options: { IDLocked: true },
    data: new SlashCommandBuilder()
        .setName("createpromocode")
        .setDescription("Create a promocode")
        .addStringOption((code) => code.setName("code").setDescription("The unique code users can redeem").setRequired(true))
        .addNumberOption((reward) => reward.setName("reward").setDescription("The amount users would get once redeemed").setRequired(true).setMinValue(1))
        .addNumberOption((uses) => uses.setName("uses").setDescription("Maximum amount of users that can use this promocode").setRequired(true).setMinValue(1).setMaxValue(25))
        .addNumberOption((hours) => hours.setName("hours").setDescription("How many hours this promocode exists for").setRequired(false).setMinValue(1))
        .setDMPermission(false)
}