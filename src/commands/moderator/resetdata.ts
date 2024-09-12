import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const user = interaction.options.getUser("user", true);
        const duser = await Database.GetUser(user.id);
        const Embed = new EmbedBuilder()
        .setTitle("User Reset")
        .setColor("#ffeb82")
        .setDescription(`<@${user.id}> has been **reset**`)

        if (!duser) {
            Embed.setTitle("Oops, we ran into a problem...")
            Embed.setDescription("This user doesn't exist in the database")
            Embed.setColor("#ff8282")
            await interaction.reply({ ephemeral: true, embeds: [Embed] });
            return
        }

        await Database.ResetData(user.id);
        await interaction.reply({ embeds: [Embed] });
    },
    options: { Moderator: true },
    data: new SlashCommandBuilder()
        .setName("resetuserdata")
        .setDescription("Reset a specific users bot data")
        .addUserOption(user => user.setName("user").setDescription("The user who you'd like to reset").setRequired(true))
        .setDMPermission(false)
}