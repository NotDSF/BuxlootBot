import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import APIWrapper from "../../modules/wrapper"

const BuxLoot = new APIWrapper()

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const username = interaction.options.getString("username", true);
        const data = await BuxLoot.GetReferrals(username.trim());
        const Embed = new EmbedBuilder()
        .setTitle(":book: User Referrals")
        .setColor("#ffeb82")

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

        let list = [];
        for (let i=0; i < 10; i++) {
            let idk = data.body.Data.topTwentyHighestEarningReferredUsers[i];
            if (!idk) continue;
            list.push(`• <t:${Math.floor(new Date(idk.creationDate).getTime() / 1000)}> Earnings: **${idk.totalEarned}**, Username: **${idk.username}**`)
        }

        Embed.setDescription(`This user has currently referred **${data.body.Data.totalReferredUsers}** users\n\nHighest earning referrals:\n${list.join("\n")}`);
        return await interaction.reply({ embeds: [Embed], ephemeral: true });
    },
    options: { Moderator: true },
    data: new SlashCommandBuilder()
        .setName("referrals")
        .setDescription("Get a site users referrals")
        .addStringOption((user) => user.setName("username").setRequired(true).setDescription("The roblox username you'd like to get referrals of"))
        .setDMPermission(false)
}