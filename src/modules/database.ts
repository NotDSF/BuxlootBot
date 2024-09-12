import { User, Giveaway, PromocodeData } from "../modules/types"

export default class DatabaseHandler {
    constructor() {
    }

    async GetUser(DiscordID: string): Promise<User | null> {
        return new Promise(async (resolve, reject) => {
            try {
                const User = await prisma.user.findUnique({
                    where: { DiscordID }
                })
                resolve(User)
            } catch (er) {
                logtail.error(er ? er.toString() : "");
                reject(er)
            }
        })
    }

    async CreateUser(DiscordID: string): Promise<User> {
        return new Promise(async (resolve, reject) => {
            try {
                const User = await prisma.user.create({
                    data: { DiscordID }
                })
                resolve(User)
            } catch (er) {
                logtail.error(er ? er.toString() : "");
                reject(er)
            }
        })
    }

    async IncrementInvites(DiscordID: string): Promise<User> {
        return new Promise(async (resolve, reject) => {
            try {
                const User = await prisma.user.update({
                    where: { DiscordID },
                    data: {
                        Invites: { increment: 1 }
                    }
                })
                resolve(User)
            } catch (er) {
                logtail.error(er ? er.toString() : "");
                reject(er)
            }
        })
    }

    async CreateGiveaway(GiveawayID: string, MiniumInvites: number, Winners: number, Expires: number, ChannelID: string, Description: string, Host: string, MiniumPoints?: number): Promise<Giveaway> {
        return new Promise(async (resolve, reject) => {
            try {
                const Giveaway = await prisma.giveaway.create({
                    data: {
                        GiveawayID,
                        Expires,
                        MiniumInvites,
                        ChannelID,
                        MiniumPoints,
                        Description,
                        Winners,
                        Host
                    }
                })
                resolve(Giveaway)
            } catch (er) {
                logtail.error(er ? er.toString() : "");
                reject(er)
            }
        })
    }

    async GetGiveaway(GiveawayID: string): Promise<Giveaway | null> {
        return new Promise(async (resolve, reject) => {
            try {
                const Giveaway = await prisma.giveaway.findUnique({
                    where: {
                        GiveawayID
                    }
                })
                resolve(Giveaway)
            } catch (er) {
                logtail.error(er ? er.toString() : "");;
                reject(er);
            }
        })
    }

    async AddEntry(GiveawayID: string, DiscordID: string): Promise<Giveaway> {
        return new Promise(async (resolve, reject) => {
            try {
                const Giveaway = await prisma.giveaway.update({
                    where: {
                        GiveawayID
                    },
                    data: {
                        Entries: {
                            push: DiscordID
                        }
                    }
                })
                resolve(Giveaway);
            } catch (er) {
                logtail.error(er ? er.toString() : "");;
                reject(er);
            }
        })
    }
    
    async GetGiveaways(): Promise<Array<Giveaway>> {
        return new Promise(async (resolve, reject) => {
            try {
                const giveaways = await prisma.giveaway.findMany();
                resolve(giveaways);
            } catch (er) {
                logtail.error(er ? er.toString() : "");;
                reject(er);
            }
        })
    }

    async DeleteGiveaway(GiveawayID: string): Promise<Giveaway> {
        return new Promise(async (resolve, reject) => {
            try {
                const Giveaway = await prisma.giveaway.delete({
                    where: {
                        GiveawayID
                    }
                })
                resolve(Giveaway);
            } catch (er) {
                logtail.error(er ? er.toString() : "");;
                reject(er);
            }
        })
    }

    async GetUserInvites(): Promise<Array<User>> {
        return new Promise(async (resolve, reject) => {
            try {
                const Results = await prisma.user.findMany({
                    take: 10,
                    orderBy: {
                        Invites: "desc"
                    }
                })
                resolve(Results);
            } catch (er) {
                logtail.error(er ? er.toString() : "");;
                reject(er);
            }
        })
    }

    async GetUserPoints(): Promise<Array<User>> {
        return new Promise(async (resolve, reject) => {
            try {
                const Results = await prisma.user.findMany({
                    take: 10,
                    orderBy: {
                        PointsEarned: "desc"
                    }
                })
                resolve(Results);
            } catch (er) {
                logtail.error(er ? er.toString() : "");;
                reject(er);
            }
        })
    }

    async IncrementPoints(DiscordID: string, Amount: number): Promise<User> {
        return new Promise(async (resolve, reject) => {
            try {
                const result = await prisma.$transaction(async (tx) => {
                    const user = await tx.user.findUnique({ where: { DiscordID } });
                    if (!user) return reject();

                    const multipler = ((user.Invites / BOT_CONFIG.multiplier.every) * 0.1) + 1;
                    Amount = Amount * multipler;

                    const User = await tx.user.update({
                        where: { DiscordID },
                        data: {
                            Points: (user.Points + Amount),
                            PointsEarned: (user.PointsEarned + (Amount < 0 ? 0 : Amount)) // if -neg bal add 0 or amount
                        }
                    })
                    
                    return User
                })

                if (!result) return reject();

                resolve(result);
            } catch (er) {
                logtail.error(er ? er.toString() : "");;
                //reject(er);
            }
        });
    }

    async IncrementPointsStrict(DiscordID: string, Amount: number): Promise<User> {
        return new Promise(async (resolve, reject) => {
            try {
                const user = await prisma.user.update({
                    where: { DiscordID },
                    data: {
                        Points: {
                            increment: Amount
                        }
                    }
                })
                resolve(user);
            } catch (er) {
                logtail.error(er ? er.toString() : "");;
                console.log(er)
            }
        });
    }

    async ResetPoints(DiscordID: string): Promise<User> {
        return new Promise(async (resolve, reject) => {
            try {
                const User = await prisma.user.update({
                    where: { DiscordID },
                    data: {
                        Points: 0
                    }
                })

                resolve(User);
            } catch (er) {
                logtail.error(er ? er.toString() : "");;
                reject(er);
            }
        });
    }

    async ResetInvites(DiscordID: string): Promise<User> {
        return new Promise(async (resolve, reject) => {
            try {
                const User = await prisma.user.update({
                    where: { DiscordID },
                    data: {
                        Invites: 0
                    }
                })

                resolve(User);
            } catch (er) {
                logtail.error(er ? er.toString() : "");;
                reject(er);
            }
        });
    }

    async FindUsername(RobloxUsername: string): Promise<User> {
        return new Promise(async (resolve, reject) => {
            try {
                const User = await prisma.user.findFirst({ where: { RobloxUsername } })
                resolve(User as User);
            } catch (er) {
                logtail.error(er ? er.toString() : "");;
                reject(er);
            }
        })
    }

    async LinkUsername(DiscordID: string, RobloxUsername: string): Promise<User> {
        return new Promise(async (resolve, reject) => {
            try {
                const User = await prisma.user.update({
                    where: { DiscordID },
                    data: { RobloxUsername }
                })
                resolve(User);
            } catch (er) {
                reject(er);
                logtail.error(er ? er.toString() : "");;
            }
        })
    }

    async ResetData(DiscordID: string): Promise<User> {
        return new Promise(async (resolve, reject) => {
            try {
                const User = await prisma.user.update({
                    where: { DiscordID },
                    data: {
                        Points: 0,
                        PointsEarned: 0,
                        RobloxUsername: null
                    }
                })
                resolve(User);
            } catch (er) {
                reject(er);
                logtail.error(er ? er.toString() : "");;
            }
        });
    }

    async CreatePromocode(Reward: number, Code: string, MaxUses: number, Expires?: number): Promise<PromocodeData> {
        return new Promise(async (resolve, reject) => {
            try {
                const Promocode = await prisma.promocode.create({
                    data: { 
                        Reward,
                        Code,
                        MaxUses,
                        Expires
                    }
                })
                resolve(Promocode);
            } catch (er) {
                reject(er);
                logtail.error(er ? er.toString() : "");;
            }
        });
    }

    async UpdatePromocode(DiscordID: string, Code: string): Promise<PromocodeData> {
        return new Promise(async (resolve, reject) => {
            try {
                const promocode = await prisma.promocode.update({
                    where: { Code },
                    data: {
                        Uses: {
                            push: DiscordID
                        }
                    }
                })

                resolve(promocode);
            } catch (er) {
                logtail.error(er ? er.toString() : "");;
                reject(er);
            }
        })
    }

    async GetPromocode(Code: string): Promise<PromocodeData | null> {
        return new Promise(async (resolve, reject) => {
            try {
                const Promocode = await prisma.promocode.findUnique({ where: { Code } });
                resolve(Promocode);
            } catch (er) {
                logtail.error(er ? er.toString() : "");;
                reject(er);
            }
        })
    }

    async DeletePromocode(Code: string): Promise<PromocodeData> {
        return new Promise(async (resolve, reject) => {
            try {
                const Promocode = await prisma.promocode.delete({ where: { Code } });
                resolve(Promocode);
            } catch (er) {
                logtail.error(er ? er.toString() : "");;
                reject(er);
            }
        })
    }

    async GetPromocodes(): Promise<Array<PromocodeData>> {
        return new Promise(async (resolve, reject) => {
            try {
                const Promocode = await prisma.promocode.findMany();
                resolve(Promocode);
            } catch (er) {
                reject(er);
                logtail.error(er ? er.toString() : "");;
            }
        })
    }
}