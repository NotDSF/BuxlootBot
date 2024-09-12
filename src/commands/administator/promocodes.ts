import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const promocodes = await Database.GetPromocodes();
        const Embed = new EmbedBuilder()
        .setTitle(":star: Promocodes")
        .setColor("#ffeb82")

        let list = [];
        let count = 1;
        for (let i=0; i < 10; i++) {
            let promocode = promocodes[i];
            if (!promocode) continue;

            list.push(`**${count}** • \`${promocode.Code}\` (Reward: **${promocode.Reward} R$**; Max Uses: **${promocode.MaxUses}**; Uses: **${promocode.Uses.length}**${promocode.Expires ? `; bhExpires: <t:${Math.floor(promocode.Expires / 1000)}>` : ""})`);
            count++;
        }

        Embed.setDescription(`Promocodes:\n${list.join("\n")}`);
        return await interaction.reply({ embeds: [Embed], ephemeral: true });
    },
    options: { IDLocked: true },
    data: new SlashCommandBuilder()
        .setName("promocodes")
        .setDescription("Get a list of all available promocodes")
        .setDMPermission(false)
}