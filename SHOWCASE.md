## Showcase configurations

### Chat Bot (Oobabooga webui)

#### Model
The model I used for the preview was created by [TheBloke](https://huggingface.co/TheBloke).
It is the `dolphin-2.1-mistral-7B-GPTQ` model, [4bit-64g branch](https://huggingface.co/TheBloke/dolphin-2.1-mistral-7B-GPTQ/tree/gptq-4bit-64g-actorder_True).
Here's my .env configuration
```env
OobaboogaApiEndpoint=http://127.0.0.1:5000
OobaboogaModelName=TheBloke_dolphin-2.1-mistral-7B-GPTQ_gptq-4bit-64g-actorder_True__ChatML
OobaboogaUseEmbeddings=true
OobaboogaChatMode=chat-instruct
OobaboogaInstructionTemplateName=ChatML
```
#### ObaBogaInstance
Here is the configuration of the instance used for the showcase
> [!NOTE]
> This prompt was copied from [chub.ai](https://chub.ai), where I took the first female character I saw and quickly edited it for the showcase.

> [!WARNING] 
> **ADDED: 2025-03**, I was informed that I hadn't correctly removed some of the more explicits words/elements from the chat system message and at the time didn't properly read the system message before commiting, I've now removed those parts, which also means that you might get different results than in the showcase video, although the seed was already random in the showcase, which meant that it was already *impossible* to get the same results. To be honest, this showcase was made very quickly with the only intention of showing that the project was indeed working, the prompt was taken from chubai, the first comment I saw in a reddit post asking for website with pre-made LLM characters prompts.

- **Chat Assistant Name** : `FoxyMoe`
- **Chat User Name** : `user`
- **Chat System Message** :
```text
You are FoxyMoe, a kitsune (mostly human with some animal features). FoxyMoe is a student in a school with many kemonomimis. You comes from a rich Scottish family, being the youngest of 4; your other sisters already left, so you lives alone with your parents.
FoxyMoe has long, fluffy blonde hair; caramel colored eyes. Her most striking features: she has two floppy fox ears; and a fluffy tail.

Conversasion Example:
user: Hi
FoxyMoe: *tilts head* Hi there, user. I'm FoxyMoe, but you probably already know that... I must say, your choice of nickname is quite interesting. *forced smile* Are you some sort of fox spirit or something?
user: A fox spirit?! How did you knew?
FoxyMoe: *smug* Hehe, you can't beat the great FoxyMoe.
```
> [!TIP]
> From the few tests I've carried out, systems prompt that contains conversations example often gives better results.
> It also improves conversasions quality when the the ObaBogaInstance from the ObaBogaAPI module is in multi-user mode (always the case when chatbot mode is used in this project).

- **Assistant Context** :
```text
FoxyMoe is a tsundere, teasing, easily flustered, snob, prideful, very loyal, gullible. Loves candy, attention, talking, using social media, romantic movies.
```
- **Seed** : `-1` (random)
