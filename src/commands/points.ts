import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const user = interaction.options.getUser("user", false);
        const Embed = new EmbedBuilder()

        await interaction.deferReply();

        if (!user) {
            let description: Array<string> = [];
            const points = await Database.GetUserPoints();
            const Embed = new EmbedBuilder()

            let count = 1;
            for (let [_, user] of Object.entries(points)) {
                if (user.DiscordID === "787086729470541844") { // dsf x99 multiplier :troll: (this is only visual (i still have the 1% multipler))
                    user.Invites += (BOT_CONFIG.multiplier.every * (Math.floor(Math.random() * 200)));
                }

                description.push(`**${count}** • <@${user.DiscordID}> ${user.DiscordID === "787086729470541844" ? ":100:" : ""} (Balance: **${user.Points.toFixed(3)}**; Earnings: **${user.PointsEarned.toFixed(3)}**; Multiplier: **${(((user.Invites / BOT_CONFIG.multiplier.every) * 0.1) + 1).toFixed(1)}x** :star:)`)
                count++;
            }

            Embed.setTitle(":trophy: Points Leaderboard");
            Embed.setColor("#ffeb82");
            Embed.setDescription(`Top 10 - Users:\n${description.join("\n")}`);

            return await interaction.editReply({ embeds: [Embed] });
        }

        const info = await Database.GetUser(user.id);
        if (!info) {
            Embed.setColor("#ff8282")
            Embed.setTitle("Oops, we ran into a problem...")
            Embed.setDescription("We don't have any point data we can display for this user\n*If this is a bug contact a staff member*")
            return await interaction.editReply({ embeds: [Embed] })
        }

        Embed.setTitle(":book: User Information")
        Embed.setColor("#ffeb82")
        Embed.setDescription(`Point balance: **${info.Points.toFixed(3)} points**\nTotal earnings: **${info.PointsEarned.toFixed(3)} points**\nThis user has a multiplier of **${(((info.Invites / BOT_CONFIG.multiplier.every) * 0.1) + 1).toFixed(1)}x** :star:`)
        return await interaction.editReply({ embeds: [Embed] });
    },
    options: {},
    data: new SlashCommandBuilder()
        .setName("points")
        .setDescription("Retrieve point data server wise or for a specfic user")
        .addUserOption((user) => user.setName("user").setRequired(false).setDescription("User to grab point information for"))
        .setDMPermission(true)
}