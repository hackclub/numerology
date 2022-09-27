import { readFileSync } from "fs"
import path from "path"
import random from "random"
const fetch = require("node-fetch")

import { complete } from "./ai21"
import { db, User } from "./db"

export type Message = {
    user: string
    text: string
}

const getEmojis = async () => {
    const res = await fetch("https://api.github.com/emojis")
    return Object.keys(await res.json()).map((emoji: string) => `:${emoji}:`)
}

export const newUser = async () => {
    const emojis = await getEmojis()

    let done = false
    let user: User
    do {
        user = new User()

        const emoji = emojis[Math.floor(random.int(0, emojis.length - 1))]

        const basePrompt = readFileSync(
            path.resolve(__dirname, "../prompts/creation.txt"),
            { encoding: "utf-8" }
        )
        const prompt = basePrompt + "\n\nEmoji: " + emoji + "\nName:"

        const completion =
            "Name:" +
            (
                await complete(prompt, {
                    stopSequences: ["\n\n"],
                    maxTokens: 64,
                    temperature: 0.9,
                })
            ).text
        const [name, qualities, example] = completion
            .split("\n")
            .map((line) => line.split(":").slice(1).join(":").trim())

        if (["Caleb Denio", "dictator", "Cantide", "chach"].includes(name)) {
            console.log("regenerating user due to invalid name:", name)
            continue
        } else done = true

        user.name = name
        user.qualities = qualities
        user.emoji = emoji
        user.example = example
    } while (!done)

    await db.manager.save(user)
    return user
}

export const renderUser = (user: User) => `Name: ${user.name}
Qualities: ${user.qualities}
Example message: ${user.example}`

export const writeMessage = async (user: User, messages: Message[]) => {
    const basePrompt = readFileSync(
        path.resolve(__dirname, "../prompts/chat.txt"),
        { encoding: "utf-8" }
    )
    const prompt =
        basePrompt +
        renderUser(user) +
        `\n\n(On Jan 22, 2020; 200 messages)\n\n` +
        messages.map(({ user, text }) => `[${user}] ${text}`).join("\n") +
        "\n(Note that " +
        user.name +
        "'s following response is unusually in-depth)" +
        "\n[" +
        user.name +
        "]"
    return (
        await complete(prompt, {
            stopSequences: ["\n"],
            maxTokens: 512,
            minTokens: 1,
            temperature: 0.85,
            topP: 0.97,
        })
    ).text.slice(1)
}
