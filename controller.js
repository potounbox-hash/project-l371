import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    update,
    onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* =========================================================
   FIREBASE
========================================================= */

const firebaseConfig = {

    databaseURL:
        "https://project-l371-default-rtdb.europe-west1.firebasedatabase.app"

};

const app =
    initializeApp(firebaseConfig);

const db =
    getDatabase(app);


/* =========================================================
   HTML
========================================================= */

const codeInput =
    document.getElementById("codeInput");

const connectButton =
    document.getElementById("connectButton");

const connectMessage =
    document.getElementById("connectMessage");

const connectScreen =
    document.getElementById("connectScreen");

const controllerScreen =
    document.getElementById("controller");

const connectionStatus =
    document.getElementById("connectionStatus");


/* =========================================================
   SESSION
========================================================= */

let sessionCode = null;


/* =========================================================
   ÉTAT MANETTE
========================================================= */

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


/* =========================================================
   CONNEXION
========================================================= */

async function connect() {

    const code =
        codeInput.value.trim();


    if (!/^\d{6}$/.test(code)) {

        connectMessage.textContent =
            "⚠️ Entrez un code à 6 chiffres.";

        return;
    }


    connectMessage.textContent =
        "Connexion...";


    try {

        const sessionRef =
            ref(db, "sessions/" + code);

        const snapshot =
            await get(sessionRef);


        if (!snapshot.exists()) {

            connectMessage.textContent =
                "❌ Ce code n'existe pas.";

            return;
        }


        sessionCode = code;


        /*
           Signaler que le téléphone est connecté.
        */

        const controllerRef =
            ref(
                db,
                "sessions/" +
                sessionCode +
                "/controller"
            );


        await update(
            controllerRef,
            controllerState
        );


        /*
           Si le téléphone ferme la page,
           il se déconnecte.
        */

        onDisconnect(
            controllerRef
        ).update({

            connected: false

        });


        /*
           Affichage de la manette.
        */

        connectScreen.style.display =
            "none";

        controllerScreen.style.display =
            "block";


        connectionStatus.textContent =
            "🟢 Connecté";


    } catch (error) {

        console.error(error);

        connectMessage.textContent =
            "❌ Erreur : " +
            error.message;

    }

}


/* =========================================================
   ENVOYER UNE TOUCHE
========================================================= */

async function sendButton(
    button,
    pressed
) {

    if (!sessionCode) {
        return;
    }


    controllerState[button] =
        pressed;


    const controllerRef =
        ref(
            db,
            "sessions/" +
            sessionCode +
            "/controller"
        );


    try {

        await update(
            controllerRef,
            {
                [button]: pressed
            }
        );

    } catch (error) {

        console.error(
            "Erreur envoi bouton:",
            error
        );

    }

}


/* =========================================================
   BOUTONS TACTILES
========================================================= */

document
    .querySelectorAll("[data-button]")
    .forEach((button) => {

        const name =
            button.dataset.button;


        /*
           TOUCH START
        */

        button.addEventListener(
            "touchstart",
            (event) => {

                event.preventDefault();

                sendButton(
                    name,
                    true
                );

            },
            { passive: false }
        );


        /*
           TOUCH END
        */

        button.addEventListener(
            "touchend",
            (event) => {

                event.preventDefault();

                sendButton(
                    name,
                    false
                );

            },
            { passive: false }
        );


        /*
           TOUCH CANCEL
        */

        button.addEventListener(
            "touchcancel",
            (event) => {

                event.preventDefault();

                sendButton(
                    name,
                    false
                );

            },
            { passive: false }
        );


        /*
           Compatibilité souris
        */

        button.addEventListener(
            "mousedown",
            () => {

                sendButton(
                    name,
                    true
                );

            }
        );


        button.addEventListener(
            "mouseup",
            () => {

                sendButton(
                    name,
                    false
                );

            }
        );


        button.addEventListener(
            "mouseleave",
            () => {

                sendButton(
                    name,
                    false
                );

            }
        );

    });


/* =========================================================
   START / SELECT
========================================================= */

document
    .getElementById("start")
    .addEventListener(
        "touchstart",
        (event) => {

            event.preventDefault();

            sendButton(
                "start",
                true
            );

        },
        { passive: false }
    );


document
    .getElementById("start")
    .addEventListener(
        "touchend",
        (event) => {

            event.preventDefault();

            sendButton(
                "start",
                false
            );

        },
        { passive: false }
    );


document
    .getElementById("select")
    .addEventListener(
        "touchstart",
        (event) => {

            event.preventDefault();

            sendButton(
                "select",
                true
            );

        },
        { passive: false }
    );


document
    .getElementById("select")
    .addEventListener(
        "touchend",
        (event) => {

            event.preventDefault();

            sendButton(
                "select",
                false
            );

        },
        { passive: false }
    );


/* =========================================================
   BOUTON CONNECTER
========================================================= */

connectButton.addEventListener(
    "click",
    connect
);


/*
   Permettre d'appuyer sur Entrée
*/

codeInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            connect();

        }

    }
);
