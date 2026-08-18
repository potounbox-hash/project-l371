import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    update,
    onValue,
    onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyAlUN410WMaCLZU7cjqLDBgZz1DpA2p9po",
    authDomain: "project-l371.firebaseapp.com",
    databaseURL: "https://project-l371-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "project-l371",
    storageBucket: "project-l371.firebasestorage.app",
    messagingSenderId: "744918953455",
    appId: "1:744918953455:web:8109247ada892ff5fe1a1a"
};

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);


/* =========================================================
   ÉLÉMENTS HTML
========================================================= */

const sessionCodeElement =
    document.getElementById("sessionCode");

const connectionText =
    document.getElementById("connectionText");

const connectionStatus =
    document.getElementById("connectionStatus");

const connectionDot =
    document.getElementById("connectionDot");

const connectionScreen =
    document.getElementById("connectionScreen");

const mainMenu =
    document.getElementById("mainMenu");

const gameScreen =
    document.getElementById("gameScreen");

const gameCanvas =
    document.getElementById("gameCanvas");

const gameTitle =
    document.getElementById("gameTitle");


/* =========================================================
   CANVAS
========================================================= */

const ctx =
    gameCanvas.getContext("2d");


/* =========================================================
   ÉTAT DE LA MANETTE
========================================================= */

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


/* =========================================================
   ÉTAT DU SYSTÈME
========================================================= */

let currentGame = null;

let selectedGame = 0;

let gameRunning = false;


/* =========================================================
   JEUX
========================================================= */

const games = [

    {
        id: "snake",
        name: "Snake",
        icon: "🐍"
    },

    {
        id: "pong",
        name: "Pong",
        icon: "🏓"
    },

    {
        id: "dodge",
        name: "Pixel Dodge",
        icon: "🟦"
    }

];


/* =========================================================
   JOUEUR
========================================================= */

const player = {

    x: 500,
    y: 280,

    size: 45,

    speed: 6

};


/* =========================================================
   GÉNÉRER CODE
========================================================= */

function generateSessionCode() {

    return Math.floor(
        100000 +
        Math.random() * 900000
    ).toString();

}


/* =========================================================
   CRÉER SESSION
========================================================= */

async function createSession() {

    let code = generateSessionCode();

    let sessionReference =
        ref(
            database,
            "sessions/" + code
        );


    console.log(
        "Création de la session :",
        code
    );


    const initialData = {

        createdAt: Date.now(),

        pc: {

            connected: true

        },

        controller: {

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

        },

        game: {

            selected: "snake",

            running: false

        }

    };


    await set(
        sessionReference,
        initialData
    );


    /* Affichage du code */

    sessionCodeElement.textContent =
        code;


    connectionText.textContent =
        "En attente du téléphone...";


    connectionStatus.textContent =
        "En attente";


    /* Suppression automatique */

    onDisconnect(
        sessionReference
    ).remove();


    /* Écouter la manette */

    listenToController(code);


    /* Écouter les changements de jeu */

    listenToGame(code);


    console.log(
        "Session Firebase créée !"
    );

}


/* =========================================================
   ÉCOUTER LA MANETTE
========================================================= */

function listenToController(code) {

    const controllerReference =
        ref(
            database,
            "sessions/" +
            code +
            "/controller"
        );


    onValue(
        controllerReference,
        (snapshot) => {

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


            updateConnectionInterface();

        }
    );

}


/* =========================================================
   CONNEXION
========================================================= */

function updateConnectionInterface() {

    if (controller.connected) {

        connectionStatus.textContent =
            "Téléphone connecté";

        connectionDot.classList.add(
            "connected"
        );

        connectionText.textContent =
            "🎮 Manette connectée !";


        /*
         * IMPORTANT :
         * On affiche maintenant le MENU
         * au lieu de lancer directement le jeu.
         */

        connectionScreen.style.display =
            "none";

        gameScreen.style.display =
            "none";

        mainMenu.style.display =
            "flex";


        updateSelectedGame();


    } else {

        connectionStatus.textContent =
            "En attente";

        connectionDot.classList.remove(
            "connected"
        );

        connectionText.textContent =
            "En attente du téléphone...";

    }

}


/* =========================================================
   ÉCOUTER LE JEU
========================================================= */

function listenToGame(code) {

    const gameReference =
        ref(
            database,
            "sessions/" +
            code +
            "/game"
        );


    onValue(
        gameReference,
        (snapshot) => {

            const data =
                snapshot.val();


            if (!data) {

                return;

            }


            if (data.selected) {

                const index =
                    games.findIndex(
                        game =>
                            game.id ===
                            data.selected
                    );


                if (index !== -1) {

                    selectedGame =
                        index;

                }

            }


            if (data.running === true) {

                startSelectedGame(
                    false
                );

            }

        }
    );

}


/* =========================================================
   CARTES DU MENU
========================================================= */

const gameCards =
    document.querySelectorAll(
        ".gameCard"
    );


function updateSelectedGame() {

    gameCards.forEach(
        (card, index) => {

            card.classList.toggle(
                "selected",
                index === selectedGame
            );

        }
    );

}


/* =========================================================
   CHANGER DE JEU
========================================================= */

async function changeGame(direction) {

    selectedGame +=
        direction;


    if (selectedGame < 0) {

        selectedGame =
            games.length - 1;

    }


    if (
        selectedGame >=
        games.length
    ) {

        selectedGame = 0;

    }


    updateSelectedGame();


    if (!window.currentSessionCode) {

        return;

    }


    const selected =
        games[selectedGame];


    await update(
        ref(
            database,
            "sessions/" +
            window.currentSessionCode +
            "/game"
        ),
        {

            selected:
                selected.id,

            running:
                false

        }
    );

}


/* =========================================================
   LANCER LE JEU
========================================================= */

async function startSelectedGame(
    sendToFirebase = true
) {

    const selected =
        games[selectedGame];


    currentGame =
        selected.id;


    gameRunning = true;


    mainMenu.style.display =
        "none";

    connectionScreen.style.display =
        "none";

    gameScreen.style.display =
        "flex";


    gameTitle.textContent =
        selected.icon +
        " " +
        selected.name;


    player.x =
        gameCanvas.width / 2;

    player.y =
        gameCanvas.height / 2;


    if (
        sendToFirebase &&
        window.currentSessionCode
    ) {

        await update(
            ref(
                database,
                "sessions/" +
                window.currentSessionCode +
                "/game"
            ),
            {

                selected:
                    selected.id,

                running:
                    true

            }
        );

    }

}


/* =========================================================
   RETOUR MENU
========================================================= */

async function returnToMenu() {

    gameRunning = false;

    currentGame = null;


    gameScreen.style.display =
        "none";

    mainMenu.style.display =
        "flex";


    updateSelectedGame();


    if (window.currentSessionCode) {

        await update(
            ref(
                database,
                "sessions/" +
                window.currentSessionCode +
                "/game"
            ),
            {

                running:
                    false

            }
        );

    }

}


/* =========================================================
   COMMANDES MANETTE
========================================================= */

let previousController = {

    A: false,
    B: false,
    left: false,
    right: false,
    start: false,
    select: false

};


function processControllerButtons() {

    /*
     * GAUCHE
     */

    if (
        controller.left &&
        !previousController.left
    ) {

        if (!gameRunning) {

            changeGame(-1);

        }

    }


    /*
     * DROITE
     */

    if (
        controller.right &&
        !previousController.right
    ) {

        if (!gameRunning) {

            changeGame(1);

        }

    }


    /*
     * A
     */

    if (
        controller.A &&
        !previousController.A
    ) {

        if (!gameRunning) {

            startSelectedGame();

        }

    }


    /*
     * B
     */

    if (
        controller.B &&
        !previousController.B
    ) {

        if (gameRunning) {

            returnToMenu();

        }

    }


    /*
     * SELECT
     */

    if (
        controller.select &&
        !previousController.select
    ) {

        if (gameRunning) {

            returnToMenu();

        }

    }


    /*
     * START
     */

    if (
        controller.start &&
        !previousController.start
    ) {

        if (!gameRunning) {

            startSelectedGame();

        }

    }


    previousController = {

        A: controller.A,

        B: controller.B,

        left: controller.left,

        right: controller.right,

        start: controller.start,

        select: controller.select

    };

}


/* =========================================================
   JEU
========================================================= */

function updatePlayer() {

    if (!gameRunning) {

        return;

    }


    if (controller.left) {

        player.x -=
            player.speed;

    }


    if (controller.right) {

        player.x +=
            player.speed;

    }


    if (controller.up) {

        player.y -=
            player.speed;

    }


    if (controller.down) {

        player.y +=
            player.speed;

    }


    const half =
        player.size / 2;


    if (player.x < half) {

        player.x = half;

    }


    if (
        player.x >
        gameCanvas.width - half
    ) {

        player.x =
            gameCanvas.width - half;

    }


    if (player.y < half) {

        player.y = half;

    }


    if (
        player.y >
        gameCanvas.height - half
    ) {

        player.y =
            gameCanvas.height - half;

    }

}


/* =========================================================
   DESSIN
========================================================= */

function drawGame() {

    ctx.fillStyle =
        "#101722";

    ctx.fillRect(
        0,
        0,
        gameCanvas.width,
        gameCanvas.height
    );


    /*
     * Grille
     */

    ctx.strokeStyle =
        "#1b2635";

    ctx.lineWidth = 1;


    for (
        let x = 0;
        x < gameCanvas.width;
        x += 50
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            gameCanvas.height
        );

        ctx.stroke();

    }


    for (
        let y = 0;
        y < gameCanvas.height;
        y += 50
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            gameCanvas.width,
            y
        );

        ctx.stroke();

    }


    /*
     * Titre
     */

    ctx.textAlign =
        "center";

    ctx.fillStyle =
        "white";

    ctx.font =
        "bold 28px Arial";

    ctx.fillText(
        games[selectedGame].name,
        gameCanvas.width / 2,
        45
    );


    /*
     * Joueur
     */

    ctx.fillStyle =
        "#4d9cff";

    ctx.fillRect(

        player.x -
        player.size / 2,

        player.y -
        player.size / 2,

        player.size,
        player.size

    );


    /*
     * Indication
     */

    ctx.font =
        "16px Arial";

    ctx.fillStyle =
        "#888";

    ctx.fillText(
        "Téléphone utilisé comme manette",
        gameCanvas.width / 2,
        gameCanvas.height - 25
    );


    /*
     * A
     */

    if (controller.A) {

        ctx.fillStyle =
            "white";

        ctx.font =
            "bold 20px Arial";

        ctx.fillText(
            "A",
            player.x,
            player.y - 35
        );

    }

}


/* =========================================================
   BOUCLE
========================================================= */

function gameLoop() {

    processControllerButtons();

    updatePlayer();

    drawGame();

    requestAnimationFrame(
        gameLoop
    );

}


/* =========================================================
   CLIC SUR LES JEUX
========================================================= */

gameCards.forEach(
    (card, index) => {

        card.addEventListener(
            "click",
            () => {

                selectedGame =
                    index;

                updateSelectedGame();

                startSelectedGame();

            }
        );

    }
);


/* =========================================================
   DÉMARRAGE
========================================================= */

async function start() {

    try {

        connectionStatus.textContent =
            "Connexion...";


        await createSession();


        connectionStatus.textContent =
            "En attente";


        gameLoop();


    } catch (error) {

        console.error(
            "Erreur Firebase :",
            error
        );


        connectionStatus.textContent =
            "Erreur";


        connectionText.textContent =
            "Erreur Firebase : " +
            error.message;

    }

}


start();
