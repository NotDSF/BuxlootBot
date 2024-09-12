import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import APIWrapper from "../../modules/wrapper"

const BuxLoot = new APIWrapper()

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const username = interaction.options.getString("username", true);
        const amount = interaction.options.getNumber("amount", true);
        const result = await BuxLoot.AddBalance(username, amount);
        const Embed = new EmbedBuilder()
        .setTitle("Operation, complete.")
        .setColor("#ffeb82")

        if (result.code !== 200) {
            if (result.body && result.body.Code == 1) {
                Embed.setTitle("Oops, we ran into a problem...")
                Embed.setDescription("This user doesn't exist on the site")
                Embed.setColor("#ff8282")
                return await interaction.reply({ ephemeral: true, embeds: [Embed] })
            }

            Embed.setTitle("Oops, we ran into a problem...")
            Embed.setDescription("Internal Error / Request fail")
            Embed.setColor("#ff8282")
            return await interaction.reply({ ephemeral: true, embeds: [Embed] })
        }

        const stats = await BuxLoot.GetStatistics(username);
        Embed.setDescription(`We recieved your request to add **${amount} R$** to this users balance\nThis users balance is now: **${stats.body.Data.balance} R$**`)

        return await interaction.reply({ embeds: [Embed], ephemeral: true });
    },
    options: { IDLocked: true },
    data: new SlashCommandBuilder()
        .setName("addbalance")
        .setDescription("Add balance to a site user")
        .addStringOption((user) => user.setName("username").setRequired(true).setDescription("The site users roblox username"))
        .addNumberOption((amount) => amount.setName("amount").setRequired(true).setDescription("The amount you'd like to give the user").setMinValue(1).setMaxValue(999999))
        .setDMPermission(true)
}