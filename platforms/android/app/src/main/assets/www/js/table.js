const table = io.connect("http://192.168.1.185:3000/table");
const cardDraft = document.getElementById("cardDraft");
table.on("connect", function () {
  table.on("text", text => {
    alert(text);
  });
  table.on("displayPlayer", (name, cash) => {
    if(!document.getElementById(name)){
      document.getElementById("playerBox").insertAdjacentHTML(
        "beforeend",
        `<div class="player" id="${name}">
              <div class="attributes">
                <div class="text">
                  <h3>${name}</h3>
                  <h5 id="${name}-cash">${cash}</h5>
                </div>
                <div id="${name}-hand" class="hand">
                </div>
              </div>
            </div>`
      );
    }
  });
  table.on("deletePlayer", name => {
    if (document.getElementById(name)){
      document.getElementById(name).remove();
    }
  });
  table.on("updatePlayer", (name, cash) => {
    document.getElementById(`${name}-cash`).textContent = cash;
  });
  table.on("displayBacks", (playerName) => {
    console.log(playerName);
    document.getElementById(`${playerName}-hand`).innerHTML =  `
    <div
      class="card"
      style="background-image: url(cards/back.svg);"
    ></div>
    <div
      class="card"
      style="background-image: url(cards/back.svg);"
    ></div>`
  });
  table.on("dealCards", cards => {
    console.log("Отображение карт - " + cards);
    table.emit("storeCards", cards);
    cards.forEach(card => {
      cardDraft.insertAdjacentHTML("beforeend", GUI.getCardHTML(card));
    });
  });
  table.on("updatePot", (tablePot, empty) => {
    if (!empty) {
      document.getElementById("tablePot").innerHTML = `На столе: ${tablePot}`;
    } else {
      document.getElementById("tablePot").innerHTML = ``;
    }
  });
  table.on("removeCards", () => {
    document.getElementById("cardDraft").innerHTML = "";
  });
  table.on("openCards", User => {
    console.log("openCards");
    document.getElementById(`${User.name}-hand`).innerHTML =  `
    <div
      class="card"
      style="background-image: url(cards/${User.cards[0].name}.svg);"
    ></div>
    <div
      class="card"
      style="background-image: url(cards/${User.cards[1].name}.svg);"
    ></div>`
  });
});
