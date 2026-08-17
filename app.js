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
    databaseURL:
        "https://project-l371-default-rtdb.europe-west1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);


/* =========================================================
   ÉLÉMENTS HTML
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
   JOUEUR
========================================================= */

const player = {
    x: 640,
    y: 360,
    size: 45,
    speed: 6
};


/* =========================================================
   GÉNÉRATION DU CODE
========================================================= */

function generateCode() {

    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();

}


/* =========================================================
   CRÉATION DE LA SESSION
========================================================= */

async function createSession() {

    const code = generateCode();

    sessionCodeElement.textContent = code;

    const sessionRef =
        ref(db, "sessions/" + code);

    await set(sessionRef, {

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

    });


    /*
       Si le PC ferme la page,
       Firebase supprimera la session.
    */

    onDisconnect(sessionRef).remove();


    listenController(code);

}


/* =========================================================
   ÉCOUTER LE TÉLÉPHONE
========================================================= */

function listenController(code) {

    const controllerRef =
        ref(db, "sessions/" + code + "/controller");


    onValue(controllerRef, (snapshot) => {

        const data = snapshot.val();

        if (!data) {
            return;
        }

        controller = {

            connected: data.connected === true,

            up: data.up === true,
            down: data.down === true,
            left: data.left === true,
            right: data.right === true,

            A: data.A === true,
            B: data.B === true,
            X: data.X === true,
            Y: data.Y === true,

            start: data.start === true,
            select: data.select === true
        };


        updateConnectionUI();

    });

}


/* =========================================================
   INTERFACE CONNEXION
========================================================= */

function updateConnectionUI() {

    if (controller.connected) {

        statusText.textContent =
            "Téléphone connecté";

        statusDot.classList.add("connected");

        connectionMessage.textContent =
            "🎮 Manette connectée !";

        gameStatus.textContent =
            "🎮 Téléphone connecté";

        /*
           On cache le menu et on lance le jeu.
        */

        menu.style.display = "none";
        gameScreen.style.display = "block";

    } else {

        statusText.textContent =
            "En attente du téléphone";

        statusDot.classList.remove("connected");

        connectionMessage.textContent =
            "En attente du téléphone...";

        gameStatus.textContent =
            "📱 En attente du téléphone";

    }

}


/* =========================================================
   CONTRÔLES DU JOUEUR
========================================================= */

function updatePlayer() {

    if (controller.left) {
        player.x -= player.speed;
    }

    if (controller.right) {
        player.x += player.speed;
    }

    if (controller.up) {
        player.y -= player.speed;
    }

    if (controller.down) {
        player.y += player.speed;
    }


    /*
       Empêcher le joueur de sortir de l'écran.
    */

    const half =
        player.size / 2;

    if (player.x < half) {
        player.x = half;
    }

    if (player.x > canvas.width - half) {
        player.x =
            canvas.width - half;
    }

    if (player.y < half) {
        player.y = half;
    }

    if (player.y > canvas.height - half) {
        player.y =
            canvas.height - half;
    }

}


/* =========================================================
   DESSIN
========================================================= */

function drawGame() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /*
       Fond
    */

    ctx.fillStyle = "#101722";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    /*
       Grille
    */

    ctx.strokeStyle = "#182230";

    ctx.lineWidth = 1;

    for (
        let x = 0;
        x < canvas.width;
        x += 50
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);

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

        ctx.moveTo(0, y);

        ctx.lineTo(
            canvas.width,
            y
        );

        ctx.stroke();

    }


    /*
       Joueur
    */

    ctx.fillStyle = "#4d9cff";

    ctx.fillRect(

        player.x - player.size / 2,

        player.y - player.size / 2,

        player.size,

        player.size

    );


    /*
       Texte
    */

    ctx.fillStyle = "white";

    ctx.font =
        "bold 24px Arial";

    ctx.textAlign = "center";

    ctx.fillText(
        "DUALPLAY",
        canvas.width / 2,
        45
    );


    ctx.font =
        "16px Arial";

    ctx.fillStyle = "#aaa";

    ctx.fillText(
        "Utilisez votre téléphone comme manette",
        canvas.width / 2,
        70
    );


    /*
       Indication bouton A
    */

    if (controller.A) {

        ctx.fillStyle = "#ffffff";

        ctx.font =
            "bold 20px Arial";

        ctx.fillText(
            "BOUTON A !",
            player.x,
            player.y - 45
        );

    }

}


/* =========================================================
   BOUCLE DU JEU
========================================================= */

function gameLoop() {

    updatePlayer();

    drawGame();

    requestAnimationFrame(gameLoop);

}


/* =========================================================
   LANCEMENT
========================================================= */

createSession()
    .then(() => {

        statusText.textContent =
            "En attente du téléphone";

        gameLoop();

    })
    .catch((error) => {

        console.error(error);

        statusText.textContent =
            "Erreur Firebase";

        connectionMessage.textContent =
            error.message;

    });
