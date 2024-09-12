import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import APIWrapper from "../../modules/wrapper"

const BuxLoot = new APIWrapper()

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const username = interaction.options.getString("username", true);
        const data = await BuxLoot.GetWithdrawals(username.trim());
        const Embed = new EmbedBuilder()
        .setTitle(":book: User Withdrawals")
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
        let count = 1;
        for (let i=0; i < 10; i++) {
            let withdrawal = data.body.Data.withdrawals[i];
            if (!withdrawal) continue;

            list.push(`**${count}** • <t:${Math.floor(Number(withdrawal.date) / 1000)}> (Amount: **${withdrawal.amount} R$**)`);
            count++;
        }

        Embed.setDescription(`This user has made **${data.body.Data.totalWithdrawals}** withdrawals\n(which add to a total of **${data.body.Data.totalWithdrawn} R$**)\n\nLast 10 - Withdrawals:\n${list.join("\n")}`);
        return await interaction.reply({ embeds: [Embed] });
    },
    options: { Moderator: true },
    data: new SlashCommandBuilder()
        .setName("withdrawals")
        .setDescription("Get a site users withdrawal information")
        .addStringOption((user) => user.setName("username").setRequired(true).setDescription("The roblox username you'd like to get withdrawals of"))
        .setDMPermission(false)
}