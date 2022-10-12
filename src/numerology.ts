import { App } from "@slack/bolt"
import random from "random"

import { db, User } from "./db"
import { newThread } from "./threads"
import { Message, newUser, writeMessage } from "./users"

const getDisplayName = async (
    app: App,
    user: string
): Promise<string | undefined> => {
    const userObj = await app.client.users.info({
        token: process.env.SLACK_XOXB_TOKEN,
        user,
    })
    return userObj.user?.profile?.display_name || userObj.user?.name
}

const getTranscript = async (
    app: App,
    thread_ts: string
): Promise<Message[]> => {
    if (!process.env.NUMEROLOGY_CHANNEL)
        throw new Error("NUMEROLOGY_CHANNEL not set")

    let rawMessages = (
        await app.client.conversations.replies({
            channel: process.env.NUMEROLOGY_CHANNEL,
            ts: thread_ts,
        })
    ).messages
    if (!rawMessages) throw new Error("invalid conversations.replies response")

    let messages = await Promise.all(
        rawMessages.map(async (message) => {
            let user = await (async () => {
                if (message.user) {
                    let displayName = await getDisplayName(app, message.user)
                    if (displayName) return displayName
                } else if ((message as any).username)
                    return (message as any).username
            })()

            if (!user)
                throw new Error("couldn't extract display name from message")
            if (!message.text) throw new Error("message has no text")

            return {
                user,
                text: message.text,
            }
        })
    )
    messages.reverse()

    let reset = messages.find((message) => message.text === "RESET")
    if (reset) messages = messages.slice(messages.indexOf(reset) + 1)

    return messages
}

export const userPosts = async (app: App, thread_ts: string) => {
    if (!process.env.NUMEROLOGY_CHANNEL)
        throw new Error("NUMEROLOGY_CHANNEL not set")

    const user = (await db
        .getRepository(User)
        .createQueryBuilder()
        .orderBy("RANDOM()")
        .getOne()) as User
    if (!user) throw new Error("user can't post: no users")

    for (let i = 0; i < random.int(1, 3); i++) {
        const response = await writeMessage(
            user,
            await getTranscript(app, thread_ts)
        )
        await app.client.chat.postMessage({
            channel: process.env.NUMEROLOGY_CHANNEL,
            text: response,
            thread_ts,
            username: user.name,
            icon_emoji: user.emoji,
        })
    }

    console.log("user posted:", user.name)
}

export const userStartsThread = async (app: App) => {
    if (!process.env.NUMEROLOGY_CHANNEL)
        throw new Error("NUMEROLOGY_CHANNEL not set")

    const user = (await db
        .getRepository(User)
        .createQueryBuilder()
        .orderBy("RANDOM()")
        .getOne()) as User
    if (!user) throw new Error("user can't start thread: no users")

    const text = await writeMessage(user, [])
    const post = await app.client.chat.postMessage({
        channel: process.env.NUMEROLOGY_CHANNEL,
        text,
        username: user.name,
        icon_emoji: user.emoji,
    })

    if (post.ts) await newThread(post.ts)
    else throw new Error("failure while starting thread: post has no timestamp")

    console.log("user started thread:", user.name)

    return post.ts
}

export const userJoins = async () => {
    if (!process.env.NUMEROLOGY_CHANNEL)
        throw new Error("NUMEROLOGY_CHANNEL not set")

    const user = await newUser()

    console.log("user joined:", user.name)
}

export const userLeaves = async () => {
    if (!process.env.NUMEROLOGY_CHANNEL)
        throw new Error("NUMEROLOGY_CHANNEL not set")

    const user = (await db
        .getRepository(User)
        .createQueryBuilder()
        .orderBy("RANDOM()")
        .getOne()) as User
    if (!user) throw new Error("user can't leave: no users")
    db.getRepository(User).delete(user.id)

    console.log("user left:", user.name)
}
