Welcome to Star Defender!

This game is Galaga inspired!

This is a dotnet application which uses javascript for the front-end and c-sharp for the backend

Setting up

This application uses docker to make setting up a breeze!

Prerequisites
Install Docker and Docker Compose
Install .Net SDK to run tests locally

Running Game

1. Clone project
2. Navigate to root directory of the project /starDefender
3. Enter the following command
'docker compose up --build'
4. Access the game on a browser at http:/localhost:8080


Running Tests

In the root directory run the following commands;

To test backend apis
'dotnet test'

To test javascript functions
'npm test'

The first screen you will see is the Log in screen, either log in with an existing account or create a new one

Controls

Movement

Arrows keys
'up' arrow - Move Up
'down' arrow - Move Down
'left' arrow - Move Left
'right' arrow - Move Right

To Shoot
'spacebar' - Shoot

To pause
'p' key - To Pause


Game Mechanics

Enemies spawn in waves, moving from the top of the screen down.

Kill enemies for points, if an enemy makes it past you, you will lose points, if this goes below Zero, you will explode and lose.

You have health, when this reaches Zero, you will explode and lose.

Taking enemy fire or colliding with enemies will take health from you.

Make sure to grab the power ups!

Green -> Health Point
Blue -> Shield, Absorbs all incoming damage
Pink -> Multi shot - Shoot in all directions
Cyan -> Increased fire rate

At round 10, you will face your first boss! Defeat him to win the game!
After you have defeated him, you can either exit to menu or continue in horde mode!

Horde mode
A never ending mode where the rounds get increasingly harder, try for the high score!

After the game is over, your highscore will be displayed with your name!

That's all their is to it, thanks for playing my game!

