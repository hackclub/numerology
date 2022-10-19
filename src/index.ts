import { App } from "@slack/bolt"
import Chance from "chance"
import dotenv from "dotenv"

const chance = new Chance()

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
    console.log("received message:", message)
    try {
        const isThreaded = (message as any).thread_ts !== undefined
        if (!isThreaded) await newThread(message.ts)
        if (chance.bool({ likelihood: isThreaded ? 30 : 70 })) await userPosts(app, message.ts)
    } catch (e) {
        console.error(e)
    }
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
    ; (async () => {
        await db.initialize()
        await app.start()

        let userCount = await db.getRepository(User).count()
        if (userCount < 4) for (let i = 0; i < 4 - userCount; i++) await userJoins()

        const messageFreq = 15 // average minutes between messages given maximum activity
        // const newThreadFreq = 360 // average minutes between new threads
        // const joinFreq = 720 // average minutes between users joining
        // const leaveFreq = 720 // average minutes between users leaving

        // SPEED!!! :3 :3
        const newThreadFreq = 0.5
        const joinFreq = 0.5
        const leaveFreq = 0.5

        const tick = async () => {
            try {
                const threads = await db.getRepository(Thread).find()
                for (let thread of threads) {
                    if (
                        chance.bool({ likelihood:
                            (1 / messageFreq / 1.2) *
                            (await threadActivity(app, thread.ts))
                        })
                    )
                        await userPosts(app, thread.ts)
                }
                if (chance.bool({ likelihood: 1 / newThreadFreq / 1.2 }))
                    await userStartsThread(app)
                if (chance.bool({ likelihood: 1 / joinFreq / 1.2 })) await userJoins()
                if (chance.bool({ likelihood: 1 / leaveFreq / 1.2 })) await userLeaves()
            } catch (e) { console.error(e) }
        }
        setInterval(tick, 500)
    })()
