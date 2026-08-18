import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
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


const app =
    initializeApp(
        firebaseConfig
    );

const database =
    getDatabase(app);


/* =====================================================
   ELEMENTS
===================================================== */

const connectScreen =
    document.getElementById(
        "connectScreen"
    );

const gamepad =
    document.getElementById(
        "gamepad"
    );

const codeInput =
    document.getElementById(
        "codeInput"
    );

const connectButton =
    document.getElementById(
        "connectButton"
    );

const connectMessage =
    document.getElementById(
        "connectMessage"
    );

const padScreenGame =
    document.getElementById(
        "padScreenGame"
    );

const stick =
    document.getElementById(
        "stick"
    );

const stickKnob =
    document.getElementById(
        "stickKnob"
    );


/* =====================================================
   MUSIQUE
===================================================== */

const phoneMusic =
    new Audio("phone.mp3");

phoneMusic.loop = true;

phoneMusic.volume = 0.35;


/* =====================================================
   SESSION
===================================================== */

let sessionCode =
    null;


/* =====================================================
   ETAT
===================================================== */

const state = {

    connected: true,

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

const games = {

    snake:
        "🐍 Snake",

    pong:
        "🏓 Pong",

    dodge:
        "🟦 Pixel Dodge"

};


/* =====================================================
   MUSIQUE
===================================================== */

function startMusic() {

    phoneMusic
        .play()
        .catch(() => {});

}


/* =====================================================
   ENVOYER BOUTON
===================================================== */

async function sendButton(
    name,
    value
) {

    if (!sessionCode)
        return;


    state[name] =
        value;


    const controllerRef =
        ref(
            database,
            "sessions/" +
            sessionCode +
            "/controller"
        );


    try {

        await update(
            controllerRef,
            {
                [name]: value
            }
        );

    }
    catch (error) {

        console.error(
            error
        );

    }

}


/* =====================================================
   ENVOYER COMMANDE
===================================================== */

async function sendCommand(
    type
) {

    if (!sessionCode)
        return;


    try {

        await update(
            ref(
                database,
                "sessions/" +
                sessionCode
            ),
            {

                command: {

                    type:
                        type,

                    timestamp:
                        Date.now()

                }

            }
        );

    }
    catch (error) {

        console.error(
            error
        );

    }

}


/* =====================================================
   CHANGER DE JEU
===================================================== */

async function selectGame(
    direction
) {

    await sendCommand(
        direction > 0
            ? "selectNext"
            : "selectPrevious"
    );

}


/* =====================================================
   BOUTONS NORMAUX
===================================================== */

document
    .querySelectorAll(
        "[data-button]"
    )
    .forEach(
        button => {

            const name =
                button.dataset.button;


            button.addEventListener(
                "touchstart",
                event => {

                    event.preventDefault();

                    sendButton(
                        name,
                        true
                    );

                },
                {
                    passive: false
                }
            );


            button.addEventListener(
                "touchend",
                event => {

                    event.preventDefault();

                    sendButton(
                        name,
                        false
                    );

                },
                {
                    passive: false
                }
            );


            button.addEventListener(
                "touchcancel",
                event => {

                    event.preventDefault();

                    sendButton(
                        name,
                        false
                    );

                },
                {
                    passive: false
                }
            );

        }
    );


/* =====================================================
   A
===================================================== */

const A =
    document.getElementById(
        "buttonA"
    );


A.addEventListener(
    "touchstart",
    event => {

        event.preventDefault();

        sendButton(
            "A",
            true
        );

        /*
           Commande séparée :
           le PC sait immédiatement
           qu'on veut lancer le jeu.
        */

        sendCommand(
            "launch"
        );

    },
    {
        passive: false
    }
);


A.addEventListener(
    "touchend",
    event => {

        event.preventDefault();

        sendButton(
            "A",
            false
        );

    },
    {
        passive: false
    }
);


/* =====================================================
   B
===================================================== */

const B =
    document.getElementById(
        "buttonB"
    );


B.addEventListener(
    "touchstart",
    event => {

        event.preventDefault();

        sendButton(
            "B",
            true
        );

        sendCommand(
            "back"
        );

    },
    {
        passive: false
    }
);


B.addEventListener(
    "touchend",
    event => {

        event.preventDefault();

        sendButton(
            "B",
            false
        );

    },
    {
        passive: false
    }
);


/* =====================================================
   D-PAD SELECTION
===================================================== */

const left =
    document.getElementById(
        "dpadLeft"
    );

const right =
    document.getElementById(
        "dpadRight"
    );


left.addEventListener(
    "touchstart",
    event => {

        event.preventDefault();

        selectGame(-1);

    },
    {
        passive: false
    }
);


right.addEventListener(
    "touchstart",
    event => {

        event.preventDefault();

        selectGame(1);

    },
    {
        passive: false
    }
);


/* =====================================================
   STICK
===================================================== */

let stickActive =
    false;


function moveStick(
    x,
    y
) {

    const rect =
        stick.getBoundingClientRect();


    const centerX =
        rect.left +
        rect.width / 2;

    const centerY =
        rect.top +
        rect.height / 2;


    let dx =
        x - centerX;

    let dy =
        y - centerY;


    const maximum =
        rect.width / 2 - 42;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    if (
        distance > maximum
    ) {

        dx =
            dx / distance *
            maximum;

        dy =
            dy / distance *
            maximum;

    }


    stickKnob.style.transform =
        `translate(${dx}px, ${dy}px)`;


    const threshold =
        25;


    sendButton(
        "left",
        dx < -threshold
    );

    sendButton(
        "right",
        dx > threshold
    );

    sendButton(
        "up",
        dy < -threshold
    );

    sendButton(
        "down",
        dy > threshold
    );

}


function resetStick() {

    stickActive =
        false;


    stickKnob.style.transform =
        "translate(0,0)";


    sendButton(
        "left",
        false
    );

    sendButton(
        "right",
        false
    );

    sendButton(
        "up",
        false
    );

    sendButton(
        "down",
        false
    );

}


stick.addEventListener(
    "touchstart",
    event => {

        event.preventDefault();

        stickActive =
            true;


        startMusic();


        const touch =
            event.touches[0];


        moveStick(
            touch.clientX,
            touch.clientY
        );

    },
    {
        passive: false
    }
);


stick.addEventListener(
    "touchmove",
    event => {

        event.preventDefault();


        if (!stickActive)
            return;


        const touch =
            event.touches[0];


        moveStick(
            touch.clientX,
            touch.clientY
        );

    },
    {
        passive: false
    }
);


stick.addEventListener(
    "touchend",
    resetStick
);


stick.addEventListener(
    "touchcancel",
    resetStick
);


/* =====================================================
   START
===================================================== */

document
    .getElementById(
        "start"
    )
    .addEventListener(
        "touchstart",
        event => {

            event.preventDefault();

            sendButton(
                "start",
                true
            );

            sendCommand(
                "launch"
            );

        },
        {
            passive: false
        }
    );


/* =====================================================
   SELECT
===================================================== */

document
    .getElementById(
        "select"
    )
    .addEventListener(
        "touchstart",
        event => {

            event.preventDefault();

            sendButton(
                "select",
                true
            );

            sendCommand(
                "back"
            );

        },
        {
            passive: false
        }
    );


/* =====================================================
   HOME
===================================================== */

document
    .getElementById(
        "homeButton"
    )
    .addEventListener(
        "touchstart",
        event => {

            event.preventDefault();

            sendCommand(
                "back"
            );

        },
        {
            passive: false
        }
    );


/* =====================================================
   MENU
===================================================== */

document
    .getElementById(
        "menuButton"
    )
    .addEventListener(
        "touchstart",
        event => {

            event.preventDefault();

            sendCommand(
                "back"
            );

        },
        {
            passive: false
        }
    );


/* =====================================================
   QUITTER
===================================================== */

document
    .getElementById(
        "quitButton"
    )
    .addEventListener(
        "touchstart",
        async event => {

            event.preventDefault();

            sendCommand(
                "close"
            );


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        200
                    )
            );


            /*
               Impossible de fermer
               directement un onglet
               que JavaScript n'a pas ouvert.

               On revient donc à l'écran
               de connexion.
            */

            gamepad.style.display =
                "none";

            connectScreen.style.display =
                "flex";

            connectMessage.textContent =
                "Session fermée.";

        },
        {
            passive: false
        }
    );


/* =====================================================
   ECOUTER LE PC
===================================================== */

function listenSession() {

    const sessionRef =
        ref(
            database,
            "sessions/" +
            sessionCode
        );


    onValue(
        sessionRef,
        snapshot => {

            const data =
                snapshot.val();


            if (!data)
                return;


            /* jeu */

            if (
                data.selectedGame
            ) {

                padScreenGame.textContent =
                    games[
                        data.selectedGame
                    ] ||
                    data.selectedGame;

            }


            /* session fermée */

            if (
                data.closed === true
            ) {

                connectScreen.style.display =
                    "flex";

                gamepad.style.display =
                    "none";

                connectMessage.textContent =
                    "La session a été fermée.";

            }

        }
    );

}


/* =====================================================
   CONNECTER
===================================================== */

async function connect() {

    startMusic();


    const code =
        codeInput.value.trim();


    if (
        !/^\d{6}$/.test(code)
    ) {

        connectMessage.textContent =
            "⚠️ Le code doit contenir 6 chiffres.";

        return;

    }


    connectButton.disabled =
        true;


    connectMessage.textContent =
        "Connexion...";


    try {

        const sessionRef =
            ref(
                database,
                "sessions/" +
                code
            );


        const snapshot =
            await get(
                sessionRef
            );


        if (
            !snapshot.exists()
        ) {

            connectMessage.textContent =
                "❌ Session introuvable.";

            connectButton.disabled =
                false;

            return;

        }


        sessionCode =
            code;


        const controllerRef =
            ref(
                database,
                "sessions/" +
                code +
                "/controller"
            );


        await update(
            controllerRef,
            state
        );


        onDisconnect(
            controllerRef
        )
        .update({

            connected:
                false

        });


        connectScreen.style.display =
            "none";

        gamepad.style.display =
            "block";


        listenSession();


    }
    catch (error) {

        console.error(
            error
        );


        connectMessage.textContent =
            "❌ " +
            error.message;


        connectButton.disabled =
            false;

    }

}


/* =====================================================
   BOUTON CONNECTION
===================================================== */

connectButton.addEventListener(
    "click",
    connect
);


codeInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            connect();

        }

    }
);


/* =====================================================
   PAS DE MENU CONTEXTUEL
===================================================== */

document.addEventListener(
    "contextmenu",
    event => {

        event.preventDefault();

    }
);
