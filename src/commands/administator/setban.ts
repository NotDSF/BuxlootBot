import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import APIWrapper from "../../modules/wrapper"

const BuxLoot = new APIWrapper()

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const username = interaction.options.getString("username", true);
        const banned = interaction.options.getBoolean("banned", true);
        const result = await BuxLoot.SetBan(username, banned);
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

        Embed.setDescription(`We recieved your request to ${banned ? "ban" : "unban"} this user\nThis user is now ${banned ? "banned" : "unbanned"}`)
        return await interaction.reply({ embeds: [Embed], ephemeral: true });
    },
    options: { IDLocked: true },
    data: new SlashCommandBuilder()
        .setName("setban")
        .setDescription("Set bans for site users")
        .addStringOption((user) => user.setName("username").setRequired(true).setDescription("The site users roblox username"))
        .addBooleanOption((banned) => banned.setName("banned").setRequired(true).setDescription("User banned?"))
        .setDMPermission(true)
}