import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const user = interaction.options.getUser("user", true);
        const duser = await Database.GetUser(user.id);
        const Embed = new EmbedBuilder()
        .setTitle("Operation, complete.")
        .setColor("#ffeb82")
        .setDescription(`We recieved your request to reset the invites of <@${user.id}>\nThis user now has **0** invites ;(`)

        if (!duser) {
            Embed.setTitle("Oops, we ran into a problem...")
            Embed.setDescription("This user doesn't exist in the database")
            Embed.setColor("#ff8282")
            await interaction.reply({ ephemeral: true, embeds: [Embed] });
            return
        }

        await Database.ResetInvites(user.id);
        await interaction.reply({ embeds: [Embed], ephemeral: true });
    },
    options: { IDLocked: true },
    data: new SlashCommandBuilder()
        .setName("resetinvites")
        .setDescription("Reset a specific users invite count")
        .addUserOption(user => user.setName("user").setDescription("The user who's invites you'd like to reset").setRequired(true))
        .setDMPermission(false)
}