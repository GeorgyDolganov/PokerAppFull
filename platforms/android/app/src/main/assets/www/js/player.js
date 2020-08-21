const player = io.connect("http://192.168.1.185:3000/player");
var User = {
    name: null,
    cash: 10000,
    cards: null,
    active: true,
    allIn: false,
    dead: false
  },
  slider,
  lastBet = 100;

player.on("connect", function () {
  if (User.name == null) {
    User.name = prompt("Введите своё имя", "Игрок");
    document.getElementById("player-name").textContent = User.name;
  }
  document.getElementById("player-cash").textContent = User.cash;
  player.on("text", function (text) {
    alert(text);
  });

  player.on("connectToTable", () => {
    player.emit("displayPlayer", User.name, User.cash);
  });

  player.on("dealCardsClient", cards => {
    console.log("Отображение карт - " + cards);
    io.of("/table").emit("displayBlankCards");
    User.cards = cards;
    cards.forEach(card => {
      let cardDraft = document.getElementById("cardDraft");
      cardDraft.insertAdjacentHTML("beforeend", GUI.getCardHTML(card));
    });
  });

  player.on("startGame", () => {
    if (!User.dead){
      if (User.active == false) {
        User.active = true;
        player.emit("returnPlayer");
      }
      User.cards = null;
      player.emit("dealCardsServer"); 
    }
  });

  player.on("yourTurn", getLastBet => {
    if (User.active && !User.dead) {
      alert("Твой ход");
      if (getLastBet) {
        lastBet = Number(getLastBet);
      }
      document.getElementById("player-lastbet").textContent =
        "Последняя ставка " + lastBet;
      createUI();
    } else{
      player.emit("passTurn", lastBet, 1);
    }
  });

  player.on("onWin", tablePot => {
    alert(`Вы выйграли и получили: ${tablePot}!`);
    User.allIn = false;
    let pot = Math.floor(parseInt(tablePot));
    User.cash += pot;
    document.getElementById("player-cash").textContent = User.cash;
    createRestartButton();
  });

  player.on("onLoose", winnerName => {
    removeUI();
    removeCards();
    if (User.allIn == true){
      User.dead = true;
      document.getElementById("player-name").textContent = "Вы выбыли из игры";
      document.getElementById("player-cash").textContent = "";
      document.getElementById("player-lastbet").textContent = "";
      alert(`К сожалению вы проиграли, попробуйте в следующий раз`);
    } else {
      alert(`Вы проиграли. Выйгрыш  забирает ${winnerName}`);
    }
  });

  player.on("showCards", () => {
    if (User.active) {
      player.emit("addCards", User);
      removeCards();
    }
  });
});

call = () => {
  if (lastBet != null) {
    if (User.cash < lastBet){
      User.allIn = true;
      alert("Вы идете ALL IN!");
      User.cash = 0;
      removeUI(); 
      player.emit("passTurn", lastBet, "call");
      document.getElementById("player-cash").textContent = User.cash;
    } else {
      let bet = lastBet;
      alert("Вы приняли ставку");
      User.cash = User.cash - bet;
      removeUI();
      player.emit("passTurn", bet, "call");
      User.cash -= bet;
      document.getElementById("player-cash").textContent = User.cash;
    }
  } else {
    alert("Последняя ставка ровна нулю, действие не выполненно");
  }
};

double = () => {
  if (User.cash > lastBet * 2){
    slider.noUiSlider.set(lastBet * 2);
    let bet = Math.floor(slider.noUiSlider.set(lastBet * 2));
    alert("Вы удвоили ставку, ваша ставка равна " + bet);
    removeUI();
    player.emit("passTurn", bet, "raise");
    User.cash -= bet;
    document.getElementById("player-cash").textContent = User.cash;
  } else {
    alert("У вас недостаточно средств, чтобы удвоить ставку");
  }
};

raise = () => {
  if (slider.noUiSlider.get() == User.cash){
    User.allIn = true;
    alert("Вы идете ALL IN!");
    let bet = Math.floor(User.cash);
    User.cash = 0;
    removeUI(); 
    player.emit("passTurn", bet, "raise");
    document.getElementById("player-cash").textContent = User.cash;
  } else {
    let bet = Math.floor(slider.noUiSlider.get());
    alert("Вы подняли ставку до " + (bet + lastBet));
    player.emit("passTurn", bet + lastBet, "raise");
    removeUI();
    User.cash -= bet + lastBet;
    document.getElementById("player-cash").textContent = User.cash;
  }
};

fold = () => {
  alert("Вы сложили карты");
  User.active = false;
  player.emit("passTurn", lastBet, "fold");
  removeCards();
  removeUI();
};

removeCards = () => {
  document.getElementById("cardDraft").innerHTML = "";
};

createUI = () => {
  document.getElementById("bottom-panel").insertAdjacentHTML(
    "beforeend",
    `<div id="slider"></div>
    <div class="row" id="btn-row">
      <div class="btn" id="btn-accept" onclick="call();">Принять ставку</div>
      <div class="btn" id="btn-double" onclick="double();">Удвоить ставку</div>
      <div class="btn" id="btn-submit" onclick="raise();">Повысить ставку</div>
      <div class="btn" id="btn-fold" onclick="fold();">Сложить карты</div>
    </div>`
  );
  slider = document.getElementById("slider");
  noUiSlider.create(slider, {
    start: [100],
    step: 10,
    connect: "lower",
    tooltips: [wNumb({ decimals: 0 })],
    range: {
      min: 0,
      max: User.cash
    },
    pips: {
      mode: "values",
      values: [
        0,
        (User.cash / 100) * 75,
        (User.cash / 100) * 50,
        (User.cash / 100) * 25,
        User.cash
      ],
      density: 1
    }
  });
};

removeUI = () => {
  document.getElementById("bottom-panel").innerHTML = "";
};

createRestartButton = () => {
  document.getElementById(
    "bottom-panel"
  ).innerHTML = `<div class="btn" id="btn-restart" onclick="restartByPlayer();">Рестарт</div>`;
};

restartByPlayer = () => {
  document.getElementById("bottom-panel").innerHTML = "";
  player.emit("Restart");
};
