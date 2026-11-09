var money = localStorage.getItem("money") ? parseInt(localStorage.getItem("money")) : 4;
var inventory;

function add_to_inventory(item, ignoreLocalStorage) {
    const li = document.createElement("li");
    li.textContent = item;
    inventory.appendChild(li);
    if (!ignoreLocalStorage)
        localStorage.setItem("inventory", JSON.stringify(inventory));
}

function remove_from_inventory(item) {
    for (let i=0; i<inventory.children.length; i++) {
        if (inventory.children[i].textContent == item) {
            inventory.children[i].remove();
            localStorage.setItem("inventory", JSON.stringify(inventory));
            return;
        }
    }
}

function add_money(v) {
    money += v;
    money_counter.textContent = money;
    localStorage.setItem("money", money);
}

function sub_money(v) {
    money -= v;
    money_counter.textContent = money;
    localStorage.setItem("money", money);
}