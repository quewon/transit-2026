var money = localStorage.getItem("money") ? parseInt(localStorage.getItem("money")) : 4;

function add_to_inventory(item) {
    const li = document.createElement("li");
    li.textContent = item;
    inventory.appendChild(li);
}

function remove_from_inventory(item) {
    for (let i=0; i<inventory.children.length; i++) {
        if (inventory.children[i].textContent == item) {
            inventory.children[i].remove();
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