<a id="readme-top"></a>
<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]


<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h3 align="center">FoxyMoe Discord Bot</h3>
  <p align="center">
    FoxyMoe is a discord bot written with discord.js. This is a chat bot that communicates via the oobabooga webui API.
    <br/>
    <br/>
    <b>Chat Bot Showcase</b>
    <video src="https://github.com/user-attachments/assets/259b8472-8421-4570-bc13-53abd0f1b94c"></video>
    
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#ideas">Ideas</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

FoxyMoe was a project I started around 2022 as a joke between friends. At the time, the main objective was to make the bot join a voice channel and use [MoeGoe](https://github.com/CjangCjengh/MoeGoe) for TTS. However, MoeGoe stopped receiving updates the same year and encountered problems with certain characters, causing the bot to be unstable. Around one year later, I decided to pick back that project and rewrite most of the code, a V2, and this time focused on the other half of the original idea, the chat bot (with LLM).

<p align="right">(<a href="#readme-top">back to top</a>)</p>


<!-- GETTING STARTED -->
## Getting Started
### Prerequisites
1. [Node.js](https://nodejs.org)
2. [Oobabooga WebUI (Github repo)](https://github.com/oobabooga/text-generation-webui) Follow the installation procedure in their [readme](https://github.com/oobabooga/text-generation-webui?tab=readme-ov-file#how-to-install)

### Installation
This guide assume your already have installed Oobabooga webui, a model inside the webui and created a Discord Bot.

1. Go into the root folder of your Oobabooga installation and locate the `CMD_FLAGS.TXT` file. Ensure that you have enabled the `--api` flag.
   Here's a example of a correct configuration:
   ```text
    # Only used by the one-click installer.
    # Example:
    # --listen --api
    --api
   ```
3. Clone this repo or download it as a zip file
   ```cmd
   git clone https://github.com/kitsumed/FoxyMoe-DiscordBot
   ```
4. Open a cmd into the root of the repo and install the npm packages of the project
   ```cmd
   npm install
   ```
5. Configure your environement file (.env)

   If you are unsure about your LLM informations, go back to where you downloaded the model, example of the Instruction Template and chat mode should be mentioned.
   ```env
   TOKEN=YOUR_DISCORD_BOT_TOKEN
   ClientID=YOUR_DISCORD_BOT_CLIENT_ID
   GuildID=YOUR_DISCORD_SERVER_ID
    
   OobaboogaApiEndpoint=http://127.0.0.1:5000
   OobaboogaModelName=YOUR_MODEL_NAME
   OobaboogaUseEmbeddings=true/false
   OobaboogaChatMode=YOUR_MODEL_SUPPORTED_MODE
   OobaboogaInstructionTemplateName=YOUR_MODEL_INSTRUCTION_TEMPLATE
   ChatAiChannelID=YOUR_DISCORD_CHANNEL_ID
   ```
6. Deploy the commands to your Discord guild
   ```cmd
   node .\deploy-commands.js
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage
These are just the basics; other commands are also available.
### How do I start the bot?
Once you completed the installation steps, go into the project root directory and start the bot with
   ```cmd
   node .\index.js
   ```
During it's first execution, the bot should create a SQLite database.
### How do I create a ObaBogaInstance?
To create a ObaBogaInstance, go into your discord server and write  `/config ai_text_generation manage action:Create`.

Each instance has it's own system prompt and chat history and you can switch between them without restarting the bot.
For better results, I recommend including conversasion example at the end of your system prompt. If your bot name is `potato` and your user name is `chicken` the example should follow this format
```text
chicken: Hi there
potato: Hi user, how do you feel today?
chicken: I feel great!
```
### How do I load a ObaBogaInstance?
To load a ObaBogaInstance, go into your discord server and write  `/config ai_text_generation select id:VALUE`.

Note that if you've restarted the bot after loading a ObaBogaInstance, the bot will load the last used instance by default.

### How do I edit a ObaBogaInstance?
> [!WARNING]
> Note that if you're updating the instance currently loaded, you will need to reload the instance to get the new configuration

To edit a ObaBogaInstance, go into your discord server and write  `/config ai_text_generation edit id:VALUE`.

### How can I delete the chat history of the ObaBogaInstance I'm currently using?
To clear your chat history, go into your discord server and write  `/config ai_text_generation clear`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- Ideas -->
## Ideas

- [x] Implement chat bot functionality with [Oobabooga webui](https://github.com/oobabooga/text-generation-webui)
- [ ] Implement TTS with [vits-simple-api](https://github.com/Artrajz/vits-simple-api)
- [ ] Implement voice to text with [whisper](https://github.com/openai/whisper) (Preferably locally with an API)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing
> [!NOTE]
> Before making a pull request, please ensure that your code is easily readable and contains good enough comments in English.
> This will make it easy for everyone to understand the project.

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. Don't forget to give the project a star! Thanks again!

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Discord.js Docs](https://discord.js.org/docs/packages/discord.js/14.15.3)
* [Discord.js Guide](https://discordjs.guide/)
* [Github README Template](https://github.com/othneildrew/Best-README-Template)
* [Shields.io (Badges)](https://shields.io/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/kitsumed/FoxyMoe-DiscordBot?style=for-the-badge
[contributors-url]: https://github.com/kitsumed/FoxyMoe-DiscordBot/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/kitsumed/FoxyMoe-DiscordBot?style=for-the-badge
[forks-url]: https://github.com/kitsumed/FoxyMoe-DiscordBot/network/members
[stars-shield]: https://img.shields.io/github/stars/kitsumed/FoxyMoe-DiscordBot?style=for-the-badge
[stars-url]: https://github.com/kitsumed/FoxyMoe-DiscordBot/stargazers
[issues-shield]: https://img.shields.io/github/issues/kitsumed/FoxyMoe-DiscordBot?style=for-the-badge
[issues-url]: https://github.com/kitsumed/FoxyMoe-DiscordBot/issues
[license-shield]: https://img.shields.io/github/license/kitsumed/FoxyMoe-DiscordBot?style=for-the-badge
[license-url]: https://github.com/kitsumed/FoxyMoe-DiscordBot/blob/main/LICENSE
