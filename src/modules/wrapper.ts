import { GetRequestData } from "./types"

async function GetRequest(url: string): Promise<GetRequestData> {
    return new Promise(async (resolve, reject) => {
        let JSONData: Object | unknown;
        const result = await fetch(url, {
            method: "GET",
            headers: {
                authorization: process.env.API_KEY as string
            }
        })

        try {
            JSONData = await result.json()
        } catch (er) {
            console.log(er)
        }

        resolve({ code: result.status, body: JSONData as Object })
    })
}

async function PostRequst(url: string, rbody: Object): Promise<GetRequestData> {
    return new Promise(async (resolve, reject) => {
        let JSONData: Object | unknown;
        const result = await fetch(url, {
            method: "POST",
            headers: {
                ["content-type"]: "application/json",
                authorization: process.env.API_KEY as string
            },
            body: JSON.stringify(rbody)
        })

        try {
            JSONData = await result.json()
        } catch (er) {
            console.log(er)
        }

        resolve({ code: result.status, body: JSONData as Object })
    })
}

export default class APIWrapper {
    constructor() {
    }

    async GetStatistics(RobloxUsername: string): Promise<GetRequestData> {
        return new Promise(async (resolve, reject) => resolve(await GetRequest(`https://bot.buxloot.com/${RobloxUsername}/stats`)))
    }

    async GetWithdrawals(RobloxUsername: string): Promise<GetRequestData> {
        return new Promise(async (resolve, reject) => resolve(await GetRequest(`https://bot.buxloot.com/${RobloxUsername}/withdrawals`)))
    }

    async GetReferrals(RobloxUsername: string): Promise<GetRequestData> {
        return new Promise(async (resolve, reject) => resolve(await GetRequest(`https://bot.buxloot.com/${RobloxUsername}/referrals`)))
    }

    async AddBalance(RobloxUsername: string, amount: number) : Promise<GetRequestData> {
        return new Promise(async (resolve, reject) => resolve(await PostRequst(`https://bot.buxloot.com/${RobloxUsername}/addBalance`, { amount })))
    }

    async RemoveBalance(RobloxUsername: string, amount: number) : Promise<GetRequestData> {
        return new Promise(async (resolve, reject) => resolve(await PostRequst(`https://bot.buxloot.com/${RobloxUsername}/removeBalance`, { amount })))
    }

    async SetBan(RobloxUsername: string, banned: boolean) : Promise<GetRequestData> {
        return new Promise(async (resolve, reject) => resolve(await PostRequst(`https://bot.buxloot.com/${RobloxUsername}/setBan`, { banned })))
    }

    async GetProfilePicture(RobloxID: number) : Promise<GetRequestData> {
        return new Promise(async (resolve, reject) => resolve(await GetRequest(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${RobloxID}&size=100x100&format=Png&isCircular=false`)))
    }
}