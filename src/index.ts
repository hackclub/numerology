import { App } from "@slack/bolt"
import dotenv from "dotenv"
import random from "random"

import { db, User } from "./db"
import { userPosts, userJoins, userLeaves } from "./numerology"
import { Message } from "./users"

dotenv.config()

const app = new App({
    token: process.env.SLACK_XOXB_TOKEN,
    appToken: process.env.SLACK_XAPP_TOKEN,
    socketMode: true,
})

const getDisplayName = async (user: string): Promise<string | undefined> => {
    const userObj = await app.client.users.info({
        token: process.env.SLACK_XOXB_TOKEN,
        user,
    })
    return userObj.user?.profile?.display_name || userObj.user?.name
}

const getTranscript = async (channel: string): Promise<Message[]> => {
    if (!process.env.NUMEROLOGY_USER) throw new Error("NUMEROLOGY_USER not set")

    let rawMessages = (
        await app.client.conversations.history({ channel, limit: 10 })
    ).messages?.filter(
        (message) =>
            (message.subtype === undefined ||
                message.subtype === "bot_message") &&
            message.user !== process.env.NUMEROLOGY_USER
    )
    if (!rawMessages) throw new Error("invalid conversations.history response")

    let messages = await Promise.all(
        rawMessages.map(async (message) => {
            let user = await (async () => {
                if (message.user) {
                    let displayName = await getDisplayName(message.user)
                    if (displayName) return displayName
                } else if (message.username) return message.username
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

;(async () => {
    await db.initialize()
    await app.start()

    let channel: string
    if (process.env.NUMEROLOGY_CHANNEL) channel = process.env.NUMEROLOGY_CHANNEL
    else throw new Error("NUMEROLOGY_CHANNEL not set")

    let messages = await getTranscript(channel)

    let userCount = await db.getRepository(User).count()
    if (userCount < 4)
        for (let i = 0; i < 4 - userCount; i++) await userJoins(app)

    const messageFreq = 5 // average minutes between messages
    const joinFreq = 30 // average minutes between users joining
    const leaveFreq = 30 // average minutes between users leaving

    const tick = async () => {
        if (random.bernoulli(1 / messageFreq / 120)())
            await userPosts(app, messages)
        if (random.bernoulli(1 / joinFreq / 120)()) await userJoins(app)
        if (random.bernoulli(1 / leaveFreq / 120)()) await userLeaves(app)
    }
    setInterval(tick, 500)
})()
