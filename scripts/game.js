var game_start_time;
var fare_unpaid = localStorage.getItem("fare_unpaid") !== null ? localStorage.getItem("fare_unpaid") : false;

// set up clock
update_time();
setTimeout(() => {
    update_time();
    setInterval(update_time, 1000);
}, new Date() - (Math.floor(new Date() / 1000) * 1000));

generate_subway();

function start_game() {
    if (localStorage.getItem("current-location-id")) {
        locations[localStorage.getItem("current-location-id")].enter();
    } else {
        subway.stations["n"].exit.enter();
    }
    money_counter.textContent = money;
    if (localStorage.getItem("start-time") === null) {
        localStorage.setItem("start-time", get_time());
    }
    game_start_time = localStorage.getItem("start-time");
}