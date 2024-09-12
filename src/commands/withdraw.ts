import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import APIWrapper from "../modules/wrapper"

const BuxLoot = new APIWrapper()

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const points = interaction.options.getNumber("points", true);
        const udata = await Database.GetUser(interaction.user.id);
        const Embed = new EmbedBuilder()
        .setColor("#ff8282")
        .setTitle("Oops, we ran into a problem...")

        const LogChannel = await interaction.guild?.channels.cache.get(BOT_CONFIG.withdraw_log_channel);

        if (!LogChannel || !LogChannel.isTextBased()) {
            Embed.setDescription("This server has an incorrect bot configuration please contact a staff memeber!");
            await interaction.reply({ embeds: [Embed], ephemeral: true });
            return;
        }

        if (!udata) {
            Embed.setDescription("You don't have any points to withdraw");
            await interaction.reply({ embeds: [Embed], ephemeral: true });
            return;
        }

        if (!udata.RobloxUsername) {
            Embed.setDescription("You need to link your buxloot account to use this command\nUse the **/link** command to do this");
            await interaction.reply({ embeds: [Embed], ephemeral: true });
            return;
        }

        if (points > udata.Points) {
            Embed.setDescription("You don't have enough points to withdraw this amount");
            await interaction.reply({ embeds: [Embed], ephemeral: true });
            return;
        }
        
        const result = await BuxLoot.AddBalance(udata.RobloxUsername, points);
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

        await Database.IncrementPointsStrict(interaction.user?.id, -points);
        
        const stats = await BuxLoot.GetStatistics(udata.RobloxUsername);

        Embed.setTitle("User made withdrawal")
        Embed.setDescription(`<@${interaction.user.id}> (Created: <t:${Math.floor(interaction.user.createdTimestamp / 1000)}>)\n\nUsername: **${udata.RobloxUsername}** (**[${stats.body.Data.userId}](<https://www.roblox.com/users/${stats.body.Data.userId}/profile>)**)\nAmount: **${points} R$**\nDate: <t:${Math.floor(Date.now() / 1000)}>`)
        Embed.setColor("#ffeb82")

        const mugshot = await BuxLoot.GetProfilePicture(stats.body.Data.userId as number);
        if (mugshot.code == 200) {
            Embed.setThumbnail(mugshot.body.data.pop().imageUrl);
        }

        await LogChannel.send({ embeds: [Embed] });

        Embed.data.thumbnail = undefined;
        Embed.setTitle("Success.")
        Embed.setDescription(`We recieved your withdrawal request for **${points} points**\nYour site balance is now **${stats.body.Data.balance} R$**`)
        await interaction.reply({ embeds: [Embed] })
    },
    options: {},
    data: new SlashCommandBuilder()
        .setName("withdraw")
        .setDescription("Withdraw your points for R$")
        .addNumberOption(points => points.setName("points").setDescription("Amount of points you'd like to withdraw").setRequired(true).setMinValue(BOT_CONFIG.minimum_withdrawal))
        .setDMPermission(false)
}