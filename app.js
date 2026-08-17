import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    onValue,
    onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* =========================================================
   CONFIGURATION FIREBASE
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


/* =========================================================
   INITIALISATION FIREBASE
========================================================= */

const firebaseApp = initializeApp(firebaseConfig);
const database = getDatabase(firebaseApp);


/* =========================================================
   ÉLÉMENTS DE LA PAGE
========================================================= */

const sessionCodeElement =
    document.getElementById("sessionCode");

const connectionMessage =
    document.getElementById("connectionMessage");

const statusText =
    document.getElementById("statusText");

const statusDot =
    document.getElementById("statusDot");

const menu =
    document.getElementById("menu");

const gameScreen =
    document.getElementById("gameScreen");

const gameStatus =
    document.getElementById("gameStatus");

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");


/* =========================================================
   ÉTAT DU TÉLÉPHONE
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
   JOUEUR DU JEU DE TEST
========================================================= */

const player = {

    x: canvas.width / 2,
    y: canvas.height / 2,

    size: 45,

    speed: 6

};


/* =========================================================
   CRÉER UN CODE À 6 CHIFFRES
========================================================= */

function generateSessionCode() {

    return Math.floor(
        100000 +
        Math.random() * 900000
    ).toString();

}


/* =========================================================
   CRÉER UNE SESSION FIREBASE
========================================================= */

async function createSession() {

    const code =
        generateSessionCode();


    const sessionReference =
        ref(
            database,
            "sessions/" + code
        );


    sessionCodeElement.textContent =
        code;


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

        }

    };


    await set(
        sessionReference,
        initialData
    );


    /*
       Si le PC ferme la page,
       Firebase supprime automatiquement
       la session.
    */

    onDisconnect(
        sessionReference
    ).remove();


    listenToController(code);

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
   METTRE À JOUR L'INTERFACE
========================================================= */

function updateConnectionInterface() {

    if (controller.connected) {

        statusText.textContent =
            "Téléphone connecté";

        statusDot.classList.add(
            "connected"
        );

        connectionMessage.textContent =
            "🎮 Manette connectée !";

        gameStatus.textContent =
            "🎮 Téléphone connecté";


        menu.style.display =
            "none";

        gameScreen.style.display =
            "block";


    } else {

        statusText.textContent =
            "En attente du téléphone";

        statusDot.classList.remove(
            "connected"
        );

        connectionMessage.textContent =
            "En attente du téléphone...";

        gameStatus.textContent =
            "📱 En attente du téléphone";

    }

}


/* =========================================================
   DÉPLACEMENT DU JOUEUR
========================================================= */

function updatePlayer() {

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


    /*
       Limites horizontales
    */

    if (player.x < half) {

        player.x =
            half;

    }


    if (
        player.x >
        canvas.width - half
    ) {

        player.x =
            canvas.width - half;

    }


    /*
       Limites verticales
    */

    if (player.y < half) {

        player.y =
            half;

    }


    if (
        player.y >
        canvas.height - half
    ) {

        player.y =
            canvas.height - half;

    }

}


/* =========================================================
   DESSINER LE JEU
========================================================= */

function drawGame() {

    /*
       Fond
    */

    ctx.fillStyle =
        "#101722";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /*
       Grille
    */

    ctx.strokeStyle =
        "#1b2635";

    ctx.lineWidth =
        1;


    for (
        let x = 0;
        x < canvas.width;
        x += 50
    ) {

        ctx.beginPath();

        ctx.moveTo(
            x,
            0
        );

        ctx.lineTo(
            x,
            canvas.height
        );

        ctx.stroke();

    }


    for (
        let y = 0;
        y < canvas.height;
        y += 50
    ) {

        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            canvas.width,
            y
        );

        ctx.stroke();

    }


    /*
       Joueur
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
       Titre
    */

    ctx.textAlign =
        "center";

    ctx.fillStyle =
        "white";

    ctx.font =
        "bold 28px Arial";

    ctx.fillText(
        "DUALPLAY",
        canvas.width / 2,
        45
    );


    /*
       Texte
    */

    ctx.font =
        "16px Arial";

    ctx.fillStyle =
        "#999";

    ctx.fillText(
        "Téléphone utilisé comme manette",
        canvas.width / 2,
        72
    );


    /*
       Bouton A
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
   BOUCLE DU JEU
========================================================= */

function gameLoop() {

    updatePlayer();

    drawGame();

    requestAnimationFrame(
        gameLoop
    );

}


/* =========================================================
   DÉMARRAGE
========================================================= */

async function start() {

    try {

        statusText.textContent =
            "Connexion à Firebase...";


        await createSession();


        statusText.textContent =
            "En attente du téléphone";


        gameLoop();


    } catch (error) {

        console.error(error);


        statusText.textContent =
            "Erreur Firebase";


        connectionMessage.textContent =
            "Impossible de créer la session : " +
            error.message;

    }

}


start();
