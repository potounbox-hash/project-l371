import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    update,
    onValue,
    onDisconnect
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* =====================================================
   FIREBASE
===================================================== */

const firebaseConfig = {

    apiKey:
        "AIzaSyAlUN410WMaCLZU7cjqLDBgZz1DpA2p9po",

    authDomain:
        "project-l371.firebaseapp.com",

    databaseURL:
        "https://project-l371-default-rtdb.europe-west1.firebasedatabase.app",

    projectId:
        "project-l371",

    storageBucket:
        "project-l371.firebasestorage.app",

    messagingSenderId:
        "744918953455",

    appId:
        "1:744918953455:web:8109247ada892ff5fe1a1a"

};


const firebaseApp =
    initializeApp(firebaseConfig);

const database =
    getDatabase(firebaseApp);


/* =====================================================
   ELEMENTS
===================================================== */

const connectionScreen =
    document.getElementById(
        "connectionScreen"
    );

const mainMenu =
    document.getElementById(
        "mainMenu"
    );

const gameScreen =
    document.getElementById(
        "gameScreen"
    );

const sessionCodeElement =
    document.getElementById(
        "sessionCode"
    );

const connectionText =
    document.getElementById(
        "connectionText"
    );

const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );

const connectionDot =
    document.getElementById(
        "connectionDot"
    );

const canvas =
    document.getElementById(
        "gameCanvas"
    );

const ctx =
    canvas.getContext("2d");

const gameTitle =
    document.getElementById(
        "gameTitle"
    );


/* =====================================================
   MUSIQUE PC
===================================================== */

const pcMusic =
    new Audio("pc.mp3");

pcMusic.loop = true;
pcMusic.volume = 0.35;


/*
   Le navigateur peut bloquer autoplay.

   Cette fonction essaie de lancer la musique.
*/

function startPCMusic() {

    pcMusic
        .play()
        .then(() => {

            document.getElementById(
                "soundNotice"
            ).textContent =
                "🎵 Musique activée";

        })
        .catch(() => {

            document.getElementById(
                "soundNotice"
            ).textContent =
                "🎵 Le navigateur bloque l'audio automatique";

        });

}


/*
   On tente également après une interaction
   locale autorisée par le navigateur.

   Cela ne transforme PAS la souris en manette.
*/

document.addEventListener(
    "keydown",
    () => {

        startPCMusic();

    },
    {
        once: true
    }
);


/* =====================================================
   SESSION
===================================================== */

let sessionCode = null;


/* =====================================================
   ÉTAT MANETTE
===================================================== */

let controller = {

    connected: false,

    up: false,
    down: false,
    left: false,
    right: false,

    A: false,
    B: false,
    X: false,
    Y: false,

    start: false,
    select: false

};


/* =====================================================
   JEUX
===================================================== */

const games = [

    "snake",
    "pong",
    "dodge"

];


const gameNames = {

    snake:
        "🐍 Snake",

    pong:
        "🏓 Pong",

    dodge:
        "🟦 Pixel Dodge"

};


let selectedGameIndex = 0;

let currentGame = null;

let gameRunning = false;


/* =====================================================
   COMMANDES
===================================================== */

let lastCommandTimestamp = 0;


/* =====================================================
   CRÉER CODE
===================================================== */

function generateCode() {

    return Math.floor(
        100000 +
        Math.random() * 900000
    ).toString();

}


/* =====================================================
   CRÉER SESSION
===================================================== */

async function createSession() {

    sessionCode =
        generateCode();


    const sessionRef =
        ref(
            database,
            "sessions/" +
            sessionCode
        );


    await set(
        sessionRef,
        {

            createdAt:
                Date.now(),

            selectedGame:
                "snake",

            state:
                "menu",

            command:
                null,

            pc: {

                connected:
                    true

            },

            controller: {

                connected:
                    false,

                up:
                    false,

                down:
                    false,

                left:
                    false,

                right:
                    false,

                A:
                    false,

                B:
                    false,

                X:
                    false,

                Y:
                    false,

                start:
                    false,

                select:
                    false

            }

        }
    );


    sessionCodeElement.textContent =
        sessionCode;


    onDisconnect(
        sessionRef
    ).remove();


    listenController();

    listenCommands();

}


/* =====================================================
   SYNCHRONISER MENU
===================================================== */

function syncMenu() {

    games.forEach(
        game => {

            const element =
                document.getElementById(
                    "game-" +
                    game
                );

            if (!element)
                return;


            element.classList.remove(
                "selected"
            );

        }
    );


    const selected =
        document.getElementById(
            "game-" +
            games[selectedGameIndex]
        );


    if (selected) {

        selected.classList.add(
            "selected"
        );

    }


    const selectedGame =
        games[selectedGameIndex];


    update(
        ref(
            database,
            "sessions/" +
            sessionCode
        ),
        {

            selectedGame:
                selectedGame

        }
    );

}


/* =====================================================
   CHOISIR JEU
===================================================== */

function changeGame(direction) {

    if (gameRunning)
        return;


    selectedGameIndex +=
        direction;


    if (
        selectedGameIndex < 0
    ) {

        selectedGameIndex =
            games.length - 1;

    }


    if (
        selectedGameIndex >=
        games.length
    ) {

        selectedGameIndex =
            0;

    }


    syncMenu();

}


/* =====================================================
   AFFICHAGE MENU
===================================================== */

function showMenu() {

    gameRunning = false;

    currentGame = null;


    gameScreen.style.display =
        "none";

    mainMenu.style.display =
        "flex";

}


/* =====================================================
   AFFICHAGE JEU
===================================================== */

function showGame() {

    connectionScreen.style.display =
        "none";

    mainMenu.style.display =
        "none";

    gameScreen.style.display =
        "flex";

}


/* =====================================================
   LANCER JEU
===================================================== */

function launchGame() {

    if (gameRunning)
        return;


    gameRunning = true;


    currentGame =
        games[selectedGameIndex];


    gameTitle.textContent =
        gameNames[currentGame];


    showGame();


    if (currentGame === "snake") {

        startSnake();

    }

    else if (
        currentGame === "pong"
    ) {

        startPong();

    }

    else if (
        currentGame === "dodge"
    ) {

        startDodge();

    }

}


/* =====================================================
   RETOUR MENU
===================================================== */

async function returnToMenu() {

    if (!sessionCode)
        return;


    gameRunning = false;

    currentGame = null;


    showMenu();


    await update(
        ref(
            database,
            "sessions/" +
            sessionCode
        ),
        {

            state:
                "menu",

            command:
                null

        }
    );


    syncMenu();

}


/* =====================================================
   COMMANDES FIREBASE
===================================================== */

function listenCommands() {

    const commandRef =
        ref(
            database,
            "sessions/" +
            sessionCode +
            "/command"
        );


    onValue(
        commandRef,
        snapshot => {

            const command =
                snapshot.val();


            if (!command)
                return;


            /*
               Très important :

               On utilise le timestamp
               comme identifiant de commande.

               Une même commande ne peut
               donc pas être exécutée
               plusieurs fois.
            */

            if (
                command.timestamp ===
                lastCommandTimestamp
            ) {

                return;

            }


            lastCommandTimestamp =
                command.timestamp;


            if (
                command.type ===
                "selectNext"
            ) {

                changeGame(1);

            }


            else if (
                command.type ===
                "selectPrevious"
            ) {

                changeGame(-1);

            }


            else if (
                command.type ===
                "launch"
            ) {

                if (!gameRunning) {

                    launchGame();

                }

            }


            else if (
                command.type ===
                "back"
            ) {

                if (gameRunning) {

                    returnToMenu();

                }

            }


            else if (
                command.type ===
                "close"
            ) {

                showConnectionScreen();

            }

        }
    );

}


/* =====================================================
   MANETTE
===================================================== */

function listenController() {

    const controllerRef =
        ref(
            database,
            "sessions/" +
            sessionCode +
            "/controller"
        );


    onValue(
        controllerRef,
        snapshot => {

            const data =
                snapshot.val();


            if (!data)
                return;


            controller =
                data;


            if (
                controller.connected
            ) {

                connectionStatus.textContent =
                    "Téléphone connecté";

                connectionDot.classList.add(
                    "connected"
                );

                connectionText.textContent =
                    "🎮 GamePad connecté";

                /*
                   On ne lance PAS automatiquement
                   le jeu ici.
                */

                if (
                    connectionScreen.style.display !==
                    "none"
                ) {

                    connectionScreen.style.display =
                        "none";

                    mainMenu.style.display =
                        "flex";

                    syncMenu();

                }

            }

        }
    );

}


/* =====================================================
   ÉCRAN CONNEXION
===================================================== */

function showConnectionScreen() {

    connectionScreen.style.display =
        "flex";

    mainMenu.style.display =
        "none";

    gameScreen.style.display =
        "none";

    gameRunning = false;

}


/* =====================================================
   SNAKE
===================================================== */

let snake = [];
let snakeDirection = { x: 1, y: 0 };
let snakeFood = { x: 10, y: 10 };
let snakeTimer = 0;


function startSnake() {

    snake = [

        { x: 10, y: 7 },
        { x: 9, y: 7 },
        { x: 8, y: 7 }

    ];


    snakeDirection =
        {
            x: 1,
            y: 0
        };


    snakeFood =
        {

            x:
                Math.floor(
                    Math.random() * 25
                ),

            y:
                Math.floor(
                    Math.random() * 14
                )

        };


    snakeTimer = 0;

}


function updateSnake() {

    if (!gameRunning)
        return;


    if (controller.up &&
        snakeDirection.y !== 1) {

        snakeDirection =
            {
                x: 0,
                y: -1
            };

    }

    if (controller.down &&
        snakeDirection.y !== -1) {

        snakeDirection =
            {
                x: 0,
                y: 1
            };

    }

    if (controller.left &&
        snakeDirection.x !== 1) {

        snakeDirection =
            {
                x: -1,
                y: 0
            };

    }

    if (controller.right &&
        snakeDirection.x !== -1) {

        snakeDirection =
            {
                x: 1,
                y: 0
            };

    }


    snakeTimer++;

    if (
        snakeTimer <
        8
    )
        return;


    snakeTimer = 0;


    const head = {

        x:
            snake[0].x +
            snakeDirection.x,

        y:
            snake[0].y +
            snakeDirection.y

    };


    if (
        head.x < 0 ||
        head.x >= 25 ||
        head.y < 0 ||
        head.y >= 14
    ) {

        startSnake();

        return;

    }


    for (
        const part of snake
    ) {

        if (
            part.x === head.x &&
            part.y === head.y
        ) {

            startSnake();

            return;

        }

    }


    snake.unshift(
        head
    );


    if (
        head.x === snakeFood.x &&
        head.y === snakeFood.y
    ) {

        snakeFood = {

            x:
                Math.floor(
                    Math.random() * 25
                ),

            y:
                Math.floor(
                    Math.random() * 14
                )

        };

    }

    else {

        snake.pop();

    }

}


function drawSnake() {

    ctx.fillStyle =
        "#0b1220";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    const cellW =
        canvas.width / 25;

    const cellH =
        canvas.height / 14;


    ctx.fillStyle =
        "#ff4d6d";

    ctx.fillRect(

        snakeFood.x *
        cellW,

        snakeFood.y *
        cellH,

        cellW - 2,
        cellH - 2

    );


    ctx.fillStyle =
        "#4dff88";


    for (
        const part of snake
    ) {

        ctx.fillRect(

            part.x *
            cellW,

            part.y *
            cellH,

            cellW - 2,
            cellH - 2

        );

    }

}


/* =====================================================
   PONG
===================================================== */

let pongBall = {

    x: 500,
    y: 280,
    vx: 5,
    vy: 3

};

let pongPlayer = 250;
let pongCPU = 250;


function startPong() {

    pongBall = {

        x: 500,
        y: 280,
        vx: 5,
        vy: 3

    };

    pongPlayer = 250;
    pongCPU = 250;

}


function updatePong() {

    pongPlayer -=
        controller.up
            ? 7
            : 0;

    pongPlayer +=
        controller.down
            ? 7
            : 0;


    pongPlayer =
        Math.max(
            0,
            Math.min(
                canvas.height - 100,
                pongPlayer
            )
        );


    pongCPU +=
        pongBall.y >
        pongCPU + 50
            ? 4
            : -4;


    pongBall.x +=
        pongBall.vx;

    pongBall.y +=
        pongBall.vy;


    if (
        pongBall.y < 0 ||
        pongBall.y >
        canvas.height
    ) {

        pongBall.vy *= -1;

    }


    if (
        pongBall.x < 45 &&
        pongBall.y >
        pongPlayer &&
        pongBall.y <
        pongPlayer + 100
    ) {

        pongBall.vx =
            Math.abs(
                pongBall.vx
            );

    }


    if (
        pongBall.x >
        canvas.width - 45 &&
        pongBall.y >
        pongCPU &&
        pongBall.y <
        pongCPU + 100
    ) {

        pongBall.vx =
            -Math.abs(
                pongBall.vx
            );

    }


    if (
        pongBall.x < -30 ||
        pongBall.x >
        canvas.width + 30
    ) {

        startPong();

    }

}


function drawPong() {

    ctx.fillStyle =
        "#101722";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.fillStyle =
        "white";


    ctx.fillRect(
        20,
        pongPlayer,
        18,
        100
    );


    ctx.fillRect(
        canvas.width - 38,
        pongCPU,
        18,
        100
    );


    ctx.beginPath();

    ctx.arc(
        pongBall.x,
        pongBall.y,
        12,
        0,
        Math.PI * 2
    );

    ctx.fill();

}


/* =====================================================
   PIXEL DODGE
===================================================== */

let dodgePlayer = {

    x: 500,
    y: 450

};

let dodgeBlocks = [];


function startDodge() {

    dodgePlayer = {

        x: 500,
        y: 450

    };


    dodgeBlocks = [];

}


function updateDodge() {

    if (controller.left)
        dodgePlayer.x -= 7;

    if (controller.right)
        dodgePlayer.x += 7;


    dodgePlayer.x =
        Math.max(
            25,
            Math.min(
                canvas.width - 25,
                dodgePlayer.x
            )
        );


    if (
        Math.random() <
        0.035
    ) {

        dodgeBlocks.push({

            x:
                Math.random() *
                (canvas.width - 40),

            y:
                -40,

            speed:
                3 +
                Math.random() * 4

        });

    }


    for (
        const block of dodgeBlocks
    ) {

        block.y +=
            block.speed;


        if (
            Math.abs(
                block.x + 20 -
                dodgePlayer.x
            ) < 40 &&
            Math.abs(
                block.y + 20 -
                dodgePlayer.y
            ) < 40
        ) {

            startDodge();

            return;

        }

    }


    dodgeBlocks =
        dodgeBlocks.filter(
            block =>
                block.y <
                canvas.height + 50
        );

}


function drawDodge() {

    ctx.fillStyle =
        "#101722";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.fillStyle =
        "#4d9cff";

    ctx.fillRect(

        dodgePlayer.x - 25,
        dodgePlayer.y - 25,
        50,
        50

    );


    ctx.fillStyle =
        "#ff4d4d";


    for (
        const block of dodgeBlocks
    ) {

        ctx.fillRect(

            block.x,
            block.y,
            40,
            40

        );

    }

}


/* =====================================================
   BOUCLE
===================================================== */

function gameLoop() {

    if (gameRunning) {

        if (
            currentGame ===
            "snake"
        ) {

            updateSnake();
            drawSnake();

        }

        else if (
            currentGame ===
            "pong"
        ) {

            updatePong();
            drawPong();

        }

        else if (
            currentGame ===
            "dodge"
        ) {

            updateDodge();
            drawDodge();

        }

    }


    requestAnimationFrame(
        gameLoop
    );

}


/* =====================================================
   DÉMARRAGE
===================================================== */

async function start() {

    try {

        await createSession();

        connectionStatus.textContent =
            "En attente du téléphone";

        gameLoop();

    }
    catch (error) {

        console.error(error);

        connectionText.textContent =
            "Erreur Firebase : " +
            error.message;

    }

}


start();
