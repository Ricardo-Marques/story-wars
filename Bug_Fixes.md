# Prompt:

Fix the following bugs:

- List of bugs

Ask questions if you need to on how to achieve any of these requests.

# Round 1

1- When a player creates a room, it's not copying the link to their clipboard. Do that. Also give them buttons to share via instagram/messenger
2- When a player joins a room with a link with a code in the url, it should not give them an option to create a room. It should say they are going to enter <player name's> room and ask them for a name and avatar. That's it.
3- There was no text to speech. The question was not read off at all. I want a typewriter effect where the text follows the speech.

# Round 2

1- Text to speech still isn't reading off the answer when asking players to vote. Please have it read it off.
2- The instagram and messenger buttons aren't working. On desktop just give them a button to copy the link, on mobile you can give the built in share option

# Round 3

1- In the reconnect screen, there is a "new game" button that does not work. I don't think we need it, remove it.
2- Refreshing is currently broken. Any player, including the leader, should be able to reload and continue from where they left off.

# Round 4

1- In the topics selection screen, the vote timer and stories per topic sliders are different sizes. Fix that.
2- The vote timer slider is glitchy because the time to the right changes widths. Fix that.
3- When 2 players have the same score, they should have the same position. If there's a tie, the game should call that out, and not choose an arbitrary winner.
4- Refreshing is broken. When I refresh in the lobby or while during voting phase, the UI is missing elements. Fix that.

# Round 5

1- Rejoin on refresh is broken from a non leader perspective. It gets stuck on "Reconnecting". Fix it.
2- The user selects 1 story per topic, but the game still presents everybody's story. It should select the story randomly, with the max number of stories per topic matching the number of players.

# Round 6

1- The button that says "neeed at least 2 players" should say that we need 3 players.
2- The non leader still doesn't have a "share link option", and they should, but currently they only have "copy link"

# Round 7

1- Sometimes when the leader refreshes they completely lose their game state. Fix that.

# Round 8

1- As leader, If I hit "play again" at the end of a game, then reload during topic selection, I go back to the home screen with no option to rejoin. Fix that.

# Round 9

1- If the leader refreshes during topic selection, non leaders will be stuck on that screen even after the leader hits next and starts the game. Fix that.

# Round 10

1- I have 3 different browsers open while I'm testing this. when the leader disconnects, only 1 other browser gets the disconnected overlay, and the other doesn't. Fix that.
2- If the leader refreshes and doesn't rejoin, and a non leader refreshes and rejoins before the leader, they get stuck in "Reconnecting". Fix that.
3- If a player disconnects during answer phase without answering everything, the game started anyway. It shouldn't have. Also, the timer isn't pausing while someone is disconnected and it should.

# Round 11

1- The timer should start from the right place when a user re-joins mid story after being disconnected. Currently it starts counting down from the max timer.
2- The app still behaves weirdly when someone disconnects while collecting stories. The game continue saying that it's waiting for that user which disconnected, and when they reconnect they should continue proving stories for topics they haven't provided stories for yet.

# Round 12

1- With the new hash router, if I try to go to a new game while someone is disconnected in my current game, I am stuck on that disconnect page. Allow entering in a new link to always send me to the new room.
2- In one instance, I saw the countdown never start after a story was read. Fix that.

# Round 13

1- With the latest set of changes, when a non leader joins a room, they are kicked to the home screen and then have to hit rejoin. They should instead go into the waiting room as they did before.

# Round 14

1- When the leader disconnects, everyone is kicked out now. I want it to kick players to the homescreen only if the leader actually presses "leave game", not if they are disconnected.

# Round 15

1- We're still getting stuck on Listen carefully and the countdown does not start. Fix it.

# Round 16

1- When the host has TTS off, it gets stuck on Listen carefully and doesn't count down or provide voting options.
