document.addEventListener("DOMContentLoaded", () => {

  /* ── Références DOM ─────────────────────────────────────────── */
  const form      = document.getElementById("nameForm");
  const firstIn   = document.getElementById("first_name");
  const lastIn    = document.getElementById("last_name");
  const feedback  = document.getElementById("feedback");
  const planning  = document.getElementById("planning");
  const download  = document.getElementById("downloadPdf");

  const title1 = document.getElementById("titleLine1");
  const title2 = document.getElementById("titleLine2");
  const g1      = document.getElementById("g1");
  const g1room  = document.getElementById("g1room");
  const g2      = document.getElementById("g2");
  const g2b     = document.getElementById("g2b");
  const g3      = document.getElementById("g3");
  const g3room  = document.getElementById("g3room");

  /* Groupes → salles */
  const roomsAct1 = { 1: "Maison", 2: "Salle A/C", 3: "Salle B" };
  const roomsAct3 = { 1: "Salle D", 2: "Salle A/C" };
  const isNA      = x => x == null || x === "N/A";

  /* ── Charger JSON et préparer l’app ─────────────────────────── */
  fetch("./assignments.json")
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
    .then(t => JSON.parse(t.replace(/\bNaN\b/g, '"N/A"')))
    .then(assignments => {

      /* ── Soumission formulaire ──────────────────────────────── */
      form.addEventListener("submit", ev => {
        ev.preventDefault();
        feedback.textContent = "";

        const norm = s => s.normalize("NFD")
                           .replace(/[\u0300-\u036f]/g, "")
                           .trim().toLowerCase();

        const firstNorm = norm(firstIn.value);
        const lastNorm  = norm(lastIn.value);
        if (!firstNorm || !lastNorm) {
          feedback.textContent = "Merci de remplir prénom et nom.";
          return;
        }

        const user = assignments[`${firstNorm} ${lastNorm}`];
        if (!user) {
          feedback.textContent = "Nom non trouvé. Vérifiez l’orthographe, évitez les accents.";
          return;
        }

        /* — Planning global : trois champs vides/N-A — */
        if (isNA(user.act1) && isNA(user.act2) && isNA(user.act3)) {
          renderGlobal(assignments);
        } else {
          renderPersonal(user, firstIn.value, lastIn.value);
        }
      });

      /* ───────────────────────────────────────────────────────── */
      /*  R E N D U S                                             */
      /* ───────────────────────────────────────────────────────── */

      function renderPersonal(user, first, last) {
        title1.textContent = "Séminaire Finance 2026";
        title2.textContent = `${first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()} ${last.toUpperCase()}`;

        g1.textContent     = isNA(user.act1) ? "N/A" : `Groupe ${user.act1}`;
        g1room.textContent = isNA(user.act1) ? "N/A" : (roomsAct1[user.act1] || "N/A");

        g2.textContent  = isNA(user.act2) ? "N/A" : `Groupe ${user.act2}`;
        g2b.textContent = g2.textContent;

        g3.textContent     = isNA(user.act3) ? "N/A" : `Groupe ${user.act3}`;
        g3room.textContent = isNA(user.act3) ? "N/A" : (roomsAct3[user.act3] || "N/A");

        planning.style.display = "block";
        attachDownload(`planning_${first}_${last}.pdf`);
      }

      function renderGlobal(assignments) {
        title1.textContent = "Planning général - Séminaire Finance 2026";
        title2.textContent = "Romane LEBRETON";

        /* table responsive */
        const table = document.createElement("table");
        table.innerHTML = `
          <thead><tr>
            <th>Nom</th><th>Act1</th><th>Salle1</th>
            <th>Act2</th><th>Act3</th><th>Salle3</th>
          </tr></thead><tbody></tbody>`;

        Object.entries(assignments).forEach(([name, d]) => {
          if (isNA(d.act1) && isNA(d.act2) && isNA(d.act3)) return; // skip Ines

          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${name}</td>
            <td>${isNA(d.act1) ? "N/A" : `Groupe ${d.act1}`}</td>
            <td>${isNA(d.act1) ? "N/A" : (roomsAct1[d.act1] || "N/A")}</td>
            <td>${isNA(d.act2) ? "N/A" : `Groupe ${d.act2}`}</td>
            <td>${isNA(d.act3) ? "N/A" : `Groupe ${d.act3}`}</td>
            <td>${isNA(d.act3) ? "N/A" : (roomsAct3[d.act3] || "N/A")}</td>`;
          table.tBodies[0].appendChild(row);
        });

        planning.innerHTML = "";      // on remplace le contenu
        const wrap = document.createElement("div");
        wrap.style.overflowX = "auto";
        wrap.appendChild(table);
        planning.appendChild(wrap);

        planning.style.display = "block";
        attachDownload("planning_global_ines_majjad.pdf");
      }

      /* ───────────────────────────────────────────────────────── */
      /*  D O W N L O A D                                         */
      /* ───────────────────────────────────────────────────────── */

      function attachDownload(filename) {
        download.onclick = async () => {
          planning.style.display = "block"; // au cas où
          if (window.html2pdf) {
            try {
              await html2pdf()
                .set({
                  margin: 5,
                  filename,
                  html2canvas: { scale: 2, useCORS: true },
                  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                  pagebreak: { mode: ['css', 'legacy'] }
                })
                .from(planning)
                .save();
              return;                       // succès
            } catch (e) {
              console.error("html2pdf a échoué, fallback print()", e);
            }
          }
          /* Fallback natif */
          window.print();
        };
      }
    })
    .catch(err => {
      console.error(err);
      feedback.textContent = `Impossible de charger les affectations : ${err.message}`;
    });
});
