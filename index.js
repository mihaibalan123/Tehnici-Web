const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');

app.use((req, res, next) => {
    res.locals.ip = req.ip;
    next();
});

app.use('/resurse', express.static(path.join(__dirname, 'resurse')));

app.get(/^\/resurse.*/, (req, res) => { 
    const caleFizica = path.join(__dirname, req.path);

    try {
        if (fs.existsSync(caleFizica) && fs.statSync(caleFizica).isDirectory()) {
            afisareEroare(res, 403);
        } else {
            afisareEroare(res, 404);
        }
    } catch (e) {
        afisareEroare(res, 404);
    }
});

let obGlobal = {
    obErori: null
};

function verificaJSONErori(caleFisier) {
    console.log("Se rulează verificarea fișierului JSON (A-D)...");

    if (!fs.existsSync(caleFisier)) {
        console.error("CRITIC [A]: Fișierul 'erori.json' NU există în rădăcina proiectului!");
        process.exit(1); 
    }

    const textBrut = fs.readFileSync(caleFisier, 'utf8');
    let json;
    try {
        json = JSON.parse(textBrut);
    } catch (e) {
        console.error("EROARE: Fișierul erori.json nu are un format JSON valid sintactic!");
        return;
    }

    const proprietatiBaza = ['info_erori', 'cale_baza', 'eroare_default'];
    proprietatiBaza.forEach(prop => {
        if (!json.hasOwnProperty(prop)) {
            console.error(`EROARE [B]: Lipsește proprietatea obligatorie de bază: "${prop}"`);
        }
    });

    if (json.eroare_default) {
        const propDefault = ['titlu', 'text', 'imagine'];
        propDefault.forEach(prop => {
            if (!json.eroare_default.hasOwnProperty(prop) || !json.eroare_default[prop]) {
                console.error(`EROARE [C]: În 'eroare_default' lipsește sau este goală proprietatea: "${prop}"`);
            }
        });
    }

    if (json.cale_baza) {
        const caleFolderFizic = path.join(__dirname, json.cale_baza);
        if (!fs.existsSync(caleFolderFizic) || !fs.statSync(caleFolderFizic).isDirectory()) {
            console.error(`EROARE [D]: Folderul din 'cale_baza' (${json.cale_baza}) NU există în sistemul de fișiere!`);
        }
    }
    console.log("Verificarea JSON-ului (A-D) s-a încheiat.");
}

function initErori() {
    try {
        const caleFisier = path.join(__dirname, 'erori.json');
        verificaJSONErori(caleFisier);
        
        const dateRaw = fs.readFileSync(caleFisier, 'utf8');
        const jsonErori = JSON.parse(dateRaw);
        const caleBaza = jsonErori.cale_baza;
        
        if (jsonErori.eroare_default && jsonErori.eroare_default.imagine) {
            jsonErori.eroare_default.imagine = `${caleBaza}/${jsonErori.eroare_default.imagine}`;
        }
        
        if (Array.isArray(jsonErori.info_erori)) {
            jsonErori.info_erori.forEach(eroare => {
                if (eroare.imagine) {
                    eroare.imagine = `${caleBaza}/${eroare.imagine}`;
                }
            });
        }
        
        obGlobal.obErori = jsonErori;
        console.log("Fișierul erori.json a fost încărcat cu succes în memorie!");
    } catch (err) {
        console.error("Eroare critică la inițializarea sistemului de erori:", err);
    }
}

initErori();

const vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
vect_foldere.forEach(folder => {
    const caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder);
        console.log(`Folderul [${folder}] a fost creat cu succes.`);
    }
});

function afisareEroare(res, identificator, titlu, text, imagine) {
    const eroriData = obGlobal.obErori;
    
    let errDefault = eroriData ? eroriData.eroare_default : { titlu: "Error", text: "An error occurred.", imagine: "" };
    
    let errSpecifica = null;
    if (identificator && eroriData && Array.isArray(eroriData.info_erori)) {
        errSpecifica = eroriData.info_erori.find(e => e.identificator === identificator);
    }
    
    let titluFinal = titlu || (errSpecifica ? errSpecifica.titlu : errDefault.titlu);
    let textFinal = text || (errSpecifica ? errSpecifica.text : errDefault.text);
    let imagineFinal = imagine || (errSpecifica ? errSpecifica.imagine : errDefault.imagine);
    
    let codStatusHTTP = 200;
    if (errSpecifica) {
        codStatusHTTP = errSpecifica.status ? errSpecifica.identificator : 200;
    } else if (identificator) {
        codStatusHTTP = identificator;
    }
    
    res.status(codStatusHTTP).render('pagini/eroare', {
        titlu: titluFinal,
        text: textFinal,
        imagine: imagineFinal
    });
}

app.get(['/', '/index', '/home'], (req, res) => {
    res.render('pagini/index');
});

app.get('/favicon.ico', (req, res) => {
    const caleFavicon = path.join(__dirname, 'resurse', 'imagini', 'favicon', 'favicon.ico');
    res.sendFile(caleFavicon);
});

app.get(/\.ejs$/, (req, res) => {
    afisareEroare(res, 400);
});

app.get(/.*/, (req, res) => { 
    let paginaCereata = req.path.substring(1);
    
    res.render(`pagini/${paginaCereata}`, (eroare, rezultatRandare) => {
        if (eroare) {
            if (eroare.message.startsWith("Failed to lookup view")) {
                afisareEroare(res, 404);
            } else {
                afisareEroare(res, 500, "Eroare Internă Server", "A apărut o problemă la procesarea paginii pe server.");
            }
        } else {
            res.send(rezultatRandare);
        }
    });
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Serverul rulează pe http://localhost:${PORT}`);
});