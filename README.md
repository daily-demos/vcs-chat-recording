# Daily chat + reaction recording with VCS

This demo shows developers how they can embed chat and emoji reaction components into their recording of a Daily-powered video call.

## In-call view
![In-call view featuring chat and reactions](screenshot-app.png)

## Recording view
![Recording view featuring chat and reactions](screenshot-recording.png)


## Running the demo locally

You'll need a [free Daily account](https://dashboard.daily.co/u/signup) and [a Daily room](https://dashboard.daily.co/rooms/create) with cloud recording enabled on creation:

![Option to enable cloud recording in the Daily room configuration](recording-enabled.png)


Then, run the following commands in your terminal:

```bash
git clone git@github.com:daily-demos/vcs-chat-recording.git
cd vcs-chat-recording
npm i
npm run dev
```

Finally, navigate to the port shown in your terminal output. This will likely be `http://localhost:8080`

Paste the URL of your Daily room into the join form, enter a nickname, and click "Join".