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

let Graphics = (() => {
    /**
    * Draws a line with the given canvas context
    * @param {Coordinate} coord1 - Start Point
    * @param {Coordinate} coord2 - End point
    * @param {Number} width (optional) - Line Width {Default = this.specs.edgeWidth}
    * @param {String} color (optional) - Stroke Color {Default = this.specs.edgeColor}
    */
    const draw_line = function(p1, p2, context, width, color) {
        context.beginPath();
        context.moveTo(p1.x, p1.y);
        context.lineTo(p2.x, p2.y);
        context.lineWidth = width;
        context.strokeStyle = color;
        context.stroke();
    }

    const direction = (p1, p2) => {
        return p1.x == p2.x ? Math.PI / 2 * (p2.y < p1.y ? 1 : -1) :
                              Math.atan2((p1.y - p2.y) , (p1.x - p2.x));
    };

    // /**
    //  * 
    //  * @param {Coordinate} coord1 :
    //  * @param {Coordinate} coord2 :
    //  * @param {Number} width (optional) : 
    //  */
    // const draw_rect = function(p1, p2, width, color) {
    //     let line = (a, b) => draw_line(a, b, width, color);

    //     let tleft = new Coordinate( Math.min(p1.x, p2.x), Math.min(p1.y, p2.y) );
    //     let bright = new Coordinate( Math.max(p1.x, p2.x), Math.max(p1.y, p2.y) );

    //     draw_line(tleft, new Coordinate(bright.x, tleft.y));
    //     draw_line(new Coordinate(bright.x, tleft.y), bright);
    //     draw_line(bright, new Coordinate(tleft.x, bright.y));
    //     line(new Coordinate(tleft.x, bright.y ), tleft);
    // }

    /**
     * Each point given is assumed to be a circle with radius, r, and there is a line segment, L,
     * connecting p1 to p2. Then finds The points (closest to each other) at the edge of each circle that fall on L.
     * @param {Coordinate} p1 
     * @param {Coordinate} p2 
     * @returns [1st point on shortened L, 2nd point on shortened L, direction theta of vector.
     */

    const segment_minus_circles = (p1, p2, radius) => {
        let theta = direction(p1, p2);
        let scaleX = radius * Math.cos(theta);
        let scaleY = radius * Math.sin(theta);

        return [
            new Coordinate(p1.x - scaleX, p1.y - scaleY),
            new Coordinate(p2.x + scaleX, p2.y + scaleY),
            theta
        ];
    }

    return {
        'draw_line' : draw_line,
        'direction' : direction,
        'segment_minus_circles' : segment_minus_circles
    };
})();

