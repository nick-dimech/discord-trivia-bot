const { Client, Events, GatewayIntentBits, Collection, MessageFlags } = require('discord.js');
const { token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(token);
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	// array of .js command files t
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		}
		else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}
// bot recieves interatcionCreate event to handle
client.on(Events.InteractionCreate, async (interaction) => {
	// handle interactions which are not slash commands
	if (!interaction.isChatInputCommand()) return;

	// is slash command with a commandName property
	const command = client.commands.get(interaction.commandName);
	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		command.execute(interaction);
	}
	catch (error) {
		console.error(`Error executing ${interaction.commandName}: ${error}`);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: 'There was an error while executing this command!',
				// ephem -> only visible to user who invoked command
				flags: MessageFlags.Ephemeral,
			});
		}
		else {
			await interaction.reply({
				content: 'There was an error while executing this command!',
				flags: MessageFlags.Ephemeral,
			});
		}
	}
	console.log(interaction);
});