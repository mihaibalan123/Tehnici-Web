window.onload = function() {
    // Salvam ordinea initiala a elementelor in DOM pentru resetare
    let container = document.getElementById("container-produse");
    if (!container) return; // Daca nu suntem pe pagina de produse
    
    let articoleInitiale = Array.from(container.getElementsByClassName("produs"));

    // Event de input pentru Textarea - corectare automată
    let inpNumeGlobal = document.getElementById("inp-nume");
    if (inpNumeGlobal) {
        inpNumeGlobal.addEventListener("input", function() {
            if (this.value.trim().length >= 3 || this.value.trim().length === 0) {
                this.classList.remove("is-invalid");
            }
        });
    }

    // ======== 1. FILTRARE ========
    document.getElementById("btn-filtrare").onclick = function() {
        let inpNume = document.getElementById("inp-nume");
        let inpDescriere = document.getElementById("inp-descriere");
        
        let valNume = inpNume.value.trim().toLowerCase();
        let valDescriere = inpDescriere.value.trim().toLowerCase();
        
        // VALIDARE: Textarea trebuie să aibă minim 3 caractere dacă nu e gol
        inpNume.classList.remove('is-invalid');
        
        if (valNume !== "" && valNume.length < 3) {
            inpNume.classList.add('is-invalid');
            alert("Numele produsului trebuie să conțină cel puțin 3 caractere pentru a filtra!");
            return;
        }

        // Preluare restul valorilor
        let minGreutate = parseInt(document.getElementById("inp-greutate").value);
        let valFormat = document.getElementById("inp-format").value.toLowerCase();
        
        // Culoare radio
        let radioCuloare = document.querySelector('input[name="gr_radio"]:checked');
        let valCuloare = radioCuloare ? radioCuloare.value.toLowerCase() : "toate";
        
        // Noutati checkbox
        let valNoutati = document.getElementById("chk-noutati").checked;
        const dataReferinta = new Date("2024-01-01").getTime();
        
        // Select simplu editie
        let valEditie = document.getElementById("sel-editie").value;
        
        // Select multiplu instrumente
        let selInstrumente = document.getElementById("sel-instrumente");
        let optiuniInstrumente = Array.from(selInstrumente.selectedOptions).map(opt => opt.value.toLowerCase());

        let articole = document.getElementsByClassName("produs");

        for (let art of articole) {
            let ascunde = false;

            // Preluare date din DOM
            let numeProdus = art.querySelector(".val-nume").textContent.trim();
            let descriereProdus = art.querySelector(".val-descriere").textContent.toLowerCase();
            let greutateProdus = parseInt(art.querySelector(".val-greutate").textContent);
            let formatProdus = art.querySelector(".val-format").textContent.toLowerCase();
            let culoareProdus = art.querySelector(".val-culoare").textContent.toLowerCase();
            let dataProdusText = art.querySelector("time").getAttribute("datetime");
            let dataProdusTimestamp = new Date(dataProdusText).getTime();
            let editieProdus = art.querySelector(".val-editie").textContent.toLowerCase() === "da" ? "da" : "nu";
            let instrumenteProdusText = art.querySelector(".val-instrumente").textContent.toLowerCase();
            
            // Verificare Nume (startsWith)
            if (valNume && !numeProdus.startsWith(valNume)) ascunde = true;
            
            // Verificare Descriere (includes)
            if (valDescriere && !descriereProdus.includes(valDescriere)) ascunde = true;
            
            // Verificare Greutate minim
            if (greutateProdus < minGreutate) ascunde = true;
            
            // Verificare Format (datalist)
            if (valFormat && formatProdus !== valFormat) ascunde = true;
            
            // Verificare Culoare (radio)
            if (valCuloare !== "toate" && culoareProdus !== valCuloare) ascunde = true;
            
            // Verificare Noutati
            if (valNoutati && dataProdusTimestamp <= dataReferinta) ascunde = true;
            
            // Verificare Editie
            if (valEditie !== "oricare" && editieProdus !== valEditie) ascunde = true;
            
            // Verificare Instrumente (select multiplu) - produsul trebuie sa contina macat un instrument selectat
            if (optiuniInstrumente.length > 0) {
                let areMacarUnInstrument = false;
                for (let inst of optiuniInstrumente) {
                    if (instrumenteProdusText.includes(inst)) {
                        areMacarUnInstrument = true;
                        break;
                    }
                }
                if (!areMacarUnInstrument) ascunde = true;
            }

            // Aplicare ascundere
            if (ascunde) {
                art.style.display = "none";
            } else {
                art.style.display = "grid"; // Grid pt ca produs-card are display:grid
            }
        }
    };

    // ======== 2. SORTARE ========
    function sorteaza(semn) {
        let articole = Array.from(document.getElementsByClassName("produs"));
        
        articole.sort(function(a, b) {
            let numeA = a.querySelector(".val-nume").textContent;
            let numeB = b.querySelector(".val-nume").textContent;
            
            if (numeA !== numeB) {
                return semn * numeA.localeCompare(numeB);
            } else {
                // Cheie secundara: Raport greutate / pret
                let greutateA = parseInt(a.querySelector(".val-greutate").textContent);
                let pretA = parseFloat(a.querySelector(".val-pret").textContent);
                let rapA = greutateA / pretA;
                
                let greutateB = parseInt(b.querySelector(".val-greutate").textContent);
                let pretB = parseFloat(b.querySelector(".val-pret").textContent);
                let rapB = greutateB / pretB;
                
                return semn * (rapA - rapB);
            }
        });
        
        for (let art of articole) {
            container.appendChild(art); // Rearanjare in DOM
        }
    }

    document.getElementById("btn-sort-asc").onclick = () => sorteaza(1);
    document.getElementById("btn-sort-desc").onclick = () => sorteaza(-1);

    // ======== 3. CALCULARE ========
    document.getElementById("btn-calcul").onclick = function() {
        let articole = document.getElementsByClassName("produs");
        let suma = 0;
        
        for (let art of articole) {
            // Daca produsul e vizibil
            if (art.style.display !== "none") {
                let pret = parseFloat(art.querySelector(".val-pret").textContent);
                suma += pret;
            }
        }
        
        let infoDiv = document.createElement("div");
        infoDiv.innerHTML = `<strong>Sumă Totală:</strong> ${suma.toFixed(2)} RON`;
        infoDiv.style.position = "fixed";
        infoDiv.style.top = "50%";
        infoDiv.style.left = "50%";
        infoDiv.style.transform = "translate(-50%, -50%)";
        infoDiv.style.backgroundColor = "var(--culoare-highlight)";
        infoDiv.style.color = "white";
        infoDiv.style.padding = "20px 40px";
        infoDiv.style.borderRadius = "10px";
        infoDiv.style.boxShadow = "0 0 15px rgba(0,0,0,0.5)";
        infoDiv.style.fontSize = "1.5rem";
        infoDiv.style.zIndex = "9999";
        
        document.body.appendChild(infoDiv);
        
        setTimeout(function() {
            infoDiv.remove();
        }, 2000);
    };

    // ======== 4. RESETARE ========
    document.getElementById("btn-reset").onclick = function() {
        if (confirm("Sigur doriți să resetați toate filtrele?")) {
            // Reset input-uri
            document.getElementById("inp-nume").value = "";
            document.getElementById("inp-nume").classList.remove("eroare-input");
            
            document.getElementById("inp-descriere").value = "";
            document.getElementById("inp-descriere").classList.remove("eroare-input");
            
            document.getElementById("inp-greutate").value = "140";
            document.getElementById("val-greutate").textContent = "140";
            
            document.getElementById("inp-format").value = "";
            document.getElementById("rad-toate").checked = true;
            document.getElementById("chk-noutati").checked = false;
            document.getElementById("sel-editie").value = "oricare";
            
            let selInstrumente = document.getElementById("sel-instrumente");
            for(let i = 0; i < selInstrumente.options.length; i++) {
                selInstrumente.options[i].selected = false;
            }
            
            // Re-afisare si rearanjare
            for (let art of articoleInitiale) {
                art.style.display = "grid"; // reset vizibilitate
                container.appendChild(art); // reset ordonare in DOM
            }
        }
    };
};
