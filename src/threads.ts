import { App } from "@slack/bolt"

import { db, Thread } from "./db"

export const newThread = async (ts: string) => {
    let thread = new Thread()
    thread.ts = ts

    await db.getRepository(Thread).save(thread)
}

export const threadActivity = async (app: App, ts: string) => {
    if (!process.env.NUMEROLOGY_CHANNEL)
        throw new Error("NUMEROLOGY_CHANNEL not set")

    let messages = (
        await app.client.conversations.replies({
            token: process.env.SLACK_XOXB_TOKEN,
            channel: process.env.NUMEROLOGY_CHANNEL,
            ts,
        })
    ).messages?.reverse()
    if (!messages)
        throw new Error(
            "could not get thread activity: conversations.replies response has no messages property"
        )

    let n = ((messages: any) => {
        let m = 0
        for (let message of messages)
            if (message.subtype === "bot_message") m++
            else return Math.min(1, 1 / m + 0.1)
        return 0.1
    })(messages)
    if (messages.length < 10) n = Math.min(1, n + 0.1 * (10 - messages.length))

    return n
}
