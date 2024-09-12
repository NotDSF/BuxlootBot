import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } from "discord.js";
import APIWrapper from "../modules/wrapper"

const BuxLoot = new APIWrapper();

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const code = interaction.options.getString("code", true);
        const promocode = await Database.GetPromocode(code);
        const Embed = new EmbedBuilder()
        .setTitle("Oops, we ran into a problem...")
        .setColor("#ff8282")

        if (!promocode) {
            Embed.setDescription("This promocode doesn't exist!");
            return await interaction.reply({ ephemeral: true, embeds: [Embed] });
        }

        if (promocode.Expires && Date.now() > promocode.Expires) {
            Embed.setDescription("This promocode doesn't exist!")
            await interaction.reply({ ephemeral: true, embeds: [Embed] })
            return await Database.DeletePromocode(promocode.Code);
        }

        if (promocode.Uses.length >= promocode.MaxUses) {
            Embed.setDescription("This promocode has reached it's maximum uses");
            return await interaction.reply({ ephemeral: true, embeds: [Embed] });
        }

        if (promocode.Uses.find(id => id === interaction.user.id)) {
            Embed.setDescription("You have already redeemed this promocode");
            return await interaction.reply({ ephemeral: true, embeds: [Embed] });
        }

        const User = await Database.GetUser(interaction.user.id);
        if (!User || !User.RobloxUsername) {
            Embed.setDescription("You need to link your buxloot account to use this command\nUse the **/link** command to do this")
            return await interaction.reply({ ephemeral: true, embeds: [Embed] });
        }

        await Database.UpdatePromocode(interaction.user.id, code);
        await Database.IncrementPointsStrict(interaction.user.id, promocode.Reward);
        Embed.setTitle("Promocode redeemed")
        Embed.setDescription(`We've rewarded **${promocode.Reward} R$** to your point balance\nWhich means altogether you have **${User.Points + promocode.Reward} R$** points`)
        Embed.setColor("#ffeb82");

        await interaction.reply({ ephemeral: true, embeds: [Embed] });
    },
    options: {},
    data: new SlashCommandBuilder()
        .setName("redeem")
        .setDescription("Redeem a promocode")
        .addStringOption((code) => code.setName("code").setRequired(true).setDescription("The unique code you'd like to redeem"))
        .setDMPermission(false)
}