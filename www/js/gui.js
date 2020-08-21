class gameUserInterface {
  constructor() {}
  getCardHTML(card){
    let imgURL = this.getCardImageURL(card);
    var cardHTML = `<div class="card" style="background-image:url(${imgURL})"></div>`;
    return cardHTML;
  }
  getCardImageURL(card) {
    return "cards/" + card.value + "_of_" + card.suit + ".svg";
  }
}

var GUI = new gameUserInterface();
