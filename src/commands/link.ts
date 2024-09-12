import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } from "discord.js";
import APIWrapper from "../modules/wrapper"

const BuxLoot = new APIWrapper();

module.exports = {
    async execute(interaction: ChatInputCommandInteraction<CacheType>) {
        const username = interaction.options.getString("username", true);
        const data = await BuxLoot.GetStatistics(username as string);
        const Embed = new EmbedBuilder()
        .setTitle("Oops, we ran into a problem...")
        .setColor("#ff8282")

        if (data.code !== 200) {
            if (data.body && data.body.Code == 1) {
                Embed.setDescription("This user isn't a valid buxloot account")
                return await interaction.reply({ ephemeral: true, embeds: [Embed] })
            }

            Embed.setDescription("Internal Error / Request fail")
            console.log(data);
            return await interaction.reply({ ephemeral: true, embeds: [Embed] })
        }

        let buser = await Database.GetUser(interaction.user.id);
        if (!buser) {
            buser = await Database.CreateUser(interaction.user.id);
        }

        if (buser.RobloxUsername) {
            Embed.setDescription("You already linked your buxloot account!")
            return await interaction.reply({ ephemeral: true, embeds: [Embed] });
        }

        const existing = await Database.FindUsername(username);
        if (existing) {
            Embed.setDescription("This username is already linked to an account")
            return await interaction.reply({ ephemeral: true, embeds: [Embed] })
        }

        const Confirm = new ButtonBuilder()
        .setCustomId("link-account")
        .setLabel("Link")
        .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(Confirm);

        Embed.setTitle("User confirmation required");
        Embed.setColor("#ffeb82");
        Embed.setDescription(`Please confirm that **${username}** is the correct account\n:warning: You won't be able to unlink / modify after proceeding`)

        const mugshot = await BuxLoot.GetProfilePicture(data.body.Data.userId as number);
        if (mugshot.code == 200) {
            Embed.setThumbnail(mugshot.body.data.pop().imageUrl);
        }

        const message = await interaction.reply({ embeds: [Embed], components: [row] });
        const filter = (tx: any) => tx.user.id === interaction.user.id;
        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, filter, time: 10000 })

        collector.on("collect", async (button) => {
            button.deferUpdate();

            if (button.customId !== "link-account") return;

            await Database.LinkUsername(interaction.user.id, username);
            Embed.setTitle("Account linked :fire:")
            Embed.setDescription(`Successfully linked **${username}** to your account\n\nWhat now?\n- Use <#1205288931529195530> to earn R$ and points\n- Gain special access to giveaways & offers\n- Access to /withdraw & /statistics`)
            await interaction.editReply({ embeds: [Embed], components: [] });

            const logs = await interaction.guild?.channels.cache.get(BOT_CONFIG.bot_log_channel);
            if (!logs || !logs.isTextBased()) return;

            Embed.setTitle("Account Linked")
            Embed.setDescription(`<@${interaction.user.id}> (Created: <t:${Math.floor((interaction.user.createdTimestamp || 0) / 1000)}>)\nAccount Linked: **${username}**`)
            await logs.send({ embeds: [Embed] })
            .catch(er => console.log(er));
        });
    },
    options: {},
    data: new SlashCommandBuilder()
        .setName("link")
        .setDescription("Link your buxloot username to your discord account")
        .addStringOption((user) => user.setName("username").setRequired(true).setDescription("Your buxloot username"))
        .setDMPermission(false)
}