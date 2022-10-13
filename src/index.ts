import { App } from "@slack/bolt"
import dotenv from "dotenv"
import random from "random"

import { db, Thread, User } from "./db"
import {
    userPosts,
    userStartsThread,
    userJoins,
    userLeaves,
} from "./numerology"
import { newThread, threadActivity } from "./threads"

dotenv.config()

const app = new App({
    token: process.env.SLACK_XOXB_TOKEN,
    appToken: process.env.SLACK_XAPP_TOKEN,
    socketMode: true,
})

app.message(/.*/, async ({ message }) => {
    const isThreaded = (message as any).thread_ts !== undefined
    if (!isThreaded) newThread(message.ts)
    if (random.bernoulli(isThreaded ? 0.3 : 0.7)) userPosts(app, message.ts)
})

app.event("reaction_added", async ({ event }) => {
    console.log("reaction added")

    if (!process.env.NUMEROLOGY_CHANNEL)
        throw new Error("NUMEROLOGY_CHANNEL not set")

    if (event.reaction === "tw_no_entry_sign" && "ts" in event.item)
        app.client.chat.delete({
            token: process.env.SLACK_XOXB_TOKEN,
            channel: process.env.NUMEROLOGY_CHANNEL,
            ts: event.item.ts,
        })
})
//
;(async () => {
    await db.initialize()
    await app.start()

    let userCount = await db.getRepository(User).count()
    if (userCount < 4) for (let i = 0; i < 4 - userCount; i++) await userJoins()

    const messageFreq = 15 // average minutes between messages given maximum activity
    const newThreadFreq = 360 // average minutes between new threads
    const joinFreq = 90 // average minutes between users joining
    const leaveFreq = 90 // average minutes between users leaving

    const tick = async () => {
        const threads = await db.getRepository(Thread).find()
        for (let thread of threads) {
            if (
                random.bernoulli(
                    (1 / messageFreq / 120) *
                        (await threadActivity(app, thread.ts))
                )()
            )
                await userPosts(app, thread.ts)
        }
        if (random.bernoulli(1 / newThreadFreq / 120)())
            await userStartsThread(app)
        if (random.bernoulli(1 / joinFreq / 120)()) await userJoins()
        if (random.bernoulli(1 / leaveFreq / 120)()) await userLeaves()
    }
    setInterval(tick, 500)
})()
