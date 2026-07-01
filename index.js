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
    obErori: null,
    folderScss: path.join(__dirname, 'resurse', 'scss'),
    folderCss: path.join(__dirname, 'resurse', 'css')
};

function compileazaScss(caleScss, caleCss) {
    if (!caleScss) return;

    let caleScssAbsoluta = path.isAbsolute(caleScss) ? caleScss : path.join(obGlobal.folderScss, caleScss);
    let caleCssAbsoluta;

    if (!caleCss) {
        let numeScss = path.parse(caleScssAbsoluta).name;
        caleCssAbsoluta = path.join(obGlobal.folderCss, numeScss + '.css');
    } else {
        caleCssAbsoluta = path.isAbsolute(caleCss) ? caleCss : path.join(obGlobal.folderCss, caleCss);
    }

    try {
        const sass = require('sass');
        if (fs.existsSync(caleScssAbsoluta)) {
            if (fs.existsSync(caleCssAbsoluta)) {
                try {
                    let caleRelativa = path.relative(obGlobal.folderCss, caleCssAbsoluta)  ;
                    let infoFisier = path.parse(caleRelativa);
                    let now = new Date();
                    let timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
                    let numeNou = `${infoFisier.name}_${timestamp}${infoFisier.ext}`;
                    let caleBackup = path.join(__dirname, 'backup', 'resurse', 'css', infoFisier.dir, numeNou);
                    let folderBackup = path.dirname(caleBackup);
                    if (!fs.existsSync(folderBackup)) {
                        fs.mkdirSync(folderBackup, { recursive: true });
                    }
                    fs.copyFileSync(caleCssAbsoluta, caleBackup);
                } catch (e) {
                    console.error(`Eroare la crearea backup-ului pentru fisierul CSS vechi:`, e.message);
                }
            }

            let rezultat = sass.compile(caleScssAbsoluta);
            fs.writeFileSync(caleCssAbsoluta, rezultat.css);
        } else {
            console.error(`Fisierul SCSS nu exista: ${caleScssAbsoluta}`);
        }
    } catch (err) {
        console.error(`Eroare la compilarea SCSS (${caleScssAbsoluta}):`, err.message);
    }
}

function compileazaToateScss() {
    if (fs.existsSync(obGlobal.folderScss)) {
        let fisiere = fs.readdirSync(obGlobal.folderScss);
        fisiere.forEach(fisier => {
            if (path.extname(fisier) === '.scss') {
                compileazaScss(fisier);
            }
        });
    }
}
compileazaToateScss();

if (fs.existsSync(obGlobal.folderScss)) {
    fs.watch(obGlobal.folderScss, (eveniment, fisier) => {
        if (eveniment === 'change' || eveniment === 'rename') {
            if (fisier && path.extname(fisier) === '.scss') {
                let caleAbsoluta = path.join(obGlobal.folderScss, fisier);
                if (fs.existsSync(caleAbsoluta)) {
                    compileazaScss(fisier);
                    console.log(`[Watch] Fisierul SCSS "${fisier}" a fost compilat in urma modificarii.`);
                }
            }
        }
    });
} else {
    console.warn(`[Avertisment] Folderul SCSS (${obGlobal.folderScss}) nu exista. Compilarea live pe parcurs este dezactivata.`);
}

function verificaJSONErori(caleFisier) {

    if (!fs.existsSync(caleFisier)) {
        console.error("Fisierul 'erori.json' NU exista in folderul resurse/json!");
        process.exit(1); 
    }

    const textBrut = fs.readFileSync(caleFisier, 'utf8');
    let json;
    try {
        json = JSON.parse(textBrut);
    } catch (e) {
        console.error("Fisierul erori.json nu are un format JSON valid sintactic!");
        return;
    }

    const proprietatiBaza = ['info_erori', 'cale_baza', 'eroare_default'];
    proprietatiBaza.forEach(prop => {
        if (!json.hasOwnProperty(prop)) {
            console.error(`EROARE: Lipseste proprietatea obligatorie de baza: "${prop}"`);
        }
    });

    if (json.eroare_default) {
        const propDefault = ['titlu', 'text', 'imagine'];
        propDefault.forEach(prop => {
            if (!json.eroare_default.hasOwnProperty(prop) || !json.eroare_default[prop]) {
                console.error(`EROARE: In 'eroare_default' lipseste sau este goala proprietatea: "${prop}"`);
            }
        });
    }

    if (json.cale_baza) {
        const caleFolderFizic = path.join(__dirname, json.cale_baza);
        if (!fs.existsSync(caleFolderFizic) || !fs.statSync(caleFolderFizic).isDirectory()) {
            console.error(`EROARE: Folderul din 'cale_baza' (${json.cale_baza}) NU exista in sistemul de fisiere!`);
        }
    }
}

function initErori() {
    try {
        const caleFisier = path.join(__dirname, 'resurse', 'json', 'erori.json');
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
        console.log("Fisierul erori.json a fost incarcat cu succes in memorie!");
    } catch (err) {
        console.error("Eroare critica la initializarea sistemului de erori:", err);
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
    
    let errDefault = eroriData ? eroriData.eroare_default : { titlu: "Eroare", text: "Eroare default.", imagine: "" };
    
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

app.use(async (req, res, next) => {
    let imaginiAlese = [];
    try {
        const caleJson = path.join(__dirname, 'resurse', 'json', 'galerie.json');
        if (fs.existsSync(caleJson)) {
            const date = JSON.parse(fs.readFileSync(caleJson, 'utf8'));
            const imagini = date.imagini;
            const caleGalerie = date.cale_galerie;

            const zile = ["duminica", "luni", "marti", "miercuri", "joi", "vineri", "sambata"];
            const aziIndex = new Date().getDay();

            imaginiAlese = imagini.filter(img => {
                if (!img.intervale_zile) return true;
                for (let interval of img.intervale_zile) {
                    if (interval.length === 2) {
                        let start = zile.indexOf(interval[0]);
                        let end = zile.indexOf(interval[1]);
                        if (start <= end) {
                            if (aziIndex >= start && aziIndex <= end) return true;
                        } else {
                            if (aziIndex >= start || aziIndex <= end) return true;
                        }
                    }
                }
                return false;
            });

            if (imaginiAlese.length % 2 !== 0) {
                imaginiAlese.pop();
            }

            for (let img of imaginiAlese) {
                let parts = img.fisier_imagine.split('.');
                let ext = parts.pop();
                let base = parts.join('.');
                let fisierMic = `${base}-mic.${ext}`;
                let fisierMediu = `${base}-mediu.${ext}`;
                
                img.cale_absoluta = path.join(__dirname, caleGalerie, img.fisier_imagine);
                img.cale_relativa = `${caleGalerie}/${img.fisier_imagine}`;
                img.cale_mica_relativa = `${caleGalerie}/${fisierMic}`;
                img.cale_medie_relativa = `${caleGalerie}/${fisierMediu}`;
                
                try {
                    const sharp = require('sharp');
                    const caleAbsolutaMica = path.join(__dirname, caleGalerie, fisierMic);
                    const caleAbsolutaMedie = path.join(__dirname, caleGalerie, fisierMediu);
                    if (fs.existsSync(img.cale_absoluta)) {
                        if (!fs.existsSync(caleAbsolutaMica)) {
                            await sharp(img.cale_absoluta).resize(300).toFile(caleAbsolutaMica);
                        }
                        if (!fs.existsSync(caleAbsolutaMedie)) {
                            await sharp(img.cale_absoluta).resize(500).toFile(caleAbsolutaMedie);
                        }
                    }
                } catch (e) {
                    const caleAbsolutaMica = path.join(__dirname, caleGalerie, fisierMic);
                    const caleAbsolutaMedie = path.join(__dirname, caleGalerie, fisierMediu);
                    if (fs.existsSync(img.cale_absoluta)) {
                        if (!fs.existsSync(caleAbsolutaMica)) {
                            fs.copyFileSync(img.cale_absoluta, caleAbsolutaMica);
                        }
                        if (!fs.existsSync(caleAbsolutaMedie)) {
                            fs.copyFileSync(img.cale_absoluta, caleAbsolutaMedie);
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error("Eroare galerie:", e);
    }
    res.locals.imaginiGalerie = imaginiAlese;
    next();
});

const { Pool } = require('pg');
const pool = new Pool({
    user: 'vinyllium_user',
    host: 'localhost',
    database: 'vinyllium_db',
    password: '123456',
    port: 5432,
});

(async () => {
    try {
        const result = await pool.query("SELECT unnest(enum_range(NULL::gen_muzical)) AS categorie");
        app.locals.categorii = result.rows.map(row => row.categorie);
        console.log("Categorii incarcate din baza de date:", app.locals.categorii);
    } catch (err) {
        console.error("Eroare la incarcarea categoriilor din enum:", err);
    }
})();

app.get(['/', '/index', '/home'], (req, res) => {
    res.render('pagini/index');
});

app.get('/produse', async (req, res) => {
    try {
        let query = 'SELECT * FROM produse';
        let params = [];
        if (req.query.categorie && app.locals.categorii.includes(req.query.categorie)) {
            query += ' WHERE categorie_mare = $1';
            params.push(req.query.categorie);
        }
        const result = await pool.query(query, params);
        res.render('pagini/produse', { produse: result.rows });
    } catch (err) {
        console.error("Eroare baza de date:", err);
        afisareEroare(res, 500, "Eroare DB", "Nu s-au putut prelua produsele.", "");
    }
});

app.get('/produs/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return afisareEroare(res, 404, "ID invalid", "Identificatorul trebuie sa fie numeric.", "");
        }
        const result = await pool.query('SELECT * FROM produse WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return afisareEroare(res, 404, "Produs inexistent", "Nu am găsit produsul.", "");
        }
        // Se trimit datele produsului prin locals, conform cerinței
        res.locals.produs = result.rows[0];
        res.render('pagini/produs');
    } catch (err) {
        console.error("Eroare baza de date:", err);
        afisareEroare(res, 500, "Eroare DB", "Eroare la preluarea detaliilor produsului.", "");
    }
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
                afisareEroare(res, 500, "Eroare Interna Server", "A aparut o problema la procesarea paginii pe server.");
            }
        } else {
            res.send(rezultatRandare);
        }
    });
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Folder index.js (__dirname): ${__dirname}`);
    console.log(`Cale fisier (__filename): ${__filename}`);
    console.log(`Director lucru (process.cwd()): ${process.cwd()}`);
    console.log(`Serverul ruleaza pe http://localhost:${PORT}`);
});