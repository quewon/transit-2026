function update_time() {
    const date = new Date();
    let ss = date.getSeconds();
    let mm = date.getMinutes();
    if (ss < 10) ss = "0" + ss;
    if (mm < 10) mm = "0" + mm;
    time.textContent = "XX:" + mm + ":" + ss;
}