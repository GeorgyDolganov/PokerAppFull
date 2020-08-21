const table = io.connect("http://192.168.1.185:3000/table");
const cardDraft = document.getElementById("cardDraft");
table.on("connect", function () {
  table.on("text", text => {
    alert(text);
  });
  table.on("displayPlayer", (name, cash) => {
    document.getElementById("playerBox").insertAdjacentHTML(
      "beforeend",
      `<div class="player" id="${name}">
            <div class="attributes">
              <div class="text">
                <h3>${name}</h3>
                <h5 id="${name}-cash">${cash}</h5>
              </div>
              <div class="${name}-hand">
              </div>
            </div>
          </div>`
    );
  });
  table.on("deletePlayer", name => {
    document.getElementById(name).remove();
  });
  table.on("updatePlayer", (name, cash) => {
    document.getElementById(`${name}-cash`).textContent = cash;
  });
  table.on("displayBacks", (playerName) => {
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
  table.on("openCards", players => {
    players.forEach(player => {
      document.getElementById(`${player.game.name}-hand`).innerHTML =  `
      <div
        class="card"
        style="background-image: url(cards/${player.game.cards[0]}.svg);"
      ></div>
      <div
        class="card"
        style="background-image: url(cards/${player.game.cards[1]}.svg);"
      ></div>`
    });
  });
});
