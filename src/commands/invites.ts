import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const user = interaction.options.getUser("user", false);
        const Embed = new EmbedBuilder()

        if (!user) {
            let description: Array<string> = [];
            const invites = await Database.GetUserInvites();
            const Embed = new EmbedBuilder()
            let count = 1;

            for (let [_, user] of Object.entries(invites)) {
                description.push(`**${count}** • <@${user.DiscordID}> (Invites: **${user.Invites}**)`);
                count++;
            }

            Embed.setTitle(":trophy: Invite Leaderboard");
            Embed.setColor("#ffeb82");
            Embed.setDescription(`Top 10 - Users:\n${description.join("\n")}`);

            return await interaction.reply({ embeds: [Embed] });
        }

        const info = await Database.GetUser(user.id);
        if (!info) {
            Embed.setColor("#ff8282")
            Embed.setTitle("Oops, we ran into a problem...")
            Embed.setDescription("We don't have any invite data we can display for this user\n*If this is a bug contact a staff member*")
            return await interaction.reply({ embeds: [Embed] })
        }

        Embed.setTitle(":book: User Information")
        Embed.setColor("#ffeb82")
        Embed.setDescription(`This user has **${info?.Invites || 0} ${info.Invites == 1 ? "Invite" : "Invites"}**`)

        return await interaction.reply({ embeds: [Embed] });
    },
    options: {},
    data: new SlashCommandBuilder()
        .setName("invites")
        .setDescription("Retrieve invite data server wise or for a specfic user")
        .addUserOption((user) => user.setName("user").setRequired(false).setDescription("User to grab invite information for"))
        .setDMPermission(true)
}