import { App } from "@slack/bolt"
import random from "random"

import { db, User } from "./db"
import { Message, newUser, writeMessage } from "./users"

export const userPosts = async (app: App, messages: Message[]) => {
    if (!process.env.NUMEROLOGY_CHANNEL)
        throw new Error("NUMEROLOGY_CHANNEL not set")

    const user = (await db
        .getRepository(User)
        .createQueryBuilder()
        .orderBy("RANDOM()")
        .getOne()) as User
    if (!user) throw new Error("user can't post: no users")

    for (let i = 0; i < random.int(1, 3); i++) {
        const response = await writeMessage(user, messages)
        await app.client.chat.postMessage({
            channel: process.env.NUMEROLOGY_CHANNEL,
            text: response,
            username: user.name,
            icon_emoji: user.emoji,
        })
    }
}

export const userJoins = async (app: App) => {
    if (!process.env.NUMEROLOGY_CHANNEL)
        throw new Error("NUMEROLOGY_CHANNEL not set")

    const user = await newUser()
    await app.client.chat.postMessage({
        channel: process.env.NUMEROLOGY_CHANNEL,
        text: `${user.name} has joined the Project.`,
    })
}

export const userLeaves = async (app: App) => {
    if (!process.env.NUMEROLOGY_CHANNEL)
        throw new Error("NUMEROLOGY_CHANNEL not set")

    const user = (await db
        .getRepository(User)
        .createQueryBuilder()
        .orderBy("RANDOM()")
        .getOne()) as User
    if (!user) throw new Error("user can't leave: no users")
    db.getRepository(User).delete(user.id)

    await app.client.chat.postMessage({
        channel: process.env.NUMEROLOGY_CHANNEL,
        text: `${user.name} has ascended to a higher plane.`,
    })
}
