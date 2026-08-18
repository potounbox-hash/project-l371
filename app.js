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
    initializeApp(
        firebaseConfig
    );

const database =
    getDatabase(
        firebaseApp
    );


/* =====================================================
   HTML
===================================================== */

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

const gameCanvas =
    document.getElementById(
        "gameCanvas"
    );

const gameTitle =
    document.getElementById(
        "gameTitle"
    );

const soundButton =
    document.getElementById(
        "soundButton"
    );


const ctx =
    gameCanvas.getContext(
        "2d"
    );


/* =====================================================
   MUSIQUE PC
===================================================== */

const pcMusic =
    new Audio(
        "pc.mp3"
    );

pcMusic.loop =
    true;

pcMusic.volume =
    0.35;

let audioEnabled =
    false;


/*
 * Les navigateurs bloquent parfois
 * l'autoplay.
 *
 * Le bouton ne lance aucun jeu :
 * il ne sert qu'au son.
 */

async function enablePCMusic() {

    audioEnabled =
        true;

    try {

        await pcMusic.play();

        soundButton.textContent =
            "🔊 Son activé";

        soundButton.classList.add(
            "enabled"
        );

    }
    catch (error) {

        console.warn(
            "Audio bloqué par le navigateur."
        );

    }

}


soundButton.addEventListener(
    "click",
    enablePCMusic
);


/* =====================================================
   JEUX
===================================================== */

const games = [

    {
        id:
            "snake",

        name:
            "Snake",

        icon:
            "🐍",

        description:
            "Faites grandir votre serpent."

    },

    {
        id:
            "pong",

        name:
            "Pong",

        icon:
            "🏓",

        description:
            "Affrontez l'ordinateur."

    },

    {
        id:
            "dodge",

        name:
            "Pixel Dodge",

        icon:
            "🟦",

        description:
            "Évitez les obstacles."

    }

];


/* =====================================================
   ÉTAT LOCAL
===================================================== */

let sessionCode =
    null;


let currentState = {

    screen:
        "connection",

    selectedGame:
        "snake",

    running:
        false,

    music:
        "menu"

};


let controller = {

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

};


let previousController = {

    A: false,
    B: false,
    left: false,
    right: false,
    start: false,
    select: false

};


/* =====================================================
   CODE SESSION
===================================================== */

function generateSessionCode() {

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
        generateSessionCode();


    const sessionRef =
        ref(
            database,
            "sessions/" +
            sessionCode
        );


    const initialData = {

        createdAt:
            Date.now(),

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

        },

        state: {

            screen:
                "connection",

            selectedGame:
                "snake",

            running:
                false,

            music:
                "menu"

        }

    };


    await set(
        sessionRef,
        initialData
    );


    await onDisconnect(
        sessionRef
    ).remove();


    sessionCodeElement.textContent =
        sessionCode;


    connectionText.textContent =
        "En attente du téléphone...";


    connectionStatus.textContent =
        "En attente";


    listenController();

    listenState();


    console.log(
        "Session créée :",
        sessionCode
    );

}


/* =====================================================
   ÉCOUTER MANETTE
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


            if (!data) {

                return;

            }


            controller = {

                connected:
                    data.connected === true,

                up:
                    data.up === true,

                down:
                    data.down === true,

                left:
                    data.left === true,

                right:
                    data.right === true,

                A:
                    data.A === true,

                B:
                    data.B === true,

                X:
                    data.X === true,

                Y:
                    data.Y === true,

                start:
                    data.start === true,

                select:
                    data.select === true

            };


            updateConnection();


            processButtons();

        }
    );

}


/* =====================================================
   ÉCOUTER ÉTAT GLOBAL
===================================================== */

function listenState() {

    const stateRef =
        ref(
            database,
            "sessions/" +
            sessionCode +
            "/state"
        );


    onValue(
        stateRef,
        snapshot => {

            const data =
                snapshot.val();


            if (!data) {

                return;

            }


            currentState = {

                screen:
                    data.screen ||
                    "connection",

                selectedGame:
                    data.selectedGame ||
                    "snake",

                running:
                    data.running === true,

                music:
                    data.music ||
                    "menu"

            };


            /*
             * IMPORTANT :
             *
             * Toute modification venant
             * du téléphone arrive ici.
             */

            updatePCInterface();

            updateMusic();

        }
    );

}


/* =====================================================
   CONNEXION
===================================================== */

function updateConnection() {

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

    }
    else {

        connectionStatus.textContent =
            "En attente";

        connectionDot.classList.remove(
            "connected"
        );

        connectionText.textContent =
            "En attente du téléphone...";

    }

}


/* =====================================================
   TROUVER JEU
===================================================== */

function getGameIndex(id) {

    const index =
        games.findIndex(
            game =>
                game.id === id
        );


    if (index < 0) {

        return 0;

    }


    return index;

}


/* =====================================================
   INTERFACE PC
===================================================== */

function updatePCInterface() {

    const index =
        getGameIndex(
            currentState.selectedGame
        );


    /*
     * Sélection visuelle
     */

    document
        .querySelectorAll(
            ".gameCard"
        )
        .forEach(
            (card, cardIndex) => {

                card.classList.toggle(
                    "selected",
                    cardIndex === index
                );

            }
        );


    /*
     * Écran
     */

    if (
        currentState.screen ===
        "menu"
    ) {

        connectionScreen.style.display =
            "none";

        gameScreen.style.display =
            "none";

        mainMenu.style.display =
            "flex";

    }


    if (
        currentState.screen ===
        "game"
    ) {

        connectionScreen.style.display =
            "none";

        mainMenu.style.display =
            "none";

        gameScreen.style.display =
            "flex";


        const game =
            games[index];


        gameTitle.textContent =
            game.icon +
            " " +
            game.name;

    }


    if (
        currentState.screen ===
        "connection"
    ) {

        connectionScreen.style.display =
            "flex";

        mainMenu.style.display =
            "none";

        gameScreen.style.display =
            "none";

    }

}


/* =====================================================
   MUSIQUE SYNCHRONISÉE
===================================================== */

function updateMusic() {

    if (!audioEnabled) {

        return;

    }


    /*
     * Pour l'instant :
     *
     * menu = pc.mp3
     * game = pc.mp3
     *
     * Tu peux ensuite mettre
     * une musique différente
     * pour chaque jeu.
     */

    if (
        currentState.music ===
        "menu"
    ) {

        if (
            pcMusic.paused
        ) {

            pcMusic.play()
                .catch(
                    () => {}
                );

        }

    }


    if (
        currentState.music ===
        "game"
    ) {

        if (
            pcMusic.paused
        ) {

            pcMusic.play()
                .catch(
                    () => {}
                );

        }

    }

}


/* =====================================================
   ÉCRIRE ÉTAT
===================================================== */

async function setState(
    changes
) {

    if (!sessionCode) {

        return;

    }


    await update(

        ref(
            database,
            "sessions/" +
            sessionCode +
            "/state"
        ),

        changes

    );

}


/* =====================================================
   CHANGER JEU
===================================================== */

async function selectGame(
    direction
) {

    const currentIndex =
        getGameIndex(
            currentState.selectedGame
        );


    let newIndex =
        currentIndex +
        direction;


    if (
        newIndex < 0
    ) {

        newIndex =
            games.length - 1;

    }


    if (
        newIndex >=
        games.length
    ) {

        newIndex = 0;

    }


    const newGame =
        games[newIndex];


    /*
     * UNE SEULE source de vérité :
     */

    await setState({

        selectedGame:
            newGame.id,

        screen:
            "menu",

        running:
            false,

        music:
            "menu"

    });

}


/* =====================================================
   LANCER JEU
===================================================== */

async function launchGame() {

    const game =
        games[
            getGameIndex(
                currentState.selectedGame
            )
        ];


    await setState({

        screen:
            "game",

        selectedGame:
            game.id,

        running:
            true,

        music:
            "game"

    });

}


/* =====================================================
   RETOUR MENU
===================================================== */

async function backToMenu() {

    await setState({

        screen:
            "menu",

        running:
            false,

        music:
            "menu"

    });

}


/* =====================================================
   BOUTONS
===================================================== */

function processButtons() {


    /*
     * ←
     */

    if (
        controller.left &&
        !previousController.left
    ) {

        if (
            currentState.screen ===
            "menu"
        ) {

            selectGame(-1);

        }

    }


    /*
     * →
     */

    if (
        controller.right &&
        !previousController.right
    ) {

        if (
            currentState.screen ===
            "menu"
        ) {

            selectGame(1);

        }

    }


    /*
     * A
     */

    if (
        controller.A &&
        !previousController.A
    ) {

        if (
            currentState.screen ===
            "menu"
        ) {

            launchGame();

        }

    }


    /*
     * START
     */

    if (
        controller.start &&
        !previousController.start
    ) {

        if (
            currentState.screen ===
            "menu"
        ) {

            launchGame();

        }

    }


    /*
     * B
     */

    if (
        controller.B &&
        !previousController.B
    ) {

        if (
            currentState.screen ===
            "game"
        ) {

            backToMenu();

        }

    }


    /*
     * SELECT
     */

    if (
        controller.select &&
        !previousController.select
    ) {

        if (
            currentState.screen ===
            "game"
        ) {

            backToMenu();

        }

    }


    previousController = {

        A:
            controller.A,

        B:
            controller.B,

        left:
            controller.left,

        right:
            controller.right,

        start:
            controller.start,

        select:
            controller.select

    };

}


/* =====================================================
   JEU : SNAKE
===================================================== */

let snake = [];
let snakeDirection = {
    x: 1,
    y: 0
};

let snakeFood = {
    x: 10,
    y: 10
};


function resetSnake() {

    snake = [

        {
            x: 10,
            y: 7
        },

        {
            x: 9,
            y: 7
        },

        {
            x: 8,
            y: 7
        }

    ];

    snakeDirection = {
        x: 1,
        y: 0
    };

    snakeFood = {

        x:
            Math.floor(
                Math.random() *
                25
            ),

        y:
            Math.floor(
                Math.random() *
                14
            )

    };

}


function drawSnake() {

    ctx.fillStyle =
        "#0b1220";

    ctx.fillRect(
        0,
        0,
        gameCanvas.width,
        gameCanvas.height
    );


    const cellW =
        gameCanvas.width / 25;

    const cellH =
        gameCanvas.height / 14;


    ctx.fillStyle =
        "#ef4444";

    ctx.fillRect(

        snakeFood.x *
            cellW,

        snakeFood.y *
            cellH,

        cellW - 2,
        cellH - 2

    );


    snake.forEach(
        (part, index) => {

            ctx.fillStyle =
                index === 0
                    ? "#4ade80"
                    : "#22c55e";


            ctx.fillRect(

                part.x *
                    cellW,

                part.y *
                    cellH,

                cellW - 2,
                cellH - 2

            );

        }
    );

}


let snakeTimer =
    0;


function updateSnake() {

    /*
     * Contrôles
     */

    if (
        controller.up &&
        snakeDirection.y === 0
    ) {

        snakeDirection = {
            x: 0,
            y: -1
        };

    }

    if (
        controller.down &&
        snakeDirection.y === 0
    ) {

        snakeDirection = {
            x: 0,
            y: 1
        };

    }

    if (
        controller.left &&
        snakeDirection.x === 0
    ) {

        snakeDirection = {
            x: -1,
            y: 0
        };

    }

    if (
        controller.right &&
        snakeDirection.x === 0
    ) {

        snakeDirection = {
            x: 1,
            y: 0
        };

    }


    snakeTimer++;


    if (
        snakeTimer < 8
    ) {

        return;

    }


    snakeTimer = 0;


    const head = {

        x:
            snake[0].x +
            snakeDirection.x,

        y:
            snake[0].y +
            snakeDirection.y

    };


    /*
     * Murs
     */

    if (
        head.x < 0 ||
        head.x >= 25 ||
        head.y < 0 ||
        head.y >= 14
    ) {

        resetSnake();

        return;

    }


    /*
     * Corps
     */

    for (
        const part of snake
    ) {

        if (
            part.x === head.x &&
            part.y === head.y
        ) {

            resetSnake();

            return;

        }

    }


    snake.unshift(
        head
    );


    if (
        head.x ===
            snakeFood.x &&
        head.y ===
            snakeFood.y
    ) {

        snakeFood = {

            x:
                Math.floor(
                    Math.random() *
                    25
                ),

            y:
                Math.floor(
                    Math.random() *
                    14
                )

        };

    }
    else {

        snake.pop();

    }

}


/* =====================================================
   DESSIN PONG
===================================================== */

let pongBall = {

    x: 500,
    y: 280,

    vx: 5,
    vy: 3

};


function drawPong() {

    ctx.fillStyle =
        "#050505";

    ctx.fillRect(
        0,
        0,
        gameCanvas.width,
        gameCanvas.height
    );


    ctx.strokeStyle =
        "#333";

    ctx.setLineDash(
        [10, 10]
    );

    ctx.beginPath();

    ctx.moveTo(
        500,
        0
    );

    ctx.lineTo(
        500,
        562
    );

    ctx.stroke();

    ctx.setLineDash([]);


    ctx.fillStyle =
        "white";


    /*
     * Joueur
     */

    const playerY =
        250 +
        (
            controller.up
                ? -120
                : controller.down
                    ? 120
                    : 0
        );


    ctx.fillRect(
        30,
        playerY,
        15,
        100
    );


    /*
     * Adversaire
     */

    ctx.fillRect(
        955,
        pongBall.y - 50,
        15,
        100
    );


    /*
     * Balle
     */

    ctx.beginPath();

    ctx.arc(
        pongBall.x,
        pongBall.y,
        10,
        0,
        Math.PI * 2
    );

    ctx.fill();


    pongBall.x +=
        pongBall.vx;

    pongBall.y +=
        pongBall.vy;


    if (
        pongBall.y < 0 ||
        pongBall.y > 562
    ) {

        pongBall.vy *= -1;

    }


    if (
        pongBall.x < 0 ||
        pongBall.x > 1000
    ) {

        pongBall = {

            x: 500,
            y: 280,

            vx:
                pongBall.x < 0
                    ? 5
                    : -5,

            vy: 3

        };

    }

}


/* =====================================================
   DODGE
===================================================== */

let dodgeX =
    500;

let dodgeObstacle =
    0;


function drawDodge() {

    ctx.fillStyle =
        "#111827";

    ctx.fillRect(
        0,
        0,
        1000,
        562
    );


    /*
     * Joueur
     */

    if (
        controller.left
    ) {

        dodgeX -= 7;

    }

    if (
        controller.right
    ) {

        dodgeX += 7;

    }


    dodgeX =
        Math.max(
            30,
            Math.min(
                970,
                dodgeX
            )
        );


    ctx.fillStyle =
        "#60a5fa";

    ctx.fillRect(
        dodgeX - 25,
        500,
        50,
        30
    );


    /*
     * Obstacle
     */

    dodgeObstacle += 5;


    if (
        dodgeObstacle > 590
    ) {

        dodgeObstacle = -30;

    }


    ctx.fillStyle =
        "#f43f5e";

    ctx.fillRect(
        400,
        dodgeObstacle,
        200,
        35
    );

}


/* =====================================================
   DESSIN JEU
===================================================== */

function drawCurrentGame() {

    if (
        currentState.selectedGame ===
        "snake"
    ) {

        updateSnake();

        drawSnake();

    }


    else if (
        currentState.selectedGame ===
        "pong"
    ) {

        drawPong();

    }


    else if (
        currentState.selectedGame ===
        "dodge"
    ) {

        drawDodge();

    }

}


/* =====================================================
   BOUCLE
===================================================== */

function gameLoop() {

    if (
        currentState.running &&
        currentState.screen ===
        "game"
    ) {

        drawCurrentGame();

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

        resetSnake();

        gameLoop();

    }
    catch (error) {

        console.error(
            error
        );

        connectionStatus.textContent =
            "Erreur Firebase";

        connectionText.textContent =
            error.message;

    }

}


start();
