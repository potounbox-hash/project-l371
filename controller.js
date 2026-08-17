import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    update,
    onDisconnect,
    onValue
}
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* ========================================
   FIREBASE
======================================== */

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


/* ========================================
   ELEMENTS
======================================== */

const connectScreen =
    document.getElementById(
        "connectScreen"
    );

const controllerScreen =
    document.getElementById(
        "controller"
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

const selectedGame =
    document.getElementById(
        "selectedGame"
    );

const joystick =
    document.getElementById(
        "joystick"
    );

const joystickKnob =
    document.getElementById(
        "joystickKnob"
    );


/* ========================================
   MUSIQUE
======================================== */

const phoneMusic =
    new Audio("phone.mp3");

phoneMusic.loop = true;

phoneMusic.volume = 0.35;


/*
   Le navigateur autorise normalement
   la musique après le clic sur CONNECTER.
*/

function startMusic() {

    phoneMusic
        .play()
        .catch(() => {});

}


/* ========================================
   SESSION
======================================== */

let sessionCode = null;


/* ========================================
   ETAT MANETTE
======================================== */

const controllerState = {

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


/* ========================================
   JEUX
======================================== */

const games = [

    {
        id: "dodge",
        name: "🟦 Pixel Dodge"
    },

    {
        id: "snake",
        name: "🐍 Snake"
    },

    {
        id: "pong",
        name: "🏓 Pong"
    }

];


let selectedIndex = 0;


/* ========================================
   VERIFICATION ORIENTATION
======================================== */

function checkOrientation() {

    const rotateMessage =
        document.getElementById(
            "rotateMessage"
        );

    if (
        window.innerWidth <
        window.innerHeight
    ) {

        rotateMessage.style.display =
            "flex";

    }
    else {

        rotateMessage.style.display =
            "none";

    }

}


window.addEventListener(
    "resize",
    checkOrientation
);

window.addEventListener(
    "orientationchange",
    checkOrientation
);

checkOrientation();


/* ========================================
   AFFICHER JEU
======================================== */

function updateGameDisplay() {

    selectedGame.textContent =
        games[selectedIndex].name;

}


/* ========================================
   ENVOYER ETAT
======================================== */

async function sendButton(
    name,
    value
) {

    if (!sessionCode)
        return;


    controllerState[name] =
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
            "Firebase:",
            error
        );

    }

}


/* ========================================
   CHANGER DE JEU
======================================== */

async function changeGame(
    direction
) {

    selectedIndex += direction;


    if (
        selectedIndex < 0
    ) {

        selectedIndex =
            games.length - 1;

    }


    if (
        selectedIndex >= games.length
    ) {

        selectedIndex = 0;

    }


    updateGameDisplay();


    if (!sessionCode)
        return;


    const sessionRef =
        ref(
            database,
            "sessions/" +
            sessionCode
        );


    try {

        await update(
            sessionRef,
            {

                selectedGame:
                    games[selectedIndex].id,

                gameStarted:
                    false

            }
        );

    }
    catch (error) {

        console.error(error);

    }

}


/* ========================================
   BOUTONS DIRECTIONNELS
======================================== */

function setupButton(
    element
) {

    const name =
        element.dataset.button;


    /* TOUCH START */

    element.addEventListener(
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


    /* TOUCH END */

    element.addEventListener(
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


    /* TOUCH CANCEL */

    element.addEventListener(
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


document
    .querySelectorAll(
        "[data-button]"
    )
    .forEach(
        setupButton
    );


/* ========================================
   START
======================================== */

function setupSystemButton(
    id,
    name
) {

    const button =
        document.getElementById(id);


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

}


setupSystemButton(
    "start",
    "start"
);

setupSystemButton(
    "select",
    "select"
);


/* ========================================
   JOYSTICK
======================================== */

let joystickActive = false;


function moveJoystick(
    x,
    y
) {

    const rect =
        joystick.getBoundingClientRect();


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
        rect.width / 2 - 45;


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


    joystickKnob.style.transform =
        `translate(${dx}px, ${dy}px)`;


    const threshold = 25;


    const left =
        dx < -threshold;

    const right =
        dx > threshold;

    const up =
        dy < -threshold;

    const down =
        dy > threshold;


    sendButton(
        "left",
        left
    );

    sendButton(
        "right",
        right
    );

    sendButton(
        "up",
        up
    );

    sendButton(
        "down",
        down
    );

}


/* ========================================
   RESET JOYSTICK
======================================== */

function resetJoystick() {

    joystickActive = false;


    joystickKnob.style.transform =
        "translate(0px, 0px)";


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


/* ========================================
   JOYSTICK TOUCH START
======================================== */

joystick.addEventListener(
    "touchstart",
    event => {

        event.preventDefault();

        joystickActive = true;


        const touch =
            event.touches[0];


        moveJoystick(
            touch.clientX,
            touch.clientY
        );

    },
    {
        passive: false
    }
);


/* ========================================
   JOYSTICK MOVE
======================================== */

joystick.addEventListener(
    "touchmove",
    event => {

        event.preventDefault();


        if (!joystickActive)
            return;


        const touch =
            event.touches[0];


        moveJoystick(
            touch.clientX,
            touch.clientY
        );

    },
    {
        passive: false
    }
);


/* ========================================
   JOYSTICK END
======================================== */

joystick.addEventListener(
    "touchend",
    event => {

        event.preventDefault();

        resetJoystick();

    },
    {
        passive: false
    }
);


joystick.addEventListener(
    "touchcancel",
    resetJoystick
);


/* ========================================
   SELECTION AVEC D-PAD
======================================== */

let previousLeft = false;

let previousRight = false;


setInterval(
    () => {

        if (
            controllerState.left &&
            !previousLeft
        ) {

            changeGame(-1);

        }


        if (
            controllerState.right &&
            !previousRight
        ) {

            changeGame(1);

        }


        previousLeft =
            controllerState.left;

        previousRight =
            controllerState.right;

    },
    80
);


/* ========================================
   A = LANCER
======================================== */

let previousA = false;


setInterval(
    async () => {

        if (
            controllerState.A &&
            !previousA &&
            sessionCode
        ) {

            const sessionRef =
                ref(
                    database,
                    "sessions/" +
                    sessionCode
                );


            try {

                await update(
                    sessionRef,
                    {

                        selectedGame:
                            games[selectedIndex].id,

                        gameStarted:
                            true

                    }
                );

            }
            catch (error) {

                console.error(error);

            }

        }


        previousA =
            controllerState.A;

    },
    80
);


/* ========================================
   CONNEXION
======================================== */

async function connect() {

    startMusic();


    const code =
        codeInput.value.trim();


    if (
        !/^\d{6}$/.test(code)
    ) {

        connectMessage.textContent =
            "⚠️ Entre un code à 6 chiffres.";

        return;

    }


    connectButton.disabled =
        true;


    connectMessage.textContent =
        "Connexion à la console...";


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
                "❌ Cette session n'existe pas.";

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
            controllerState
        );


        onDisconnect(
            controllerRef
        )
        .update({

            connected: false

        });


        connectScreen.style.display =
            "none";


        controllerScreen.style.display =
            "block";


        updateGameDisplay();


        listenToSession();


    }
    catch (error) {

        console.error(error);


        connectMessage.textContent =
            "❌ " +
            error.message;


        connectButton.disabled =
            false;

    }

}


/* ========================================
   ECOUTER FIREBASE
======================================== */

function listenToSession() {

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


            if (
                data.selectedGame
            ) {

                const index =
                    games.findIndex(
                        game =>
                            game.id ===
                            data.selectedGame
                    );


                if (
                    index !== -1
                ) {

                    selectedIndex =
                        index;

                    updateGameDisplay();

                }

            }

        }
    );

}


/* ========================================
   BOUTON CONNECTER
======================================== */

connectButton.addEventListener(
    "click",
    connect
);


/* ========================================
   ENTREE CLAVIER
======================================== */

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


/* ========================================
   PREVENTION DU ZOOM / MENU
======================================== */

document.addEventListener(
    "contextmenu",
    event => {

        event.preventDefault();

    }
);


/* ========================================
   ORIENTATION INITIALE
======================================== */

updateGameDisplay();
