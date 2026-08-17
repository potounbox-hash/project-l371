import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getDatabase,
    ref,
    get,
    update,
    onDisconnect
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


/* =========================================================
   CONFIGURATION FIREBASE
========================================================= */

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


/* =========================================================
   INITIALISATION
========================================================= */

const firebaseApp =
    initializeApp(
        firebaseConfig
    );

const database =
    getDatabase(
        firebaseApp
    );


/* =========================================================
   ÉLÉMENTS HTML
========================================================= */

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

const connectScreen =
    document.getElementById(
        "connectScreen"
    );

const controllerScreen =
    document.getElementById(
        "controller"
    );

const connectionStatus =
    document.getElementById(
        "connectionStatus"
    );


/* =========================================================
   SESSION ACTUELLE
========================================================= */

let sessionCode =
    null;


/* =========================================================
   ÉTAT DE LA MANETTE
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
   CONNEXION À UNE SESSION
========================================================= */

async function connectToSession() {

    const code =
        codeInput.value.trim();


    /*
       Vérification du code
    */

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
        "Connexion en cours...";


    try {

        const sessionReference =
            ref(
                database,
                "sessions/" +
                code
            );


        /*
           Vérifier que la session existe
        */

        const snapshot =
            await get(
                sessionReference
            );


        if (
            !snapshot.exists()
        ) {

            connectMessage.textContent =
                "❌ Code incorrect ou session inexistante.";

            connectButton.disabled =
                false;

            return;

        }


        /*
           Enregistrer la session
        */

        sessionCode =
            code;


        const controllerReference =
            ref(
                database,
                "sessions/" +
                sessionCode +
                "/controller"
            );


        /*
           Dire à Firebase :
           "le téléphone est connecté"
        */

        await update(
            controllerReference,
            controllerState
        );


        /*
           Si le téléphone ferme la page,
           passer automatiquement à disconnected.
        */

        onDisconnect(
            controllerReference
        ).update({

            connected: false

        });


        /*
           Afficher la manette
        */

        connectScreen.style.display =
            "none";

        controllerScreen.style.display =
            "block";


        connectionStatus.textContent =
            "🟢 Connecté";


    } catch (error) {

        console.error(
            error
        );


        connectMessage.textContent =
            "❌ Erreur Firebase : " +
            error.message;


        connectButton.disabled =
            false;

    }

}


/* =========================================================
   ENVOYER L'ÉTAT D'UN BOUTON
========================================================= */

async function sendButton(
    button,
    pressed
) {

    /*
       Aucun téléphone connecté
    */

    if (!sessionCode) {

        return;

    }


    /*
       Mise à jour locale
    */

    controllerState[button] =
        pressed;


    /*
       Référence Firebase
    */

    const controllerReference =
        ref(
            database,
            "sessions/" +
            sessionCode +
            "/controller"
        );


    try {

        await update(

            controllerReference,

            {

                [button]:
                    pressed

            }

        );

    } catch (error) {

        console.error(
            "Erreur lors de l'envoi :",
            error
        );

    }

}


/* =========================================================
   CONFIGURATION DES BOUTONS
========================================================= */

function setupButton(button) {

    const buttonName =
        button.dataset.button;


    /*
       TOUCH START
    */

    button.addEventListener(

        "touchstart",

        (event) => {

            event.preventDefault();

            sendButton(
                buttonName,
                true
            );

        },

        {
            passive: false
        }

    );


    /*
       TOUCH END
    */

    button.addEventListener(

        "touchend",

        (event) => {

            event.preventDefault();

            sendButton(
                buttonName,
                false
            );

        },

        {
            passive: false
        }

    );


    /*
       TOUCH CANCEL
    */

    button.addEventListener(

        "touchcancel",

        (event) => {

            event.preventDefault();

            sendButton(
                buttonName,
                false
            );

        },

        {
            passive: false
        }

    );


    /*
       Souris / PC
    */

    button.addEventListener(

        "mousedown",

        () => {

            sendButton(
                buttonName,
                true
            );

        }

    );


    button.addEventListener(

        "mouseup",

        () => {

            sendButton(
                buttonName,
                false
            );

        }

    );


    button.addEventListener(

        "mouseleave",

        () => {

            sendButton(
                buttonName,
                false
            );

        }

    );

}


/* =========================================================
   INSTALLER LES BOUTONS
========================================================= */

document
    .querySelectorAll(
        "[data-button]"
    )
    .forEach(
        setupButton
    );


/* =========================================================
   BOUTON START
========================================================= */

const startButton =
    document.getElementById(
        "start"
    );


startButton.addEventListener(

    "touchstart",

    (event) => {

        event.preventDefault();

        sendButton(
            "start",
            true
        );

    },

    {
        passive: false
    }

);


startButton.addEventListener(

    "touchend",

    (event) => {

        event.preventDefault();

        sendButton(
            "start",
            false
        );

    },

    {
        passive: false
    }

);


/* =========================================================
   BOUTON SELECT
========================================================= */

const selectButton =
    document.getElementById(
        "select"
    );


selectButton.addEventListener(

    "touchstart",

    (event) => {

        event.preventDefault();

        sendButton(
            "select",
            true
        );

    },

    {
        passive: false
    }

);


selectButton.addEventListener(

    "touchend",

    (event) => {

        event.preventDefault();

        sendButton(
            "select",
            false
        );

    },

    {
        passive: false
    }

);


/* =========================================================
   BOUTON CONNECTER
========================================================= */

connectButton.addEventListener(
    "click",
    connectToSession
);


/* =========================================================
   TOUCHE ENTRÉE
========================================================= */

codeInput.addEventListener(

    "keydown",

    (event) => {

        if (
            event.key === "Enter"
        ) {

            connectToSession();

        }

    }

);
