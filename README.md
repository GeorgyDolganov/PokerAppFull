# PokerAppPublic
## Клиентская часть
### Оболочка
Вся оболочка клиентской части находится в папке **www/**, 
* index.html - Страница системы
* player.html - Игрок
* table.html - Стол
### Скрипты
Вся логика клиентской части храниться в папке **www/js**,
* admin.js - Страница системы
* player.js - Игрок
* table.js - Стол
## Серверная часть
Сервер и некоторые из библиотек находятся в папке **www/js**,
* nodeServer.js - Сервер на котором обрабатываются все запросы
* stateMachine.js - Библиотека для fsm
* solver.js - Библиотека для решения победителя
* wNumb.min.js - Библиотека для работы с числами
* nouislider.min.js - Библиотека генерации слайдера
* gui.js - Файл который генерирует карты по запросу
* utilites.js - Перезапись стандартных методов js
