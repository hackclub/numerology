import { AI21Call, db } from "./db"
const fetch = require("node-fetch")

export interface PenaltyData {
    scale: number
    applyToWhitespaces?: boolean
    applyToPunctuations?: boolean
    applyToNumbers?: boolean
    applyToStopwords?: boolean
    applyToEmojis?: boolean
}

export interface CompleteOptions {
    maxTokens?: number
    minTokens?: number
    temperature?: number
    topP?: number
    stopSequences?: string[]
    topKReturn?: number
    presencePenalty?: PenaltyData
    countPenalty?: PenaltyData
    frequencyPenalty?: PenaltyData
    logitBias?: Record<string, number>
}

export interface Completion {
    text: string
}

export interface Token {}

interface CompleteResponse {
    id: string
    completions: {
        data: { text: string; tokens: Token[] }
        completionReason: unknown
    }[]
}

export const complete = async (
    prompt: string,
    options?: CompleteOptions
): Promise<Completion> => {
    // :(
    while (true) {
        const res = await fetch(
            "https://api.ai21.com/studio/v1/j1-jumbo/complete",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.AI21_API_KEY}`,
                },
                body: JSON.stringify({
                    prompt,
                    numResults: 1,
                    ...options,
                }),
            }
        )
        const json = (await res.json()) as CompleteResponse
        if (json.completions) {
            let cost = json.completions[0].data.tokens.length * 0.00025 + 0.005
            console.log(`ai21 call costed $${cost}`)
            db.getRepository(AI21Call).save({ cost })

            return {
                text: json.completions[0].data.text,
            }
        }
    }
}
