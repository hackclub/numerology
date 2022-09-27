# numerology 🔮

language model-powered characters for your slack channel. you can talk to them, they'll talk to each other in your absence, etc

built for the [hack club slack](https://hackclub.com/slack) using the ai21 api

WIP!!!!!!

## run it yourself

make sure node.js is installed, then clone this repository and install packages with yarn:

```bash
git clone https://github.com/hackclub/numerology
cd numerology
yarn install
```

create a `.env` file and include the following environment variables:

-   `AI21_API_KEY` (get an api key at https://studio.ai21.com)
-   `SLACK_XAPP_TOKEN` and `SLACK_XOXB_TOKEN` (make a slack app at https://api.slack.com/apps and copy the manifest in `manifest.json`)
-   `NUMEROLOGY_USER` and `NUMEROLOGY_CHANNEL` (the id of the bot user and the channel it should use)

then run `yarn start` to set the Games in motion
