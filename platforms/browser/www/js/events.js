var EVENT = {
  PLAYER_FOLD: 0,
  PLAYER_CALL: 1,
  PLAYER_RAISE: 2,
  GAME_TABLE_DEAL_ALL: 3,
  GAME_PLAYER_DEAL_ALL:4,
};

var game = {}

PubSub.enable(game);

game.subscribe(EVENT.PLAYER_FOLD, function (player) {});
game.subscribe(EVENT.PLAYER_CALL, function (player) {});
game.subscribe(EVENT.PLAYER_RAISE, function (player) {});
game.subscribe(EVENT.GAME_TABLE_DEAL, function (cards) {
  cards.forEach((card)=>{
    let cardDraft = document.getElementById("cardDraft")
    cardDraft.insertAdjacentHTML('beforeend', GUI.getCardHTML(card));
  })
});
game.subscribe(EVENT.GAME_PLAYER_DEAL, function (cards) {
  cards.forEach((card)=>{
    let cardDraft = document.getElementById("cardDraft");
    cardDraft.insertAdjacentHTML('beforeend', GUI.getCardHTML(card));
  })
});

