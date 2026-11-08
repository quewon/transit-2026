function seconds_to_time(seconds) {
    let mm = Math.floor(seconds / 60);
    let ss = Math.floor(seconds % 60);
    if (mm < 10) mm = "0" + mm;
    if (ss < 10) ss = "0" + ss;
    return "XX:" + mm + ":" + ss;
}

function get_time() {
    const now = new Date();
    return now.getMinutes() * 60 + now.getSeconds();
}

function update_time() {
    clock.textContent = seconds_to_time(get_time());
}