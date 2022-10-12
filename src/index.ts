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
import { threadActivity } from "./threads"

dotenv.config()

const app = new App({
    token: process.env.SLACK_XOXB_TOKEN,
    appToken: process.env.SLACK_XAPP_TOKEN,
    socketMode: true,
})

;(async () => {
    await db.initialize()
    await app.start()

    let userCount = await db.getRepository(User).count()
    if (userCount < 4) for (let i = 0; i < 4 - userCount; i++) await userJoins()

    const messageFreq = 0.2 // average minutes between messages given maximum activity
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
