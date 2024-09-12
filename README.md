# InviteGiveaway
Commission for Internal

## Usage (server wise)
1. Clone the repo
2. Run start.bat

## Configuration
- .env located in root (token, bot id, database url, buxloot api key)
- config.json located in root (points_per_hour, server_id)
- site_issues.json located in src
- bot_issues.json located in src

```env
TOKEN=""
ID=""
DATABASE_URL=""
API_KEY=""
```

```json
{
    "points_per_hour": 1,
    "server_id": "",
    "keywords": [],
    "multiplier": {
        "every": 30,
        "multiply": 0.1
    },
    "keyword_threshold": 3,
    "minimum_withdrawal": 1,
    "bot_status": "buxloot.com",
    "staff": ["1056818884398809118"],
    "bot_commands_channel": "1193385316732637254",
    "withdraw_log_channel": "",
    "bot_log_channel": ""
}
```

## Site Issues
```json
{
    "issues": [
        {
            "name": "Captcha failed: 300030",
            "explationation": "This error happens when you reattempt the withdrawal after facing a __different error__\n\n**How to fix**: Make sure you close out of the withdraw pop up and press the claim button again."
        },
        {
            "name": "You must complete at least one survey or offer",
            "explationation": "You didn't do any offers or surveys for buxloot\n**How to fix**: You must complete at least one survey on the website."
        },
        {
            "name": "You didn't recieve robux",
            "explationation": "You didn’t qualify for the survey then. If you received 1 robux that means the offerwall saw your effort and gave you a R$ to keep you motivated. If you didn’t it means you probably bullshitted the survey and gave subpar info\n\n**How to fix:** Use genuine info in your surveys, using incorrect info will invalidate them"
        },
        {
            "name": "I downloaded app and didn't get reward",
            "explationation": "Make sure the app is properly linked to to your offerwll account. It should be shown in the offers history or settings page of the offerwall. You will also be prompted to link the app to your offerwall account when you download it."
        },
        {
            "name": "Withdraw not working",
            "explationation": "Read the error on the site. It is 100% a user issue if you can’t withdraw and you should watch the withdrawal tutorial which can be found in <#1186776256730103888>"
        }
    ]
}
```

## Bot Issues
```json
{
    "issues": [
        {
            "name": "I invited someone and didn't recieve my invite",
            "explationation": "Make sure your link is your own (NOT **discord.gg/buxloot**)\nHeres how:",
            "image": "https://i.imgur.com/0mjSIDs.gif"
        },
        {
            "name": "InviteTracker says I have x invites, BuxBot doesn't",
            "explationation": "BuxBot is a new bot, it will only track **new invites**"
        },
        {
            "name": "How do I increase my multipler",
            "explationation": "Your multipler increases every x invites, more invites, higher multipler"
        }
    ]
}
```