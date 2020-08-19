const signature = document.getElementById("signature");

function signPetition() {
    let canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var x;
    var y;
    var down;

    canvas.addEventListener("mousedown", function (e) {
        down = true;
        console.log(event);
        x = event.offsetX;
        y = event.offsetY;

        canvas.addEventListener("mousemove", function (e) {
            if (down) {
                ctx.strokeStyle = "#174276";
                ctx.lineWidth = 1;
                ctx.moveTo(x, y);
                x = event.offsetX;
                y = event.offsetY;
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        });
    });

    canvas.addEventListener("mouseup", function (e) {
        console.log("Mouseup");
        down = false;
        signature.value = canvas.toDataURL();
    });

    canvas.addEventListener("mouseout", function (e) {
        console.log("Mouseout");
    });
}
signPetition();
