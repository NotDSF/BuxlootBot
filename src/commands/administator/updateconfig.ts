import { SlashCommandBuilder, CacheType, ChatInputCommandInteraction, ModalBuilder, EmbedBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } from "discord.js";
import { writeFileSync } from "fs"
import path from "path";

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const modal = new ModalBuilder()
        .setTitle("Bot Configuration")
        .setCustomId("serverconfig")

        const ServerID = new TextInputBuilder()
        .setCustomId("points")
        .setLabel("Points Per Hour:")
        .setValue(BOT_CONFIG.points_per_hour.toString())
        .setRequired(true)
        .setStyle(TextInputStyle.Short)

        const BotCommnds = new TextInputBuilder()
        .setCustomId("multiplier")
        .setLabel("Apply multiplier every x invites:")
        .setValue(BOT_CONFIG.multiplier.every.toString())
        .setRequired(true)
        .setStyle(TextInputStyle.Short)

        const BotLogs = new TextInputBuilder()
        .setCustomId("multiply")
        .setLabel("Multiply by:")
        .setValue(BOT_CONFIG.multiplier.multiply.toString())
        .setRequired(true)
        .setStyle(TextInputStyle.Short)

        const WithdrawLogs = new TextInputBuilder()
        .setCustomId("withdrawals")
        .setLabel("Minimum user withdrawal amount:")
        .setValue(BOT_CONFIG.minimum_withdrawal.toString())
        .setRequired(true)
        .setStyle(TextInputStyle.Short)

        let rows: any = [];
        rows.push(new ActionRowBuilder().addComponents(ServerID));
        rows.push(new ActionRowBuilder().addComponents(BotCommnds));
        rows.push(new ActionRowBuilder().addComponents(BotLogs));
        rows.push(new ActionRowBuilder().addComponents(WithdrawLogs));
        modal.setComponents(...rows);

        await interaction.showModal(modal);
        const result = await interaction.awaitModalSubmit({ filter: (tx) => tx.customId == "serverconfig", time: 60000 })
        .catch(er => console.log(er));

        if (!result) return;

        BOT_CONFIG.points_per_hour = Number(result.fields.getTextInputValue("points"))
        BOT_CONFIG.multiplier.every = Number(result.fields.getTextInputValue("multiplier"))
        BOT_CONFIG.multiplier.multiply = Number(result.fields.getTextInputValue("multiply"));
        BOT_CONFIG.minimum_withdrawal = Number(result.fields.getTextInputValue("withdrawals"));

        const Embed = new EmbedBuilder()
        .setTitle("Updated configuation")
        .setDescription(`Successfully updated bot configuration\n\`\`\`json\n${JSON.stringify(BOT_CONFIG, null, 4)}\`\`\``)
        .setColor("#ffeb82")
        await interaction.channel?.send({ embeds: [Embed] });
        writeFileSync(path.join(__dirname, "../../../config.json"), JSON.stringify(BOT_CONFIG, null, 4));
    },
    options: { IDLocked: true },
    data: new SlashCommandBuilder()
        .setName("updateconfig")
        .setDescription("Remotely update the bot configuration and restart it")
        .setDMPermission(false)
}