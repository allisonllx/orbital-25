# NUSeek

## Overview

NUSeek aims to be a community-driven platform that connects NUS students who need help with others who are willing to assist. Our app consists of the following features:
- Post a request for assistance in a relevant category
- Browse and search existing help requests to find ones that match your skills and offer assistance
- Initiate one-on-one real-time conversations with peers for easy and direct communication
- Comment under help requests to ask questions and gain clarification 
- Edit your user profile

For more details on our project, click on the following [link](https://docs.google.com/document/d/12BeeBjIBJq3f33igGvPg8Oom3S9jXbHCDpM-ghdKk04/edit?usp=sharing).

## Getting Started

1. Clone the Repository

```
git clone https://github.com/allisonllx/orbital-25.git
cd orbital-25
```

2. Switch to the Feature Branch (Optional)

```
git checkout feature/hty
```

3. Create a .env File at the Root Path 


Add the following env variables: 
- `DB_URL` (retrieved after creating a database on Supabase)  
- `EXPRESS_HOST_URL` (hosted URL on Render, otherwise default is localhost:3000)
- `JWT_SECRET` (string generated at random, at least 32 characters long)
- `OPENAI_API_KEY` (generated from OpenAI)
- `RESEND_API_KEY` (generated from Resend)

4. Start the Redis Server

```
cd backend
npm install
redis-server 
```

5. Open a New Terminal and Start the Backend Server

```
node app.js
```

6. Open a New Terminal and Start the Mobile App

```
cd mobile
npm install
npx expo start --tunnel
```

7. Run the App

Follow the on-screen prompts to open the app in an emulator or on your device.
⚠️ Note: Web support is not configured.

## Future Extensions
- [ ] Earn points and compete on the leaderboard to encourage active participation
- [ ] Receive task recommendations based on your interests and prior interactions with tasks