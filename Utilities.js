const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const loadjson = async function(path) {
    let raw = await fetch(path);
    let json = await raw.json();
    return json;
}

let spawn_menu = function() {
    var menu_gui = new dat.GUI({ autoPlace : false });
    menu_gui.width = this.specs.menuWidth;
    var menu = document.createElement('div');
    menu.className = 'menu';
    menu.style.top  = coord.y + 'px';
    menu.style.left = (coord.x - this.specs.menuWidth / 2) + 'px';
    document.body.appendChild(menu);
    menu.appendChild(menu_gui.domElement);
    this.menus.push(menu_gui);
}