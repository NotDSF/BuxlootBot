import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import APIWrapper from "../modules/wrapper"

const BuxLoot = new APIWrapper()

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        let username: string = interaction.options.getString("username", false) as string
        let duser = interaction.options.getUser("user", false);

        const user = await Database.GetUser(interaction.user.id);
        const Embed = new EmbedBuilder()
        .setTitle(":book: User Statistics")
        .setColor("#ffeb82")

        if (!user || !user.RobloxUsername) {
            Embed.setTitle("Oops, we ran into a problem...")
            Embed.setDescription("You need to link your buxloot account to use this command\nUse the **/link** command to do this")
            Embed.setColor("#ff8282")
            return await interaction.reply({ ephemeral: true, embeds: [Embed] })
        }

        if (!username && duser) {
            const info = await Database.GetUser(duser?.id);
            if (!info || !info.RobloxUsername) {
                Embed.setTitle("Oops, we ran into a problem...")
                Embed.setDescription("This user hasn't linked their buxloot account")
                Embed.setColor("#ff8282")
                return await interaction.reply({ ephemeral: true, embeds: [Embed] })
            }
            username = info.RobloxUsername;
        }

        if (!username && user.RobloxUsername) {
            username = user.RobloxUsername;
        }

        const data = await BuxLoot.GetStatistics(username.trim());

        if (data.code !== 200) {
            if (data.body && data.body.Code == 1) {
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

        const mugshot = await BuxLoot.GetProfilePicture(data.body.Data.userId as number);
        if (mugshot.code == 200) {
            Embed.setThumbnail(mugshot.body.data.pop().imageUrl);
        }

        Embed.setDescription(`Username: **${data.body.Data.username}**\n(ID: **${data.body.Data.userId}**)\n\nBalance: **${data.body.Data.balance} R$** (Withdrawn: **${data.body.Data.totalWithdrawn} R$**)\nReferred users: **${data.body.Data.userRefers}** (Earnings: **${data.body.Data.referralEarnings} R$**)`)
        return await interaction.reply({ embeds: [Embed] });
    },
    options: {},
    data: new SlashCommandBuilder()
        .setName("statistics")
        .setDescription("Get your buxloot statistics or another users statistics")
        .addStringOption((user) => user.setName("username").setRequired(false).setDescription("The roblox username you'd like to get statistics of"))
        .addUserOption((user) => user.setName("user").setDescription("The discord user you'd like to get statistics of"))
        .setDMPermission(true)
}