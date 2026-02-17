Make a browser game called "story wars". It should:

- Allow players to start a game
- Other players can join the private room via a link with a code built in to the link that the room creator gets put into their clipboard as soon as they create a room
- Allow any number of players to join that room.
  - Players need a name and an avatar (allow them to pick their avatar, give a "create random" button which creates a random avatar")

The game then is as follows:

- The leader picks how many topics. Topics are simple short prompts like "heat" or "date night", that players are supposed to write their stories around. The game provides a list of static topics (lets say 50 for now) for the leader to pick from.
- The leader picks how many stories per prompt. This will determine how many stories per prompt are used throughout the game
- Each player will then enter a short story (up to 300 characters) around each of the prompts

Then the game "officially" starts:

- The game picks a random topic from the list that was given by the leader at the start
- It then picks and reads aloud one of the answers.
- Players are supposed to guess who the story belongs to by having a conversation amongst themselves
- Each player should see the story and a list of the names of the other players, so they can cast their vote
- If the player guesses the owner of the story, they get 2 points.

After n topics, and x answers in each topic (each chosen at the start of the game), the game should provide a list of the rankings.

Technical stuff:

- This is a PWA that can be installed on a phone
- Use react, react-router, typescript, mobx, vite, emotion styled components
- Use websockets for quick communication between players
- Make it self-hosted (run on host device) as much as possible

Ask me questions to clarify the product requirements, technical requirements, engineering principles, and hard constraints.
