import { ActionRowBuilder, CacheType, ChatInputCommandInteraction, ComponentType, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { issues } from "../site_issues.json"

let questions: Array<StringSelectMenuOptionBuilder> = []
for (let issue of issues) {
    const option = new StringSelectMenuOptionBuilder()
    option.setLabel(issue.name)
    option.setValue(issue.name)
    questions.push(option)
}

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const menu = new StringSelectMenuBuilder()
            .setCustomId("site-help")
            .setPlaceholder("Choose your issue")
            .addOptions(...questions);

        const row = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(menu);

        const message = await interaction.reply({ components: [row], ephemeral: true });
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 })
        collector.on("collect", async (selected) => {
            if (!selected.isStringSelectMenu()) return;
            selected.deferUpdate();

            const problem = selected.values.shift();
            const issue = issues.find(issue => issue.name == problem);
            if (!issue) return;

            const Embed = new EmbedBuilder()
            .setAuthor({ name: issue.name })
            .setDescription(issue.explationation)
            .setColor("#ff8282")
            await interaction.editReply({ embeds: [Embed] })
        });
    },
    options: {},
    data: new SlashCommandBuilder()
        .setName("site-help")
        .setDescription("Do you need help with the BuxLoot site? This command will answer all your questions")
        .setDMPermission(true)
}

// ff8282